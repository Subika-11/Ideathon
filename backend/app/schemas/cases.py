"""
schemas/cases.py — Pydantic models for case tracking request/response validation.
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List


# ── Case ──────────────────────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    """Request body for POST /api/cases"""
    cnr: str
    title: str
    petitioner: str
    respondent: str
    status: str = "active"
    court_name: str
    state: str = "Tamil Nadu"
    district: str = "Coimbatore"
    next_hearing_date: Optional[str] = None
    presiding_bench: Optional[str] = None

    @field_validator("cnr")
    @classmethod
    def validate_cnr(cls, v: str) -> str:
        v = v.strip().upper()
        if len(v) != 16:
            raise ValueError("CNR must be exactly 16 characters (4 letters + 12 digits)")
        return v


class HearingResponse(BaseModel):
    """Hearing/timeline event in API response"""
    id: int
    event_type: str
    title: str
    hearing_date: str
    status: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class CaseResponse(BaseModel):
    """Full case details in API response"""
    id: int
    cnr: str
    title: str
    petitioner: str
    respondent: str
    status: str
    court_name: str
    state: str
    district: str
    next_hearing_date: Optional[str] = None
    presiding_bench: Optional[str] = None
    hearings: List[HearingResponse] = []

    class Config:
        from_attributes = True


class CaseSearchResponse(BaseModel):
    """Response for case search endpoint"""
    found: bool
    case_data: Optional[CaseResponse] = None
    error: Optional[str] = None
