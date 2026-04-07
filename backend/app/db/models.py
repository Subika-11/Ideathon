from app.db.database import cursor

# OTP table
cursor.execute("""
CREATE TABLE IF NOT EXISTS otp_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    otp TEXT,
    expires_at TEXT,
    verified BOOLEAN
)
""")

# Users table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    dob TEXT,
    gender TEXT,
    phone TEXT UNIQUE,
    aadhaar_last4 TEXT,
    nfc_uid TEXT
)
""")