import logging
from collections import Counter
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth_config import require_admin
from database import get_db

router = APIRouter()
logger = logging.getLogger("wedding.admin")


class DashboardResponse(BaseModel):
    stats: dict
    recent_logs: list


@router.get("/dashboard")
async def dashboard(user=Depends(require_admin)) -> DashboardResponse:
    """Admin dashboard with stats and recent activity."""
    db = get_db()

    guests = db.table("guests").select("rsvp_status, invite_sent").execute().data or []
    photos_count  = len(db.table("photos").select("id").execute().data or [])
    messages      = db.table("messages").select("type").execute().data or []
    recent_logs   = db.table("audit_log").select("*").order("created_at", desc=True).limit(20).execute().data or []

    guests_total     = len(guests)
    guests_confirmed = sum(1 for g in guests if g["rsvp_status"] == "confirmed")
    guests_declined  = sum(1 for g in guests if g["rsvp_status"] == "declined")
    guests_pending   = sum(1 for g in guests if g["rsvp_status"] == "pending")
    invites_sent     = sum(1 for g in guests if g.get("invite_sent") == 1)
    messages_count   = sum(1 for m in messages if m["type"] in ("text", "both"))
    audio_messages   = sum(1 for m in messages if m["type"] in ("audio", "both"))

    stats = {
        "guests_total":    guests_total,
        "guests_confirmed": guests_confirmed,
        "guests_declined":  guests_declined,
        "guests_pending":   guests_pending,
        "invites_sent":     invites_sent,
        "photos":           photos_count,
        "messages":         messages_count,
        "audio_messages":   audio_messages,
    }

    return DashboardResponse(stats=stats, recent_logs=recent_logs)


@router.get("/logs")
async def audit_logs(admin=Depends(require_admin)):
    """Fetch all audit logs (admin only)."""
    db = get_db()
    logs = db.table("audit_log").select("*").order("created_at", desc=True).limit(100).execute().data or []
    return logs


@router.get("/stats")
async def stats(admin=Depends(require_admin)):
    """Fetch detailed statistics (admin only)."""
    db = get_db()

    # Guests grouped by status
    guests = db.table("guests").select("rsvp_status, dietary, table_num").execute().data or []

    status_counter = Counter(g["rsvp_status"] for g in guests)
    guests_by_status = [{"rsvp_status": k, "count": v} for k, v in status_counter.items()]

    dietary_counter = Counter(
        g["dietary"] for g in guests if g.get("dietary")
    )
    dietary_stats = [{"dietary": k, "count": v} for k, v in dietary_counter.most_common()]

    table_counter = Counter(
        g["table_num"] for g in guests if g.get("table_num") is not None
    )
    table_stats = [{"table_num": k, "count": v} for k, v in sorted(table_counter.items())]

    # Menu choices with item details
    choices = db.table("menu_choices").select("item_id, menu_items(course, name)").execute().data or []
    choice_counter: dict = {}
    for c in choices:
        iid = c["item_id"]
        if iid not in choice_counter:
            mi = c.get("menu_items") or {}
            choice_counter[iid] = {"item_id": iid, "course": mi.get("course"), "name": mi.get("name"), "count": 0}
        choice_counter[iid]["count"] += 1
    menu_stats = sorted(choice_counter.values(), key=lambda x: (x["course"] or "", -x["count"]))

    return {
        "guests_by_status":    guests_by_status,
        "dietary_restrictions": dietary_stats,
        "table_assignments":    table_stats,
        "menu_preferences":     menu_stats,
    }
