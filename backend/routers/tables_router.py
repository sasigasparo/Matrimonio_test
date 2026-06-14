# tables.py  –  FastAPI router
# Aggiungi questo file nella cartella routers/ e includilo in main.py con:
#   from routers.tables import router as tables_router
#   app.include_router(tables_router)

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from .auth import get_current_admin   # adatta al tuo percorso reale

router = APIRouter(prefix="/api/tables", tags=["tables"])

# ─── Modelli Pydantic ──────────────────────────────────────────────────────

class TableCreate(BaseModel):
    name: str
    seats: int = 8

class TableUpdate(BaseModel):
    name: Optional[str] = None
    seats: Optional[int] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None

class AssignSeat(BaseModel):
    seat_index: int
    guest_id: int

# ─── Struttura dati in-memory (sostituisci con il tuo DB) ─────────────────
# Se usi SQLAlchemy/SQLModel, adatta i metodi CRUD di conseguenza.
# Qui usiamo una lista semplice per illustrare la logica.

_tables: List[dict] = []
_next_id = 1

def _find(table_id: int):
    for t in _tables:
        if t["id"] == table_id:
            return t
    return None

# ─── GET /api/tables ───────────────────────────────────────────────────────
@router.get("/")
async def list_tables(current_user=Depends(get_current_admin)):
    """
    Restituisce tutti i tavoli con l'array `assigned` (lista di guest o None per ogni posto).
    Gli ospiti vengono caricati dal DB ospiti — adatta la query al tuo modello.
    """
    return _tables

# ─── POST /api/tables ──────────────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_table(body: TableCreate, current_user=Depends(get_current_admin)):
    global _next_id
    table = {
        "id": _next_id,
        "name": body.name,
        "seats": body.seats,
        "pos_x": 0.0,
        "pos_y": 0.0,
        # lista di (guest_id | None) per ogni posto
        "assigned": [None] * body.seats,
    }
    _tables.append(table)
    _next_id += 1
    return table

# ─── PUT /api/tables/{id} ──────────────────────────────────────────────────
@router.put("/{table_id}")
async def update_table(table_id: int, body: TableUpdate, current_user=Depends(get_current_admin)):
    t = _find(table_id)
    if not t:
        raise HTTPException(404, "Tavolo non trovato")

    if body.name  is not None: t["name"]  = body.name
    if body.pos_x is not None: t["pos_x"] = body.pos_x
    if body.pos_y is not None: t["pos_y"] = body.pos_y

    if body.seats is not None and body.seats != t["seats"]:
        old = t["assigned"]
        new_seats = body.seats
        # ridimensiona l'array mantenendo gli ospiti già assegnati
        t["assigned"] = (old + [None] * new_seats)[:new_seats]
        t["seats"] = new_seats

    return t

# ─── DELETE /api/tables/{id} ───────────────────────────────────────────────
@router.delete("/{table_id}", status_code=204)
async def delete_table(table_id: int, current_user=Depends(get_current_admin)):
    t = _find(table_id)
    if not t:
        raise HTTPException(404, "Tavolo non trovato")
    _tables.remove(t)
    return

# ─── POST /api/tables/{id}/assign ─────────────────────────────────────────
@router.post("/{table_id}/assign")
async def assign_seat(table_id: int, body: AssignSeat, current_user=Depends(get_current_admin)):
    t = _find(table_id)
    if not t:
        raise HTTPException(404, "Tavolo non trovato")
    if body.seat_index < 0 or body.seat_index >= t["seats"]:
        raise HTTPException(400, "Indice posto non valido")

    # controlla che l'ospite non sia già seduto altrove
    for other in _tables:
        for i, g in enumerate(other["assigned"]):
            if g and g.get("id") == body.guest_id and not (other["id"] == table_id and i == body.seat_index):
                raise HTTPException(400, f"Ospite già assegnato al tavolo '{other['name']}'")

    # carica il guest dal DB — qui simuliamo con un dizionario base
    # In produzione: guest = db.query(Guest).filter(Guest.id == body.guest_id).first()
    guest = {"id": body.guest_id, "name": f"Ospite #{body.guest_id}", "rsvp_status": "pending"}
    # ↑ sostituisci con la vera query al tuo modello Guest

    t["assigned"][body.seat_index] = guest
    return t

# ─── DELETE /api/tables/{id}/seats/{seat_index} ───────────────────────────
@router.delete("/{table_id}/seats/{seat_index}")
async def remove_seat(table_id: int, seat_index: int, current_user=Depends(get_current_admin)):
    t = _find(table_id)
    if not t:
        raise HTTPException(404, "Tavolo non trovato")
    if seat_index < 0 or seat_index >= t["seats"]:
        raise HTTPException(400, "Indice posto non valido")
    t["assigned"][seat_index] = None
    return t
