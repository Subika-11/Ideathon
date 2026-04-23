"""
database/__init__.py — SQLAlchemy engine, session factory, and dependency injection.

Replaces the old raw sqlite3 connection with a proper ORM setup.
- Thread-safe session per request via get_db() dependency
- Automatic table creation on first import
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# check_same_thread=False is required for SQLite with FastAPI (multi-threaded)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite-specific
    echo=False,  # Set True to log all SQL queries (useful for debugging)
)

# ── Session Factory ───────────────────────────────────────────────────────────
# Each request gets its own session via the get_db() dependency
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative Base ──────────────────────────────────────────────────────────
# All ORM models inherit from this
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session per request.
    The session is automatically closed when the request finishes.

    Usage in routers:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
