"""
seed_guests.py
──────────────
Popola la tabella `guests` con 50 nomi fittizi.

Uso:
  1. Assicurati che le variabili d'ambiente SUPABASE_URL e SUPABASE_KEY
     siano impostate (stesso .env del backend).
  2. Esegui:
       python seed_guests.py
  3. Per azzerare prima gli ospiti esistenti:
       python seed_guests.py --clear
"""

import os
import sys
import argparse
from datetime import datetime

# ── Carica .env se presente ────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from supabase import create_client
except ImportError:
    print("❌  Installa supabase-py:  pip install supabase")
    sys.exit(1)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌  Imposta SUPABASE_URL e SUPABASE_KEY nel tuo .env")
    sys.exit(1)

db = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── 50 ospiti fittizi ──────────────────────────────────────────────
GUESTS = [
    {"name": "Alessandro Ferretti",  "email": "a.ferretti@example.com",   "phone": "+39 333 0000001", "table_num": 1,  "dietary": None},
    {"name": "Beatrice Conti",       "email": "b.conti@example.com",       "phone": "+39 333 0000002", "table_num": 1,  "dietary": "vegetariano"},
    {"name": "Carlo Esposito",       "email": "c.esposito@example.com",    "phone": "+39 333 0000003", "table_num": 2,  "dietary": None},
    {"name": "Daniela Ricci",        "email": "d.ricci@example.com",       "phone": "+39 333 0000004", "table_num": 2,  "dietary": None},
    {"name": "Emanuele Lombardi",    "email": "e.lombardi@example.com",    "phone": "+39 333 0000005", "table_num": 2,  "dietary": None},
    {"name": "Francesca Marino",     "email": "f.marino@example.com",      "phone": "+39 333 0000006", "table_num": 3,  "dietary": None},
    {"name": "Giorgio Greco",        "email": "g.greco@example.com",       "phone": "+39 333 0000007", "table_num": 3,  "dietary": "senza_glutine"},
    {"name": "Helena Fontana",       "email": "h.fontana@example.com",     "phone": "+39 333 0000008", "table_num": 3,  "dietary": None},
    {"name": "Ivan Barbieri",        "email": "i.barbieri@example.com",    "phone": "+39 333 0000009", "table_num": 4,  "dietary": None},
    {"name": "Laura Gallo",          "email": "l.gallo@example.com",       "phone": "+39 333 0000010", "table_num": 4,  "dietary": None},
    {"name": "Marco Cattaneo",       "email": "m.cattaneo@example.com",    "phone": "+39 333 0000011", "table_num": 4,  "dietary": "vegano"},
    {"name": "Nadia Pellegrini",     "email": "n.pellegrini@example.com",  "phone": "+39 333 0000012", "table_num": 5,  "dietary": None},
    {"name": "Orlando Silvestri",    "email": "o.silvestri@example.com",   "phone": "+39 333 0000013", "table_num": 5,  "dietary": None},
    {"name": "Paola Santoro",        "email": "p.santoro@example.com",     "phone": "+39 333 0000014", "table_num": 5,  "dietary": None},
    {"name": "Quintino De Luca",     "email": "q.deluca@example.com",      "phone": "+39 333 0000015", "table_num": 6,  "dietary": None},
    {"name": "Roberta Mancini",      "email": "r.mancini@example.com",     "phone": "+39 333 0000016", "table_num": 6,  "dietary": "senza_lattosio"},
    {"name": "Stefano Vitale",       "email": "s.vitale@example.com",      "phone": "+39 333 0000017", "table_num": 6,  "dietary": None},
    {"name": "Teresa Marchetti",     "email": "t.marchetti@example.com",   "phone": "+39 333 0000018", "table_num": 7,  "dietary": None},
    {"name": "Ugo Ferrero",          "email": "u.ferrero@example.com",     "phone": "+39 333 0000019", "table_num": 7,  "dietary": None},
    {"name": "Valentina Costa",      "email": "v.costa@example.com",       "phone": "+39 333 0000020", "table_num": 7,  "dietary": None},
    {"name": "Walter Bianco",        "email": "w.bianco@example.com",      "phone": "+39 333 0000021", "table_num": 8,  "dietary": None},
    {"name": "Xenia Moretti",        "email": "x.moretti@example.com",     "phone": "+39 333 0000022", "table_num": 8,  "dietary": None},
    {"name": "Ylenia Basile",        "email": "y.basile@example.com",      "phone": "+39 333 0000023", "table_num": 8,  "dietary": "vegetariano"},
    {"name": "Zeno Caruso",          "email": "z.caruso@example.com",      "phone": "+39 333 0000024", "table_num": 9,  "dietary": None},
    {"name": "Andrea Sorrentino",    "email": "a.sorrentino@example.com",  "phone": "+39 333 0000025", "table_num": 9,  "dietary": None},
    {"name": "Barbara Monti",        "email": "b.monti@example.com",       "phone": "+39 333 0000026", "table_num": 9,  "dietary": None},
    {"name": "Cesare Palumbo",       "email": "c.palumbo@example.com",     "phone": "+39 333 0000027", "table_num": 10, "dietary": None},
    {"name": "Debora Sanna",         "email": "d.sanna@example.com",       "phone": "+39 333 0000028", "table_num": 10, "dietary": None},
    {"name": "Enrico Longo",         "email": "e.longo@example.com",       "phone": "+39 333 0000029", "table_num": 10, "dietary": "allergie"},
    {"name": "Federica Amato",       "email": "f.amato@example.com",       "phone": "+39 333 0000030", "table_num": 11, "dietary": None},
    {"name": "Giacomo Testa",        "email": "g.testa@example.com",       "phone": "+39 333 0000031", "table_num": 11, "dietary": None},
    {"name": "Irene Montanari",      "email": "i.montanari@example.com",   "phone": "+39 333 0000032", "table_num": 11, "dietary": None},
    {"name": "Jacopo Ferrara",       "email": "j.ferrara@example.com",     "phone": "+39 333 0000033", "table_num": 12, "dietary": None},
    {"name": "Katia Colombo",        "email": "k.colombo@example.com",     "phone": "+39 333 0000034", "table_num": 12, "dietary": "vegano"},
    {"name": "Leonardo Bruno",       "email": "l.bruno@example.com",       "phone": "+39 333 0000035", "table_num": 12, "dietary": None},
    {"name": "Miriam Ruggiero",      "email": "m.ruggiero@example.com",    "phone": "+39 333 0000036", "table_num": 13, "dietary": None},
    {"name": "Nicola Gatti",         "email": "n.gatti@example.com",       "phone": "+39 333 0000037", "table_num": 13, "dietary": None},
    {"name": "Ottavia Ferretti",     "email": "o.ferretti@example.com",    "phone": "+39 333 0000038", "table_num": 13, "dietary": "senza_glutine"},
    {"name": "Pietro Gentile",       "email": "p.gentile@example.com",     "phone": "+39 333 0000039", "table_num": 14, "dietary": None},
    {"name": "Quirina Bellini",      "email": "q.bellini@example.com",     "phone": "+39 333 0000040", "table_num": 14, "dietary": None},
    {"name": "Raffaele Martini",     "email": "r.martini@example.com",     "phone": "+39 333 0000041", "table_num": 14, "dietary": None},
    {"name": "Sabrina Farina",       "email": "s.farina@example.com",      "phone": "+39 333 0000042", "table_num": 15, "dietary": None},
    {"name": "Tommaso Serra",        "email": "t.serra@example.com",       "phone": "+39 333 0000043", "table_num": 15, "dietary": None},
    {"name": "Ursula Negri",         "email": "u.negri@example.com",       "phone": "+39 333 0000044", "table_num": 15, "dietary": None},
    {"name": "Valerio Coppola",      "email": "v.coppola@example.com",     "phone": "+39 333 0000045", "table_num": 16, "dietary": "vegetariano"},
    {"name": "Wanda Giuliani",       "email": "w.giuliani@example.com",    "phone": "+39 333 0000046", "table_num": 16, "dietary": None},
    {"name": "Ximena Parisi",        "email": "x.parisi@example.com",      "phone": "+39 333 0000047", "table_num": 16, "dietary": None},
    {"name": "Yuri Caputo",          "email": "y.caputo@example.com",      "phone": "+39 333 0000048", "table_num": 17, "dietary": None},
    {"name": "Zaira Donati",         "email": "z.donati@example.com",      "phone": "+39 333 0000049", "table_num": 17, "dietary": None},
    {"name": "Arturo Veneziani",     "email": "a.veneziani@example.com",   "phone": "+39 333 0000050", "table_num": 17, "dietary": None},
]


