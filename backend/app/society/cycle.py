"""
Daily Cycle (streaming) — SSE version for the /api/cycle/run endpoint.

Wraps the CLI run_cycle logic with SSE event yielding.
"""

import json
import asyncio
import os
import uuid
import time

from app.db import get_db, init_db
from app.epistemics.claim_types import get_source_tier, classify_temporal_type, compute_confidence


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


async def run_cycle_streaming(beats_filter: list[str] | None = None):
    """Run daily cycle, yielding SSE events for each phase."""
    await init_db()
    t0 = time.time()

    db = await get_db()

    # Load beings
    if beats_filter:
        placeholders = ",".join(f"'{b}'" for b in beats_filter)
        rows = await db.execute(f"SELECT * FROM beings WHERE status='active' AND beat IN ({placeholders})")
    else:
        rows = await db.execute("SELECT * FROM beings WHERE status='active'")

    beings = await rows.fetchall()
    if not beings:
        yield _sse("error", {"message": "No active agents. Run spawn first."})
        await db.close()
        return

    beat_beings = {}
    for b in beings:
        beat_beings.setdefault(b["beat"], []).append(b)

    yield _sse("step", {"phase": "start", "message": f"{len(beings)} agents across {len(beat_beings)} beats"})

    # ── Phase 1: Read RSS ──
    yield _sse("step", {"phase": "read", "message": "Reading RSS feeds..."})

    from app.feeds import BEAT_FEEDS
    import httpx
    from bs4 import BeautifulSoup

    beat_articles = {}

    async def fetch_beat(beat):
        feeds = BEAT_FEEDS.get(beat, [])
        articles = []
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            for feed in feeds[:4]:
                try:
                    url = feed["url"]
                    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"} if feed.get("type") == "reddit" else {"User-Agent": "Mozilla/5.0"}
                    resp = await client.get(url, headers=headers)
                    if resp.status_code != 200:
                        continue

                    if feed.get("type") == "reddit":
                        data = resp.json()
                        for post in data.get("data", {}).get("children", [])[:5]:
                            p = post.get("data", {})
                            if p.get("stickied"):
                                continue
                            permalink = f"https://reddit.com{p.get('permalink', '')}"
                            selftext = p.get("selftext", "")[:2000]
                            title = p.get("title", "")
                            content = selftext if selftext else f"{title}. Score: {p.get('score', 0)}"
                            articles.append({"url": permalink, "title": title[:200], "content": content[:2000], "source": feed.get("name", "reddit")})
                    else:
                        soup = BeautifulSoup(resp.text, "xml")
                        for item in (soup.find_all("item") or soup.find_all("entry"))[:5]:
                            title_tag = item.find("title")
                            link_tag = item.find("link")
                            desc_tag = item.find("description") or item.find("summary") or item.find("content")
                            title = title_tag.get_text(strip=True) if title_tag else ""
                            link = (link_tag.get_text(strip=True) or link_tag.get("href", "")) if link_tag else ""
                            content = BeautifulSoup(desc_tag.get_text(), "html.parser").get_text(strip=True)[:2000] if desc_tag else ""
                            if title:
                                articles.append({"url": link or url, "title": title[:200], "content": content or title, "source": feed.get("name", "rss")})
                except Exception:
                    continue

        seen = set()
        unique = [a for a in articles if a["url"] not in seen and not seen.add(a["url"])]
        beat_articles[beat] = unique[:10]

    await asyncio.gather(*[fetch_beat(beat) for beat in beat_beings.keys()])
    total_articles = sum(len(a) for a in beat_articles.values())
    yield _sse("step", {"phase": "read", "message": f"Fetched {total_articles} articles from {len(beat_articles)} beats"})

    # ── Phase 2: Extract ──
    yield _sse("step", {"phase": "extract", "message": "Extracting beliefs..."})

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("LLM_API_KEY", ""), base_url=os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1"))
    model = os.getenv("LLM_MODEL", "openai/gpt-4.1-nano")

    ROLES = {"scout": "Hunts for NEW signals.", "researcher": "Seeks evidence.", "cartographer": "Maps connections.", "infiltrator": "Reads between the lines.", "tracker": "Spots trends.", "analyst": "Evaluates strategy.", "qualifier": "Assesses timing."}

    role_groups = {}
    for beat, group in beat_beings.items():
        articles = beat_articles.get(beat, [])
        if not articles:
            continue
        for being in group:
            key = f"{beat}::{being['role']}"
            if key not in role_groups:
                role_groups[key] = (articles, being["role"], beat, [])
            role_groups[key][3].append(being)

    sem = asyncio.Semaphore(5)
    group_results = {}
    done = [0]

    async def extract_group(key, articles, role, beat):
        try:
            async with sem:
                digest = "\n\n".join(f"[{i}] {a['title']}\n{a['content'][:600]}" for i, a in enumerate(articles[:5]))[:4000]
                resp = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": f"You are a {role} monitoring {beat.replace('_',' ')}. {ROLES.get(role,'')} Extract claims as JSON: {{\"articles\":[{{\"index\":0,\"beliefs\":[{{\"subject\":\"\",\"predicate\":\"\",\"object\":\"\",\"confidence\":0.0,\"stance\":\"positive|negative|uncertain\"}}]}}]}}. Max 2 beliefs per article."},
                        {"role": "user", "content": digest},
                    ],
                    max_tokens=1500, temperature=0.1,
                )
                content = resp.choices[0].message.content.strip()
                if "```" in content:
                    content = content.split("```")[1].split("```")[0]
                    if content.startswith("json"):
                        content = content[4:]
                group_results[key] = json.loads(content.strip())
        except Exception:
            pass
        done[0] += 1
        if done[0] % 10 == 0 or done[0] == len(role_groups):
            yield_msg = f"{done[0]}/{len(role_groups)} groups extracted"

    await asyncio.gather(*[extract_group(k, a, r, b) for k, (a, r, b, _) in role_groups.items()], return_exceptions=True)
    yield _sse("step", {"phase": "extract", "message": f"{len(group_results)}/{len(role_groups)} groups succeeded"})

    # ── Phase 3: Write to DB ──
    yield _sse("step", {"phase": "write", "message": "Writing beliefs to database..."})
    beliefs_written = 0

    for key, (articles, role, beat, group_beings) in role_groups.items():
        extraction = group_results.get(key)
        if not extraction:
            continue
        art_results = extraction.get("articles", []) if isinstance(extraction, dict) else extraction if isinstance(extraction, list) else []

        for being in group_beings:
            for i, article in enumerate(articles[:5]):
                art_data = next((a for a in art_results if a.get("index") == i), None)
                if not art_data and i < len(art_results):
                    art_data = art_results[i]
                if not art_data:
                    continue

                ep_id = str(uuid.uuid4())
                await db.execute("INSERT INTO episodes (id, being_id, source_url, raw_content, beat, source_name) VALUES (?,?,?,?,?,?)",
                    (ep_id, being["id"], article.get("url", ""), str(art_data.get("summary", ""))[:500], beat, article.get("source", "")))

                for bd in art_data.get("beliefs", []):
                    subj = str(bd.get("subject", "")).strip()
                    obj = str(bd.get("object", "")).strip()
                    pred = str(bd.get("predicate", "")).strip()
                    if not subj or not pred or not obj:
                        continue

                    stance = bd.get("stance", "positive")
                    if stance not in ("positive", "negative", "uncertain"):
                        stance = "positive"
                    confidence = max(0.0, min(1.0, float(bd.get("confidence", 0.5))))
                    article_url = article.get("url", "")

                    for name in [subj, obj]:
                        await db.execute("INSERT OR IGNORE INTO entities (id, canonical_name, mention_count) VALUES (?, ?, 1)", (str(uuid.uuid4()), name))
                        await db.execute("UPDATE entities SET mention_count = mention_count + 1 WHERE canonical_name = ?", (name,))

                    subj_row = await (await db.execute("SELECT id FROM entities WHERE canonical_name=?", (subj,))).fetchone()
                    obj_row = await (await db.execute("SELECT id FROM entities WHERE canonical_name=?", (obj,))).fetchone()
                    if not subj_row or not obj_row:
                        continue

                    tier, tier_score = get_source_tier(article_url)
                    temporal = classify_temporal_type(pred)
                    conf = compute_confidence(confidence, article_url, 0, 0, 0)

                    await db.execute(
                        "INSERT INTO beliefs (id, being_id, subject_entity_id, predicate, object_entity_id, confidence, source_episode_id, claim_type, temporal_type, source_tier, source_tier_score, confidence_band, status, stance, source_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (str(uuid.uuid4()), being["id"], subj_row["id"], pred, obj_row["id"], conf["composite"], ep_id, "observation", temporal, tier, tier_score, conf["band"], "observed", stance, article_url))
                    beliefs_written += 1

            await db.execute("UPDATE beings SET articles_read=articles_read+?, beliefs_formed=beliefs_formed+?, cycles_completed=cycles_completed+1, last_cycle_at=datetime('now') WHERE id=?",
                (len(articles), beliefs_written, being["id"]))

    await db.commit()
    yield _sse("step", {"phase": "write", "message": f"{beliefs_written} beliefs written"})

    # ── Phase 4: Corroborate ──
    yield _sse("step", {"phase": "corroborate", "message": "Corroborating beliefs..."})
    corr = await db.execute("""
        SELECT a.id, b.id FROM beliefs a JOIN beliefs b
        ON a.subject_entity_id = b.subject_entity_id AND a.object_entity_id = b.object_entity_id
        AND a.predicate = b.predicate AND a.being_id < b.being_id
        JOIN beings ba ON ba.id = a.being_id JOIN beings bb ON bb.id = b.being_id
        WHERE ba.beat = bb.beat AND a.valid_until IS NULL AND b.valid_until IS NULL
        AND a.created_at > datetime('now', '-1 day')
    """)
    pairs = await corr.fetchall()
    for a_id, b_id in pairs:
        await db.execute("UPDATE beliefs SET confidence=MIN(1.0, confidence+0.05), status='supported', claim_type=CASE WHEN claim_type='observation' THEN 'claim' ELSE claim_type END WHERE id=?", (a_id,))
        await db.execute("UPDATE beliefs SET confidence=MIN(1.0, confidence+0.05), status='supported', claim_type=CASE WHEN claim_type='observation' THEN 'claim' ELSE claim_type END WHERE id=?", (b_id,))
    await db.commit()
    yield _sse("step", {"phase": "corroborate", "message": f"{len(pairs)} corroboration pairs"})

    # ── Phase 5: Consolidate ──
    yield _sse("step", {"phase": "consolidate", "message": "Night consolidation..."})
    await db.execute("UPDATE beliefs SET confidence=confidence*0.9 WHERE valid_until IS NULL AND created_at < datetime('now', '-30 days') AND confidence > 0.1")
    await db.execute("UPDATE beliefs SET valid_until=datetime('now'), status='invalidated' WHERE valid_until IS NULL AND confidence < 0.1")
    await db.commit()
    await db.close()

    elapsed = time.time() - t0
    yield _sse("complete", {
        "agents": len(beings), "articles": total_articles,
        "beliefs": beliefs_written, "corroborations": len(pairs),
        "duration": round(elapsed, 1),
    })
