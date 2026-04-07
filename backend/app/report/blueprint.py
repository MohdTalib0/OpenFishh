"""
Blueprint Report Generator — Produces auditable intelligence reports.

Pipeline:
  1. Search the web for relevant content
  2. Extract structured beliefs with epistemic metadata
  3. Generate report sections using LLM
  4. Assemble with trust layer (evidence footnotes, known unknowns, falsification)
"""

import asyncio
import json
import os
from datetime import datetime, timezone

from openai import AsyncOpenAI

from app.agents.searcher import web_search, fetch_article
from app.agents.extractor import extract_beliefs, get_client, LLM_MODEL
from app.epistemics.claim_types import (
    get_source_tier,
    CONFIDENCE_BANDS,
)


async def generate_report(question: str):
    """
    Generate a Blueprint report. Yields SSE events for streaming.

    Events:
      step     — progress updates
      section  — report section completed
      result   — final report with trust summary
    """
    client = get_client()
    start_time = datetime.now(timezone.utc)

    # ── Step 1: SEARCH ──
    yield _sse("step", {"phase": "search", "message": f"Searching the web for: {question}"})

    search_results = await web_search(question, max_results=8)
    yield _sse("step", {"phase": "search", "message": f"Found {len(search_results)} results"})

    # Fetch full articles for top results
    articles = []
    fetch_tasks = [fetch_article(r["url"]) for r in search_results[:5] if r.get("url")]
    fetched = await asyncio.gather(*fetch_tasks, return_exceptions=True)
    for result in fetched:
        if isinstance(result, dict) and result.get("content"):
            articles.append(result)

    # Combine search snippets with fetched articles
    all_sources = []
    seen_urls = set()
    for a in articles:
        if a["url"] not in seen_urls:
            all_sources.append(a)
            seen_urls.add(a["url"])
    for r in search_results:
        if r.get("url") and r["url"] not in seen_urls:
            all_sources.append(r)
            seen_urls.add(r["url"])

    yield _sse("step", {"phase": "search", "message": f"Fetched {len(articles)} articles"})

    # ── Step 2: EXTRACT ──
    yield _sse("step", {"phase": "extract", "message": "Extracting claims with epistemic analysis..."})

    beliefs = await extract_beliefs(all_sources, question)
    summary = ""
    clean_beliefs = []
    for b in beliefs:
        if b.get("_summary"):
            summary = b["_summary"]
        else:
            clean_beliefs.append(b)

    yield _sse("step", {
        "phase": "extract",
        "message": f"Extracted {len(clean_beliefs)} claims from {len(all_sources)} sources",
        "beliefs": len(clean_beliefs),
    })

    # ── Step 3: SYNTHESIZE ──
    yield _sse("step", {"phase": "synthesize", "message": "Writing intelligence report..."})

    # Build context for report
    beliefs_context = "\n".join(
        f"- [{b.get('confidence_band_label', '?')}] {b['subject']} {b['predicate']} {b['object']} "
        f"(conf={b.get('confidence', 0):.2f}, tier={b.get('source_tier', '?')})"
        for b in clean_beliefs
    )
    sources_context = "\n".join(
        f"- {a.get('title', '')[:80]} ({a.get('url', '')})"
        for a in all_sources[:10]
    )

    # Generate report
    try:
        report_resp = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": """You are a senior intelligence analyst writing a dossier.

Write a structured intelligence report with:
1. Executive Summary (2 paragraphs: headline finding + key risk/opportunity)
2. Three analysis sections (3-4 paragraphs each, dense analytical prose)
3. Use specific facts and cite sources where possible

Write in a professional, analytical tone. No bullet points in sections. End with a predictive statement."""},
                {"role": "user", "content": f"""INVESTIGATION: {question}

EXTRACTED CLAIMS:
{beliefs_context}

SOURCES:
{sources_context}

{f'INITIAL SUMMARY: {summary}' if summary else ''}

Write the intelligence report:"""},
            ],
            max_tokens=3000,
            temperature=0.3,
        )
        report_text = report_resp.choices[0].message.content.strip()
    except Exception as e:
        report_text = f"# Report Generation Failed\n\nError: {str(e)[:200]}\n\nPlease check your LLM API configuration."

    yield _sse("step", {"phase": "synthesize", "message": "Report written"})

    # ── Step 4: FALSIFICATION ──
    yield _sse("step", {"phase": "falsification", "message": "Generating falsification criteria..."})

    try:
        falsification_resp = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": """You are a red-team analyst. Given key claims, identify specific events that would INVALIDATE each.
