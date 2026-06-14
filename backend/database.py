import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from supabase import create_client, Client

logger = logging.getLogger("wedding.db")

# ── Supabase Configuration ─────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "❌ SUPABASE_URL e SUPABASE_KEY devono essere impostati nelle variabili d'ambiente!\n"
        "   Locale: aggiungi al file .env\n"
        "   Render: aggiungi in Environment Variables"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_db() -> Client:
    return supabase

# Alias per compatibilità
get_conn = get_db


def init_db():
    logger.info("🌍 Initialising Supabase database at %s", SUPABASE_URL)
    try:
        result = supabase.table("guests").select("*").limit(1).execute()
        logger.info("✅ Supabase connection successful!")

        result = supabase.table("menu_items").select("*").execute()
        if len(result.data) == 0:
            _seed_menu()
        else:
            logger.info("📋 Menu items already seeded (%d items)", len(result.data))
    except Exception as e:
        logger.error("❌ Supabase initialization error: %s", e)
        raise


def _seed_menu():
    items = [
        {"course": "Benvenuto",  "name": "Cocktail di benvenuto",      "description": "Prosecco, succhi freschi e stuzzichini misti",                           "allergens": "",                  "is_vegan": False, "is_gluten_free": False, "sort_order": 1},
        {"course": "Antipasto",  "name": "Tagliere salumi e formaggi", "description": "Selezione di salumi locali, formaggi stagionati, miele e confetture",     "allergens": "",                  "is_vegan": False, "is_gluten_free": False, "sort_order": 2},
        {"course": "Antipasto",  "name": "Burrata con pomodori",       "description": "Burrata fresca con pomodori datterini, basilico e olio EVO",              "allergens": "latte",             "is_vegan": True,  "is_gluten_free": True,  "sort_order": 3},
        {"course": "Primo",      "name": "Risotto al tartufo",         "description": "Risotto Carnaroli con tartufo nero, parmigiano 36 mesi",                  "allergens": "latte, glutine",    "is_vegan": True,  "is_gluten_free": True,  "sort_order": 4},
        {"course": "Primo",      "name": "Tagliolini al ragù",         "description": "Pasta fresca all'uovo con ragù di cinghiale e ginepro",                   "allergens": "glutine, uova",     "is_vegan": False, "is_gluten_free": False, "sort_order": 5},
        {"course": "Secondo",    "name": "Filetto di manzo",           "description": "Filetto con riduzione al Barolo, patate fondenti e asparagi",             "allergens": "",                  "is_vegan": False, "is_gluten_free": True,  "sort_order": 6},
        {"course": "Secondo",    "name": "Branzino al forno",          "description": "Branzino in crosta di erbe aromatiche con verdure di stagione",           "allergens": "pesce",             "is_vegan": False, "is_gluten_free": True,  "sort_order": 7},
        {"course": "Dessert",    "name": "Torta degli sposi",          "description": "Torta nuziale a tre strati: vaniglia, fragola e cioccolato fondente",     "allergens": "latte, uova, glutine", "is_vegan": False, "is_gluten_free": False, "sort_order": 8},
        {"course": "Dessert",    "name": "Gelato artigianale",         "description": "Selezione di gelati e sorbetti artigianali",                              "allergens": "latte, uova",       "is_vegan": False, "is_gluten_free": True,  "sort_order": 9},
        {"course": "Drink",      "name": "Vino rosso",                 "description": "Barolo DOCG 2019",                                                        "allergens": "",                  "is_vegan": True,  "is_gluten_free": True,  "sort_order": 10},
        {"course": "Drink",      "name": "Vino bianco",                "description": "Gavi di Gavi DOCG 2022",                                                  "allergens": "",                  "is_vegan": True,  "is_gluten_free": True,  "sort_order": 11},
    ]
    try:
        for item in items:
            supabase.table("menu_items").insert(item).execute()
        logger.info("✅ Menu items seeded (%d items)", len(items))
    except Exception as e:
        logger.error("❌ Error seeding menu: %s", e)


# ── Guest Functions ────────────────────────────────────────────────────────────
def get_guest_by_email(email: str) -> Optional[Dict]:
    try:
        result = supabase.table("guests").select("*").eq("email", email.lower()).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error getting guest by email: %s", e)
        return None


def get_guest_by_id(guest_id: int) -> Optional[Dict]:
    try:
        result = supabase.table("guests").select("*").eq("id", guest_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error getting guest by id: %s", e)
        return None


def create_guest(name: str, email: str, password_hash: str = None, google_id: str = None, avatar_url: str = None) -> Optional[Dict]:
    try:
        result = supabase.table("guests").insert({
            "name":          name,
            "email":         email.lower(),
            "password_hash": password_hash,
            "google_id":     google_id,
            "avatar_url":    avatar_url,
            "rsvp_status":   "pending",
            "created_at":    datetime.utcnow().isoformat(),
            "updated_at":    datetime.utcnow().isoformat(),
        }).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error creating guest: %s", e)
        return None


def update_guest(guest_id: int, updates: Dict) -> Optional[Dict]:
    try:
        updates["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("guests").update(updates).eq("id", guest_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error updating guest: %s", e)
        return None


def audit(actor: str, action: str, target: str = "", detail: str = "", ip: str = ""):
    try:
        supabase.table("audit_log").insert({
            "actor":      actor,
            "action":     action,
            "target":     target,
            "detail":     detail,
            "ip":         ip,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        logger.error("Audit log error: %s", e)
