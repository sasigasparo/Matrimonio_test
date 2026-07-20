import logging
import os
from datetime import datetime
from typing import Optional, List

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth_config import get_current_guest, require_admin
from database import get_db, audit
from tenant import get_matrimonio_id

router = APIRouter()
logger = logging.getLogger("wedding.guests")

BREVO_API_KEY      = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "")
BREVO_SENDER_NAME  = os.getenv("BREVO_SENDER_NAME", "")
BREVO_API_URL      = "https://api.brevo.com/v3/smtp/email"
COUPLE_NAMES   = os.getenv("COUPLE_NAMES", "Antonios & Petronia")
WEDDING_DATE   = os.getenv("WEDDING_DATE", "17 October 2026")
WEDDING_VENUE  = os.getenv("WEDDING_VENUE", "Estia Home of Taste, Zürich")
APP_URL        = os.getenv("APP_URL", "http://localhost:5173")
LOGIN_PASSWORD = os.getenv("LOGIN_PASSWORD", "")


# ── Schemas ───────────────────────────────────────────────────────────────────
class GuestCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    table_num: Optional[int] = None
    dietary: Optional[str] = None


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    table_num: Optional[int] = None
    dietary: Optional[str] = None


class CompanionInfo(BaseModel):
    name: str
    dietary: Optional[str] = None
    special_requests: Optional[str] = None


class rsvpUpdate(BaseModel):
    rsvp_status: str  # confirmed | declined
    dietary: Optional[str] = None
    special_requests: Optional[str] = None
    companions: Optional[List[CompanionInfo]] = None  # accompagnatori con dettagli
    children: Optional[int] = 0     # bambini


# ── Helpers ───────────────────────────────────────────────────────────────────
def _send_invite_email(guest: dict) -> bool:
    if not guest.get("email"):
        logger.warning("Guest %s has no email, skipping invite", guest.get("name"))
        return False
    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        logger.warning("Brevo not configured, skipping email for %s", guest["email"])
        return False
    try:
        password_hint = (
            f'<div style="background:#fdf6f0;border:1.5px dashed #e8bfa0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">'
            f'<p style="margin:0 0 4px;color:#888;font-size:.85rem;text-transform:uppercase;letter-spacing:.05em">Access password</p>'
            f'<p style="margin:0;font-size:1.4rem;font-weight:700;color:#c8956c;letter-spacing:.12em">{LOGIN_PASSWORD}</p>'
            f'</div>'
        ) if LOGIN_PASSWORD else ""

        html = f"""
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#fdf6f0;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#c8956c,#e8bfa0);padding:48px;text-align:center">
    <h1 style="color:#fff;font-size:2rem;margin:0;letter-spacing:.05em">{COUPLE_NAMES}</h1>
    <p style="color:#fff8f3;margin:8px 0 0;font-size:1.1rem">{WEDDING_DATE}</p>
  </div>
  <div style="padding:40px 48px">
    <p style="font-size:1.1rem;color:#333">Dear <strong>{guest['name']}</strong>,</p>
    <p style="color:#555;line-height:1.7">
      We're overjoyed to invite you to share the most beautiful day of our lives with us.
      The wedding will be celebrated at <strong>{WEDDING_VENUE}</strong>.
    </p>
    {password_hint}
    <div style="text-align:center;margin:32px 0">
      <a href="{APP_URL}" style="background:#c8956c;color:#fff;padding:14px 36px;border-radius:50px;text-decoration:none;font-size:1rem;font-weight:600">
        Visit the wedding website
      </a>
    </div>
    <p style="color:#888;font-size:.9rem;text-align:center">
      Use the password above to log in, confirm your attendance, leave messages, and upload photos.
    </p>
  </div>
  <div style="background:#fdf6f0;padding:24px;text-align:center">
    <p style="color:#bbb;font-size:.8rem;margin:0">{COUPLE_NAMES} · {WEDDING_DATE} · {WEDDING_VENUE}</p>
  </div>
</div>
</body></html>"""

        payload = {
            "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            "to": [{"email": guest["email"], "name": guest["name"]}],
            "subject": f"💌 You're invited to {COUPLE_NAMES}'s wedding",
            "htmlContent": html,
        }
        resp = httpx.post(
            BREVO_API_URL,
            json=payload,
            headers={
                "api-key": BREVO_API_KEY,
                "content-type": "application/json",
                "accept": "application/json",
            },
            timeout=15,
        )
        if resp.status_code >= 400:
            logger.error(
                "Brevo error for %s: status=%d body=%s",
                guest["email"], resp.status_code, resp.text,
            )
            return False
        logger.info("Invite sent to %s", guest["email"])
        return True
    except Exception as e:
        logger.error("Email error for %s: %s", guest["email"], e)
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────
SYSTEM_EMAILS = ("admin@wedding.local", "guest@wedding.local")

