import logging
import re
import time
from typing import Optional
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.config import settings
from app.database.models import Consultation, ConsultationMessage, ConsultationResponse
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, StructuredDataOutput

logger = logging.getLogger("legaledge.chat")

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY missing!")

# Language name map for the system prompt
LANG_NAMES = {
    "en-IN": "English",
    "hi-IN": "Hindi (हिंदी)",
    "ta-IN": "Tamil (தமிழ்)",
    "te-IN": "Telugu (తెలుగు)",
    "kn-IN": "Kannada (ಕನ್ನಡ)",
    "ml-IN": "Malayalam (മലയാളം)",
    "bn-IN": "Bengali (বাংলা)",
    "mr-IN": "Marathi (मराठी)",
    "gu-IN": "Gujarati (ગુજરાતી)",
    "pa-IN": "Punjabi (ਪੰਜਾਬੀ)",
    "or-IN": "Odia (ଓଡ଼ିଆ)",
    "as-IN": "Assamese (অসমীয়া)",
    "ur-IN": "Urdu (اردو)",
}

SYSTEM_PROMPT = """\
You are 'Legal Edge AI', a pro-bono legal assistant for marginalized citizens in India.

STRICT RULES:
1. ONLY answer questions related to Indian law, legal rights, courts, police, legal procedures, and government schemes for legal aid.
2. If the user asks anything NOT related to law or legal issues, politely decline and redirect them to ask a legal question instead.
3. Always reply ENTIRELY in the language specified. Every single word of your response must be in that language.
4. Assume the user has zero legal knowledge — use very simple, plain language. No jargon.
5. Always mention: you are an AI, not a licensed lawyer, and they should contact NALSA (15100) or their District Legal Services Authority (DLSA) for official help.
6. Be practical: give step-by-step guidance specific to Indian procedures.
"""


def build_system_history(language_code: str) -> list:
    lang_name = LANG_NAMES.get(language_code, "English")
    return [
        {
            "role": "user",
            "parts": [
                f"{SYSTEM_PROMPT}\n\n"
                f"LANGUAGE INSTRUCTION: You MUST reply ENTIRELY in {lang_name}. "
                f"Every word of your response must be in {lang_name}, including legal terms, disclaimers, and advice."
            ]
        },
        {
            "role": "model",
            "parts": [
                f"Understood. I am Legal Edge AI. I will only answer questions about Indian law and legal rights, "
                f"and I will reply entirely in {lang_name}."
            ]
        }
    ]


def call_gemini_with_retry(chat_session, prompt: str, max_retries: int = 2) -> Optional[str]:
    """Call Gemini with smart retry on rate limits. Returns None if all retries fail."""
    for attempt in range(max_retries):
        try:
            response = chat_session.send_message(prompt)
            return response.text
        except Exception as e:
            error_msg = str(e)
            # Log the FULL error so we can diagnose the issue
            logger.error(f"Gemini error (attempt {attempt+1}/{max_retries}): {error_msg}")

            if "400" in error_msg or "API_KEY_INVALID" in error_msg or "invalid" in error_msg.lower():
                logger.error("GEMINI API KEY IS INVALID. Update GEMINI_API_KEY in backend/.env")
                return None

            if "429" in error_msg or "quota" in error_msg.lower() or "RESOURCE_EXHAUSTED" in error_msg:
                # Daily quota exhausted — no point retrying
                if "PerDay" in error_msg or "per_day" in error_msg.lower():
                    logger.warning("Daily quota exhausted. Get a new API key or wait until tomorrow.")
                    return None

                delay_match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', error_msg)
                wait_secs = min(int(delay_match.group(1)) + 2 if delay_match else 35, 45)

                if attempt < max_retries - 1:
                    logger.info(f"Rate limited. Waiting {wait_secs}s before retry...")
                    time.sleep(wait_secs)
                else:
                    logger.warning("Rate limit persists after retries.")
                    return None
            else:
                logger.error(f"Unexpected Gemini error type — not retrying.")
                return None
    return None


def generate_structured_report(text: str, consultation: Consultation) -> StructuredDataOutput:
    """Generate a structured final legal report using Gemini."""
    lang_name = LANG_NAMES.get(consultation.language, "English")

    prompt = f"""\
The user has completed a legal consultation. Generate a structured legal report in {lang_name}.

Category: {consultation.category}
Summary of issue: {text}

Reply ONLY with a valid JSON object in this exact schema (no markdown, no extra text):
{{
  "summary": "2-3 sentence plain language summary of the legal issue in {lang_name}",
  "actions": "numbered list of steps the user should take, in {lang_name}",
  "documents": "bullet list of documents the user needs, in {lang_name}"
}}

IMPORTANT: The content must be in {lang_name} and specific to Indian law."""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = model.generate_content(prompt)
        text_resp = resp.text.strip()
        # Strip markdown wrappers if present
        if text_resp.startswith("```json"): text_resp = text_resp[7:]
        if text_resp.startswith("```"): text_resp = text_resp[3:]
        if text_resp.endswith("```"): text_resp = text_resp[:-3]

        import json
        data = json.loads(text_resp.strip())
        return StructuredDataOutput(
            summary=data.get("summary", ""),
            actions=data.get("actions", ""),
            documents=data.get("documents", "")
        )
    except Exception as e:
        logger.error(f"Structured report generation failed: {e}")
        return StructuredDataOutput(
            summary="Could not generate the report. Please try again.",
            actions="Contact NALSA helpline: 15100 for free legal assistance.",
            documents="• Identity proof (Aadhaar)\n• Any relevant documents to your case"
        )


