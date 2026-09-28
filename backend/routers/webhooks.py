import logging
import os

from fastapi import APIRouter, HTTPException, Request

from database import get_db, audit

router = APIRouter()
logger = logging.getLogger("wedding.webhooks")

BREVO_WEBHOOK_SECRET = os.getenv("BREVO_WEBHOOK_SECRET", "")

# Eventi Brevo che indicano un problema di recapito da tracciare nell'audit log
PROBLEM_EVENTS = {"hard_bounce", "soft_bounce", "blocked", "spam", "invalid_email", "error"}


@router.post("/brevo")
async def brevo_webhook(request: Request):
    """Riceve le notifiche di evento email da Brevo (delivered, blocked, bounce, spam, ...).

    Da configurare su Brevo in Transactional > Settings > Webhooks, puntando a
    {APP_URL}/api/webhooks/brevo?token=<BREVO_WEBHOOK_SECRET>. È l'unico modo per
    sapere *perché* una mail accettata dall'API (status 201) non viene poi recapitata:
    quella risposta sincrona non porta questa informazione, solo Brevo la conosce
    dopo aver processato l'invio.
    """
    if BREVO_WEBHOOK_SECRET and request.query_params.get("token") != BREVO_WEBHOOK_SECRET:
        raise HTTPException(403, "Invalid webhook token")

    payload = await request.json()
    event = payload.get("event", "unknown")
    email = payload.get("email", "")
    reason = payload.get("reason", "")
    message_id = payload.get("message-id", "")

    logger.warning(
        "Brevo webhook: event=%s email=%s reason=%s message_id=%s",
        event, email, reason, message_id,
    )

    if event in PROBLEM_EVENTS and email:
        try:
            db = get_db()
            guests = (
                db.table("guests").select("matrimonio_id")
                .eq("email", email).limit(1).execute().data
            )
            matrimonio_id = guests[0]["matrimonio_id"] if guests else 1
            audit("brevo", f"email_{event}", email, reason or "nessun motivo fornito", "", matrimonio_id)
        except Exception as e:
            logger.error("Impossibile scrivere audit log per evento Brevo %s/%s: %s", event, email, e)

    return {"received": True}
