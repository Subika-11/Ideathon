import sys
import os
import random

# Add the backend directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.database.models import User, Case, Hearing

# Names to create cases for
names = ["Subika", "Sanjay", "Dhanya", "Dharanika"]

# Expanded variety of case titles
titles = [
    "Property Dispute Resolution", "Consumer Rights Violation", "Civil Defamation Suit",
    "Land Encroachment Case", "Labor Law Dispute", "Contractual Breach Claim",
    "Family Inheritance Matter", "Public Interest Litigation", "Taxation Dispute",
    "Environmental Compliance Case", "Intellectual Property Theft", "Employment Discrimination",
    "Insurance Claim Dispute", "Corporate Fraud Investigation", "Motor Accident Compensation",
    "Matrimonial Relief Petition", "Cheque Bounce Case (Sec 138)", "Specific Performance of Contract",
    "Easement Rights Dispute", "Partition Suit", "Eviction Proceedings", "Money Recovery Suit",
    "Writ Petition (Certiorari)", "Anticipatory Bail Application", "Custody of Minor Dispute"
]

# Expanded variety of court names
courts = [
    "District Court, Coimbatore", "Consumer Forum, Coimbatore", "High Court, Madras",
    "Civil Court, Pollachi", "Labor Court, Coimbatore", "Sub-Court, Tirupur",
    "Family Court, Coimbatore", "Magistrate Court, Coimbatore", "Debt Recovery Tribunal",
    "National Company Law Tribunal (NCLT)", "State Consumer Commission, Chennai"
]

# Variety of respondents
respondents = [
    "State of Tamil Nadu", "Municipal Corporation, Coimbatore", "Central Board of Direct Taxes",
    "XYZ Electronics Pvt Ltd", "Global Insurance Co.", "Reliance Jio Infocomm",
    "National Highways Authority", "HDFC Bank Ltd", "Local Panchayat Administration",
    "Southern Railways", "Bharathiar University", "Tamil Nadu Electricity Board (TNEB)"
]

months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

db = SessionLocal()

def generate_cnr():
    """Generates a CNR number in the format TNCO + 12 digits"""
    digits = "".join([str(random.randint(0, 9)) for _ in range(12)])
    return f"TNCO{digits}"

def add_hearings_to_case(case_id):
    """Adds a timeline of events to a case with varied dates"""
    # 1. Filed event (2024)
    reg_month = random.choice(months[:6]) # Jan - Jun 2024
    db.add(Hearing(
        case_id=case_id,
        event_type="filed",
        title="Case Registered",
        hearing_date=f"{random.randint(1, 28)} {reg_month} 2024",
        status="completed",
        description="Initial petition accepted and case number assigned."
    ))
    
    # 2. Previous hearing (Late 2024 / Early 2025)
    prelim_month = random.choice(months[6:]) # Jul - Dec 2024
    db.add(Hearing(
        case_id=case_id,
        event_type="hearing",
        title="Preliminary Hearing",
        hearing_date=f"{random.randint(1, 28)} {prelim_month} 2024",
        status="completed",
        description="First appearance of parties. Documents verified."
    ))

    # 3. Evidence Submission (Mid 2025 - Early 2026)
    ev_month = random.choice(months)
    ev_year = random.choice([2025, 2026])
    db.add(Hearing(
        case_id=case_id,
        event_type="evidence",
        title="Evidence Submission",
        hearing_date=f"{random.randint(1, 28)} {ev_month} {ev_year}",
        status="active",
        description="Submit all original property/contract documents to the court registry."
    ))

    # 4. Main Arguments (Late 2026)
    arg_month = random.choice(months[6:]) # Jul - Dec 2026
    db.add(Hearing(
        case_id=case_id,
        event_type="scheduled",
        title="Main Arguments",
        hearing_date=f"{random.randint(1, 28)} {arg_month} 2026",
        status="pending",
        description="Detailed oral arguments from both the petitioner and respondent."
    ))

try:
    print("Clearing existing cases to re-seed with varied dates...")
    db.query(Hearing).delete()
    db.query(Case).delete()
    db.commit()

    print("Starting massive seeding of 1000 cases with varied timelines...")
    
    # Check for demo user to link cases if they exist
    demo_user = db.query(User).filter(User.name == "Sanjay R").first()
    user_id = demo_user.id if demo_user else None

    total_created = 0
    cases_per_person = 250
    
    for name in names:
        print(f"Generating {cases_per_person} cases for {name}...")
        for i in range(cases_per_person):
            cnr = generate_cnr()
            while db.query(Case).filter(Case.cnr == cnr).first():
                cnr = generate_cnr()
            
            # Use one of the upcoming dates for next_hearing_date for consistency
            next_date = f"{random.randint(1, 28)} {random.choice(months)} 2026"
            
            new_case = Case(
                cnr=cnr,
                title=random.choice(titles),
                petitioner=name,
                respondent=random.choice(respondents),
                status="active",
                court_name=random.choice(courts),
                state="Tamil Nadu",
                district=random.choice(["Coimbatore", "Tirupur", "Chennai", "Erode"]),
                next_hearing_date=next_date,
                presiding_bench=f"Hon. Justice {random.choice(['M. Venkatesh', 'K. Priya', 'R. Subramanian', 'S. Meenakshi', 'A. Kumar', 'P. Lakshmi'])}",
                user_id=user_id if name == "Sanjay" else None
            )
            db.add(new_case)
            db.flush()
            
            # Add timeline events
            add_hearings_to_case(new_case.id)
            
            total_created += 1
            if total_created % 100 == 0:
                db.commit()
                print(f"  Processed {total_created} cases...")
    
    db.commit()
    print(f"\n[OK] Successfully created 1000 cases with varied timelines.")

finally:
    db.close()
