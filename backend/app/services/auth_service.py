"""
services/auth_service.py — JWT token creation/verification and password hashing.

Handles:
  - Creating JWT access tokens with configurable expiry
  - Verifying and decoding JWT tokens
  - Hashing passwords with bcrypt
  - Verifying passwords against hashes
  - FastAPI dependency to extract current user from token
"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.database.models import User

# ── Password Hashing ─────────────────────────────────────────────────────────
# Uses bcrypt — industry standard for password storage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 Token Extraction ──────────────────────────────────────────────────
# Looks for "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain-text password matches its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT token.

    Args:
        data: Payload to encode (must include 'sub' for user identifier)
        expires_delta: Custom expiry time (defaults to config value)

    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.

    Returns:
        Decoded payload dict, or None if token is invalid/expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    FastAPI dependency that extracts the current user from the JWT token.

    Returns None if no token is provided (for optional auth routes).
    Raises 401 if token is invalid or user not found.

    Usage:
        @router.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            ...
    """
    if token is None:
        return None

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload invalid.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Account may have been deleted.",
        )

    return user


def require_auth(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """
    Strict auth dependency — raises 401 if user is not authenticated.
    Use this for routes that REQUIRE login.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
