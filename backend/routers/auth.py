import logging
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth_config import create_access_token
from database import get_guest_by_email, get_guest_by_id, create_guest, audit
from tenant import resolve_matrimonio_id, HEADER_NAME

LOGIN_PASSWORD = os.getenv("LOGIN_PASSWORD", "Sasi")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

router = APIRouter()
logger = logging.getLogger("wedding.auth")


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    guest: dict


class SimpleLoginRequest(BaseModel):
    password: str


@router.get("/me")
async def me(request: Request):
    from auth_config import decode_token
    from jose import JWTError
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(auth_header[7:])
    except JWTError:
        raise HTTPException(401, "Invalid token")

    g = get_guest_by_id(int(payload["sub"]))
    if not g:
        raise HTTPException(404, "Guest not found")
    return g


@router.post("/simple-login")
async def simple_login(req: SimpleLoginRequest, request: Request):
    """Simple password-only login. Admin gets is_admin=True if ADMIN_PASSWORD matches."""
    if ADMIN_PASSWORD and req.password == ADMIN_PASSWORD:
        is_admin = True
    elif req.password == LOGIN_PASSWORD:
        is_admin = False
    else:
        raise HTTPException(401, "Invalid password")

    matrimonio_id = resolve_matrimonio_id(request.headers.get(HEADER_NAME))

    email = "admin@wedding.local" if is_admin else "guest@wedding.local"
    guest = get_guest_by_email(email, matrimonio_id)

    if not guest:
        name = "Amministratore" if is_admin else "Ospite"
        guest = create_guest(name, email, matrimonio_id=matrimonio_id)

    guest_id = guest["id"]

    token = create_access_token({
        "sub":      str(guest_id),
        "email":    email,
        "name":     guest["name"],
        "avatar":   guest.get("avatar_url") or "",
        "is_admin": is_admin,
        "mid":      matrimonio_id,
    })

    audit(email, "login", f"guest:{guest_id}", "Simple password login",
          request.client.host if request.client else "", matrimonio_id)
    logger.info("Guest logged in via simple login (guest:%s)", guest_id)

    return TokenOut(
        access_token=token,
        guest={
            "id":       guest_id,
            "email":    email,
            "name":     guest["name"],
            "is_admin": is_admin,
            "avatar":   guest.get("avatar_url") or ""
        }
    )
