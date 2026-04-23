"""
routers/users.py — User profile API routes.

Endpoints:
  GET /api/users/me  — Get current user's profile
  PUT /api/users/me  — Update current user's profile
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.database.models import User
from app.schemas.auth import UserResponse
from app.services.auth_service import require_auth

logger = logging.getLogger("legaledge.users")

router = APIRouter(prefix="/api/users", tags=["Users"])


class UpdateProfileRequest(BaseModel):
    """Request body for PUT /api/users/me"""
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None


# ── GET PROFILE ───────────────────────────────────────────────────────────────
@router.get("/me")
def get_profile(user: User = Depends(require_auth)):
    """Get the currently authenticated user's profile."""
    return {
        "id": user.id,
        "name": user.name,
        "dob": user.dob,
        "gender": user.gender,
        "phone": user.phone,
        "aadhaar_last4": user.aadhaar_last4,
        "nfc_uid": user.nfc_uid,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── UPDATE PROFILE ────────────────────────────────────────────────────────────
@router.put("/me")
def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Update the currently authenticated user's profile."""
    if body.name is not None:
        user.name = body.name.strip()
    if body.dob is not None:
        user.dob = body.dob.strip()
    if body.gender is not None:
        user.gender = body.gender.strip()

    db.commit()
    db.refresh(user)

    logger.info(f"Profile updated for user {user.id}")

    return {
        "success": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "dob": user.dob,
            "gender": user.gender,
            "phone": user.phone,
        },
    }
