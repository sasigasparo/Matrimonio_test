import logging
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from auth_config import get_current_guest, get_optional_guest
from database import get_db, audit
from image_utils import compress_image

router = APIRouter()
logger = logging.getLogger("wedding.photos")

ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}
MAX_PHOTO_MB = 30

SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "wedding-photos")




def _upload_to_supabase(data: bytes, filename: str, mime_type: str) -> str:
    """Upload file to Supabase Storage bucket. Returns public URL."""
    size_mb = len(data) / (1024 * 1024)
    path = f"photos/{filename}"

    logger.info(
        "🗄️  Supabase Storage | START | bucket=%s | path=%s | size=%.2f MB | mime=%s",
        SUPABASE_BUCKET, path, size_mb, mime_type,
    )
    start = time.time()

    try:
        db = get_db()

        # Step 1 — upload binario
        logger.debug("   Supabase [1/2] upload binario → %s", path)
        db.storage.from_(SUPABASE_BUCKET).upload(
            path=path,
            file=data,
            file_options={"content-type": mime_type, "upsert": "false"},
        )
        logger.debug("   Supabase [1/2] upload OK")

        # Step 2 — recupera URL pubblico
        logger.debug("   Supabase [2/2] recupero URL pubblico")
        public_url = db.storage.from_(SUPABASE_BUCKET).get_public_url(path)

        ms = int((time.time() - start) * 1000)
        logger.info(
            "✅ Supabase Storage | OK | path=%s | %d ms | url=%s",
            path, ms, public_url,
        )
        return public_url

    except Exception as e:
        ms = int((time.time() - start) * 1000)
        logger.error(
            "❌ Supabase Storage | FAIL | path=%s | %d ms | %s: %s",
            path, ms, type(e).__name__, e,
        )
        raise


def _mime_from_ext(ext: str) -> str:
    return {
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png":  "image/png",
        ".webp": "image/webp",
        ".gif":  "image/gif",
        ".heic": "image/heic",
    }.get(ext, "application/octet-stream")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
async def list_photos(user=Depends(get_optional_guest)):
    db = get_db()
    photos = (
        db.table("photos")
        .select("*, guests(name, avatar_url)")
        .order("created_at", desc=True)
        .execute().data or []
    )
    for p in photos:
        guest_info = p.pop("guests", {}) or {}
        p["guest_name"] = guest_info.get("name")
        p["avatar_url"]  = guest_info.get("avatar_url")
    return photos


