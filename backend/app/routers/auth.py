"""
routers/auth.py — Authentication API routes.

Endpoints:
  POST /api/auth/send-otp      — Send OTP to phone
  POST /api/auth/verify-otp    — Verify OTP code
  POST /api/auth/save-profile  — Register new user (signup)
  POST /api/auth/login         — Login with phone + password
  GET  /api/auth/check/{phone} — Check if phone is already registered
  POST /api/auth/update-nfc    — Assign NFC UID to user
  POST /api/auth/lookup-nfc    — Find user by NFC card UID
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import User
from app.schemas.auth import (
    SendOTPRequest, VerifyOTPRequest, SignupRequest, LoginRequest,
    UpdateNFCRequest, LookupNFCRequest, TokenResponse, UserResponse,
)
from app.services.otp_service import generate_otp, save_otp, verify_otp
from app.services.sms_service import send_sms
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
)
from app.routers.rfid import trigger_motor_on_otp_verified

logger = logging.getLogger("legaledge.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── CHECK USER ────────────────────────────────────────────────────────────────
@router.get("/check/{phone}")
def check_user(phone: str, db: Session = Depends(get_db)):
    """Check if a phone number is already registered."""
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        return {"registered": False}

    return {
        "registered": True,
        "name": user.name,
        "hasCard": bool(user.nfc_uid),
    }


# ── SEND OTP ──────────────────────────────────────────────────────────────────
@router.post("/send-otp")
def send_otp_route(body: SendOTPRequest, db: Session = Depends(get_db)):
    """Generate and send a 4-digit OTP to the given phone number."""
    otp = generate_otp()
    save_otp(db, body.phone, otp)

    sent = send_sms(body.phone, otp)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send SMS. Please try again.",
        )

    logger.info(f"OTP sent to +91{body.phone}")
    return {"success": True}


# ── VERIFY OTP ────────────────────────────────────────────────────────────────
@router.post("/verify-otp")
def verify_otp_route(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify a 4-digit OTP for the given phone number."""
    success, error = verify_otp(db, body.phone, body.otp)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    logger.info(f"OTP verified for +91{body.phone}")
    
    # Trigger motor on ESP32 after OTP verification
    motor_triggered = trigger_motor_on_otp_verified()
    
    return {
        "success": True,
        "motor_triggered": motor_triggered
    }


# ── SAVE PROFILE (SIGNUP) ────────────────────────────────────────────────────
@router.post("/save-profile", status_code=status.HTTP_201_CREATED)
def save_profile(body: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user after OTP verification.
    Returns JWT token on success for immediate session.
    """
    # Check for duplicate phone
    existing = db.query(User).filter(User.phone == body.phone).first()
    if existing:
        return {
            "success": False,
            "alreadyRegistered": True,
            "existingName": existing.name,
        }

    # Create user
    new_user = User(
        name=body.name,
        dob=body.dob,
        gender=body.gender,
        phone=body.phone,
        aadhaar_last4=body.aadhaar[-4:],
        password_hash=hash_password(body.password) if body.password else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token for immediate session
    token = create_access_token(data={"sub": str(new_user.id)})

    logger.info(f"New user registered: {new_user.name} (ID: {new_user.id})")

    return {
        "success": True,
        "userId": new_user.id,
        "access_token": token,
        "token_type": "bearer",
        "name": new_user.name,
    }


# ── LOGIN ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone number and password. Returns JWT token."""
    user = db.query(User).filter(User.phone == body.phone).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this phone number.",
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No password set. Please use OTP login or reset password.",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    token = create_access_token(data={"sub": str(user.id)})

    logger.info(f"User logged in: {user.name} (ID: {user.id})")

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
    )


# ── UPDATE NFC ────────────────────────────────────────────────────────────────
@router.post("/update-nfc")
def update_nfc(body: UpdateNFCRequest, db: Session = Depends(get_db)):
    """Assign an NFC card UID to a registered user."""
    user = db.query(User).filter(User.id == body.user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Check if NFC UID is already assigned to another user
    existing = db.query(User).filter(User.nfc_uid == body.nfc_uid, User.id != body.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This NFC card is already assigned to another user.",
        )

    user.nfc_uid = body.nfc_uid
    db.commit()

    logger.info(f"NFC UID assigned to user {user.name}: {body.nfc_uid}")
    return {"success": True}


# ── LOOKUP NFC ────────────────────────────────────────────────────────────────
@router.post("/lookup-nfc")
def lookup_nfc(body: LookupNFCRequest, db: Session = Depends(get_db)):
    """Find a user by their NFC card UID. Used for kiosk card-tap login."""
    user = db.query(User).filter(User.nfc_uid == body.nfc_uid).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not recognised. Please register as a new user.",
        )

    # Generate a token for card-tap login too
    token = create_access_token(data={"sub": str(user.id)})

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "gender": user.gender,
        },
    }
