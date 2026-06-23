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
from tenant import get_matrimonio_id

router = APIRouter()
logger = logging.getLogger("wedding.guests")

SMTP_HOST      = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASSWORD  = os.getenv("SMTP_PASSWORD", "")
COUPLE_NAMES   = os.getenv("COUPLE_NAMES", "Sofia & Marco")
WEDDING_DATE   = os.getenv("WEDDING_DATE", "14 Giugno 2027")
WEDDING_VENUE  = os.getenv("WEDDING_VENUE", "Villa Doria d'Angri, Napoli")
APP_URL        = os.getenv("APP_URL", "http://localhost:5173")
LOGIN_PASSWORD = os.getenv("LOGIN_PASSWORD", "")


# ── Schemas ───────────────────────────────────────────────────────────────────
class GuestCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    table_num: Optional[int] = None
    dietary: Optional[str] = None


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    table_num: Optional[int] = None
    dietary: Optional[str] = None


class rsvpUpdate(BaseModel):
    rsvp_status: str  # confirmed | declined
    dietary: Optional[str] = None
    companions: Optional[int] = 0  # accompagnatori adulti oltre all'ospite
    children: Optional[int] = 0     # bambini


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

        password_hint = (
            f'<div style="background:#fdf6f0;border:1.5px dashed #e8bfa0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">'
            f'<p style="margin:0 0 4px;color:#888;font-size:.85rem;text-transform:uppercase;letter-spacing:.05em">Password di accesso</p>'
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
    <p style="font-size:1.1rem;color:#333">Caro/a <strong>{guest['name']}</strong>,</p>
    <p style="color:#555;line-height:1.7">
      Con immensa gioia ti invitiamo a condividere con noi il giorno più bello della nostra vita.
      Il matrimonio sarà celebrato presso <strong>{WEDDING_VENUE}</strong>.
    </p>
    {password_hint}
    <div style="text-align:center;margin:32px 0">
      <a href="{APP_URL}" style="background:#c8956c;color:#fff;padding:14px 36px;border-radius:50px;text-decoration:none;font-size:1rem;font-weight:600">
        Accedi al sito del matrimonio
      </a>
    </div>
    <p style="color:#888;font-size:.9rem;text-align:center">
      Usa la password indicata per accedere, confermare la presenza, lasciare messaggi e caricare foto.
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
SYSTEM_EMAILS = ("admin@wedding.local", "guest@wedding.local")

@router.get("/")
async def list_guests(admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    guests = (
        db.table("guests").select("*")
        .eq("matrimonio_id", matrimonio_id)
        .not_.in_("email", list(SYSTEM_EMAILS))
        .order("name")
        .execute().data or []
    )
    return guests


@router.post("/")
async def create_guest_endpoint(body: GuestCreate, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    # Check duplicate email (scoped to this wedding)
    existing = (
        db.table("guests").select("id")
        .eq("email", body.email.lower())
        .eq("matrimonio_id", matrimonio_id)
        .execute().data
    )
    if existing:
        raise HTTPException(400, "Email già presente")

    guest_data = {
        "name":          body.name,
        "email":         body.email.lower(),
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
        raise HTTPException(400, f"Errore creazione ospite: {e}")

    guest = result.data[0]
    audit(admin["email"], "create_guest", f"{body.name} ({body.email})", "",
          request.client.host if request.client else "", matrimonio_id)
    logger.info("Guest created: %s (%s)", body.name, body.email)
    return guest


@router.post("/{guest_id}/invite")
async def send_invite(guest_id: int, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    result = db.table("guests").select("*").eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    if not result.data:
        raise HTTPException(404, "Guest not found")

    guest = result.data[0]
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
    if body.rsvp_status not in ("confirmed", "declined"):
        raise HTTPException(400, "rsvp_status must be confirmed or declined")

    # Qualsiasi utente loggato può aggiornare l'RSVP di un ospite
    # (la selezione avviene tramite menu a tendina pubblico, non per account)
    # Solo la modifica dei dati admin (es. eliminazione) resta protetta.

    db = get_db()

    base_update = {
        "rsvp_status": body.rsvp_status,
        "dietary":     body.dietary,
        "updated_at":  datetime.utcnow().isoformat(),
    }
    # companions/children are stored only if those columns exist on the table.
    # If they don't yet (pre-migration), retry without them so RSVP never breaks.
    # SQL to enable: ALTER TABLE guests ADD COLUMN companions int DEFAULT 0,
    #                ADD COLUMN children int DEFAULT 0;
    extended = {**base_update, "companions": max(0, body.companions or 0), "children": max(0, body.children or 0)}
    try:
        result = (
            db.table("guests").update(extended)
            .eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
        )
    except Exception as e:
        logger.warning("rsvp companions/children columns missing, falling back: %s", e)
        result = (
            db.table("guests").update(base_update)
            .eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
        )

    if not result.data:
        raise HTTPException(404, "Guest not found")

    audit(user["email"], "rsvp_update", f"guest:{guest_id}", body.rsvp_status,
          request.client.host if request.client else "", matrimonio_id)
    logger.info("rsvp updated: guest %d → %s", guest_id, body.rsvp_status)
    return result.data[0]


@router.put("/{guest_id}")
async def update_guest(guest_id: int, body: GuestUpdate, request: Request, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    existing = db.table("guests").select("id").eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
    if not existing.data:
        raise HTTPException(404, "Guest not found")

    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "email" in patch and patch["email"]:
        patch["email"] = patch["email"].lower()
        dup = db.table("guests").select("id").eq("email", patch["email"]).eq("matrimonio_id", matrimonio_id).neq("id", guest_id).execute()
        if dup.data:
            raise HTTPException(400, "Email già in uso da un altro ospite")
    if not patch:
        raise HTTPException(400, "Nessun campo da aggiornare")
    patch["updated_at"] = datetime.utcnow().isoformat()

    result = db.table("guests").update(patch).eq("id", guest_id).eq("matrimonio_id", matrimonio_id).execute()
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
        raise HTTPException(500, f"Errore eliminazione: {e}")
    audit(admin["email"], "delete_guest", f"{guest['name']} ({guest['email']})", "",
          request.client.host if request.client else "", matrimonio_id)
    logger.info("Guest deleted: %d (%s)", guest_id, guest["email"])
    return {"deleted": guest_id}


@router.get("/all-guests")
async def get_all_guests(user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    """Get all guests list visible to any logged-in user."""
    db = get_db()
    guests = (
        db.table("guests").select("id, name, rsvp_status")
        .eq("matrimonio_id", matrimonio_id)
        .not_.in_("email", list(SYSTEM_EMAILS))
        .order("name")
        .execute().data or []
    )
    return guests


@router.get("/stats")
async def stats(admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    guests   = (
        db.table("guests").select("rsvp_status, invite_sent")
        .eq("matrimonio_id", matrimonio_id)
        .not_.in_("email", list(SYSTEM_EMAILS))
        .execute().data or []
    )
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