"""
seed_guests.py
──────────────
Popola la tabella `guests` con la lista invitati reale di Antonios & Petronia.

Uso:
  1. Assicurati che le variabili d'ambiente SUPABASE_URL e SUPABASE_KEY
     siano impostate (stesso .env del backend).
  2. Esegui:
       python seed_guests.py
  3. Per azzerare prima gli ospiti esistenti (es. i 50 fittizi di Sofia & Marco):
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
    print("🗑  Cancello tutti gli ospiti esistenti…")
    db.table("guests").delete().neq("id", 0).execute()
    print("   ✓ Tabella svuotata")


def seed():
    now = datetime.utcnow().isoformat()
    inserted = 0
    skipped = 0

    for g in GUESTS:
        if not g["email"]:
            print(f"   ⚠  {g['name']} non ha email — salto (aggiungi a mano dal pannello Admin)")
            skipped += 1
            continue

        # Controlla se l'email esiste già
        existing = db.table("guests").select("id").eq("email", g["email"]).execute().data
        if existing:
            print(f"   ⚠  {g['name']} già presente — salto")
            skipped += 1
            continue

        db.table("guests").insert({
            "name":        g["name"],
            "email":       g["email"],
            "phone":       None,
            "table_num":   None,
            "dietary":     None,
            "rsvp_status": "pending",
            "invite_sent": 0,
            "created_at":  now,
            "updated_at":  now,
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
