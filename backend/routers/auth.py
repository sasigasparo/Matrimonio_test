import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth_config import create_access_token
from database import get_guest_by_email, get_guest_by_id, create_guest, audit

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
    """Simple password-only login. Password must be 'Sasi'."""
    if req.password != "Sasi":
        raise HTTPException(401, "Invalid password")

    email = "guest@wedding.local"
    guest = get_guest_by_email(email)

    if not guest:
        guest = create_guest("Ospite", email)

    guest_id = guest["id"]
    is_admin = False

    token = create_access_token({
        "sub":      str(guest_id),
        "email":    email,
        "name":     guest["name"],
        "avatar":   guest.get("avatar_url") or "",
        "is_admin": is_admin,
    })

    audit(email, "login", f"guest:{guest_id}", "Simple password login",
          request.client.host if request.client else "")
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
