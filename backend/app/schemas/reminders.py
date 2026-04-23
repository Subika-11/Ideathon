"""
schemas/reminders.py — Pydantic models for reminder endpoints.
"""

from pydantic import BaseModel
from typing import Optional, List


class ReminderCreate(BaseModel):
    """Request body for POST /api/reminders"""
    type: str          # hearing | document | meeting | general
    title: str
    date: str
    description: Optional[str] = None
    urgent: bool = False
    case_id: Optional[int] = None


class ReminderResponse(BaseModel):
    """Single reminder in API response"""
    id: int
    type: str
    title: str
    date: str
    description: Optional[str] = None
    urgent: bool = False
    case_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ReminderListResponse(BaseModel):
    """List of reminders"""
    reminders: List[ReminderResponse]
    total: int
