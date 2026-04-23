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
import serial
import serial.tools.list_ports

from fastapi import APIRouter

logger = logging.getLogger("legaledge.rfid")

router = APIRouter(tags=["RFID"])

# ── Internal state ─────────────────────────────────────────────────────────────
_latest_uid: Optional[str] = None
_lock = threading.Lock()
_reader_thread: Optional[threading.Thread] = None


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
    global _latest_uid

    while True:
        port = _find_esp32_port()
        if not port:
            logger.warning("No serial port found. Retrying in 5s...")
            time.sleep(5)
            continue

        try:
            ser = serial.Serial(port, baudrate=115200, timeout=1)
            logger.info(f"Serial port opened: {port} @ 115200 baud")
        except serial.SerialException as e:
            logger.warning(f"Cannot open {port}: {e}. Retrying in 3s...")
            time.sleep(3)
            continue

        try:
            while True:
                raw = ser.readline().decode("utf-8", errors="ignore").strip()
                if not raw:
                    continue

                logger.debug(f"Serial RX: {raw!r}")

                if _is_valid_uid(raw):
                    uid = ":".join(p.upper() for p in raw.split(":")[:4])
                    with _lock:
                        _latest_uid = uid
                    logger.info(f"RFID card scanned: {uid}")

        except serial.SerialException as e:
            logger.warning(f"Serial error on {port}: {e}. Reconnecting in 3s...")
            try:
                ser.close()
            except Exception:
                pass
            time.sleep(3)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(3)


def start_rfid_reader():
    """Start the background serial reader thread (called once on startup)."""
    global _reader_thread
    if _reader_thread and _reader_thread.is_alive():
        return
    _reader_thread = threading.Thread(target=_serial_reader, daemon=True, name="rfid-reader")
    _reader_thread.start()
    logger.info("RFID reader thread started")


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
