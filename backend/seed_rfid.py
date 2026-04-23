"""
seed_rfid.py — Assign real physical RFID card UIDs to test users.

Creates 5 users (one per physical card) in the database with
the exact UIDs from the ESP32 reader.

Run:
    cd backend
    python seed_rfid.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.database.models import User, Case, Hearing, Reminder
from app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Your 5 physical card UIDs ─────────────────────────────────────────────────
CARDS = [
    {"uid": "E9:33:E2:06", "name": "Arjun Mehta",    "phone": "9000000001", "dob": "10-03-1990", "gender": "Male"},
    {"uid": "FB:F8:02:07", "name": "Priya Sharma",   "phone": "9000000002", "dob": "22-07-1995", "gender": "Female"},
    {"uid": "93:31:86:E2", "name": "Rahul Nair",     "phone": "9000000003", "dob": "05-11-1988", "gender": "Male"},
    {"uid": "F1:80:46:01", "name": "Sneha Iyer",     "phone": "9000000004", "dob": "14-04-1992", "gender": "Female"},
    {"uid": "DC:2E:6A:06", "name": "Vikram Singh",   "phone": "9000000005", "dob": "30-08-1985", "gender": "Male"},
]

try:
    created = 0
    updated = 0

    for card in CARDS:
        existing = db.query(User).filter(User.phone == card["phone"]).first()

        if existing:
            # Update NFC UID if user already exists
            existing.nfc_uid = card["uid"]
            db.commit()
            print(f"[UPDATED] {existing.name} → NFC UID: {card['uid']}")
            updated += 1
        else:
            # Also check if this UID is already taken by another user
            uid_taken = db.query(User).filter(User.nfc_uid == card["uid"]).first()
            if uid_taken:
                print(f"[SKIP]    UID {card['uid']} already assigned to {uid_taken.name}")
                continue

            user = User(
                name=card["name"],
                dob=card["dob"],
                gender=card["gender"],
                phone=card["phone"],
                aadhaar_last4="0000",
                nfc_uid=card["uid"],
                password_hash=hash_password("test1234"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Give each user a sample case so the portal has something to show
            case = Case(
                cnr=f"TNCO{user.id:012d}",
                title="Legal Aid Application",
                petitioner=user.name,
                respondent="State of Tamil Nadu",
                status="active",
                court_name="District Legal Services Authority",
                state="Tamil Nadu",
                district="Coimbatore",
                next_hearing_date="15 May 2026",
                presiding_bench="Hon. Justice R. Krishnaswamy",
                user_id=user.id,
            )
            db.add(case)
            db.commit()
            db.refresh(case)

            Hearing(
                case_id=case.id,
                event_type="filed",
                title="Application Filed",
                hearing_date="01 April 2026",
                status="completed",
                description="Legal aid application filed at district court.",
            )

            print(f"[CREATED] {user.name} (ID:{user.id}) → NFC UID: {card['uid']} | Phone: {card['phone']}")
            created += 1

    db.commit()

    print()
    print("=" * 60)
    print("  RFID USERS SEEDED SUCCESSFULLY!")
    print("=" * 60)
    print(f"  Created : {created} new users")
    print(f"  Updated : {updated} existing users")
    print()
    print("  Card → User mapping:")
    for card in CARDS:
        print(f"    {card['uid']}  →  {card['name']}  ({card['phone']})")
    print()
    print("  All users have password: test1234")
    print()

finally:
    db.close()
