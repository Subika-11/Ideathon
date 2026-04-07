import random
from datetime import datetime, timedelta
from app.db.database import cursor, conn

def generate_otp():
    return str(random.randint(1000, 9999))

def save_otp(phone: str, otp: str):
    expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()

    # delete old OTP
    cursor.execute("DELETE FROM otp_verifications WHERE phone=?", (phone,))

    cursor.execute(
        "INSERT INTO otp_verifications (phone, otp, expires_at, verified) VALUES (?, ?, ?, ?)",
        (phone, otp, expires_at, False)
    )
    conn.commit()

def verify_otp(phone: str, otp: str):
    cursor.execute(
        "SELECT id, expires_at FROM otp_verifications WHERE phone=? AND otp=? AND verified=0",
        (phone, otp)
    )
    record = cursor.fetchone()

    if not record:
        return False, "Invalid OTP"

    otp_id, expires_at = record

    if datetime.fromisoformat(expires_at) < datetime.utcnow():
        return False, "OTP expired"

    cursor.execute(
        "UPDATE otp_verifications SET verified=1 WHERE id=?",
        (otp_id,)
    )
    conn.commit()

    return True, None