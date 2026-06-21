# routers/chatbot.py
# Chatbot AI gratuito basato su Groq (Llama 3.3 70B) — API diretta, nessun router
# necessario, nessun problema di crediti per provider terzi.
#
# Setup richiesto:
# 1. Crea un account gratuito su https://console.groq.com (nessuna carta richiesta)
# 2. Genera una API key dalla dashboard
# 3. Aggiungi al tuo .env (backend) e su Render in Environment Variables:
#      GROQ_API_KEY=gsk_xxxxxxxxxxxx
# 4. python -m pip install groq
#
# In main.py:
#   from routers import chatbot
#   app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])

import logging
import os
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger("wedding.chatbot")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   ="llama-3.1-8b-instant"# "llama-3.3-70b-versatile"


@router.get("/health")
async def chatbot_health():
    """Verifica rapida: il router è caricato e la chiave è configurata?"""
    return {
        "router_loaded": True,
        "api_key_configured": bool(GROQ_API_KEY),
        "api_key_preview": f"{GROQ_API_KEY[:10]}…" if GROQ_API_KEY else None,
        "model": GROQ_MODEL,
    }


# ─────────────────────────────────────────────────────────────────────────
# CONTESTO FISSO — scrivi qui tutte le informazioni sul matrimonio.
# Il chatbot risponderà SOLO basandosi su queste informazioni.
# Modifica liberamente questo testo con i dettagli reali.
# ─────────────────────────────────────────────────────────────────────────
WEDDING_CONTEXT = """
Sei l'assistente virtuale del matrimonio di Sofia & Marco. Rispondi sempre in
modo cordiale, caldo e con un tocco di eleganza, come se facessi parte dello
staff dell'evento. Usa l'italiano salvo che l'utente scriva in inglese.

INFORMAZIONI SUGLI SPOSI:
- Sofia e Marco si sposano il 14 Giugno 2027.

CERIMONIA:
- Luogo: Duomo di Napoli, Via Duomo, 80138 Napoli (NA)
- Orario: ore 15:00

RICEVIMENTO:
- Luogo: Villa Doria d'Angri, Via Francesco Petrarca 80, Posillipo, Napoli (NA)
- Orario: a seguire, dalle ore 17:00

PROGRAMMA DELLA GIORNATA:
- 15:00 — Cerimonia al Duomo di Napoli
- 17:00 — Cocktail di benvenuto a Villa Doria d'Angri
- 19:30 — Cena di nozze
- 22:00 — Taglio della torta
- A seguire — Festa e ballo

DRESS CODE:
- Elegante. Si chiede gentilmente di evitare il bianco (riservato alla sposa).

COME ARRIVARE:
- Parcheggio disponibile presso Villa Doria d'Angri.
- Per chi viene da fuori città, si consigliano hotel in zona Posillipo/Chiaia.

RSVP:
- Gli ospiti possono confermare la presenza tramite la sezione "Inviti" del sito,
  indicando anche eventuali esigenze alimentari (vegetariano, vegano, senza
  glutine, senza lattosio, allergie).

MENU:
- Disponibile nella sezione "Menù" del sito, con possibilità di scegliere tra
  diverse portate.

REGALI:
- (Aggiungi qui le info sulla lista nozze o IBAN se previsti)

CONTATTI:
- Per domande specifiche non coperte qui, invita l'utente a contattare
  direttamente gli sposi o a usare la sezione "Chat" del sito.

ISTRUZIONI IMPORTANTI:
- Rispondi in modo breve e chiaro (massimo 3-4 frasi).
- Se non conosci la risposta a qualcosa che non è in queste informazioni,
  dillo onestamente e suggerisci di contattare gli sposi.
- Non inventare mai informazioni non presenti qui sopra.
""".strip()


class ChatMessage(BaseModel):
    role: str    # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None


@router.post("/")
async def chat(body: ChatRequest):
    logger.info("📥 Richiesta ricevuta | message=%r | history_len=%d",
                body.message[:80], len(body.history or []))

    if not GROQ_API_KEY:
        logger.error("❌ GROQ_API_KEY non configurata sul server")
        raise HTTPException(500, "GROQ_API_KEY non configurata sul server")

    logger.info("🔑 GROQ_API_KEY presente (lunghezza=%d, inizia con %s…)",
                len(GROQ_API_KEY), GROQ_API_KEY[:10])

    try:
        from groq import Groq
    except ImportError:
        logger.error("❌ Libreria 'groq' non installata sul server")
        raise HTTPException(500, "Libreria 'groq' non installata sul server")

    client = Groq(api_key=GROQ_API_KEY)

    messages = [{"role": "system", "content": WEDDING_CONTEXT}]
    if body.history:
        for m in body.history[-10:]:
            messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": body.message})

    logger.info("📤 Chiamata a Groq | model=%s", GROQ_MODEL)

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.6,
            max_tokens=400,
        )
        reply = completion.choices[0].message.content
        logger.info("✅ Reply ricevuta da Groq | length=%d", len(reply))
        return {"reply": reply}
    except Exception as e:
        logger.error("❌ Groq API error | type=%s | message=%s", type(e).__name__, str(e))
        raise HTTPException(502, f"Errore chatbot: {e}")