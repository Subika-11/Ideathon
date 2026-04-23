"""
routers/cases.py — Case tracking API routes.

Endpoints:
  GET  /api/cases/search?cnr=XXX  — Search case by CNR number
  GET  /api/cases/{id}            — Get case details by ID
  GET  /api/cases/user/me         — Get logged-in user's cases
  POST /api/cases                 — Create a new case (protected)
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.database.models import User, Case
from app.schemas.cases import CaseCreate, CaseResponse, HearingResponse
from app.services.case_service import search_by_cnr, create_case, get_user_cases, build_reminders_from_hearings
from app.services.auth_service import get_current_user

logger = logging.getLogger("legaledge.cases")

router = APIRouter(prefix="/api/cases", tags=["Case Tracking"])


# ── SEARCH BY CNR ─────────────────────────────────────────────────────────────
@router.get("/search")
def search_case(
    cnr: str = Query(..., min_length=1, description="CNR number to search"),
    db: Session = Depends(get_db),
):
    """
    Search for a case by CNR number.
    Returns full case details with timeline events and reminders.
    """
    result = search_by_cnr(db, cnr)

    if not result["found"]:
        return {
            "found": False,
            "error": result["error"],
        }

    case = result["case"]

    # Build timeline events from hearings
    timeline_events = [
        {
            "type": h.event_type,
            "title": h.title,
            "date": h.hearing_date,
            "status": h.status,
            "description": h.description,
        }
        for h in case.hearings
    ]

    # Build reminders from upcoming hearings
    reminders = build_reminders_from_hearings(case.hearings)

    # Build case data matching frontend's expected shape
    case_data = {
        "cnr": case.cnr,
        "title": case.title,
        "petitioner": case.petitioner,
        "respondent": case.respondent,
        "status": case.status,
        "courtName": case.court_name,
        "state": case.state,
        "district": case.district,
        "nextHearingDate": case.next_hearing_date or "To be scheduled",
        "presidingBench": case.presiding_bench or "To be assigned",
    }

    logger.info(f"Case found: {case.cnr} — {case.title}")

    return {
        "found": True,
        "caseData": case_data,
        "timelineEvents": timeline_events,
        "reminders": reminders,
    }


# ── GET CASE BY ID ────────────────────────────────────────────────────────────
@router.get("/{case_id}")
def get_case(case_id: int, db: Session = Depends(get_db)):
    """Get full case details by case ID."""
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    return CaseResponse.from_orm(case)


# ── GET USER'S CASES ──────────────────────────────────────────────────────────
@router.get("/user/me")
def get_my_cases(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all cases for the currently logged-in user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to view your cases.",
        )

    cases = get_user_cases(db, user.id)
    return {
        "cases": [CaseResponse.from_orm(c) for c in cases],
        "total": len(cases),
    }


# ── CREATE CASE ───────────────────────────────────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_case(
    body: CaseCreate,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new case. Optionally linked to the authenticated user."""
    # Check for duplicate CNR
    existing = db.query(Case).filter(Case.cnr == body.cnr.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A case with CNR {body.cnr} already exists.",
        )

    case = create_case(db, body.model_dump(), user_id=user.id if user else None)
    logger.info(f"Case created: {case.cnr}")

    return {"success": True, "case_id": case.id, "cnr": case.cnr}
