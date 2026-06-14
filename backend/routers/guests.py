import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth_config import get_current_guest, require_admin
from database import get_db, audit

router = APIRouter()
logger = logging.getLogger("wedding.guests")

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
COUPLE_NAMES  = os.getenv("COUPLE_NAMES", "Sofia & Marco")
WEDDING_DATE  = os.getenv("WEDDING_DATE", "14 Giugno 2025")
WEDDING_VENUE = os.getenv("WEDDING_VENUE", "Villa Belvedere, Toscana")
APP_URL       = os.getenv("APP_URL", "http://localhost:5173")


# ── Schemas ───────────────────────────────────────────────────────────────────
class GuestCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    table_num: Optional[int] = None
    dietary: Optional[str] = None


class rsvpUpdate(BaseModel):
    rsvp_status: str  # confirmed | declined
    dietary: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────
def _send_invite_email(guest: dict) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email for %s", guest["email"])
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"💌 Sei invitato al matrimonio di {COUPLE_NAMES}"
        msg["From"]    = SMTP_USER
        msg["To"]      = guest["email"]

        rsvp_url = f"{APP_URL}/rsvp?email={guest['email']}"
        html = f"""
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#fdf6f0;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#c8956c,#e8bfa0);padding:48px;text-align:center">
    <h1 style="color:#fff;font-size:2rem;margin:0;letter-spacing:.05em">{COUPLE_NAMES}</h1>
    <p style="color:#fff8f3;margin:8px 0 0;font-size:1.1rem">{WEDDING_DATE}</p>
  </div>
  <div style="padding:40px 48px">
    <p style="font-size:1.1rem;color:#333">Caro/a <strong>{guest['name']}</strong>,</p>
    <p style="color:#555;line-height:1.7">
      Con immensa gioia vi rsvpamo a condividere con noi il giorno più bello della nostra vita.
      Il matrimonio sarà celebrato presso <strong>{WEDDING_VENUE}</strong>.
    </p>
    <div style="text-align:center;margin:32px 0">
      <a href="{rsvp_url}" style="background:#c8956c;color:#fff;padding:14px 36px;border-radius:50px;text-decoration:none;font-size:1rem;font-weight:600">
        Conferma la tua presenza
      </a>
    </div>
    <p style="color:#888;font-size:.9rem;text-align:center">
      Accedi con Google per confermare, lasciare messaggi e caricare foto.
    </p>
  </div>
  <div style="background:#fdf6f0;padding:24px;text-align:center">
    <p style="color:#bbb;font-size:.8rem;margin:0">{COUPLE_NAMES} · {WEDDING_DATE} · {WEDDING_VENUE}</p>
  </div>
</div>
</body></html>"""

        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_USER, guest["email"], msg.as_string())
        logger.info("Invite sent to %s", guest["email"])
        return True
    except Exception as e:
        logger.error("Email error for %s: %s", guest["email"], e)
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/")
async def list_guests(admin=Depends(require_admin)):
    db = get_db()
    guests = db.table("guests").select("*").order("name").execute().data or []
    return guests


@router.post("/")
async def create_guest_endpoint(body: GuestCreate, request: Request, admin=Depends(require_admin)):
    db = get_db()
    # Check duplicate email
    existing = db.table("guests").select("id").eq("email", body.email.lower()).execute().data
    if existing:
        raise HTTPException(400, "Email già presente")

    try:
        result = db.table("guests").insert({
            "name":        body.name,
            "email":       body.email.lower(),
            "phone":       body.phone,
            "table_num":   body.table_num,
            "dietary":     body.dietary,
            "rsvp_status": "pending",
            "invite_sent": 0,
            "created_at":  datetime.utcnow().isoformat(),
            "updated_at":  datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        raise HTTPException(400, f"Errore creazione ospite: {e}")

    guest = result.data[0]
    audit(admin["email"], "create_guest", f"guest:{guest['id']}", body.email,
          request.client.host if request.client else "")
    logger.info("Guest created: %s (%s)", body.name, body.email)
    return guest


@router.post("/{guest_id}/invite")
async def send_invite(guest_id: int, request: Request, admin=Depends(require_admin)):
    db = get_db()
    result = db.table("guests").select("*").eq("id", guest_id).execute()
    if not result.data:
        raise HTTPException(404, "Guest not found")

    guest = result.data[0]
    ok = _send_invite_email(guest)
    if ok:
        db.table("guests").update({"invite_sent": 1}).eq("id", guest_id).execute()

    audit(admin["email"], "send_invite", f"guest:{guest_id}", "",
          request.client.host if request.client else "")
    return {"sent": ok}


@router.post("/invite-all")
async def send_all_invites(request: Request, admin=Depends(require_admin)):
    db = get_db()
    guests = (
        db.table("guests")
        .select("*")
        .eq("invite_sent", 0)
        .eq("rsvp_status", "pending")
        .execute().data or []
    )

    results = []
    for g in guests:
        ok = _send_invite_email(g)
        if ok:
            db.table("guests").update({"invite_sent": 1}).eq("id", g["id"]).execute()
        results.append({"id": g["id"], "email": g["email"], "sent": ok})

    audit(admin["email"], "send_all_invites", "", f"{len(results)} emails",
          request.client.host if request.client else "")
    return results


@router.put("/{guest_id}/rsvp")
async def update_rsvp(guest_id: int, body: rsvpUpdate, request: Request, user=Depends(get_current_guest)):
    if body.rsvp_status not in ("confirmed", "declined"):
        raise HTTPException(400, "rsvp_status must be confirmed or declined")

    # Qualsiasi utente loggato può aggiornare l'RSVP di un ospite
    # (la selezione avviene tramite menu a tendina pubblico, non per account)
    # Solo la modifica dei dati admin (es. eliminazione) resta protetta.

    db = get_db()
    result = db.table("guests").update({
        "rsvp_status": body.rsvp_status,
        "dietary":     body.dietary,
        "updated_at":  datetime.utcnow().isoformat(),
    }).eq("id", guest_id).execute()

    if not result.data:
        raise HTTPException(404, "Guest not found")

    audit(user["email"], "rsvp_update", f"guest:{guest_id}", body.rsvp_status,
          request.client.host if request.client else "")
    logger.info("rsvp updated: guest %d → %s", guest_id, body.rsvp_status)
    return result.data[0]


@router.delete("/{guest_id}")
async def delete_guest(guest_id: int, admin=Depends(require_admin)):
    db = get_db()
    db.table("guests").delete().eq("id", guest_id).execute()
    logger.info("Guest deleted: %d", guest_id)
    return {"deleted": guest_id}


@router.get("/all-guests")
async def get_all_guests(user=Depends(get_current_guest)):
    """Get all guests list visible to any logged-in user."""
    db = get_db()
    guests = db.table("guests").select("id, name, rsvp_status").order("name").execute().data or []
    return guests


@router.get("/stats")
async def stats(admin=Depends(require_admin)):
    db = get_db()
    guests   = db.table("guests").select("rsvp_status, invite_sent").execute().data or []
    photos   = db.table("photos").select("id").execute().data or []
    messages = db.table("messages").select("id").execute().data or []

    return {
        "total":        len(guests),
        "confirmed":    sum(1 for g in guests if g["rsvp_status"] == "confirmed"),
        "declined":     sum(1 for g in guests if g["rsvp_status"] == "declined"),
        "pending":      sum(1 for g in guests if g["rsvp_status"] == "pending"),
        "invites_sent": sum(1 for g in guests if g.get("invite_sent") == 1),
        "photos":       len(photos),
        "messages":     len(messages),
    }