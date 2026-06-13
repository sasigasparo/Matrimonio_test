import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import httpx
import bcrypt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from fastapi import Depends, HTTPException

logger = logging.getLogger("wedding.auth_config")

# ── Environment Variables ──────────────────────────────────────────────────────
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "your-client-id.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "your-client-secret")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
APP_URL              = os.getenv("APP_URL", "http://localhost:5173")
SECRET_KEY           = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM            = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Admin emails (can manage the app)
ADMIN_EMAILS = set(e.strip() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip())

oauth2_scheme = HTTPBearer()
oauth2_optional = HTTPBearer(auto_error=False)


# ── Password Hashing Functions ─────────────────────────────────────────────────
def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception as e:
        logger.error("Password verification error: %s", e)
        return False


# ── JWT Token Functions ────────────────────────────────────────────────────────
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token for user session."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


# ── Google OAuth Functions ─────────────────────────────────────────────────────
def get_google_auth_url() -> str:
    """Generate Google OAuth consent screen URL."""
    scopes = "openid profile email"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={scopes}&"
        f"access_type=offline"
    )
    return auth_url


async def exchange_code_for_tokens(code: str) -> Dict[str, str]:
    """Exchange authorization code for access token from Google."""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        response.raise_for_status()
        return response.json()


async def get_google_userinfo(access_token: str) -> Dict[str, Any]:
    """Fetch user info from Google using access token."""
    userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(userinfo_url, headers=headers)
        response.raise_for_status()
        return response.json()


# ── Dependency Injection ───────────────────────────────────────────────────────
async def get_current_guest(credential: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """FastAPI dependency to validate and extract current user from JWT token."""
    token = credential.credentials
    try:
        payload = decode_token(token)
        guest_id = payload.get("sub")
        if not guest_id:
            raise JWTError("No subject in token")
        return payload
    except JWTError as e:
        logger.warning("Invalid token: %s", e)
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


async def get_optional_guest(credential: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_optional)) -> Optional[Dict[str, Any]]:
    """FastAPI dependency to extract current user from JWT token if present, otherwise return None."""
    if not credential:
        return None
    token = credential.credentials
    try:
        payload = decode_token(token)
        guest_id = payload.get("sub")
        if not guest_id:
            return None
        return payload
    except JWTError as e:
        logger.warning("Invalid token: %s", e)
        return None


async def require_admin(user: Dict[str, Any] = Depends(get_current_guest)) -> Dict[str, Any]:
    """Dependency to ensure user is admin. Must be used after get_current_guest."""
    if not user.get("is_admin"):
        from fastapi import HTTPException
        raise HTTPException(403, "Admin access required")
    return user
