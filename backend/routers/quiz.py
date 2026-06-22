import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from database import get_db

router = APIRouter()
logger = logging.getLogger("wedding.quiz")

ALLOWED_GAMES = {"sposo", "sposa", "cruciv"}


class ScoreIn(BaseModel):
    game_id: str
    player_name: str
    score: int
    total: int


@router.post("/scores")
async def save_score(body: ScoreIn):
    if body.game_id not in ALLOWED_GAMES:
        raise HTTPException(400, f"game_id non valido: {body.game_id}")
    if not body.player_name.strip():
        raise HTTPException(400, "player_name richiesto")
    if body.score < 0 or body.total <= 0 or body.score > body.total:
        raise HTTPException(400, "score/total non validi")

    db = get_db()
    row = {
        "game_id":     body.game_id,
        "player_name": body.player_name.strip(),
        "score":       body.score,
        "total":       body.total,
        "created_at":  datetime.utcnow().isoformat(),
    }
    result = db.table("quiz_scores").insert(row).execute()
    logger.info("✅ QUIZ_SCORE | game=%s | player=%r | score=%d/%d", body.game_id, body.player_name, body.score, body.total)
    return result.data[0]


@router.get("/scores")
async def get_scores(game_id: Optional[str] = None):
    db = get_db()
    q = db.table("quiz_scores").select("game_id, player_name, score, total, created_at")
    if game_id:
        if game_id not in ALLOWED_GAMES:
            raise HTTPException(400, f"game_id non valido: {game_id}")
        q = q.eq("game_id", game_id)
    rows = q.order("score", desc=True).order("created_at").limit(100).execute().data or []
    return rows
