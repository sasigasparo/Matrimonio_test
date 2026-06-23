# routers/tables.py
# Router tavoli — usa Supabase come tutti gli altri router
# In main.py aggiungi:
#   from routers import tables
#   app.include_router(tables.router, prefix="/api/tables", tags=["Tables"])

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_config import get_current_guest   # qualsiasi utente loggato può leggere
from database import get_db
from tenant import get_matrimonio_id

router = APIRouter()
logger = logging.getLogger("wedding.tables")


# ─── Schemi ────────────────────────────────────────────────────────────────

class TableCreate(BaseModel):
    name: str
    seats: int = 8

class TableUpdate(BaseModel):
    name: Optional[str] = None
    seats: Optional[int] = None

class AssignSeat(BaseModel):
    seat_index: int
    guest_id: int


# ─── Helper: costruisce la risposta arricchita con gli ospiti assegnati ────

def _build_table(t: dict, guests_by_id: dict) -> dict:
    """
    Aggiunge l'array `assigned` (lista di guest | None per ogni posto)
    partendo dal campo `seats_data` JSON salvato su Supabase.
    seats_data = lista di (guest_id | null) per ogni posto
    """
    seats_data = t.get("seats_data") or [None] * t["seats"]
    # Assicura la lunghezza corretta
    while len(seats_data) < t["seats"]:
        seats_data.append(None)
    seats_data = seats_data[:t["seats"]]

    assigned = []
    for gid in seats_data:
        if gid is None:
            assigned.append(None)
        else:
            g = guests_by_id.get(int(gid))
            if g:
                assigned.append({"id": g["id"], "name": g["name"], "rsvp_status": g.get("rsvp_status", "pending")})
            else:
                assigned.append(None)

    return {**t, "assigned": assigned, "seats_data": seats_data}


def _load_tables_with_guests(db, matrimonio_id: int) -> list:
    tables = db.table("tables").select("*").eq("matrimonio_id", matrimonio_id).order("created_at").execute().data or []
    if not tables:
        return []
    guests = db.table("guests").select("id, name, rsvp_status").eq("matrimonio_id", matrimonio_id).execute().data or []
    guests_by_id = {g["id"]: g for g in guests}
    return [_build_table(t, guests_by_id) for t in tables]


# ─── GET /api/tables ───────────────────────────────────────────────────────

@router.get("/")
async def list_tables(user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    return _load_tables_with_guests(db, matrimonio_id)


# ─── POST /api/tables ──────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_table(body: TableCreate, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    result = db.table("tables").insert({
        "name":          body.name,
        "seats":         body.seats,
        "seats_data":    [None] * body.seats,
        "matrimonio_id": matrimonio_id,
        "created_at":    datetime.utcnow().isoformat(),
        "updated_at":    datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(500, "Errore creazione tavolo")

    t = result.data[0]
    logger.info("Table created: %s (%d posti)", body.name, body.seats)
    return {**t, "assigned": [None] * body.seats}


# ─── PUT /api/tables/{id} ──────────────────────────────────────────────────

@router.put("/{table_id}")
async def update_table(table_id: int, body: TableUpdate, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    existing = db.table("tables").select("*").eq("id", table_id).eq("matrimonio_id", matrimonio_id).execute().data
    if not existing:
        raise HTTPException(404, "Tavolo non trovato")

    t = existing[0]
    updates: dict = {"updated_at": datetime.utcnow().isoformat()}

    if body.name is not None:
        updates["name"] = body.name

    if body.seats is not None and body.seats != t["seats"]:
        old_data = t.get("seats_data") or [None] * t["seats"]
        new_data = (old_data + [None] * body.seats)[:body.seats]
        updates["seats"]      = body.seats
        updates["seats_data"] = new_data

    result = db.table("tables").update(updates).eq("id", table_id).execute()
    if not result.data:
        raise HTTPException(500, "Errore aggiornamento tavolo")

    guests = db.table("guests").select("id, name, rsvp_status").eq("matrimonio_id", matrimonio_id).execute().data or []
    guests_by_id = {g["id"]: g for g in guests}
    return _build_table(result.data[0], guests_by_id)


# ─── DELETE /api/tables/{id} ───────────────────────────────────────────────

@router.delete("/{table_id}", status_code=204)
async def delete_table(table_id: int, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    existing = db.table("tables").select("id").eq("id", table_id).eq("matrimonio_id", matrimonio_id).execute().data
    if not existing:
        raise HTTPException(404, "Tavolo non trovato")
    db.table("tables").delete().eq("id", table_id).execute()
    logger.info("Table deleted: %d", table_id)


# ─── POST /api/tables/{id}/assign ─────────────────────────────────────────

@router.post("/{table_id}/assign")
async def assign_seat(table_id: int, body: AssignSeat, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()

    # Carica il tavolo
    existing = db.table("tables").select("*").eq("id", table_id).eq("matrimonio_id", matrimonio_id).execute().data
    if not existing:
        raise HTTPException(404, "Tavolo non trovato")
    t = existing[0]

    if body.seat_index < 0 or body.seat_index >= t["seats"]:
        raise HTTPException(400, "Indice posto non valido")

    # Verifica che l'ospite non sia già seduto altrove (solo tavoli di questo matrimonio)
    all_tables = db.table("tables").select("id, name, seats_data").eq("matrimonio_id", matrimonio_id).execute().data or []
    for other in all_tables:
        sd = other.get("seats_data") or []
        for i, gid in enumerate(sd):
            if gid == body.guest_id and not (other["id"] == table_id and i == body.seat_index):
                raise HTTPException(400, f"Ospite già assegnato al tavolo '{other['name']}'")

    # Aggiorna seats_data
    seats_data = t.get("seats_data") or [None] * t["seats"]
    while len(seats_data) < t["seats"]:
        seats_data.append(None)
    seats_data[body.seat_index] = body.guest_id

    result = db.table("tables").update({
        "seats_data": seats_data,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", table_id).execute()

    if not result.data:
        raise HTTPException(500, "Errore assegnazione")

    guests = db.table("guests").select("id, name, rsvp_status").eq("matrimonio_id", matrimonio_id).execute().data or []
    guests_by_id = {g["id"]: g for g in guests}
    return _build_table(result.data[0], guests_by_id)


# ─── DELETE /api/tables/{id}/seats/{seat_index} ───────────────────────────

@router.delete("/{table_id}/seats/{seat_index}")
async def remove_seat(table_id: int, seat_index: int, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()

    existing = db.table("tables").select("*").eq("id", table_id).eq("matrimonio_id", matrimonio_id).execute().data
    if not existing:
        raise HTTPException(404, "Tavolo non trovato")
    t = existing[0]

    if seat_index < 0 or seat_index >= t["seats"]:
        raise HTTPException(400, "Indice posto non valido")

    seats_data = t.get("seats_data") or [None] * t["seats"]
    while len(seats_data) < t["seats"]:
        seats_data.append(None)
    seats_data[seat_index] = None

    result = db.table("tables").update({
        "seats_data": seats_data,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", table_id).execute()

    if not result.data:
        raise HTTPException(500, "Errore rimozione")

    guests = db.table("guests").select("id, name, rsvp_status").eq("matrimonio_id", matrimonio_id).execute().data or []
    guests_by_id = {g["id"]: g for g in guests}
    return _build_table(result.data[0], guests_by_id)