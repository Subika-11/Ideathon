from fastapi import APIRouter, HTTPException
from app.services.otp_service import generate_otp, save_otp, verify_otp
from app.services.sms_service import send_sms
from app.db.database import cursor, conn

router = APIRouter()

# ✅ CHECK USER
@router.get("/check/{phone}")
def check_user(phone: str):
    cursor.execute("SELECT name, nfc_uid FROM users WHERE phone=?", (phone,))
    user = cursor.fetchone()

    if not user:
        return {"registered": False}

    name, nfc_uid = user
    return {
        "registered": True,
        "name": name,
        "hasCard": bool(nfc_uid)
    }

# ✅ SEND OTP
@router.post("/send-otp")
def send_otp(data: dict):
    phone = data.get("phone")

    if not phone or len(phone) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    otp = generate_otp()
    save_otp(phone, otp)
    send_sms(phone, otp)

    return {"success": True}

# ✅ VERIFY OTP
@router.post("/verify-otp")
def verify_otp_route(data: dict):
    phone = data.get("phone")
    otp = data.get("otp")

    success, error = verify_otp(phone, otp)

    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"success": True}

# ✅ SAVE USER
@router.post("/save-profile")
def save_profile(data: dict):
    cursor.execute("SELECT id, name FROM users WHERE phone=?", (data["phone"],))
    existing = cursor.fetchone()

    if existing:
        return {
            "success": False,
            "alreadyRegistered": True,
            "existingName": existing[1]
        }

    cursor.execute(
        """INSERT INTO users (name, dob, gender, phone, aadhaar_last4, nfc_uid)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            data["name"],
            data["dob"],
            data["gender"],
            data["phone"],
            data["aadhaar"][-4:],
            None
        )
    )
    conn.commit()

    user_id = cursor.lastrowid
    return {"success": True, "userId": user_id}

# ✅ UPDATE NFC
@router.post("/update-nfc")
def update_nfc(data: dict):
    cursor.execute(
        "UPDATE users SET nfc_uid=? WHERE id=?",
        (data["nfc_uid"], data["user_id"])
    )
    conn.commit()

    return {"success": True}

# ✅ LOOKUP NFC
@router.post("/lookup-nfc")
def lookup_nfc(data: dict):
    cursor.execute(
        "SELECT id, name, phone, gender FROM users WHERE nfc_uid=?",
        (data["nfc_uid"],)
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Card not recognised")

    return {
        "success": True,
        "user": {
            "id": user[0],
            "name": user[1],
            "phone": user[2],
            "gender": user[3]
        }
    }