"""
Cycle API — Run daily cycle, spawn society, epistemic scorecard.

POST /api/cycle/run    → SSE stream of cycle progress
POST /api/spawn        → Create society with config
GET  /api/scorecard    → Epistemic health metrics
"""

import json
import asyncio

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter()


@router.post("/cycle/run")
async def run_cycle(request: Request):
    """Run a daily cycle. Streams progress via SSE."""
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    beats_filter = body.get("beats", None)

    from app.config import LLM_API_KEY
    if not LLM_API_KEY:
        return JSONResponse({"error": "LLM_API_KEY not configured"}, status_code=500)

    from app.db import get_stats
    stats = await get_stats()
    if stats["beings"] == 0:
        return JSONResponse({"error": "No agents. Run: python -m scripts.spawn_society"}, status_code=400)

    async def event_stream():
        # Import here to avoid circular deps
        from app.society.cycle import run_cycle_streaming

        async for event in run_cycle_streaming(beats_filter):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/spawn")
async def spawn_society(request: Request):
    """Spawn a new agent society."""
    body = await request.json()
    agent_count = body.get("agents", 50)
    beat_count = body.get("beats", 10)

    if agent_count < 1 or agent_count > 50000:
        return JSONResponse({"error": "agents must be 1-50000"}, status_code=400)
    if beat_count < 1 or beat_count > 31:
        return JSONResponse({"error": "beats must be 1-31"}, status_code=400)

    from app.db import get_stats
    stats = await get_stats()
    if stats["beings"] > 0:
        return JSONResponse({
            "error": f"Society already exists ({stats['beings']} agents). Delete data/openfishh.db to reset.",
        }, status_code=400)

    # Run spawn in background
    from scripts.spawn_society import spawn
    await spawn(agent_count, beat_count)

    stats = await get_stats()
    return {"success": True, "agents": stats["beings"], "beats": stats["beats"]}


@router.get("/scorecard")
async def scorecard():
    """Epistemic health of the society."""
    from app.db import get_db
    from app.epistemics.scorecard import compute_scorecard

    db = await get_db()
    rows = await db.execute("""
        SELECT confidence, source_url, source_tier, confidence_band,
               temporal_type, status, claim_type
        FROM beliefs WHERE valid_until IS NULL
    """)

    beliefs = []
    for row in await rows.fetchall():
        beliefs.append({
            "confidence": row[0], "source_url": row[1], "source_tier": row[2],
            "confidence_band": row[3], "temporal_type": row[4],
            "status": row[5], "claim_type": row[6],
        })
    await db.close()

    return compute_scorecard(beliefs)
