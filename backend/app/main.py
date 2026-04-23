"""
main.py — LegalEdge FastAPI Application Entry Point.

This is the single source of truth for the FastAPI app instance.
It configures:
  - CORS middleware (origins from .env)
  - Request logging middleware
  - Global exception handlers (400, 401, 404, 500)
  - All API routers
  - Database table creation on startup
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.database.models import (
    User, OTPVerification, Case, Hearing, Reminder, Consultation, ConsultationMessage
)

# Import all routers
from app.routers import auth, cases, reminders, chat, users
from app.routers import rfid as rfid_router
from app.routers.rfid import start_rfid_reader

# ── Logging Setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("legaledge")


# ── Lifespan — runs on startup and shutdown ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Create all database tables if they don't exist.
    Shutdown: Clean up resources.
    """
    logger.info("🚀 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables ready")
    logger.info(f"🌐 CORS origins: {settings.CORS_ORIGINS}")
    # Start ESP32 RFID reader background thread
    start_rfid_reader()
    logger.info("📡 RFID serial reader started")
    logger.info("=" * 60)
    logger.info("  LegalEdge API is running!")
    logger.info("  Docs: http://localhost:8000/docs")
    logger.info("=" * 60)
    yield
    logger.info("🛑 LegalEdge API shutting down")


# ── FastAPI App Instance ──────────────────────────────────────────────────────
app = FastAPI(
    title="LegalEdge API",
    description="Backend API for the LegalEdge Digital Justice Platform",
    version="2.0.0",
    lifespan=lifespan,
)


# ── CORS Middleware ───────────────────────────────────────────────────────────
# Allows the React frontend (localhost:5173) to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Logging Middleware ────────────────────────────────────────────────
# Logs every request with method, path, status code, and response time
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} "
        f"({duration_ms:.0f}ms)"
    )

    return response


# ── Global Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(400)
async def bad_request_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "Bad request. Please check your input."},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Resource not found."},
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


# ── Register All Routers ─────────────────────────────────────────────────────
app.include_router(auth.router)           # /api/auth/*
app.include_router(cases.router)          # /api/cases/*
app.include_router(reminders.router)      # /api/reminders/*
app.include_router(chat.router)           # /api/chat/*
app.include_router(users.router)          # /api/users/*
app.include_router(rfid_router.router)    # /check-rfid


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint — used to verify the API is running."""
    return {
        "status": "healthy",
        "app": "LegalEdge API",
        "version": "2.0.0",
    }


# ── Root Redirect ─────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
def root():
    """Root endpoint — redirects users to the API documentation."""
    return {
        "message": "LegalEdge API v2.0 — Visit /docs for API documentation",
        "docs": "/docs",
    }