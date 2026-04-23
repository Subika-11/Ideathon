"""
routers/reminders.py — Reminder management API routes.

Endpoints:
  GET    /api/reminders      — Get all reminders for current user
  POST   /api/reminders      — Create a new reminder
  DELETE /api/reminders/{id} — Delete a reminder
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.database.models import User, Reminder
from app.schemas.reminders import ReminderCreate, ReminderResponse
from app.services.auth_service import get_current_user

logger = logging.getLogger("legaledge.reminders")

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


# ── GET REMINDERS ─────────────────────────────────────────────────────────────
@router.get("/")
def get_reminders(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all reminders for the current user.
    Returns empty list if not authenticated (public access with no data).
    """
    if not user:
        return {"reminders": [], "total": 0}

    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == user.id)
        .order_by(Reminder.urgent.desc(), Reminder.created_at.desc())
        .all()
    )

    return {
        "reminders": [
            {
                "id": r.id,
                "type": r.type,
                "title": r.title,
                "date": r.date,
                "description": r.description,
                "urgent": r.urgent,
                "case_id": r.case_id,
            }
            for r in reminders
        ],
        "total": len(reminders),
    }


# ── CREATE REMINDER ───────────────────────────────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_reminder(
    body: ReminderCreate,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new reminder for the current user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to create reminders.",
        )

    reminder = Reminder(
        user_id=user.id,
        case_id=body.case_id,
        type=body.type,
        title=body.title,
        date=body.date,
        description=body.description,
        urgent=body.urgent,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    logger.info(f"Reminder created for user {user.id}: {reminder.title}")

    return {"success": True, "reminder_id": reminder.id}


# ── DELETE REMINDER ───────────────────────────────────────────────────────────
@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder by ID. User can only delete their own reminders."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to manage reminders.",
        )

    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user.id,
    ).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found or access denied.",
        )

    db.delete(reminder)
    db.commit()

    logger.info(f"Reminder {reminder_id} deleted by user {user.id}")
    return {"success": True}
