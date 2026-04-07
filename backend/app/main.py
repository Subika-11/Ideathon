# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import random
import string
from datetime import datetime, timedelta
import os
from fastapi import FastAPI
from app.routes import auth

app = FastAPI()

app.include_router(auth.router, prefix="/auth")
# ---------- simple in-memory stores (replace with your DB later) ----------
otp_store: dict[str, dict] = {}   # phone -> {otp, expires_at, verified}
users_store: dict[str, dict] = {} # phone -> {id, name, dob, gender, phone, aadhaar_last4, nfc_uid}
users_by_id: dict[str, dict] = {} # id -> user

# ---------- app ----------
app = FastAPI(title="LegalEdge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- models ----------
class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class SaveProfileRequest(BaseModel):
    name: str
    dob: str
    gender: str
    phone: str
    aadhaar: str

class UpdateNFCRequest(BaseModel):
    user_id: str
    nfc_uid: str

class LookupNFCRequest(BaseModel):
    nfc_uid: str

# ---------- helpers ----------
def generate_otp() -> str:
    return str(random.randint(1000, 9999))

def generate_uid() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def send_sms(phone: str, otp: str) -> bool:
    """
    Replace this stub with your SMS provider (Twilio, AWS SNS, etc.)
    For now it just prints the OTP to the console.
    """
    print(f"[SMS] Sending OTP {otp} to +91{phone}")
    return True

# =========================================================================
# ROUTES
# =========================================================================

# --- Check if already registered ---
@app.get("/auth/check/{phone}")
def check_registered(phone: str):
    user = users_store.get(phone)
    if not user:
        return {"registered": False}
    return {
        "registered": True,
        "name": user["name"],
        "hasCard": bool(user.get("nfc_uid")),
    }

# --- Send OTP ---
@app.post("/auth/send-otp")
def send_otp(body: SendOTPRequest):
    if not body.phone.isdigit() or len(body.phone) != 10:
        raise HTTPException(400, "Please enter a valid 10-digit phone number.")
    
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    otp_store[body.phone] = {"otp": otp, "expires_at": expires_at, "verified": False}

    sent = send_sms(body.phone, otp)
    if not sent:
        raise HTTPException(500, "Could not send SMS. Please check your number and try again.")

    return {"success": True}

# --- Verify OTP ---
@app.post("/auth/verify-otp")
def verify_otp(body: VerifyOTPRequest):
    if len(body.otp) != 4:
        raise HTTPException(400, "Please enter the complete 4-digit OTP.")

    record = otp_store.get(body.phone)
    if not record or record["otp"] != body.otp or record["verified"]:
        raise HTTPException(400, "Wrong OTP. Please check and try again.")

    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(400, "OTP has expired. Please request a new one.")

    otp_store[body.phone]["verified"] = True
    return {"success": True}

# --- Save profile ---
@app.post("/auth/save-profile")
def save_profile(body: SaveProfileRequest):
    # Race-condition guard
    if body.phone in users_store:
        existing = users_store[body.phone]
        return {"success": False, "alreadyRegistered": True, "existingName": existing["name"]}

    user_id = generate_uid()
    user = {
        "id": user_id,
        "name": body.name,
        "dob": body.dob,
        "gender": body.gender,
        "phone": body.phone,
        "aadhaar_last4": body.aadhaar[-4:],
        "nfc_uid": None,
    }
    users_store[body.phone] = user
    users_by_id[user_id] = user

    return {"success": True, "userId": user_id}

# --- Update NFC UID ---
@app.post("/auth/update-nfc")
def update_nfc(body: UpdateNFCRequest):
    user = users_by_id.get(body.user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    user["nfc_uid"] = body.nfc_uid
    users_store[user["phone"]]["nfc_uid"] = body.nfc_uid
    return {"success": True}

# --- Lookup by NFC UID ---
@app.post("/auth/lookup-nfc")
def lookup_nfc(body: LookupNFCRequest):
    user = next(
        (u for u in users_store.values() if u.get("nfc_uid") == body.nfc_uid),
        None
    )
    if not user:
        raise HTTPException(404, "Card not recognised. Please register as a new user.")
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "phone": user["phone"],
            "gender": user["gender"],
        }
    }