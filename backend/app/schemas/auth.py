"""
schemas/auth.py — Pydantic models for authentication request/response validation.

Every field is validated before reaching the service layer.
This prevents invalid data from ever touching the database.
"""

from pydantic import BaseModel, field_validator
from typing import Optional


# ── OTP Flow ──────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    """Request body for POST /api/auth/send-otp"""
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Phone must be exactly 10 digits")
        return v


class VerifyOTPRequest(BaseModel):
    """Request body for POST /api/auth/verify-otp"""
    phone: str
    otp: str

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 4:
            raise ValueError("OTP must be exactly 4 digits")
        return v


# ── Registration ──────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    """Request body for POST /api/auth/save-profile (registration)"""
    name: str
    dob: str
    gender: str
    phone: str
    aadhaar: str
    password: Optional[str] = None  # Optional — users can set a password for login

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Phone must be exactly 10 digits")
        return v

    @field_validator("aadhaar")
    @classmethod
    def validate_aadhaar(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 12:
            raise ValueError("Aadhaar must be exactly 12 digits")
        return v


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Request body for POST /api/auth/login"""
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Phone must be exactly 10 digits")
        return v


# ── NFC Operations ────────────────────────────────────────────────────────────

class UpdateNFCRequest(BaseModel):
    """Request body for POST /api/auth/update-nfc"""
    user_id: int
    nfc_uid: str

    @field_validator("nfc_uid")
    @classmethod
    def validate_nfc(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 4:
            raise ValueError("NFC UID too short")
        return v


class LookupNFCRequest(BaseModel):
    """Request body for POST /api/auth/lookup-nfc"""
    nfc_uid: str


# ── Responses ─────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT token response returned after login/signup"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str


class UserResponse(BaseModel):
    """User profile response"""
    id: int
    name: str
    dob: str
    gender: str
    phone: str
    aadhaar_last4: str
    nfc_uid: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True  # Allow creating from ORM objects
