import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth_config import get_current_guest, get_optional_guest, require_admin
from database import get_db, audit
from tenant import get_matrimonio_id

router = APIRouter()
logger = logging.getLogger("wedding.menu")


class MenuItemCreate(BaseModel):
    course: str
    name: str
    description: Optional[str] = None
    allergens: Optional[str] = None
    is_vegan: bool = False
    is_gluten_free: bool = False
    sort_order: int = 0


class MenuChoiceUpdate(BaseModel):
    item_ids: List[int]


@router.get("/")
async def get_menu(matrimonio_id: int = Depends(get_matrimonio_id)):
    """Public endpoint - no auth needed to view menu."""
    db = get_db()
    rows = (
        db.table("menu_items")
        .select("*")
        .eq("matrimonio_id", matrimonio_id)
        .order("sort_order")
        .order("course")
        .order("name")
        .execute().data or []
    )

    courses: dict = {}
    for r in rows:
        c = r["course"]
        courses.setdefault(c, []).append(r)

    return {"courses": courses, "items": rows}


@router.post("/")
async def add_menu_item(body: MenuItemCreate, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    result = db.table("menu_items").insert({
        "course":        body.course,
        "name":          body.name,
        "description":   body.description,
        "allergens":     body.allergens,
        "is_vegan":      body.is_vegan,
        "is_gluten_free": body.is_gluten_free,
        "sort_order":    body.sort_order,
        "matrimonio_id": matrimonio_id,
    }).execute()
    return result.data[0]


@router.delete("/{item_id}")
async def delete_menu_item(item_id: int, admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    db.table("menu_items").delete().eq("id", item_id).eq("matrimonio_id", matrimonio_id).execute()
    return {"deleted": item_id}


@router.post("/choices")
async def save_choices(body: MenuChoiceUpdate, request: Request, user=Depends(get_current_guest), matrimonio_id: int = Depends(get_matrimonio_id)):
    """Guest saves their menu choices."""
    db = get_db()

    # Delete existing choices for this guest
    db.table("menu_choices").delete().eq("guest_id", user["sub"]).execute()

    # Insert new choices
    if body.item_ids:
        rows = [{"guest_id": int(user["sub"]), "item_id": iid, "matrimonio_id": matrimonio_id} for iid in body.item_ids]
        db.table("menu_choices").upsert(rows, on_conflict="guest_id,item_id").execute()

    audit(user["email"], "save_menu_choices", f"guest:{user['sub']}", str(body.item_ids), "", matrimonio_id)
    return {"saved": len(body.item_ids)}


@router.get("/choices/me")
async def my_choices(user=Depends(get_optional_guest)):
    if not user:
        return {"item_ids": []}
    db = get_db()
    rows = db.table("menu_choices").select("item_id").eq("guest_id", user["sub"]).execute().data or []
    return {"item_ids": [r["item_id"] for r in rows]}


@router.get("/choices/all")
async def all_choices(admin=Depends(require_admin), matrimonio_id: int = Depends(get_matrimonio_id)):
    db = get_db()
    # Fetch choices with menu item details via foreign key join
    rows = db.table("menu_choices").select("item_id, menu_items(name, course)").eq("matrimonio_id", matrimonio_id).execute().data or []

    counts: dict = {}
    for r in rows:
        iid = r["item_id"]
        if iid not in counts:
            mi = r.get("menu_items") or {}
            counts[iid] = {"item_id": iid, "name": mi.get("name"), "course": mi.get("course"), "count": 0}
        counts[iid]["count"] += 1

    return sorted(counts.values(), key=lambda x: -x["count"])