def process_message(db: Session, user_id: Optional[int], body: ChatMessageRequest) -> ChatMessageResponse:
    # Resolve or create consultation
    cons = None
    if body.consultation_id:
        cons = db.query(Consultation).filter(Consultation.id == body.consultation_id).first()

    if not cons:
        cons = Consultation(
            user_id=user_id,
            category=body.active_track or "general",
            description=body.text,
            language=body.language or "en-IN"
        )
        db.add(cons)
        db.commit()
        db.refresh(cons)

    if body.active_track and cons.category != body.active_track:
        cons.category = body.active_track
        db.commit()

    if body.language and cons.language != body.language:
        cons.language = body.language
        db.commit()

    # ── Final Report Route ────────────────────────────────────────────────────
    if "GENERATE_FINAL_REPORT" in body.text:
        structured_data = generate_structured_report(
            body.text.replace("GENERATE_FINAL_REPORT", "").strip(), cons
        )
        existing = db.query(ConsultationResponse).filter_by(consultation_id=cons.id).first()
        if not existing:
            db.add(ConsultationResponse(
                consultation_id=cons.id,
                summary=structured_data.summary,
                actions=structured_data.actions,
                documents=structured_data.documents
            ))
        else:
            existing.summary = structured_data.summary
            existing.actions = structured_data.actions
            existing.documents = structured_data.documents
        db.commit()
        db.add(ConsultationMessage(consultation_id=cons.id, role="model", message="[FINAL_REPORT_GENERATED]"))
        db.commit()

        return ChatMessageResponse(
            consultation_id=cons.id,
            reply="Your legal report has been generated.",
            active_track=cons.category,
            is_final_structured=True,
            structured_data=structured_data
        )

    # ── Standard Chat Route ───────────────────────────────────────────────────
    user_msg = ConsultationMessage(consultation_id=cons.id, role="user", message=body.text)
    db.add(user_msg)
    db.commit()

    # Build history for Gemini (system context + previous turns)
    gemini_history = build_system_history(cons.language)
    history_records = db.query(ConsultationMessage).filter(
        ConsultationMessage.consultation_id == cons.id
    ).order_by(ConsultationMessage.created_at).all()

    for m in history_records[:-1]:  # Exclude the current message
        if m.message == "[FINAL_REPORT_GENERATED]":
            continue
        role = m.role if m.role in ["user", "model"] else "user"
        gemini_history.append({"role": role, "parts": [m.message]})

    lang_name = LANG_NAMES.get(cons.language, "English")
    reply_text = None

    if settings.GEMINI_API_KEY:
        model = genai.GenerativeModel("gemini-2.5-flash")
        chat_session = model.start_chat(history=gemini_history)
        prompt = f"[Respond ENTIRELY in {lang_name}. Legal questions only.]\n\n{body.text}"
        reply_text = call_gemini_with_retry(chat_session, prompt)

    if reply_text is None:
        # Minimal graceful fallback — no hardcoded legal content
        lang_messages = {
            "hi-IN": f"माफ करें, मैं अभी आपसे कनेक्ट नहीं हो पा रहा। कृपया NALSA हेल्पलाइन 15100 से संपर्क करें।",
            "ta-IN": f"மன்னிக்கவும், தற்போது இணைக்க முடியவில்லை. NALSA உதவி எண் 15100-ஐ தொடர்பு கொள்ளவும்.",
            "te-IN": f"క్షమించండి, ప్రస్తుతం కనెక్ట్ అవ్వడం లేదు. NALSA హెల్ప్‌లైన్ 15100 సంప్రదించండి.",
            "kn-IN": f"ಕ್ಷಮಿಸಿ, ಸಧ್ಯ ಸಂಪರ್ಕಿಸಲು ಆಗುತ್ತಿಲ್ಲ. NALSA 15100 ಸಂಪರ್ಕಿಸಿ.",
            "ml-IN": f"ക്ഷമിക്കണം, ഇപ്പോൾ കണക്ട് ചെയ്യാൻ കഴിയുന്നില്ല. NALSA ഹെൽപ്‌ലൈൻ 15100 ബന്ധപ്പെടുക.",
            "bn-IN": f"দুঃখিত, এই মুহূর্তে সংযোগ হচ্ছে না। NALSA হেল্পলাইন 15100 যোগাযোগ করুন।",
            "mr-IN": f"माफ करा, सध्या कनेक्ट होत नाही. NALSA हेल्पलाइन 15100 वर संपर्क करा.",
            "gu-IN": f"માફ કરશો, અત્યારે કનેક્ટ થઈ શકાતું નથી. NALSA હેલ્પલાઇન 15100 સંપર્ક કરો.",
            "pa-IN": f"ਮਾਫ਼ ਕਰਨਾ, ਹੁਣੇ ਕੁਨੈਕਟ ਨਹੀਂ ਹੋ ਰਿਹਾ। NALSA ਹੈਲਪਲਾਈਨ 15100 ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
        }
        reply_text = lang_messages.get(
            cons.language,
            "Sorry, I'm unable to connect right now. Please contact NALSA helpline: 15100 for free legal assistance."
        )

    db.add(ConsultationMessage(consultation_id=cons.id, role="model", message=reply_text))
    db.commit()

    return ChatMessageResponse(
        consultation_id=cons.id,
        reply=reply_text,
        active_track=cons.category,
        is_final_structured=False
    )
