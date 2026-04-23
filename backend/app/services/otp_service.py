"""
services/otp_service.py — OTP generation, storage, and verification.

Uses SQLAlchemy instead of raw sqlite3 cursor.
Generates 4-digit OTPs with 5-minute expiry.
"""

import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Tuple, Optional

from app.database.models import OTPVerification


def generate_otp() -> str:
    """Generate a cryptographically secure 4-digit OTP."""
    return str(secrets.randbelow(9000) + 1000)  # Always 4 digits: 1000–9999


def save_otp(db: Session, phone: str, otp: str) -> None:
    """
    Save a new OTP for the given phone number.
    Deletes any existing unverified OTPs for the same phone first
    to prevent OTP flooding.
    """
    # Delete old unverified OTPs for this phone
    db.query(OTPVerification).filter(
        OTPVerification.phone == phone,
        OTPVerification.verified == False,
    ).delete()

    # Create new OTP record with 5-minute expiry
    new_otp = OTPVerification(
        phone=phone,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        verified=False,
    )
    db.add(new_otp)
    db.commit()


def verify_otp(db: Session, phone: str, otp: str) -> Tuple[bool, Optional[str]]:
    """
    Verify an OTP for the given phone number.

    Returns:
        (True, None) if OTP is valid
        (False, error_message) if OTP is invalid, expired, or not found
    """
    # Find unverified OTP matching phone + code
    record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone == phone,
            OTPVerification.otp == otp,
            OTPVerification.verified == False,
        )
        .first()
    )

    if not record:
        return False, "Invalid OTP. Please check and try again."

    # Check expiry
    if datetime.utcnow() > record.expires_at:
        return False, "OTP has expired. Please request a new one."

    # Mark as verified
    record.verified = True
    db.commit()

    return True, None