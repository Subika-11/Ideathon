"""
schemas/chat.py — Pydantic models for legal chatbot endpoints.
"""

from pydantic import BaseModel
from typing import Optional, List


class ChatMessageRequest(BaseModel):
    """Request body for POST /api/chat"""
    text: str
    active_track: Optional[str] = None  # property | criminal | family
    language: str = "en-IN"
    consultation_id: Optional[int] = None


class StructuredDataOutput(BaseModel):
    summary: str
    actions: str
    documents: str


class ChatMessageResponse(BaseModel):
    """Chat API response"""
    consultation_id: int
    reply: str
    active_track: Optional[str] = None
    is_final_structured: bool = False
    structured_data: Optional[StructuredDataOutput] = None


class ConsultationHistoryResponse(BaseModel):
    """History of consultations response"""
    # Define fields if needed later, right now we just use dicts
    pass
