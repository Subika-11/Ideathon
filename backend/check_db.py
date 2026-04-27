import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()
for col in columns:
    print(col)
conn.close()
