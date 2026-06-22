import logging
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from auth_config import get_current_guest, get_optional_guest
from database import get_db, audit

router = APIRouter()
logger = logging.getLogger("wedding.messages")

ALLOWED_AUDIO = {".webm", ".ogg", ".mp3", ".wav", ".m4a"}
ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}
MAX_AUDIO_MB = 50
MAX_PHOTO_MB = 30

SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "wedding-photos")


def _mime_from_audio_ext(ext: str) -> str:
    return {
        ".webm": "audio/webm",
        ".ogg":  "audio/ogg",
        ".mp3":  "audio/mpeg",
        ".wav":  "audio/wav",
        ".m4a":  "audio/mp4",
    }.get(ext, "application/octet-stream")


def _mime_from_image_ext(ext: str) -> str:
    return {
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png":  "image/png",
        ".webp": "image/webp",
        ".gif":  "image/gif",
        ".heic": "image/heic",
    }.get(ext, "application/octet-stream")


def _upload_to_supabase(data: bytes, path: str, mime_type: str) -> str:
    """Upload to Supabase Storage and return public URL."""
    size_mb = len(data) / (1024 * 1024)
    logger.info("Supabase upload | path=%s | size=%.2f MB | mime=%s", path, size_mb, mime_type)
    start = time.time()
    try:
        db = get_db()
        db.storage.from_(SUPABASE_BUCKET).upload(
            path=path,
            file=data,
            file_options={"content-type": mime_type, "upsert": "false"},
        )
        public_url = db.storage.from_(SUPABASE_BUCKET).get_public_url(path)
        logger.info("Supabase OK | path=%s | %dms | url=%s", path, int((time.time()-start)*1000), public_url)
        return public_url
    except Exception as e:
        logger.error("Supabase FAIL | path=%s | %s: %s", path, type(e).__name__, e)
        raise


# ──────────────────────────────────────────────────────────────────────────────
# GET PUBLIC MESSAGES
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/public")
async def list_messages():
    """Returns all messages (public). No auth required."""
    db = get_db()
    messages = (
        db.table("messages")
        .select("id, guest_id, content, audio_path, photo_url, type, created_at, guest_name, guests(name, avatar_url)")
        .order("created_at", desc=True)
        .execute()
        .data or []
    )
    result = []
    for m in messages:
        if not m.get("content") and not m.get("audio_path") and not m.get("photo_url"):
            continue
        guest_info = m.pop("guests", {}) or {}
        # guest_name: prefer stored name (anon guests), fallback to registered user name
        if not m.get("guest_name"):
            m["guest_name"] = guest_info.get("name") or "Ospite"
        if not m.get("avatar_url"):
            m["avatar_url"] = guest_info.get("avatar_url")
        result.append(m)
    return result


