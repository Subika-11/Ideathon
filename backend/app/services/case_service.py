"""
services/case_service.py — Business logic for case tracking operations.

Handles:
  - Searching cases by CNR number
  - Creating new cases
  - Building timeline events and reminders from hearings
"""

from sqlalchemy.orm import Session
from app.database.models import Case, Hearing


def search_by_cnr(db: Session, cnr: str) -> dict:
    """
    Search for a case by its CNR number.

    Returns a dict with:
      - found: bool
      - case: Case ORM object (if found)
      - error: str (if not found)
    """
    case = db.query(Case).filter(Case.cnr == cnr.upper()).first()

    if not case:
        return {"found": False, "case": None, "error": "No case found for this CNR number."}

    return {"found": True, "case": case, "error": None}


def get_case_with_hearings(db: Session, case_id: int) -> dict:
    """Get a case with all its hearings loaded."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return {"found": False, "case": None}
    return {"found": True, "case": case}


def get_user_cases(db: Session, user_id: int) -> list[Case]:
    """Get all cases belonging to a user."""
    return db.query(Case).filter(Case.user_id == user_id).all()


def create_case(db: Session, case_data: dict, user_id: int = None) -> Case:
    """
    Create a new case record.

    Args:
        case_data: dict with case fields (cnr, title, petitioner, etc.)
        user_id: optional user to link the case to
    """
    new_case = Case(
        cnr=case_data["cnr"].upper(),
        title=case_data["title"],
        petitioner=case_data["petitioner"],
        respondent=case_data["respondent"],
        status=case_data.get("status", "active"),
        court_name=case_data["court_name"],
        state=case_data.get("state", "Tamil Nadu"),
        district=case_data.get("district", "Coimbatore"),
        next_hearing_date=case_data.get("next_hearing_date"),
        presiding_bench=case_data.get("presiding_bench"),
        user_id=user_id,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case


def build_reminders_from_hearings(hearings: list[Hearing]) -> list[dict]:
    """
    Build reminder objects from hearings that are upcoming/active.
    Used by the case tracking frontend to show alerts.
    """
    reminders = []
    for h in hearings:
        if h.status == "completed" or h.hearing_date == "Pending":
            continue

        reminder_type = "hearing"
        if h.event_type == "evidence":
            reminder_type = "document"
        elif h.event_type not in ("hearing", "scheduled"):
            reminder_type = "meeting"

        reminders.append({
            "type": reminder_type,
            "title": h.title,
            "date": h.hearing_date,
            "description": h.description,
            "urgent": h.status == "active",
        })

    return reminders
