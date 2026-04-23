"""
database/models.py — SQLAlchemy ORM models for all LegalEdge tables.

Tables:
  - users             : Registered citizen profiles
  - otp_verifications : OTP codes sent for phone verification
  - cases             : Court cases linked to users
  - hearings          : Timeline events (hearings, evidence, orders) per case
  - reminders         : Alerts & deadlines for users
  - consultations     : AI Legal Assistant consultation sessions
  - cons_messages     : Messages inside a consultation
  - cons_responses    : Structured final legal advice

All tables include:
  - Primary keys (auto-increment)
  - Foreign key relationships with CASCADE delete
  - UNIQUE constraints where applicable
  - Indexes on frequently queried columns
  - NOT NULL constraints on required fields
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


# ══════════════════════════════════════════════════════════════════════════════
# USERS — Citizen profiles registered via OTP + Aadhaar verification
# ══════════════════════════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    dob = Column(String(10), nullable=False)              # dd-mm-yyyy format
    gender = Column(String(20), nullable=False)
    phone = Column(String(10), unique=True, nullable=False, index=True)
    aadhaar_last4 = Column(String(4), nullable=False)
    nfc_uid = Column(String(20), unique=True, nullable=True)  # Assigned after card issue
    password_hash = Column(String(255), nullable=True)         # For phone+password login
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    cases = relationship("Case", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    consultations = relationship("Consultation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} name={self.name} phone={self.phone}>"


# ══════════════════════════════════════════════════════════════════════════════
# OTP VERIFICATIONS — Time-limited codes for phone verification
# ══════════════════════════════════════════════════════════════════════════════
class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(10), nullable=False, index=True)
    otp = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Composite index for faster OTP lookups
    __table_args__ = (
        Index("ix_otp_phone_verified", "phone", "verified"),
    )

    def __repr__(self):
        return f"<OTP phone={self.phone} verified={self.verified}>"


# ══════════════════════════════════════════════════════════════════════════════
# CASES — Court cases tracked by CNR number
# ══════════════════════════════════════════════════════════════════════════════
class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cnr = Column(String(16), unique=True, nullable=False, index=True)  # e.g. TNCO123456789012
    title = Column(String(200), nullable=False)
    petitioner = Column(String(100), nullable=False)
    respondent = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="active")      # active | hearing | closed
    court_name = Column(String(150), nullable=False)
    state = Column(String(50), default="Tamil Nadu")
    district = Column(String(50), default="Coimbatore")
    next_hearing_date = Column(String(50), nullable=True)
    presiding_bench = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="cases")
    hearings = relationship("Hearing", back_populates="case", cascade="all, delete-orphan",
                            order_by="Hearing.created_at")

    def __repr__(self):
        return f"<Case cnr={self.cnr} title={self.title}>"


# ══════════════════════════════════════════════════════════════════════════════
# HEARINGS — Timeline events belonging to a case
# ══════════════════════════════════════════════════════════════════════════════
class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(20), nullable=False)    # filed | hearing | evidence | scheduled | order
    title = Column(String(150), nullable=False)
    hearing_date = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)        # completed | active | pending
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    case = relationship("Case", back_populates="hearings")

    def __repr__(self):
        return f"<Hearing case_id={self.case_id} title={self.title}>"


# ══════════════════════════════════════════════════════════════════════════════
# REMINDERS — Alerts and deadlines for users
# ══════════════════════════════════════════════════════════════════════════════
class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(20), nullable=False)          # hearing | document | meeting | general
    title = Column(String(150), nullable=False)
    date = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    urgent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="reminders")

    def __repr__(self):
        return f"<Reminder user_id={self.user_id} title={self.title}>"


# ══════════════════════════════════════════════════════════════════════════════
# AI LEGAL CONSULTATIONS
# ══════════════════════════════════════════════════════════════════════════════
class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    category = Column(String(50), nullable=True)       # e.g., property, criminal, family
    description = Column(Text, nullable=True)          # The user's initial prompt
    status = Column(String(20), default="active", nullable=False) # active | completed
    language = Column(String(20), default="en-IN", nullable=False) # English, Hindi, Tamil
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="consultations")
    messages = relationship("ConsultationMessage", back_populates="consultation", cascade="all, delete-orphan", order_by="ConsultationMessage.created_at")
    response = relationship("ConsultationResponse", back_populates="consultation", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Consultation id={self.id} user={self.user_id} category={self.category}>"


class ConsultationMessage(Base):
    __tablename__ = "consultation_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(10), nullable=False)          # user | model
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    consultation = relationship("Consultation", back_populates="messages")

    def __repr__(self):
        return f"<ConsultationMessage cons_id={self.consultation_id} role={self.role}>"


class ConsultationResponse(Base):
    __tablename__ = "consultation_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    summary = Column(Text, nullable=False)
    actions = Column(Text, nullable=False)             # Structured string (JSON/HTML/List)
    documents = Column(Text, nullable=False)           # Structured string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    consultation = relationship("Consultation", back_populates="response")

    def __repr__(self):
        return f"<ConsultationResponse cons_id={self.consultation_id}>"
