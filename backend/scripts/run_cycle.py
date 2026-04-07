"""
Run Daily Cycle — The heartbeat of the society.

Each cycle:
  1. MORNING  — Agents read their beat's RSS feeds
  2. MIDDAY   — LLM extracts beliefs with epistemic metadata
  3. EVENING  — Corroborate matching beliefs across agents
  4. NIGHT    — Decay old beliefs, promote corroborated ones

Usage:
  python -m scripts.run_cycle                    # All agents
  python -m scripts.run_cycle --beats ai_startups,markets  # Specific beats
"""

import argparse
import asyncio
import json
import os
import sys
import time
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import get_db, init_db
from app.epistemics.claim_types import (
    get_source_tier, classify_temporal_type, compute_confidence,
)

# Import feed config from the main app
BEAT_FEEDS = None


def _load_feeds():
    """Load RSS feed configurations."""
    global BEAT_FEEDS
    if BEAT_FEEDS is not None:
        return

    # Import feed definitions
    try:
        from app.feeds import BEAT_FEEDS as feeds
        BEAT_FEEDS = feeds
    except ImportError:
        BEAT_FEEDS = {}


async def run_cycle(beats_filter: list[str] | None = None):
    await init_db()
    _load_feeds()

    db = await get_db()
    t0 = time.time()

    # Load active beings
    if beats_filter:
        placeholders = ",".join(f"'{b}'" for b in beats_filter)
        rows = await db.execute(
            f"SELECT * FROM beings WHERE status='active' AND beat IN ({placeholders})"
        )
    else:
        rows = await db.execute("SELECT * FROM beings WHERE status='active'")

    beings = await rows.fetchall()
    if not beings:
        print("No active beings. Run: python -m scripts.spawn_society")
        await db.close()
        return

    # Group by beat
    beat_beings: dict[str, list] = {}
    for b in beings:
        beat_beings.setdefault(b["beat"], []).append(b)

    print(f"Daily Cycle — {len(beings)} agents across {len(beat_beings)} beats")
    print()

    # ═══ Phase 1: MORNING — Read RSS ═══
    print("Phase 1: Reading RSS feeds...")
    import httpx
    from bs4 import BeautifulSoup

    beat_articles: dict[str, list[dict]] = {}

    async def fetch_beat_feeds(beat: str):
        feeds = BEAT_FEEDS.get(beat, [])
        articles = []
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            for feed in feeds[:4]:  # Max 4 feeds per beat
                try:
                    url = feed["url"]
                    feed_type = feed.get("type", "rss")

                    if feed_type == "reddit":
                        headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
                    else:
                        headers = {"User-Agent": "Mozilla/5.0"}

                    resp = await client.get(url, headers=headers)
                    if resp.status_code != 200:
                        continue

                    if feed_type == "reddit":
                        data = resp.json()
                        posts = data.get("data", {}).get("children", [])
                        for post in posts[:5]:
                            p = post.get("data", {})
                            if p.get("stickied"):
                                continue
                            permalink = f"https://reddit.com{p.get('permalink', '')}"
                            selftext = p.get("selftext", "")[:2000]
                            title = p.get("title", "")
                            content = selftext if selftext else f"{title}. Score: {p.get('score', 0)}"
                            articles.append({
                                "url": permalink,
                                "title": title[:200],
                                "content": content[:2000],
                                "source": feed.get("name", "reddit"),
                            })
                    else:
                        soup = BeautifulSoup(resp.text, "xml")
                        items = soup.find_all("item") or soup.find_all("entry")
                        for item in items[:5]:
                            title_tag = item.find("title")
                            link_tag = item.find("link")
                            desc_tag = item.find("description") or item.find("summary") or item.find("content")
                            title = title_tag.get_text(strip=True) if title_tag else ""
                            link = (link_tag.get_text(strip=True) or link_tag.get("href", "")) if link_tag else ""
                            content = ""
                            if desc_tag:
                                desc_soup = BeautifulSoup(desc_tag.get_text(), "html.parser")
                                content = desc_soup.get_text(strip=True)[:2000]
                            if title and (link or content):
                                articles.append({
                                    "url": link or url,
                                    "title": title[:200],
                                    "content": content[:2000] or title,
                                    "source": feed.get("name", "rss"),
                                })
                except Exception:
                    continue

        # Dedup by URL
        seen = set()
        unique = []
        for a in articles:
            if a["url"] not in seen:
                seen.add(a["url"])
                unique.append(a)

        beat_articles[beat] = unique[:10]
        print(f"  {beat:25s} {len(unique[:10])} articles")

    await asyncio.gather(*[fetch_beat_feeds(beat) for beat in beat_beings.keys()])
    total_articles = sum(len(a) for a in beat_articles.values())
    print(f"  Total: {total_articles} articles")
    print()

    # ═══ Phase 2: MIDDAY — Extract beliefs ═══
    print("Phase 2: Extracting beliefs...")

    from openai import AsyncOpenAI

    api_key = os.getenv("LLM_API_KEY", "")
    if not api_key:
        print("Error: LLM_API_KEY not set. Add it to .env")
        await db.close()
        return

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1"),
    )
    model = os.getenv("LLM_MODEL", "openai/gpt-4.1-nano")

    EXTRACTION_PROMPT = """You are {name}, a {role} monitoring {beat}.
Personality: {personality}

Extract claims from these articles. Return ONLY valid JSON:
{{
  "articles": [
    {{
      "index": 0,
      "summary": "<1-2 sentence summary>",
      "beliefs": [
        {{
          "subject": "<Entity A>",
          "predicate": "<relationship>",
          "object": "<Entity B>",
          "confidence": <float 0.0-1.0>,
          "stance": "<positive|negative|uncertain>"
        }}
      ]
    }}
  ]
}}

Rules:
- Max 2 beliefs per article
- Subject and object must be named entities
- Stance: positive if constructive, negative if destructive/threatening, uncertain if speculative"""

    ROLE_PERSONALITIES = {
        "scout": "Hunts for NEW signals others miss.",
        "researcher": "Seeks evidence and data. Won't speculate.",
        "cartographer": "Maps connections between entities.",
        "infiltrator": "Reads between the lines. Finds hidden motivations.",
        "tracker": "Spots trends accelerating or dying.",
        "analyst": "Evaluates strategy and competitive positioning.",
        "qualifier": "Assesses timing, readiness, and actionability.",
    }

    # Group by (beat, role) for deduplication
    role_groups: dict[str, tuple] = {}
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
    group_results: dict[str, dict] = {}
    done = [0]

    async def extract_group(key, articles, role, beat):
        try:
            async with sem:
                digest = "\n\n".join(
                    f"[Article {i}] {a['title']}\nSource: {a.get('source', '?')}\n{a['content'][:600]}"
                    for i, a in enumerate(articles[:5])
                )[:4000]

                prompt = EXTRACTION_PROMPT.format(
                    name=role.capitalize(), role=role, beat=beat.replace("_", " "),
                    personality=ROLE_PERSONALITIES.get(role, "Analytical thinker."),
                )

                resp = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": f"Today's reading:\n\n{digest}"},
                    ],
                    max_tokens=1500,
                    temperature=0.1,
                )

                content = resp.choices[0].message.content.strip()
                if "```" in content:
                    content = content.split("```")[1].split("```")[0]
                    if content.startswith("json"):
                        content = content[4:]
                group_results[key] = json.loads(content.strip())
        except Exception as e:
            print(f"    Extraction failed for {key}: {str(e)[:60]}")

        done[0] += 1
        if done[0] % 10 == 0 or done[0] == len(role_groups):
            print(f"  {done[0]}/{len(role_groups)} groups extracted")

    await asyncio.gather(
        *[extract_group(k, arts, role, beat) for k, (arts, role, beat, _) in role_groups.items()],
        return_exceptions=True,
    )
    print(f"  {len(group_results)}/{len(role_groups)} groups succeeded")
    print()

    # ═══ Phase 2.5: Write beliefs to DB ═══
    print("Phase 3: Writing beliefs to database...")
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

                # Write episode
                ep_id = str(uuid.uuid4())
                await db.execute(
                    "INSERT INTO episodes (id, being_id, source_url, raw_content, beat, source_name) VALUES (?,?,?,?,?,?)",
                    (ep_id, being["id"], article.get("url", ""), str(art_data.get("summary", ""))[:500], beat, article.get("source", "")),
                )

                for belief_data in art_data.get("beliefs", []):
                    subj = str(belief_data.get("subject", "")).strip()
                    obj = str(belief_data.get("object", "")).strip()
                    pred = str(belief_data.get("predicate", "")).strip()
                    if not subj or not pred or not obj:
                        continue

                    confidence = max(0.0, min(1.0, float(belief_data.get("confidence", 0.5))))
                    stance = belief_data.get("stance", "positive")
                    if stance not in ("positive", "negative", "uncertain"):
                        stance = "positive"
                    article_url = article.get("url", "")

                    # Resolve entities
                    for name in [subj, obj]:
                        await db.execute(
                            "INSERT OR IGNORE INTO entities (id, canonical_name, mention_count) VALUES (?, ?, 1)",
                            (str(uuid.uuid4()), name),
                        )
                        await db.execute(
                            "UPDATE entities SET mention_count = mention_count + 1 WHERE canonical_name = ?",
                            (name,),
                        )

                    subj_row = await (await db.execute("SELECT id FROM entities WHERE canonical_name=?", (subj,))).fetchone()
                    obj_row = await (await db.execute("SELECT id FROM entities WHERE canonical_name=?", (obj,))).fetchone()
                    if not subj_row or not obj_row:
                        continue

                    # Epistemic metadata
                    tier, tier_score = get_source_tier(article_url)
                    temporal = classify_temporal_type(pred)
                    conf = compute_confidence(confidence, article_url, 0, 0, 0)

                    await db.execute(
                        """INSERT INTO beliefs (id, being_id, subject_entity_id, predicate, object_entity_id,
                           confidence, source_episode_id, claim_type, temporal_type, source_tier, source_tier_score,
                           confidence_band, status, stance, source_url)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (str(uuid.uuid4()), being["id"], subj_row["id"], pred, obj_row["id"],
                         conf["composite"], ep_id, "observation", temporal, tier, tier_score,
                         conf["band"], "observed", stance, article_url),
                    )
                    beliefs_written += 1

            # Update being stats
            await db.execute(
                "UPDATE beings SET articles_read=articles_read+?, beliefs_formed=beliefs_formed+?, cycles_completed=cycles_completed+1, last_cycle_at=datetime('now') WHERE id=?",
                (len(articles), beliefs_written, being["id"]),
            )

    await db.commit()
    print(f"  {beliefs_written} beliefs written")
    print()

    # ═══ Phase 3: EVENING — Corroborate ═══
    print("Phase 4: Corroborating beliefs...")
    corr_result = await db.execute("""
        SELECT a.id, b.id FROM beliefs a
        JOIN beliefs b ON a.subject_entity_id = b.subject_entity_id
            AND a.object_entity_id = b.object_entity_id
            AND a.predicate = b.predicate
            AND a.being_id < b.being_id
        JOIN beings ba ON ba.id = a.being_id
        JOIN beings bb ON bb.id = b.being_id
        WHERE ba.beat = bb.beat
            AND a.valid_until IS NULL AND b.valid_until IS NULL
            AND a.created_at > datetime('now', '-1 day')
    """)
    corr_pairs = await corr_result.fetchall()

    if corr_pairs:
        corr_ids = set()
        for a_id, b_id in corr_pairs:
            corr_ids.add(a_id)
            corr_ids.add(b_id)

        for cid in corr_ids:
            await db.execute(
                "UPDATE beliefs SET confidence=MIN(1.0, confidence+0.05), status='supported', claim_type=CASE WHEN claim_type='observation' THEN 'claim' ELSE claim_type END WHERE id=?",
                (cid,),
            )
        await db.commit()

    print(f"  {len(corr_pairs)} corroboration pairs found")
    print()

    # ═══ Phase 4: NIGHT — Consolidate ═══
    print("Phase 5: Night consolidation...")
    await db.execute("""
        UPDATE beliefs SET confidence=confidence*0.9
        WHERE valid_until IS NULL
        AND created_at < datetime('now', '-30 days') AND confidence > 0.1
    """)
    await db.execute("""
        UPDATE beliefs SET valid_until=datetime('now'), status='invalidated'
        WHERE valid_until IS NULL AND confidence < 0.1
    """)
    await db.commit()

    await db.close()

    elapsed = time.time() - t0
    print(f"Cycle complete in {elapsed:.0f}s")
    print(f"  Agents: {len(beings)}")
    print(f"  Articles: {total_articles}")
    print(f"  Beliefs: {beliefs_written}")
    print(f"  Corroborations: {len(corr_pairs)}")


def main():
    parser = argparse.ArgumentParser(description="Run the daily cycle")
    parser.add_argument("--beats", type=str, default=None, help="Comma-separated beats")
    args = parser.parse_args()

    beats_filter = [b.strip() for b in args.beats.split(",") if b.strip()] if args.beats else None
    asyncio.run(run_cycle(beats_filter))


if __name__ == "__main__":
    main()
