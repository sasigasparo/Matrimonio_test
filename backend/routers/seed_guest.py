"""
seed_guests.py
──────────────
Popola la tabella `guests` con la lista invitati reale di Antonios & Petronia.

Uso:
  1. Assicurati che le variabili d'ambiente SUPABASE_URL e SUPABASE_KEY
     siano impostate (stesso .env del backend).
  2. Esegui:
       python seed_guests.py
  3. Per azzerare prima gli ospiti già inseriti per QUESTO matrimonio
     (matrimoni.slug = "antonios-petronia", id=2 — non tocca i 53 ospiti
     fittizi del vecchio demo "sofia-marco", id=1):
       python seed_guests.py --clear

Nota: gli invitati senza email (Vasiliki Kontotoli, Jonathan Kauffmann) non
possono accedere/fare il login autonomamente — vanno gestiti manualmente
dal pannello Admin (RSVP inserito per loro conto) oppure aggiungi un'email
prima di eseguire lo script. I due posti "TBU" (28, 29) non sono inclusi:
aggiungili quando nome ed email saranno confermati.
"""

import os
import sys
import argparse
from datetime import datetime

# Su Windows la console usa cp1252, che non supporta le emoji usate nei
# print sotto: senza questo la print crasha a metà script (UnicodeEncodeError)
# PRIMA di aver inserito gli ospiti nel DB.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

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

# ── Tenant: risolve lo slug nel matrimonio_id (tabella condivisa fra matrimoni) ──
MATRIMONIO_SLUG = "antonios-petronia"

def resolve_matrimonio_id() -> int:
    res = db.table("matrimoni").select("id").eq("slug", MATRIMONIO_SLUG).limit(1).execute()
    if not res.data:
        print(f"❌  Nessun matrimonio con slug {MATRIMONIO_SLUG!r} su Supabase — crealo prima nella tabella `matrimoni`")
        sys.exit(1)
    return int(res.data[0]["id"])

MATRIMONIO_ID = resolve_matrimonio_id()

# ── Lista invitati reale ────────────────────────────────────────────
GUESTS = [
    {"name": "Theodoros Stougias",             "email": "stoujias@otenet.gr"},
    {"name": "Vasiliki Kontotoli",              "email": None},
    {"name": "Georgios Charalampopoulos",       "email": "g-xaralamp@hotmail.com"},
    {"name": "Anastasia Zografaki",             "email": "zwgranasta1971@gmail.com"},
    {"name": "Foteini Charalampopoulou",        "email": "fotinichrl@gmail.com"},
    {"name": "Paraskevi Stougia",               "email": "stougia_evie@hotmail.com"},
    {"name": "Jonathan Kauffmann",              "email": None},
    {"name": "Eleftherios Madentzoglou",        "email": "emadentzoglou@gmail.com"},
    {"name": "Stavroula Petrou",                "email": "petrou.stav@gmail.com"},
    {"name": "Nikolaos Vasilikis",              "email": "nikolaos.vasilikis@gmail.com"},
    {"name": "Vasiliki Kalligeri",              "email": "kalligeri.v@gmail.com"},
    {"name": "Eleftherios Karystios",           "email": "e.karystios@outlook.com"},
    {"name": "Konstantinos Chatzikonstantinou", "email": "kchatzikonstantinou@outlook.com"},
    {"name": "Savvina Skepetari",               "email": "savvina_skep@hotmail.com"},
    {"name": "Katerina Roussou",                "email": "Roussouk4@gmail.com"},
    {"name": "Eirini Rapti",                    "email": "eirini_rpt@hotmail.com"},
    {"name": "Dimitrios Gkanavias",             "email": "dgkanavias@yahoo.gr"},
    {"name": "Ilias Athousas",                  "email": "i.athousas@gmail.com"},
    {"name": "Stefanos Karvounis",              "email": "Stefkarvounis@gmail.com"},
    {"name": "Kosmas Manetas",                  "email": "kosmasmanetas@gmail.com"},
    {"name": "Eleftheria Christofi",            "email": "Eleftheriachristofi1@gmail.com"},
    {"name": "Luiza Pinho Crespo",              "email": "Lu_crespo@hotmail.com"},
    {"name": "Sergio Marques Martins Junior",   "email": "S_martins@live.com"},
    {"name": "Bianca Strazzullo",               "email": "Bianca.strazzullo7@gmail.com"},
    {"name": "Salvatore Gasparo Rippa",         "email": "sgasparorippa@gmail.com"},
    {"name": "Joana dos Santos Oliveira",       "email": "Joana.santos.oliveira2000@gmail.com"},
    {"name": "Joao Miguel Freitas Casimiro",    "email": "joaofreitascasimiro@gmail.com"},
]


def clear_guests():
    print(f"🗑  Cancello gli ospiti esistenti del matrimonio id={MATRIMONIO_ID}…")
    db.table("guests").delete().eq("matrimonio_id", MATRIMONIO_ID).execute()
    print("   ✓ Tabella svuotata (solo per questo matrimonio)")


def seed():
    now = datetime.utcnow().isoformat()
    inserted = 0
    skipped = 0

    for g in GUESTS:
        if not g["email"]:
            print(f"   ⚠  {g['name']} non ha email — salto (aggiungi a mano dal pannello Admin)")
            skipped += 1
            continue

        # Controlla se l'email esiste già per QUESTO matrimonio
        existing = db.table("guests").select("id").eq("email", g["email"]).eq("matrimonio_id", MATRIMONIO_ID).execute().data
        if existing:
            print(f"   ⚠  {g['name']} già presente — salto")
            skipped += 1
            continue

        db.table("guests").insert({
            "name":          g["name"],
            "email":         g["email"],
            "phone":         None,
            "table_num":     None,
            "dietary":       None,
            "rsvp_status":   "pending",
            "invite_sent":   0,
            "matrimonio_id": MATRIMONIO_ID,
            "created_at":    now,
            "updated_at":    now,
        }).execute()
        print(f"   ✓ {g['name']}")
        inserted += 1

    print(f"\n✅  Completato — {inserted} inseriti, {skipped} saltati")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed lista invitati reale nel DB")
    parser.add_argument("--clear", action="store_true", help="Svuota la tabella prima di inserire")
    args = parser.parse_args()

    if args.clear:
        clear_guests()

    print(f"\n💍  Inserimento {len(GUESTS)} invitati…\n")
    seed()
