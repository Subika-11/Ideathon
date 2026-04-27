import sqlite3
import os
from datetime import datetime

# Path to your database
DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")

USER_DATA = [
    {"name": "Sanjay",    "uid": "FB:F8:02:07", "phone": "9999999901"},
    {"name": "Subika",    "uid": "93:31:86:E2", "phone": "9999999902"},
    {"name": "Dharanika", "uid": "F1:80:46:01", "phone": "9999999903"},
    {"name": "Dhanya",    "uid": "E9:33:E2:06", "phone": "9999999904"},
]

def seed_identities():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("--- LegalEdge Identity Seeder ---")

    for user in USER_DATA:
        print(f"Processing {user['name']}...")
        # Clear existing data to avoid conflicts
        cursor.execute("DELETE FROM users WHERE nfc_uid = ?", (user['uid'],))
        cursor.execute("DELETE FROM users WHERE name = ?", (user['name'],))
        cursor.execute("DELETE FROM users WHERE phone = ?", (user['phone'],))
        
        # Insert fresh identity
        cursor.execute(
            "INSERT INTO users (name, dob, gender, phone, aadhaar_last4, nfc_uid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user['name'], "01-01-2000", "Unknown", user['phone'], "0000", user['uid'], datetime.now().isoformat())
        )
        print(f"DONE: {user['name']} linked to {user['uid']}")

    conn.commit()
    conn.close()
    print("--- All Identities Hardcoded! ---")

if __name__ == "__main__":
    seed_identities()
