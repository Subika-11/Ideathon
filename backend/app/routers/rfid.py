"""
routers/rfid.py — RFID Card Scanner API route.

Reads from the ESP32's serial port (which sends UID strings like "E9:33:E2:06")
and exposes a single polling endpoint used by the frontend kiosk.

Endpoint:
  GET /check-rfid  — Returns {"status": "idle"} or {"status": "detected", "uid": "E9:33:E2:06"}
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional
import httpx
import serial
import serial.tools.list_ports

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.database.models import User

logger = logging.getLogger("legaledge.rfid")

router = APIRouter(tags=["RFID"])

# ── Internal state ─────────────────────────────────────────────────────────────
_latest_uid: Optional[str] = None
_presence_detected: bool = True  # Default to True so it doesn't start black if serial fails
_lock = threading.Lock()
_reader_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()
_ser: Optional[serial.Serial] = None  # Persistent serial connection for writing


def _find_esp32_port() -> Optional[str]:
    """Auto-detect the COM port where the ESP32 is connected."""
    known_keywords = ["CP210", "CH340", "FTDI", "USB-SERIAL", "USB SERIAL", "UART"]
    for port in serial.tools.list_ports.comports():
        desc = (port.description or "").upper()
        hwid = (port.hwid or "").upper()
        for kw in known_keywords:
            if kw in desc or kw in hwid:
                logger.info(f"Auto-detected ESP32 on {port.device} ({port.description})")
                return port.device
    # Fallback: use the first available port
    ports = list(serial.tools.list_ports.comports())
    if ports:
        logger.warning(f"Falling back to first port: {ports[0].device}")
        return ports[0].device
    return None


def _is_valid_uid(raw: str) -> bool:
    """Check if a string looks like a UID: e.g. E9:33:E2:06"""
    parts = raw.split(":")
    if len(parts) < 4:
        return False
    return all(
        len(p) == 2 and all(c in "0123456789ABCDEFabcdef" for c in p)
        for p in parts[:4]
    )


def _serial_reader():
    """
    Background daemon thread.
    Continuously tries to open the serial port, reads UIDs, and retries on failure.
    Recovers automatically after the Arduino sketch is uploaded and port reopens.
    """
    global _latest_uid, _presence_detected, _ser

    while not _stop_event.is_set():
        port = _find_esp32_port()
        if not port:
            logger.warning("No serial port found. Retrying in 5s...")
            _stop_event.wait(5)
            continue

        try:
            with serial.Serial(port, baudrate=115200, timeout=1) as ser:
                with _lock:
                    _ser = ser
                logger.info(f"Serial port opened: {port} @ 115200 baud")
                
                while not _stop_event.is_set():
                    try:
                        line = ser.readline()
                        if not line:
                            continue
                        
                        raw = line.decode("utf-8", errors="ignore").strip()
                        if not raw:
                            continue

                        # Robust keyword detection
                        is_on = any(kw in raw for kw in ["PRESENCE:ON", "SCREEN ON", "Person Detected"])
                        is_off = any(kw in raw for kw in ["PRESENCE:OFF", "SCREEN OFF", "No Person"])

                        if is_on:
                            with _lock:
                                if not _presence_detected:
                                    logger.info(">>> Screen Wake Up (Person Detected)")
                                    _presence_detected = True
                        elif is_off:
                            with _lock:
                                if _presence_detected:
                                    logger.info(">>> Screen Power Save (No Person)")
                                    _presence_detected = False
                        elif "RFID:" in raw:
                            uid = raw.split("RFID:")[1].strip()
                            with _lock:
                                _latest_uid = uid
                            logger.info(f"RFID card scanned: {uid}")
                        elif _is_valid_uid(raw):
                            uid = ":".join(p.upper() for p in raw.split(":")[:4])
                            with _lock:
                                _latest_uid = uid
                            logger.info(f"RFID card scanned: {uid}")
                        else:
                            # Log other messages for debugging
                            if "RFID Scanner Ready" not in raw and "--- LegalEdge" not in raw:
                                logger.info(f"ESP32 Message: {raw}")

                    except serial.SerialException as e:
                        logger.warning(f"Serial read error on {port}: {e}. Reconnecting...")
                        break
                    except Exception as e:
                        logger.error(f"Unexpected error during read: {e}")
                        _stop_event.wait(1)

        except serial.SerialException as e:
            if "PermissionError" in str(e) or "Access is denied" in str(e):
                logger.warning(f"❌ Access Denied on {port}. Please CLOSE the Arduino Serial Monitor and other serial tools.")
            else:
                logger.warning(f"Cannot open {port}: {e}")
            _stop_event.wait(3)
        finally:
            with _lock:
                _ser = None
            logger.info(f"Serial connection to {port} released")


def start_rfid_reader():
    """Start the background serial reader thread (called once on startup)."""
    global _reader_thread, _stop_event
    if _reader_thread and _reader_thread.is_alive():
        return
    _stop_event.clear()
    _reader_thread = threading.Thread(target=_serial_reader, daemon=True, name="rfid-reader")
    _reader_thread.start()
    logger.info("RFID reader thread started")


def stop_rfid_reader():
    """Stop the background serial reader thread gracefully."""
    global _reader_thread, _stop_event
    if _reader_thread:
        logger.info("Stopping RFID reader thread...")
        _stop_event.set()
        _reader_thread.join(timeout=2)
        _reader_thread = None
        logger.info("RFID reader thread stopped")


# ── Polling Endpoint ──────────────────────────────────────────────────────────

@router.get("/check-rfid")
def check_rfid():
    """
    Frontend polls this endpoint every ~1.5s.

    Returns:
      {"status": "idle"}                           - no card scanned yet
      {"status": "detected", "uid": "E9:33:E2:06"} - card detected; UID consumed after read
    """
    global _latest_uid
    with _lock:
        uid = _latest_uid
        if uid:
            _latest_uid = None  # Consume so each tap fires only once
            return {"status": "detected", "uid": uid}
    return {"status": "idle"}


@router.get("/check-presence")
def check_presence():
    """
    Frontend polls this to see if the screen should be on or off.
    """
    global _presence_detected
    with _lock:
        return {"presence": _presence_detected}


@router.post("/update-rfid")
async def update_rfid(payload: dict = Body(...), db: Session = Depends(get_db)):
    """
    ESP32 calls this endpoint via WiFi when a card is scanned.
    Payload: {"uid": "E9:33:E2:06"}
    """
    global _latest_uid
    uid = payload.get("uid")
    if not uid:
        return {"status": "error", "message": "No UID provided"}

    uid = uid.upper()
    with _lock:
        _latest_uid = uid
    
    # Check if this card belongs to a registered user
    user = db.query(User).filter(User.nfc_uid == uid).first()
    
    if user:
        logger.info(f"RFID Sync: User '{user.name}' (ID: {user.id}) detected via card {uid}")
        return {
            "status": "success", 
            "received": uid,
            "user_found": True,
            "user_name": user.name,
            "user_id": user.id
        }
    else:
        logger.warning(f"RFID Sync: Unknown card {uid} scanned")
        return {
            "status": "success", 
            "received": uid,
            "user_found": False,
            "message": "Card not assigned to any user"
        }
@router.post("/update-presence")
async def update_presence(payload: dict = Body(...)):
    """
    ESP32 calls this via WiFi to report if someone is detected.
    Payload: {"presence": true} or {"presence": false}
    """
    global _presence_detected
    presence = payload.get("presence", True)
    with _lock:
        if presence != _presence_detected:
            state = "Wake Up" if presence else "Power Save"
            logger.info(f">>> Wireless Presence: {state}")
            _presence_detected = presence
    return {"status": "ok"}
 
@router.post("/play-audio")
async def play_audio(track: int):
    """Trigger audio on the ESP32 via the active Serial connection."""
    global _ser
    
    with _lock:
        if _ser and _ser.is_open:
            try:
                command = f"{track}\n"
                _ser.write(command.encode("utf-8"))
                logger.info(f"Serial Audio Triggered: Track {track}")
                return {"status": "success", "mode": "serial"}
            except Exception as e:
                logger.error(f"Serial Audio Write Failed: {e}")
                return {"status": "error", "message": f"Serial write error: {e}"}
        else:
            logger.warning(f"Serial Audio Failed: No active serial connection for track {track}")
            return {"status": "error", "message": "Serial port not open"}


def trigger_motor_on_otp_verified() -> bool:
    """
    Send OTP_VERIFIED command to ESP32 to trigger motor after OTP verification.
    Called from auth.py after successful OTP verification.
    Returns True if command sent successfully, False otherwise.
    """
    global _ser
    
    with _lock:
        if _ser and _ser.is_open:
            try:
                command = "OTP_VERIFIED\n"
                _ser.write(command.encode("utf-8"))
                logger.info("✅ OTP_VERIFIED command sent to ESP32 - Motor triggered")
                return True
            except Exception as e:
                logger.error(f"❌ Failed to send OTP_VERIFIED command: {e}")
                return False
        else:
            logger.warning("⚠️ Serial port not open - Motor trigger failed")
            return False

