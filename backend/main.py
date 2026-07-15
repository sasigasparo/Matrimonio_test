import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
PHOTOS_DIR = UPLOADS_DIR / "photos"
AUDIO_DIR = UPLOADS_DIR / "audio"

# Aggiunge BASE_DIR al sys.path così Python trova tutti i moduli locali
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Carica le variabili d'ambiente PRIMA di tutto il resto
load_dotenv(BASE_DIR / ".env")

# Crea le cartelle uploads solo se il filesystem è scrivibile (non su Render read-only)
for folder in [UPLOADS_DIR, PHOTOS_DIR, AUDIO_DIR]:
    try:
        folder.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass  # Su Render il filesystem è read-only, le foto vanno su Supabase Storage

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import init_db
from routers import auth, guests, messages, photos, menu, admin, tables, chatbot, quiz

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_DIR = BASE_DIR / "logs"
try:
    LOG_DIR.mkdir(exist_ok=True)
    file_handler = logging.FileHandler(LOG_DIR / "wedding.log", encoding="utf-8")
    handlers = [logging.StreamHandler(sys.stdout), file_handler]
except OSError:
    handlers = [logging.StreamHandler(sys.stdout)]  # Solo stdout su Render

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=handlers,
    force=True,
)
logger = logging.getLogger("wedding")

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🌸 Wedding App avviata")
    init_db()
    yield
    logger.info("🌸 Wedding App spenta")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Wedding App API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://sasigasparo.github.io",
    "https://matrimonio-test.pages.dev", 

]

if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Garantisce header CORS anche sulle risposte 500 non gestite
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    cors_origin = origin if origin in origins else (origins[0] if origins else "*")
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(guests.router,   prefix="/api/guests",   tags=["Guests"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(photos.router,   prefix="/api/photos",   tags=["Photos"])
app.include_router(menu.router,     prefix="/api/menu",     tags=["Menu"])
app.include_router(admin.router,    prefix="/api/admin",    tags=["Admin"])

app.include_router(tables.router,   prefix="/api/tables",   tags=["Tables"])
app.include_router(chatbot.router,  prefix="/api/chatbot",  tags=["Chatbot"])
app.include_router(quiz.router,     prefix="/api/quiz",     tags=["Quiz"])

@app.get("/")
async def root():
    return {"status": "ok", "service": "Wedding App"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Wedding App"}

@app.get("/api/health")
async def api_health():
    return {"status": "ok", "service": "Wedding App"}