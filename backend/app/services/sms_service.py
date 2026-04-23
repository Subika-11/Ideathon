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
    # ── Console Mode (default for development) ────────────────────────────────
    if not settings.TWILIO_ACCOUNT_SID:
        logger.info(f"📲 [CONSOLE SMS] OTP for +91{phone}: {otp}")
        print(f"\n{'='*50}")
        print(f"  📲 OTP for +91{phone}: {otp}")
        print(f"{'='*50}\n")
        return True

    # ── Twilio Mode (production) ──────────────────────────────────────────────
    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"[LegalEdge] Your OTP is: {otp}. Valid for 5 minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=f"+91{phone}",
        )
        logger.info(f"SMS sent to +91{phone} | SID: {message.sid}")
        return True

    except Exception as e:
        logger.error(f"Failed to send SMS to +91{phone}: {e}")
        # Fallback to console so the developer can still see the OTP
        print(f"\n⚠️  SMS FAILED — OTP for +91{phone}: {otp}\n")
        return False