@router.post("/")
async def upload_photo(
    request: Request,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    user=Depends(get_current_guest),
):
    t0        = time.time()
    guest_id  = user["sub"]
    client_ip = request.client.host if request.client else "unknown"

    logger.info(
        "📥 UPLOAD REQUEST | guest_id=%s | original_filename=%s | ip=%s",
        guest_id, file.filename, client_ip,
    )

    # ── 1. Validazione ────────────────────────────────────────────────────────
    ext = Path(file.filename).suffix.lower()
    
    # Dopo la validazione dell'estensione, aggiungi il fallback:
    
    if not ext or ext not in ALLOWED_EXTS:
        ct = (file.content_type or "").lower()
        ct_to_ext = {
            "image/jpeg": ".jpg", "image/jpg": ".jpg",
            "image/png": ".png", "image/webp": ".webp",
            "image/gif": ".gif", "image/heic": ".heic",
        }
        ext = ct_to_ext.get(ct, ext)

    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, f"Formato non supportato: {ext}")

    data    = await file.read()
    size_mb = len(data) / (1024 * 1024)

    if size_mb > MAX_PHOTO_MB:
        logger.warning(
            "🚫 VALIDATION FAIL | guest_id=%s | size=%.2f MB > max=%d MB | filename=%s",
            guest_id, size_mb, MAX_PHOTO_MB, file.filename,
        )
        raise HTTPException(413, f"File troppo grande (max {MAX_PHOTO_MB}MB)")

    data, ext, mime_type = compress_image(data, ext)
    filename = f"{uuid.uuid4()}{ext}"
    logger.info(
        "✔️  VALIDATION OK | guest_id=%s | ext=%s | size=%.2f MB | uuid_filename=%s",
        guest_id, ext, size_mb, filename,
    )

    # ── 2. Supabase Storage (obbligatorio) ────────────────────────────────────
    try:
        public_url = _upload_to_supabase(data, filename, mime_type)
    except Exception as e:
        logger.error(
            "💥 UPLOAD ABORTED | guest_id=%s | Supabase è obbligatorio ed è fallito | %s: %s",
            guest_id, type(e).__name__, e,
        )
        raise HTTPException(500, f"Errore upload immagine: {e}")


    # ── 4. Salva metadati DB ──────────────────────────────────────────────────
    logger.info("💾 DB INSERT | guest_id=%s | filename=%s", guest_id, filename)
    t_db = time.time()
    try:
        db     = get_db()
        result = db.table("photos").insert({
            "guest_id":   int(guest_id),
            "filename":   filename,
            "url":        public_url,
            "caption":    caption,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

        photo    = result.data[0]
        photo_id = photo["id"]
        logger.info(
            "✅ DB INSERT OK | photo_id=%s | guest_id=%s | %d ms",
            photo_id, guest_id, int((time.time() - t_db) * 1000),
        )
    except Exception as e:
        logger.error(
            "❌ DB INSERT FAIL | guest_id=%s | filename=%s | %s: %s",
            guest_id, filename, type(e).__name__, e,
        )
        raise HTTPException(500, f"Errore salvataggio metadati: {e}")

    # ── 5. Arricchisci risposta con dati guest ────────────────────────────────
    guest_result = db.table("guests").select("name, avatar_url").eq("id", guest_id).execute()
    guest_info   = guest_result.data[0] if guest_result.data else {}
    photo["guest_name"] = guest_info.get("name")
    photo["avatar_url"]  = guest_info.get("avatar_url")

    audit(user["email"], "upload_photo", f"photo:{photo_id}", filename, client_ip)

    total_ms = int((time.time() - t0) * 1000)
    logger.info(
        "🎉 UPLOAD COMPLETE | photo_id=%s | guest_id=%s | size=%.2f MB | total=%d ms"
        " | supabase=OK | drive=%s | caption=%r",
        photo_id, guest_id, size_mb, total_ms,
        caption or "",
    )

    return photo


@router.delete("/{photo_id}")
async def delete_photo(photo_id: int, user=Depends(get_current_guest)):
    db     = get_db()
    result = db.table("photos").select("*").eq("id", photo_id).execute()
    if not result.data:
        raise HTTPException(404, "Photo not found")

    row      = result.data[0]
    is_owner = str(row["guest_id"]) == str(user["sub"])
    if not is_owner and not user.get("is_admin"):
        raise HTTPException(403, "Forbidden")

    logger.info(
        "🗑️  DELETE | photo_id=%s | guest_id=%s | filename=%s",
        photo_id, user["sub"], row["filename"],
    )

    try:
        db.storage.from_(SUPABASE_BUCKET).remove([f"photos/{row['filename']}"])
        logger.info("✅ Supabase Storage DELETE OK | photo_id=%s | filename=%s", photo_id, row["filename"])
    except Exception as e:
        logger.warning("⚠️  Supabase Storage DELETE FAIL | photo_id=%s | %s: %s", photo_id, type(e).__name__, e)

    db.table("photos").delete().eq("id", photo_id).execute()
    logger.info("✅ DB DELETE OK | photo_id=%s", photo_id)
    return {"deleted": photo_id}


@router.get("/my")
async def my_photos(user=Depends(get_current_guest)):
    db   = get_db()
    rows = (
        db.table("photos")
        .select("*")
        .eq("guest_id", user["sub"])
        .order("created_at", desc=True)
        .execute().data or []
    )
    return rows
