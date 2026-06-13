import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

logger = logging.getLogger("wedding.db")

# ── Supabase Configuration ─────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://wzwtwbnjcxrwxgiurgqa.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")  # Use anon key, not publishable key

if not SUPABASE_KEY:
    raise ValueError(
        "❌ SUPABASE_KEY not set in .env file!\n"
        "   Ottieni l'Anon Key da: https://app.supabase.com → Settings → API\n"
        "   Dovrebbe iniziare con 'eyJ...'\n"
        "   Nota: Usa Anon Key, NON Publishable Key!"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_db():
    """Get Supabase client instance."""
    return supabase


# Alias for backward compatibility
get_conn = get_db


def init_db():
    """Initialize Supabase database schema."""
    logger.info("🌍 Initialising Supabase database at %s", SUPABASE_URL)
    
    try:
        # Test connection
        result = supabase.table("guests").select("*").limit(1).execute()
        logger.info("✅ Supabase connection successful!")
        
        # Seed menu items if empty
        result = supabase.table("menu_items").select("*").execute()
        if len(result.data) == 0:
            _seed_menu()
        else:
            logger.info("📋 Menu items already seeded (%d items)", len(result.data))
            
    except Exception as e:
        logger.error("❌ Supabase initialization error: %s", e)
        raise


def _seed_menu():
    """Seed initial menu items."""
    items = [
        {"course": "Benvenuto", "name": "Cocktail di benvenuto", "description": "Prosecco, succhi freschi e stuzzichini misti", "allergens": "", "is_vegan": False, "is_gluten_free": False, "sort_order": 1},
        {"course": "Antipasto", "name": "Tagliere di salumi e formaggi", "description": "Selezione di salumi locali, formaggi stagionati, miele e confetture", "allergens": "", "is_vegan": False, "is_gluten_free": False, "sort_order": 2},
        {"course": "Antipasto", "name": "Burrata con pomodori", "description": "Burrata fresca con pomodori datterini, basilico e olio EVO", "allergens": "latte", "is_vegan": True, "is_gluten_free": True, "sort_order": 3},
        {"course": "Primo", "name": "Risotto al tartufo", "description": "Risotto Carnaroli con tartufo nero, parmigiano 36 mesi", "allergens": "latte, glutine", "is_vegan": True, "is_gluten_free": True, "sort_order": 4},
        {"course": "Primo", "name": "Tagliolini al ragù di cinghiale", "description": "Pasta fresca all'uovo con ragù di cinghiale e ginepro", "allergens": "glutine, uova", "is_vegan": False, "is_gluten_free": False, "sort_order": 5},
        {"course": "Secondo", "name": "Filetto di manzo", "description": "Filetto di manzo con riduzione al Barolo, patate fondenti e asparagi", "allergens": "", "is_vegan": False, "is_gluten_free": True, "sort_order": 6},
        {"course": "Secondo", "name": "Branzino al forno", "description": "Branzino in crosta di erbe aromatiche con verdure di stagione", "allergens": "pesce", "is_vegan": False, "is_gluten_free": True, "sort_order": 7},
        {"course": "Dessert", "name": "Torta degli sposi", "description": "Torta nuziale a tre strati: vaniglia, fragola e cioccolato fondente", "allergens": "latte, uova, glutine", "is_vegan": False, "is_gluten_free": False, "sort_order": 8},
        {"course": "Dessert", "name": "Gelato artigianale", "description": "Selezione di gelati e sorbetti artigianali", "allergens": "latte, uova", "is_vegan": False, "is_gluten_free": True, "sort_order": 9},
        {"course": "Drink", "name": "Vino rosso", "description": "Barolo DOCG 2019", "allergens": "", "is_vegan": True, "is_gluten_free": True, "sort_order": 10},
        {"course": "Drink", "name": "Vino bianco", "description": "Gavi di Gavi DOCG 2022", "allergens": "", "is_vegan": True, "is_gluten_free": True, "sort_order": 11},
    ]
    
    try:
        for item in items:
            supabase.table("menu_items").insert(item).execute()
        logger.info("✅ Menu items seeded (%d items)", len(items))
    except Exception as e:
        logger.error("❌ Error seeding menu: %s", e)


# ── Guest Functions ────────────────────────────────────────────────────────────

def get_guest_by_email(email: str) -> Optional[Dict]:
    """Get guest by email."""
    try:
        result = supabase.table("guests").select("*").eq("email", email.lower()).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error getting guest by email: %s", e)
        return None


def get_guest_by_id(guest_id: int) -> Optional[Dict]:
    """Get guest by ID."""
    try:
        result = supabase.table("guests").select("*").eq("id", guest_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error getting guest by id: %s", e)
        return None


def create_guest(name: str, email: str, password_hash: str = None, google_id: str = None, avatar_url: str = None) -> Optional[Dict]:
    """Create a new guest."""
    try:
        guest_data = {
            "name": name,
            "email": email.lower(),
            "password_hash": password_hash,
            "google_id": google_id,
            "avatar_url": avatar_url,
            "rsvp_status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = supabase.table("guests").insert(guest_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error creating guest: %s", e)
        return None


def update_guest(guest_id: int, updates: Dict) -> Optional[Dict]:
    """Update guest information."""
    try:
        updates["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("guests").update(updates).eq("id", guest_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Error updating guest: %s", e)
        return None


def audit(actor: str, action: str, target: str = "", detail: str = "", ip: str = ""):
    """Log action to audit log."""
    try:
        audit_data = {
            "actor": actor,
            "action": action,
            "target": target,
            "detail": detail,
            "ip": ip,
            "created_at": datetime.utcnow().isoformat(),
        }
        supabase.table("audit_log").insert(audit_data).execute()
    except Exception as e:
        logger.error("Audit log error: %s", e)
