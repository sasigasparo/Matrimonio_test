import io
import logging
import time
from typing import Tuple

logger = logging.getLogger("wedding.image_utils")

MAX_DIMENSION = 1920
JPEG_QUALITY  = 82


def compress_image(data: bytes, ext: str) -> Tuple[bytes, str, str]:
    """
    Resize + recompress image before Supabase upload.
    Returns (output_bytes, new_ext, new_mime).
    GIF is kept as-is. Everything else → JPEG.
    Falls back to original on any error so upload never fails.
    """
    orig_kb = len(data) / 1024
    logger.info("🖼️  COMPRESS_START | ext=%s | size=%.1f KB (%.2f MB)", ext, orig_kb, orig_kb / 1024)

    if ext == ".gif":
        logger.info("⏭️  COMPRESS_SKIP | GIF non compresso (animazioni)")
        return data, ext, "image/gif"

    try:
        from PIL import Image, ImageOps
    except ImportError:
        logger.warning("⚠️  COMPRESS_SKIP | Pillow non installato")
        return data, ext, _mime(ext)

    t0 = time.time()
    try:
        # Decode
        img = Image.open(io.BytesIO(data))
        orig_mode = img.mode
        orig_w, orig_h = img.size
        logger.info(
            "🔍 COMPRESS_DECODE | mode=%s | size=%dx%d | format=%s",
            orig_mode, orig_w, orig_h, img.format or "unknown",
        )

        # Fix EXIF rotation
        img = ImageOps.exif_transpose(img)
        if img.size != (orig_w, orig_h):
            logger.info("🔄 COMPRESS_EXIF | rotated %dx%d → %dx%d", orig_w, orig_h, img.width, img.height)

        # Convert to RGB (handles RGBA, P, CMYK, etc.)
        if img.mode != "RGB":
            img = img.convert("RGB")
            logger.info("🎨 COMPRESS_CONVERT | %s → RGB", orig_mode)

        # Resize if needed
        w, h = img.size
        if max(w, h) > MAX_DIMENSION:
            ratio = MAX_DIMENSION / max(w, h)
            new_w, new_h = int(w * ratio), int(h * ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            logger.info(
                "📐 COMPRESS_RESIZE | %dx%d → %dx%d (ratio=%.3f)",
                w, h, new_w, new_h, ratio,
            )
        else:
            logger.info("📐 COMPRESS_RESIZE | skip — %dx%d già ≤ %dpx", w, h, MAX_DIMENSION)

        # Encode to JPEG
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        compressed = buf.getvalue()

        new_kb   = len(compressed) / 1024
        saving   = (1 - new_kb / orig_kb) * 100 if orig_kb > 0 else 0
        elapsed  = int((time.time() - t0) * 1000)

        logger.info(
            "✅ COMPRESS_DONE | %.1f KB → %.1f KB | risparmio=%.0f%% | q=%d | %dms",
            orig_kb, new_kb, saving, JPEG_QUALITY, elapsed,
        )

        return compressed, ".jpg", "image/jpeg"

    except Exception as e:
        elapsed = int((time.time() - t0) * 1000)
        logger.warning(
            "⚠️  COMPRESS_FAIL | %s: %s | %dms | uso originale (%.1f KB)",
            type(e).__name__, e, elapsed, orig_kb,
        )
        return data, ext, _mime(ext)


def _mime(ext: str) -> str:
    return {
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png":  "image/png",
        ".webp": "image/webp",
        ".gif":  "image/gif",
        ".heic": "image/heic",
    }.get(ext, "application/octet-stream")