def clear_guests():
    print("🗑  Cancello tutti gli ospiti esistenti…")
    db.table("guests").delete().neq("id", 0).execute()
    print("   ✓ Tabella svuotata")


def seed():
    now = datetime.utcnow().isoformat()
    inserted = 0
    skipped = 0

    for g in GUESTS:
        # Controlla se l'email esiste già
        existing = db.table("guests").select("id").eq("email", g["email"]).execute().data
        if existing:
            print(f"   ⚠  {g['name']} già presente — salto")
            skipped += 1
            continue

        db.table("guests").insert({
            "name":        g["name"],
            "email":       g["email"],
            "phone":       g.get("phone"),
            "table_num":   g.get("table_num"),
            "dietary":     g.get("dietary"),
            "rsvp_status": "pending",
            "invite_sent": 0,
            "created_at":  now,
            "updated_at":  now,
        }).execute()
        print(f"   ✓ {g['name']}")
        inserted += 1

    print(f"\n✅  Completato — {inserted} inseriti, {skipped} già presenti")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed 50 ospiti fittizi nel DB")
    parser.add_argument("--clear", action="store_true", help="Svuota la tabella prima di inserire")
    args = parser.parse_args()

    if args.clear:
        clear_guests()

    print(f"\n💍  Inserimento 50 ospiti fittizi…\n")
    seed()