"""
Society API — Browse agents, beliefs, entities.

GET /api/stats           → Live society stats
GET /api/beliefs         → Top beliefs with epistemic metadata
GET /api/beliefs/contested → Contested belief clusters
GET /api/beings          → Agent list
GET /api/entities        → Entity list
"""

from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()


@router.get("/stats")
async def stats():
    """Live stats about the local society."""
    try:
        from app.db import get_stats
        return await get_stats()
    except Exception:
        return {"beings": 0, "beliefs": 0, "entities": 0, "episodes": 0, "beats": 0}


@router.get("/beliefs")
async def list_beliefs(
    limit: int = Query(100, le=1000),
    beat: Optional[str] = Query(None),
    min_confidence: float = Query(0.0),
):
    """Top beliefs with epistemic metadata."""
    from app.db import get_db

    db = await get_db()
    where = "WHERE b.valid_until IS NULL AND b.confidence >= ?"
    params = [min_confidence]

    if beat:
        where += " AND bg.beat = ?"
        params.append(beat)

    rows = await db.execute(f"""
        SELECT b.id, bg.name, bg.role, bg.beat,
               subj.canonical_name, b.predicate, COALESCE(obj.canonical_name, ''),
               b.confidence, b.claim_type, b.temporal_type, b.source_tier,
               b.confidence_band, b.status, b.stance, b.source_url,
               b.independence_count, b.created_at
        FROM beliefs b
        JOIN beings bg ON b.being_id = bg.id
        JOIN entities subj ON b.subject_entity_id = subj.id
        LEFT JOIN entities obj ON b.object_entity_id = obj.id
        {where}
        ORDER BY b.confidence DESC
        LIMIT ?
    """, params + [limit])

    beliefs = []
    for row in await rows.fetchall():
        beliefs.append({
            "id": row[0], "being": row[1], "role": row[2], "beat": row[3],
            "subject": row[4], "predicate": row[5], "object": row[6],
            "confidence": round(row[7], 3), "claim_type": row[8],
            "temporal_type": row[9], "source_tier": row[10],
            "confidence_band": row[11], "status": row[12],
            "stance": row[13], "source_url": row[14],
            "independence": row[15], "created_at": row[16],
        })

    await db.close()

    total_row = None
    db2 = await get_db()
    total_row = await (await db2.execute("SELECT COUNT(*) FROM beliefs WHERE valid_until IS NULL")).fetchone()
    await db2.close()

    return {"beliefs": beliefs, "total": total_row[0] if total_row else 0}


@router.get("/beliefs/contested")
async def contested_beliefs(limit: int = Query(20, le=50)):
    """Contested belief clusters — where agents disagree."""
    from app.db import get_db
    from app.epistemics.contradictions import cluster_contested_beliefs

    db = await get_db()
    rows = await db.execute("""
        SELECT bg.name, bg.role, bg.beat,
               subj.canonical_name, b.predicate, COALESCE(obj.canonical_name, ''),
               b.confidence, b.source_tier, b.confidence_band, b.status,
               b.independence_count, b.stance, b.claim_type,
               b.subject_entity_id, b.object_entity_id
        FROM beliefs b
        JOIN beings bg ON b.being_id = bg.id
        JOIN entities subj ON b.subject_entity_id = subj.id
        LEFT JOIN entities obj ON b.object_entity_id = obj.id
        WHERE b.valid_until IS NULL AND b.confidence >= 0.3
        ORDER BY b.confidence DESC
        LIMIT 2000
    """)

    belief_rows = []
    for row in await rows.fetchall():
        belief_rows.append({
            "being": row[0], "role": row[1], "beat": row[2],
            "subject": row[3], "predicate": row[4], "object": row[5],
            "confidence": row[6], "source_tier": row[7],
            "confidence_band": row[8], "status": row[9],
            "independence": row[10], "corroborated_by": [],
            "predicate_stance": row[11], "claim_type": row[12],
            "canonical_subject_entity_id": str(row[13]) if row[13] else None,
            "canonical_object_entity_id": str(row[14]) if row[14] else None,
            "canonical_predicate": None, "predicate_family": None,
        })
    await db.close()

    clusters = cluster_contested_beliefs(belief_rows, limit=limit)

    return {
        "contested": [{
            "subject": c["subject"],
            "object": c["object"],
            "disagreement_type": c["disagreement_type"],
            "total_beings": c["total_beings"],
            "dispute_score": c["dispute_score"],
            "sides": [{
                "predicate": s["predicate"],
                "stance": s["stance"],
                "beings": s["beings"],
                "avg_confidence": s["avg_confidence"],
                "evidence_score": s["evidence_score"],
            } for s in c["sides"][:3]],
        } for c in clusters],
        "total": len(clusters),
    }


@router.get("/beings")
async def list_beings(
    limit: int = Query(100, le=1000),
    beat: Optional[str] = Query(None),
):
    """List agents with stats."""
    from app.db import get_db

    db = await get_db()
    where = "WHERE status = 'active'"
    params = []
    if beat:
        where += " AND beat = ?"
        params.append(beat)

    rows = await db.execute(f"""
        SELECT id, name, role, beat, backstory, boldness, creativity,
               patience, empathy, energy, mood, articles_read,
               beliefs_formed, cycles_completed, last_cycle_at
        FROM beings
        {where}
        ORDER BY beliefs_formed DESC
        LIMIT ?
    """, params + [limit])

    beings = []
    for row in await rows.fetchall():
        beings.append({
            "id": row[0], "name": row[1], "role": row[2], "beat": row[3],
            "backstory": row[4], "boldness": row[5], "creativity": row[6],
            "patience": row[7], "empathy": row[8], "energy": row[9],
            "mood": row[10], "articles_read": row[11],
            "beliefs_formed": row[12], "cycles_completed": row[13],
            "last_cycle_at": row[14],
        })
    await db.close()

    return {"beings": beings, "total": len(beings)}


@router.get("/entities")
async def list_entities(
    limit: int = Query(100, le=1000),
    search: Optional[str] = Query(None),
):
    """List entities ranked by mention count."""
    from app.db import get_db

    db = await get_db()
    if search:
        rows = await db.execute(
            "SELECT id, canonical_name, mention_count FROM entities WHERE canonical_name LIKE ? ORDER BY mention_count DESC LIMIT ?",
            (f"%{search}%", limit),
        )
    else:
        rows = await db.execute(
            "SELECT id, canonical_name, mention_count FROM entities ORDER BY mention_count DESC LIMIT ?",
            (limit,),
        )

    entities = []
    for row in await rows.fetchall():
        entities.append({
            "id": row[0], "name": row[1], "mention_count": row[2],
        })
    await db.close()

    return {"entities": entities, "total": len(entities)}