# ──────────────────────────────────────────────────────────────────────────────
# SEND MESSAGE — supports anon guests (name only) and registered users
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/")
async def send_message(
    request: Request,
    content:    Optional[str]        = Form(None),
    audio:      Optional[UploadFile] = File(None),
    file:       Optional[UploadFile] = File(None),   # inline photo from chat
    guest_name: Optional[str]        = Form(None),   # for anonymous guests
    user=Depends(get_optional_guest),
):
    """
    Send a message (text, audio, photo, or mix).
    Supports both authenticated users and anonymous guests (guest_name form field).
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        "📨 MSG_IN | ip=%s | auth=%s | guest_name=%r | content_len=%d | "
        "has_audio=%s | has_file=%s | file=%r | file_ct=%r",
        client_ip, bool(user), guest_name,
        len(content) if content else 0,
        bool(audio), bool(file),
        getattr(file, "filename", None),
        getattr(file, "content_type", None),
    )

    if not content and not audio and not file:
        logger.warning("❌ MSG_REJECT 400 | nessun payload | ip=%s", client_ip)
        raise HTTPException(400, "Almeno un contenuto è richiesto")

    # Resolve identity
    if user:
        actor_id    = int(user["sub"])
        real_form_name = guest_name.strip() if guest_name and guest_name.strip() not in ("", "Ospite") else None
        real_jwt_name  = user.get("name") if user.get("name") and user.get("name") != "Ospite" else None
        actor_name  = real_form_name or real_jwt_name or "Ospite"
        actor_email = user.get("email", "anon")
        logger.info("👤 IDENTITY | tipo=auth | id=%s | name=%r | email=%r", actor_id, actor_name, actor_email)
    elif guest_name and guest_name.strip():
        actor_id    = None
        actor_name  = guest_name.strip()
        actor_email = "anon"
        logger.info("👤 IDENTITY | tipo=anon | name=%r", actor_name)
    else:
        logger.warning(
            "❌ MSG_REJECT 400 | nome mancante | ip=%s | auth=%s | guest_name=%r",
            client_ip, bool(user), guest_name,
        )
        raise HTTPException(400, "Nome richiesto per inviare un messaggio")

    audio_path = None
    photo_url  = None

    # ── Audio upload ──────────────────────────────────────────────────────────
    if audio:
        ext = Path(audio.filename).suffix.lower()
        if ext not in ALLOWED_AUDIO:
            logger.warning("❌ AUDIO_REJECT | ext=%r | filename=%r | guest=%r", ext, audio.filename, actor_name)
            raise HTTPException(400, f"Formato audio non supportato: {ext}")
        data = await audio.read()
        size_mb = len(data) / (1024 * 1024)
        logger.info("🎙️  AUDIO_UPLOAD | ext=%s | size=%.2f MB | guest=%r", ext, size_mb, actor_name)
        if size_mb > MAX_AUDIO_MB:
            raise HTTPException(413, f"File troppo grande (max {MAX_AUDIO_MB} MB)")
        filename  = f"{uuid.uuid4()}{ext}"
        mime_type = audio.content_type or _mime_from_audio_ext(ext)
        try:
            audio_path = _upload_to_supabase(data, f"audio/{filename}", mime_type)
            logger.info("✅ AUDIO_OK | path=audio/%s | guest=%r", filename, actor_name)
        except Exception as e:
            logger.error("❌ AUDIO_FAIL | %s: %s | guest=%r", type(e).__name__, e, actor_name)
            raise HTTPException(500, f"Errore upload audio: {e}")

    # ── Inline photo upload (from chat) ───────────────────────────────────────
    if file:
        logger.info(
            "🖼️  FOTO_CHAT | INIZIO | filename=%r | content_type=%r | user=%s",
            file.filename, file.content_type, actor_name,
        )
        raw_filename = file.filename or ""
        ext = Path(raw_filename).suffix.lower()

        # Some browsers/mobile send files with no extension (e.g. filename="blob" or "")
        # Fallback: infer extension from content-type
        if not ext or ext not in ALLOWED_IMAGE:
            ct = (file.content_type or "").lower()
            ct_to_ext = {
                "image/jpeg": ".jpg", "image/jpg": ".jpg",
                "image/png": ".png", "image/webp": ".webp",
                "image/gif": ".gif", "image/heic": ".heic",
            }
            inferred = ct_to_ext.get(ct, "")
            logger.info(
                "🖼️  FOTO_CHAT | RICONOSCIMENTO | filename=%r | ext_originale=%r | content_type=%r -> ext_dedotto=%r",
                raw_filename, ext, ct, inferred,
            )
            ext = inferred

        if not ext or ext not in ALLOWED_IMAGE:
            logger.error(
                "❌ FOTO_CHAT 400 | FORMATO INVALIDO | filename=%r | ext=%r | content_type=%r | ALLOWED=%s",
                raw_filename, ext, file.content_type, ALLOWED_IMAGE,
            )
            raise HTTPException(
                400,
                f"Formato immagine non supportato (filename={raw_filename!r}, type={file.content_type!r}). "
                f"Usa: jpg, png, webp, gif, heic"
            )

        data = await file.read()
        size_mb = len(data) / (1024 * 1024)
        logger.info(
            "🖼️  FOTO_CHAT | LETTURA_FILE | filename=%r | ext=%s | size=%.2f MB | guest=%r",
            raw_filename, ext, size_mb, actor_name,
        )
        if size_mb > MAX_PHOTO_MB:
            logger.error(
                "❌ FOTO_CHAT 413 | FILE TROPPO GRANDE | size=%.2f MB | max=%d MB",
                size_mb, MAX_PHOTO_MB,
            )
            raise HTTPException(413, f"File troppo grande ({size_mb:.1f} MB, max {MAX_PHOTO_MB} MB)")

        filename  = f"{uuid.uuid4()}{ext}"
        mime_type = file.content_type or _mime_from_image_ext(ext)
        logger.info(
            "🖼️  FOTO_CHAT | UPLOAD_SUPABASE | nome_interno=%s | mime_type=%s | path=photos/%s",
            filename, mime_type, filename,
        )
        try:
            photo_url = _upload_to_supabase(data, f"photos/{filename}", mime_type)
            logger.info("✅ FOTO_CHAT | UPLOAD_OK | url=%s | guest=%s | size=%.2f MB", photo_url, actor_name, size_mb)
        except Exception as e:
            logger.error(
                "❌ FOTO_CHAT | UPLOAD_FAIL | errore=%s | messaggio=%s | nome=%s",
                type(e).__name__, str(e), filename
            )
            raise HTTPException(500, f"Errore upload foto: {e}")

    # ── Message type ──────────────────────────────────────────────────────────
    has_text  = bool(content and content.strip())
    has_audio = bool(audio_path)
    has_photo = bool(photo_url)

    logger.info(
        "📊 MESSAGE_CLASSIFY | guest=%r | has_text=%s | has_audio=%s | has_photo=%s",
        actor_name, has_text, has_audio, has_photo,
    )

    if not has_text and not has_audio and not has_photo:
        logger.error("❌ MESSAGE_EMPTY | guest=%r — nessun contenuto dopo upload, abortisco", actor_name)
        raise HTTPException(400, "Nessun contenuto nel messaggio")

    if has_audio and has_text:
        msg_type = "both"
    elif has_audio:
        msg_type = "audio"
    elif has_photo and has_text:
        msg_type = "photo_text"
    elif has_photo:
        msg_type = "photo"
    else:
        msg_type = "text"

    logger.info(
        "📝 MESSAGE_READY | type=%s | text_len=%d | text=%r | has_photo=%s | has_audio=%s | guest=%r",
        msg_type,
        len(content.strip()) if content else 0,
        (content.strip()[:60] if content else ""),
        bool(photo_url),
        bool(audio_path),
        actor_name,
    )

    # ── Save to DB ────────────────────────────────────────────────────────────
    db = get_db()
    row = {
        "content":    content.strip() if content else None,
        "audio_path": audio_path,
        "photo_url":  photo_url,
        "type":       msg_type,
        "guest_name": actor_name,
        "created_at": datetime.utcnow().isoformat(),
    }
    if actor_id:
        row["guest_id"] = actor_id

    logger.info(
        "💾 DB_INSERT | type=%s | guest=%r | guest_id=%s | has_photo=%s | has_audio=%s | has_text=%s",
        msg_type, actor_name, actor_id, bool(photo_url), bool(audio_path), has_text,
    )
    result = db.table("messages").insert(row).execute()
    msg    = result.data[0]
    msg_id = msg["id"]

    logger.info("✅ MSG_SAVED | id=%s | type=%s | guest=%r", msg_id, msg_type, actor_name)

    # Enrich with guest info if registered
    if actor_id:
        gr = db.table("guests").select("name, avatar_url").eq("id", actor_id).execute()
        gi = gr.data[0] if gr.data else {}
        msg["avatar_url"] = gi.get("avatar_url")
    msg["guest_name"] = actor_name

    audit(
        actor_email, "send_message", f"message:{msg_id}", msg_type,
        request.client.host if request.client else "",
    )
    logger.info("🎉 MSG_DONE | id=%s | type=%s | guest=%r | photo=%s | audio=%s | text=%s",
                msg_id, msg_type, actor_name, bool(photo_url), bool(audio_path), has_text)
    return msg


# ──────────────────────────────────────────────────────────────────────────────
# DELETE MESSAGE
# ──────────────────────────────────────────────────────────────────────────────
@router.delete("/{message_id}")
async def delete_message(message_id: int, user=Depends(get_current_guest)):
    db     = get_db()
    result = db.table("messages").select("*").eq("id", message_id).execute()
    if not result.data:
        raise HTTPException(404, "Message not found")

    row      = result.data[0]
    is_owner = str(row.get("guest_id", "")) == str(user["sub"])
    if not is_owner and not user.get("is_admin"):
        logger.warning("❌ DELETE_FORBIDDEN | msg_id=%s | guest_id=%s | owner=%s", message_id, user["sub"], row.get("guest_id"))
        raise HTTPException(403, "Forbidden")

    logger.info("🗑️  MSG_DELETE | id=%s | type=%s | guest_id=%s | by_admin=%s", message_id, row.get("type"), user["sub"], user.get("is_admin"))

    # Delete audio from Supabase
    if row.get("audio_path"):
        try:
            filename = Path(urlparse(row["audio_path"]).path).name
            db.storage.from_(SUPABASE_BUCKET).remove([f"audio/{filename}"])
            logger.info("✅ STORAGE_DEL | audio/%s", filename)
        except Exception as e:
            logger.warning("⚠️  STORAGE_DEL_FAIL | audio | msg_id=%s | %s: %s", message_id, type(e).__name__, e)

    # Delete inline photo from Supabase
    if row.get("photo_url"):
        try:
            filename = Path(urlparse(row["photo_url"]).path).name
            db.storage.from_(SUPABASE_BUCKET).remove([f"photos/{filename}"])
            logger.info("✅ STORAGE_DEL | photos/%s", filename)
        except Exception as e:
            logger.warning("⚠️  STORAGE_DEL_FAIL | photos | msg_id=%s | %s: %s", message_id, type(e).__name__, e)

    db.table("messages").delete().eq("id", message_id).execute()
    logger.info("✅ MSG_DELETED | id=%s", message_id)
    return {"deleted": message_id}


# ──────────────────────────────────────────────────────────────────────────────
# MY MESSAGES
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/me")
async def my_messages(user=Depends(get_current_guest)):
    db   = get_db()
    rows = (
        db.table("messages")
        .select("*")
        .eq("guest_id", user["sub"])
        .order("created_at", desc=True)
        .execute()
        .data or []
    )
    return rows