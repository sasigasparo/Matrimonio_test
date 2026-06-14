import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import bcrypt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from fastapi import Depends, HTTPException

logger = logging.getLogger("wedding.auth_config")

# ── Environment Variables ──────────────────────────────────────────────────────
SECRET_KEY               = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Admin emails
ADMIN_EMAILS = set(e.strip() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip())

oauth2_scheme   = HTTPBearer()
oauth2_optional = HTTPBearer(auto_error=False)


# ── Password Hashing ───────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception as e:
        logger.error("Password verification error: %s", e)
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ── FastAPI Dependencies ───────────────────────────────────────────────────────
async def get_current_guest(
    credential: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
) -> Dict[str, Any]:
    token = credential.credentials
    try:
        payload = decode_token(token)
        if not payload.get("sub"):
            raise JWTError("No subject in token")
        return payload
    except JWTError as e:
        logger.warning("Invalid token: %s", e)
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


async def get_optional_guest(
    credential: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_optional),
) -> Optional[Dict[str, Any]]:
    if not credential:
        return None
    try:
        payload = decode_token(credential.credentials)
        if not payload.get("sub"):
            return None
        return payload
    except JWTError:
        return None


async def require_admin(user: Dict[str, Any] = Depends(get_current_guest)) -> Dict[str, Any]:
    if not user.get("is_admin"):
        raise HTTPException(403, "Admin access required")
    return user
