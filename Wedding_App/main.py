import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
PHOTOS_DIR = UPLOADS_DIR / "photos"
AUDIO_DIR = UPLOADS_DIR / "audio"

# Aggiunge BASE_DIR al sys.path così Python trova tutti i moduli locali
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# ⚠️ Carica le variabili d'ambiente PRIMA di tutto il resto
load_dotenv(BASE_DIR / ".env")

for folder in [UPLOADS_DIR, PHOTOS_DIR, AUDIO_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db

from routers import auth
from routers import guests
from routers import messages
from routers import photos
from routers import menu
from routers import admin

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / "wedding.log", encoding="utf-8"),
    ],
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
import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    # GitHub Pages
    "https://sasigasparo.github.io",
]

if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ──────────────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(guests.router,   prefix="/api/guests",   tags=["Guests"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(photos.router,   prefix="/api/photos",   tags=["Photos"])
app.include_router(menu.router,     prefix="/api/menu",     tags=["Menu"])
app.include_router(admin.router,    prefix="/api/admin",    tags=["Admin"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Wedding App"}