@router.get("/")
async def list_guests(admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    guests = (
        db.table("guests").select("*")
        .eq("matrimonio_id", matrimonio_id)
        .order("name")
        .execute().data or []
    )
    # Filtrato in Python: un filtro SQL "not in" esclude anche le righe con
    # email NULL (semantica NOT IN di Postgres), nascondendo gli ospiti senza email
    return [g for g in guests if g.get("email") not in SYSTEM_EMAILS]


@router.post("/")
async def create_guest_endpoint(body: GuestCreate, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    email = body.email.strip().lower() if body.email and body.email.strip() else None

    if email:
        # Check duplicate email (scoped to this wedding)
        existing = (
            db.table("guests").select("id")
            .eq("email", email)
            .eq("matrimonio_id", matrimonio_id)
            .execute().data
        )
        if existing:
            raise HTTPException(400, "Email already exists")

    guest_data = {
        "name":          body.name,
        "email":         email,
        "rsvp_status":   "pending",
        "invite_sent":   0,
        "matrimonio_id": matrimonio_id,
        "created_at":    datetime.utcnow().isoformat(),
        "updated_at":    datetime.utcnow().isoformat(),
    }
    if body.phone:     guest_data["phone"]     = body.phone
    if body.table_num: guest_data["table_num"] = body.table_num
    if body.dietary:   guest_data["dietary"]   = body.dietary

    try:
        result = db.table("guests").insert(guest_data).execute()
    except Exception as e:
        raise HTTPException(400, f"Error creating guest: {e}")

    guest = result.data[0]
    audit(admin["email"], "create_guest", f"{body.name} ({email or 'no email'})", "",
          request.client.host if request.client else "", matrimonio_id)
    logger.info("Guest created: %s (%s)", body.name, email or "no email")
    return guest


@router.post("/{guest_id}/invite")
async def send_invite(guest_id: int, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    result = db.table("guests").select("*").eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    if not result.data:
        raise HTTPException(404, "Guest not found")

    guest = result.data[0]
    if not guest.get("email"):
        return {"sent": False, "reason": "no_email"}

    ok = _send_invite_email(guest)
    if ok:
        db.table("guests").update({"invite_sent": 1}).eq("id", guest_id).execute()

    audit(admin["email"], "send_invite", f"{guest['name']} ({guest['email']})", "ok" if ok else "smtp non configurato",
          request.client.host if request.client else "", matrimonio_id)
    return {"sent": ok}


@router.post("/invite-all")
async def send_all_invites(request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    guests = (
        db.table("guests")
        .select("*")
        .eq("matrimonio_id", matrimonio_id)
        .eq("invite_sent", 0)
        .eq("rsvp_status", "pending")
        .execute().data or []
    )
    guests = [g for g in guests if g.get("email")]

    results = []
    for g in guests:
        ok = _send_invite_email(g)
        if ok:
            db.table("guests").update({"invite_sent": 1}).eq("id", g["id"]).execute()
        results.append({"id": g["id"], "email": g["email"], "sent": ok})

    sent_count = sum(1 for r in results if r["sent"])
    audit(admin["email"], "send_all_invites", f"{sent_count}/{len(results)} inviati", "",
          request.client.host if request.client else "", matrimonio_id)
    return results


@router.put("/{guest_id}/rsvp")
async def update_rsvp(guest_id: int, body: rsvpUpdate, request: Request, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    import json

    if body.rsvp_status not in ("confirmed", "declined"):
        raise HTTPException(400, "rsvp_status must be confirmed or declined")

    # Qualsiasi utente loggato può aggiornare l'RSVP di un ospite
    # (la selezione avviene tramite menu a tendina pubblico, non per account)
    # Solo la modifica dei dati admin (es. eliminazione) resta protetta.

    db = get_db()

    base_update = {
        "rsvp_status": body.rsvp_status,
        "dietary":     body.dietary,
        "special_requests": body.special_requests,
        "updated_at":  datetime.utcnow().isoformat(),
    }
    # companions/children are stored only if those columns exist on the table.
    # If they don't yet (pre-migration), retry without them so RSVP never breaks.
    # SQL to enable: ALTER TABLE guests ADD COLUMN companions jsonb DEFAULT '[]',
    #                ADD COLUMN children int DEFAULT 0,
    #                ADD COLUMN special_requests text;
    companions_data = body.companions or []
    extended = {
        **base_update,
        "companions": json.dumps([c.model_dump() for c in companions_data]),
        "children": max(0, body.children or 0)
    }
    try:
        result = (
            db.table("guests").update(extended)
            .eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
        )
    except Exception as e:
        logger.warning("rsvp companions/children/special_requests columns missing, falling back: %s", e)
        result = (
            db.table("guests").update(base_update)
            .eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
        )

    if not result.data:
        raise HTTPException(404, "Guest not found")

    # Parse companions back if stored as JSON string
    data = result.data[0]
    if isinstance(data.get("companions"), str):
        try:
            data["companions"] = json.loads(data["companions"])
        except:
            data["companions"] = []

    audit(user["email"], "rsvp_update", f"guest:{guest_id}", body.rsvp_status,
          request.client.host if request.client else "", matrimonio_id)
    logger.info("rsvp updated: guest %d → %s", guest_id, body.rsvp_status)
    return data


@router.put("/{guest_id}")
async def update_guest(guest_id: int, body: GuestUpdate, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    existing = db.table("guests").select("id").eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    if not existing.data:
        raise HTTPException(404, "Guest not found")

    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "email" in patch:
        patch["email"] = patch["email"].strip().lower() if patch["email"] and patch["email"].strip() else None
        if patch["email"]:
            dup = db.table("guests").select("id").eq("email", patch["email"]).eq("matrimonio_id", matrimonio_id).neq("id", guest_id).execute()
            if dup.data:
                raise HTTPException(400, "Email already in use by another guest")
    if not patch:
        raise HTTPException(400, "No fields to update")
    patch["updated_at"] = datetime.utcnow().isoformat()

    result = db.table("guests").update(patch).eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    if not result.data:
        raise HTTPException(404, "Guest not found or update failed")
    updated = result.data[0]
    changed = ", ".join(f"{k}={v}" for k, v in patch.items() if k != "updated_at")
    audit(admin["email"], "update_guest", f"{updated['name']} ({updated['email']})", changed,
          request.client.host if request.client else "", matrimonio_id)
    return updated


@router.delete("/{guest_id}")
async def delete_guest(guest_id: int, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    existing = db.table("guests").select("id, name, email").eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    if not existing.data:
        raise HTTPException(404, "Guest not found")
    guest = existing.data[0]
    try:
        result = db.table("guests").delete().eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    except Exception as e:
        logger.error("Delete guest error: %s", e)
        raise HTTPException(500, f"Error deleting: {e}")
    audit(admin["email"], "delete_guest", f"{guest['name']} ({guest['email']})", "",
          request.client.host if request.client else "", matrimonio_id)
    logger.info("Guest deleted: %d (%s)", guest_id, guest["email"])
    return {"deleted": guest_id}


@router.get("/all-guests")
async def get_all_guests(user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    """Get all guests list visible to any logged-in user."""
    db = get_db()
    guests = (
        db.table("guests").select("id, name, rsvp_status, email")
        .eq("matrimonio_id", matrimonio_id)
        .order("name")
        .execute().data or []
    )
    # email è selezionata solo per filtrare gli account di sistema, non va esposta
    return [
        {"id": g["id"], "name": g["name"], "rsvp_status": g["rsvp_status"]}
        for g in guests if g.get("email") not in SYSTEM_EMAILS
    ]


@router.get("/stats")
async def stats(admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    guests   = (
        db.table("guests").select("rsvp_status, invite_sent, email")
        .eq("matrimonio_id", matrimonio_id)
        .execute().data or []
    )
    guests = [g for g in guests if g.get("email") not in SYSTEM_EMAILS]
    photos   = db.table("photos").select("id").eq("matrimonio_id", matrimonio_id).execute().data or []
    messages = db.table("messages").select("id").eq("matrimonio_id", matrimonio_id).execute().data or []

    return {
        "total":        len(guests),
        "confirmed":    sum(1 for g in guests if g["rsvp_status"] == "confirmed"),
        "declined":     sum(1 for g in guests if g["rsvp_status"] == "declined"),
        "pending":      sum(1 for g in guests if g["rsvp_status"] == "pending"),
        "invites_sent": sum(1 for g in guests if g.get("invite_sent") == 1),
        "photos":       len(photos),
        "messages":     len(messages),
    }