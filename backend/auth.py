from datetime import datetime, timedelta, timezone
import os

import jwt
from fastapi import HTTPException, status

from security import verify_password

import secrets
import hashlib

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def authenticate_admin(db, username: str, password: str):
    from models import Admin

    admin = db.query(Admin).filter(
        Admin.username == username
    ).first()

    if not admin or not verify_password(
        password, admin.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    return admin


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_password_reset_token():
    """Generate a secure random password-reset token."""
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str):
    """Hash the token before storing it in the database."""
    return hashlib.sha256(token.encode()).hexdigest()