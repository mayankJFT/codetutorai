"""Auth helpers shared by backend.py and tests (no FastAPI import needed)."""

import bcrypt

_BCRYPT_MAX_BYTES = 72


def _password_bytes(password: str) -> bytes:
    # bcrypt only reads the first 72 bytes; slicing avoids the ValueError
    # newer bcrypt versions raise for longer inputs.
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()
