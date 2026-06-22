import io
import logging
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
    if ext == ".gif":
        return data, ext, "image/gif"

    try:
        from PIL import Image, ImageOps
    except ImportError:
        logger.warning("Pillow not installed – skipping compression")
        return data, ext, _mime(ext)

    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")

        w, h = img.size
        if max(w, h) > MAX_DIMENSION:
            ratio = MAX_DIMENSION / max(w, h)
            new_w, new_h = int(w * ratio), int(h * ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            logger.info("📐 Resize %dx%d → %dx%d", w, h, new_w, new_h)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        compressed = buf.getvalue()

        orig_kb = len(data) / 1024
        new_kb  = len(compressed) / 1024
        saving  = (1 - new_kb / orig_kb) * 100 if orig_kb > 0 else 0
        logger.info("🗜️  Compressed %.0f KB → %.0f KB (saved %.0f%%)", orig_kb, new_kb, saving)

        return compressed, ".jpg", "image/jpeg"

    except Exception as e:
        logger.warning("⚠️  compress_image failed (%s: %s) – using original", type(e).__name__, e)
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
