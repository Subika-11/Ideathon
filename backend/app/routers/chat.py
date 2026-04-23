"""
routers/chat.py — Legal chatbot API routes.
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.database.models import User, Consultation, ConsultationMessage, ConsultationResponse
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.chat_service import process_message
from app.services.auth_service import get_current_user

logger = logging.getLogger("legaledge.chat")

router = APIRouter(prefix="/api/chat", tags=["Legal Chatbot"])

@router.post("/", response_model=ChatMessageResponse)
def send_message(
    body: ChatMessageRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Process a user message in the legal consultation and get AI response.
    """
    return process_message(db, user.id if user else None, body)


@router.get("/history")
def chat_history(
    consultation_id: Optional[int] = None,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat history for a specific consultation or the latest active one."""
    if not user:
        return {"messages": []}

    cons = None
    if consultation_id:
        cons = db.query(Consultation).filter_by(id=consultation_id, user_id=user.id).first()
    else:
        cons = db.query(Consultation).filter_by(user_id=user.id).order_by(Consultation.created_at.desc()).first()

    if not cons:
        return {"messages": [], "consultation_id": None}
    
    messages = db.query(ConsultationMessage).filter_by(consultation_id=cons.id).order_by(ConsultationMessage.created_at).all()
    
    # Check if a structured final response was generated for this consultation
    response_record = db.query(ConsultationResponse).filter_by(consultation_id=cons.id).first()
    structured_data = None
    if response_record:
        structured_data = {
            "summary": response_record.summary,
            "actions": response_record.actions,
            "documents": response_record.documents,
        }

    return {
        "consultation_id": cons.id,
        "active_track": cons.category,
        "language": cons.language,
        "structured_data": structured_data,
        "messages": [
            {
                "id": m.id,
                "sender": "user" if m.role == "user" else "bot",
                "text": m.message,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages if m.message != "[FINAL_REPORT_GENERATED]"
        ]
    }
