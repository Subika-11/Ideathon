import sqlite3

conn = sqlite3.connect("app.db", check_same_thread=False)
cursor = conn.cursor()