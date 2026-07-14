"""
Multi-tenant: risoluzione del matrimonio corrente per ogni richiesta.

Ogni frontend (un matrimonio = un deploy) manda l'header `X-Matrimonio-Slug`
con lo slug del proprio matrimonio (preso da wedding.js). Qui lo traduciamo
nell'id numerico usato come foreign key su tutte le tabelle.

NON DISTRUTTIVO: se l'header manca (frontend non ancora aggiornato) si usa
DEFAULT_MATRIMONIO_ID (= 1, "Antonios & Petronia"), quindi il comportamento attuale
resta identico.
"""
import os
import logging

from fastapi import Request
from database import get_db

logger = logging.getLogger("wedding.tenant")

HEADER_NAME = "X-Matrimonio-Slug"
DEFAULT_MATRIMONIO_ID = int(os.getenv("DEFAULT_MATRIMONIO_ID", "1"))

# Cache slug → id (gli slug non cambiano a runtime)
_slug_cache: dict[str, int] = {}


def resolve_matrimonio_id(slug: str | None) -> int:
    """Traduce uno slug in matrimonio_id. Fallback a DEFAULT se slug assente/sconosciuto."""
    if not slug:
        return DEFAULT_MATRIMONIO_ID

    slug = slug.strip().lower()
    if slug in _slug_cache:
        return _slug_cache[slug]

    try:
        res = get_db().table("matrimoni").select("id").eq("slug", slug).limit(1).execute()
        if res.data:
            mid = int(res.data[0]["id"])
            _slug_cache[slug] = mid
            return mid
        logger.warning("⚠️  Slug matrimonio sconosciuto: %r → fallback id=%d", slug, DEFAULT_MATRIMONIO_ID)
    except Exception as e:
        logger.error("❌ Errore risoluzione slug %r: %s", slug, e)

    return DEFAULT_MATRIMONIO_ID


def get_matrimonio_id(request: Request) -> int:
    """Dependency FastAPI: matrimonio_id della richiesta corrente (dall'header)."""
    return resolve_matrimonio_id(request.headers.get(HEADER_NAME))