Be specific: name entities, events, dates. Not generic statements.
Format: - **[Claim]**: [What would prove this wrong]
Write 3-5 bullet points."""},
                {"role": "user", "content": f"INVESTIGATION: {question}\n\nKEY CLAIMS:\n{beliefs_context}"},
            ],
            max_tokens=800,
            temperature=0.3,
        )
        falsification_text = falsification_resp.choices[0].message.content.strip()
    except Exception:
        falsification_text = ""

    # ── Step 5: ASSEMBLE ──
    duration = (datetime.now(timezone.utc) - start_time).total_seconds()

    # Compute trust summary
    band_counts = {}
    tier_counts = {}
    forecasts = []
    for b in clean_beliefs:
        band = b.get("confidence_band", "speculative")
        band_counts[band] = band_counts.get(band, 0) + 1
        tier = b.get("source_tier", "unknown")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
        if b.get("temporal_type") == "forecast":
            forecasts.append(b)

    # Known unknowns
    unknowns = []
    social_count = tier_counts.get("social", 0) + tier_counts.get("unknown", 0)
    if social_count > len(clean_beliefs) * 0.5:
        unknowns.append(f"Relies heavily on social/unverified sources ({social_count} of {len(clean_beliefs)})")
    if len(forecasts) > 0:
        unknowns.append(f"{len(forecasts)} claims are predictions, not verified facts")
    if len(clean_beliefs) < 3:
        unknowns.append("Limited evidence found — claims should be independently verified")

    # Assemble full report
    full_report = f"# Intelligence Report: {question}\n\n"
    full_report += f"*{len(clean_beliefs)} claims from {len(all_sources)} sources. Generated in {duration:.0f}s.*\n\n"
    full_report += report_text + "\n\n"

    # Evidence section
    full_report += "---\n\n## What Would Change Our Mind\n\n"
    if falsification_text:
        full_report += falsification_text + "\n\n"

    if unknowns:
        full_report += "---\n\n## Known Unknowns\n\n"
        for u in unknowns:
            full_report += f"- {u}\n"
        full_report += "\n"

    full_report += "---\n\n## Evidence & Sources\n\n"
    full_report += "### Claim Quality\n"
    for band in ["well_supported", "supported", "tentative", "speculative"]:
        cnt = band_counts.get(band, 0)
        if cnt > 0:
            full_report += f"- **{band.replace('_', ' ').title()}**: {cnt} claims\n"

    full_report += "\n### Source Tiers\n"
    for tier, cnt in sorted(tier_counts.items(), key=lambda x: -x[1]):
        full_report += f"- {tier.replace('_', ' ').title()}: {cnt}\n"

    full_report += "\n### Cited Sources\n"
    for a in all_sources[:10]:
        url = a.get("url", "")
        if url:
            domain = url.split("//")[-1].split("/")[0].replace("www.", "")
            tier, _ = get_source_tier(url)
            full_report += f"- [{domain}]({url}) ({tier.replace('_', ' ').title()})\n"

    # Footnotes
    if clean_beliefs:
        full_report += "\n### Evidence Footnotes\n"
        for i, b in enumerate(clean_beliefs[:10], 1):
            band_label = CONFIDENCE_BANDS.get(b.get("confidence_band", ""), {}).get("label", "?")
            tier_label = b.get("source_tier", "unknown").replace("_", " ").title()
            full_report += f"[{i}] *{b['subject']} {b['predicate']} {b['object']}* — **{band_label}** | {tier_label}"
            if b.get("source_url"):
                full_report += f" | [source]({b['source_url']})"
            full_report += "\n\n"

    trust_summary = {
        "claims_count": len(clean_beliefs),
        "sources_count": len(all_sources),
        "band_counts": band_counts,
        "tier_counts": tier_counts,
        "forecast_count": len(forecasts),
        "known_unknowns": unknowns,
        "duration_seconds": round(duration, 1),
    }

    yield _sse("result", {
        "report": full_report,
        "trust_summary": trust_summary,
        "beliefs": [
            {k: v for k, v in b.items() if k != "known_unknowns"}
            for b in clean_beliefs
        ],
    })


def _sse(event: str, data: dict) -> str:
    """Format a Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"
