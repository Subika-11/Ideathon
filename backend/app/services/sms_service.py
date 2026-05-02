"""
services/sms_service.py — SMS sending service.

Supports two modes:
  1. Console mode (default) — prints OTP to terminal (for development/demo)
  2. Twilio mode — sends real SMS when Twilio credentials are configured in .env

The mode is auto-detected based on whether TWILIO_ACCOUNT_SID is set.
"""

import logging
from app.config import settings

logger = logging.getLogger("legaledge.sms")


def send_sms(phone: str, otp: str) -> bool:
    """
    Send an OTP via SMS to the given phone number.

    Returns True if sent successfully, False on failure.
    Falls back to console printing if Twilio is not configured.
    """
    # ── Sanitize Phone Number ──────────────────────────────────────────────
    # Remove spaces, dashes, and +91 if already provided by user
    clean_phone = phone.replace("+91", "").replace(" ", "").replace("-", "").strip()
    target_number = f"+91{clean_phone}"

    # ── Console Mode (default for development) ────────────────────────────────
    if not settings.TWILIO_ACCOUNT_SID:
        logger.info(f"📲 [CONSOLE SMS] OTP for {target_number}: {otp}")
        print(f"\n{'='*50}")
        print(f"  📲 OTP for {target_number}: {otp}")
        print(f"{'='*50}\n")
        return True

    # ── Twilio Mode (production) ──────────────────────────────────────────────
    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # Use Messaging SID if available, otherwise fallback to Phone Number
        message_args = {
            "body": f"[LegalEdge] Your OTP is: {otp}. Valid for 5 minutes.",
            "to": target_number
        }
        
        if settings.TWILIO_MESSAGING_SID:
            message_args["messaging_service_sid"] = settings.TWILIO_MESSAGING_SID
        elif settings.TWILIO_PHONE_NUMBER:
            message_args["from_"] = settings.TWILIO_PHONE_NUMBER
        else:
            raise ValueError("Neither TWILIO_MESSAGING_SID nor TWILIO_PHONE_NUMBER is configured.")

        message = client.messages.create(**message_args)
        
        logger.info(f"SMS sent to {target_number} | SID: {message.sid}")
        return True

    except Exception as e:
        logger.error(f"Failed to send SMS to {target_number}: {e}")
        # Fallback to console so the developer can still see the OTP
        print(f"\n⚠️  SMS FAILED — OTP for {target_number}: {otp}\n")
        return False