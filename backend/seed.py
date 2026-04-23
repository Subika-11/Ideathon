"""
seed.py — Populate the database with demo data for testing/viva.

Run this script after starting the server at least once (so tables exist):
    cd backend
    python seed.py

Creates:
  - 1 demo user (phone: 9876543210, password: demo1234)
  - 2 court cases with timeline hearings
  - 6 reminders
  - Sample chat messages
"""

import sys
import os

# Add the backend directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.database.models import User, Case, Hearing, Reminder, Consultation, ConsultationMessage
from app.services.auth_service import hash_password

# Create all tables first
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ── Check if already seeded ───────────────────────────────────────────────
    existing = db.query(User).filter(User.phone == "9876543210").first()
    if existing:
        print("[SKIP] Database already seeded. Skipping.")
        print(f"   Demo user exists: {existing.name} (ID: {existing.id})")
        sys.exit(0)

    # ══════════════════════════════════════════════════════════════════════════
    # 1. CREATE DEMO USER
    # ══════════════════════════════════════════════════════════════════════════
    demo_user = User(
        name="Sanjay R",
        dob="15-06-2004",
        gender="Male",
        phone="9876543210",
        aadhaar_last4="7890",
        nfc_uid="AA:BB:CC:DD",
        password_hash=hash_password("demo1234"),
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    print(f"[OK] Demo user created: {demo_user.name} (ID: {demo_user.id})")
    print(f"   Phone: 9876543210 | Password: demo1234")

    # ══════════════════════════════════════════════════════════════════════════
    # 2. CREATE CASES
    # ══════════════════════════════════════════════════════════════════════════
    case1 = Case(
        cnr="TNCO123456789012",
        title="Property Dispute Resolution",
        petitioner="Sanjay R",
        respondent="Municipal Corporation",
        status="hearing",
        court_name="District Court, Coimbatore",
        state="Tamil Nadu",
        district="Coimbatore",
        next_hearing_date="15 February 2026",
        presiding_bench="Hon. Justice M. Venkatesh",
        user_id=demo_user.id,
    )
    case2 = Case(
        cnr="TNCO987654321098",
        title="Consumer Rights Violation",
        petitioner="Sanjay R",
        respondent="XYZ Electronics Pvt Ltd",
        status="active",
        court_name="Consumer Forum, Coimbatore",
        state="Tamil Nadu",
        district="Coimbatore",
        next_hearing_date="20 March 2026",
        presiding_bench="Hon. Justice K. Priya",
        user_id=demo_user.id,
    )
    db.add_all([case1, case2])
    db.commit()
    db.refresh(case1)
    db.refresh(case2)
    print(f"[OK] Case created: {case1.cnr} - {case1.title}")
    print(f"[OK] Case created: {case2.cnr} - {case2.title}")

    # ══════════════════════════════════════════════════════════════════════════
    # 3. CREATE HEARINGS (TIMELINE) FOR CASE 1
    # ══════════════════════════════════════════════════════════════════════════
    hearings = [
        Hearing(
            case_id=case1.id,
            event_type="filed",
            title="Case Filed",
            hearing_date="12 March 2025",
            status="completed",
            description="Initial petition submitted with required documents",
        ),
        Hearing(
            case_id=case1.id,
            event_type="hearing",
            title="First Hearing",
            hearing_date="28 April 2025",
            status="completed",
            description="Both parties presented preliminary arguments",
        ),
        Hearing(
            case_id=case1.id,
            event_type="evidence",
            title="Evidence Submitted",
            hearing_date="15 July 2025",
            status="completed",
            description="Property documents and witness statements filed",
        ),
        Hearing(
            case_id=case1.id,
            event_type="scheduled",
            title="Arguments Hearing",
            hearing_date="15 February 2026",
            status="active",
            description="Detailed arguments from both sides scheduled",
        ),
        Hearing(
            case_id=case1.id,
            event_type="order",
            title="Final Order",
            hearing_date="Pending",
            status="pending",
            description="Awaiting court decision",
        ),
    ]
    # Hearings for case 2
    hearings += [
        Hearing(
            case_id=case2.id,
            event_type="filed",
            title="Complaint Filed",
            hearing_date="01 January 2026",
            status="completed",
            description="Consumer complaint filed against electronics company",
        ),
        Hearing(
            case_id=case2.id,
            event_type="hearing",
            title="Notice to Respondent",
            hearing_date="15 February 2026",
            status="completed",
            description="Notice issued to XYZ Electronics Pvt Ltd",
        ),
        Hearing(
            case_id=case2.id,
            event_type="scheduled",
            title="Mediation Hearing",
            hearing_date="20 March 2026",
            status="active",
            description="Mediation session scheduled between both parties",
        ),
    ]
    db.add_all(hearings)
    db.commit()
    print(f"[OK] {len(hearings)} hearings created for both cases")

    # ══════════════════════════════════════════════════════════════════════════
    # 4. CREATE REMINDERS
    # ══════════════════════════════════════════════════════════════════════════
    reminders = [
        Reminder(
            user_id=demo_user.id,
            case_id=case1.id,
            type="hearing",
            title="Upcoming Court Hearing",
            date="15 February 2026, 10:30 AM",
            description="Court Room 4, District Court Coimbatore — Arguments Hearing scheduled.",
            urgent=True,
        ),
        Reminder(
            user_id=demo_user.id,
            case_id=case1.id,
            type="document",
            title="Document Submission Deadline",
            date="10 February 2026",
            description="Additional evidence documents must be submitted to the court registry.",
            urgent=False,
        ),
        Reminder(
            user_id=demo_user.id,
            type="meeting",
            title="Lawyer Consultation",
            date="12 February 2026, 3:00 PM",
            description="Pre-hearing preparation meeting with your advocate.",
            urgent=False,
        ),
        Reminder(
            user_id=demo_user.id,
            type="general",
            title="Court Holiday — Republic Day",
            date="26 January 2026",
            description="All district courts will remain closed on Republic Day.",
            urgent=False,
        ),
        Reminder(
            user_id=demo_user.id,
            case_id=case2.id,
            type="hearing",
            title="Consumer Forum Mediation",
            date="20 March 2026, 11:00 AM",
            description="Mediation session at Consumer Forum, Coimbatore.",
            urgent=True,
        ),
        Reminder(
            user_id=demo_user.id,
            type="general",
            title="Carry Original Documents",
            date="All Hearings",
            description="Always carry original copies of all submitted documents to every hearing.",
            urgent=False,
        ),
    ]
    db.add_all(reminders)
    db.commit()
    print(f"[OK] {len(reminders)} reminders created")

    # ══════════════════════════════════════════════════════════════════════════
    # 5. CREATE SAMPLE CONSULTATION
    # ══════════════════════════════════════════════════════════════════════════
    cons = Consultation(user_id=demo_user.id, category="property", language="en-IN", description="I have a property dispute")
    db.add(cons)
    db.commit()
    db.refresh(cons)

    chat_msgs = [
        ConsultationMessage(consultation_id=cons.id, role="model",
                    message="Welcome to **Legal Edge AI**. ⚖️\n\nI am designed to provide preliminary guidance. **Please describe your issue below.**"),
        ConsultationMessage(consultation_id=cons.id, role="user", message="I have a property dispute"),
        ConsultationMessage(consultation_id=cons.id, role="model",
                    message="Track set to **Property Law**. I can now provide specific checklists for land and housing disputes."),
    ]
    db.add_all(chat_msgs)
    db.commit()
    print(f"[OK] {len(chat_msgs)} consultation messages created")

    # ══════════════════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("  [DONE] DATABASE SEEDED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\n  Demo Login Credentials:")
    print(f"  Phone: 9876543210")
    print(f"  Password: demo1234")
    print(f"  NFC UID: AA:BB:CC:DD")
    print(f"\n  Test CNR Numbers:")
    print(f"  {case1.cnr} - {case1.title}")
    print(f"  {case2.cnr} - {case2.title}")
    print()

finally:
    db.close()
