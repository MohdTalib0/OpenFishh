"""
Epistemic Scorecard — Measures the health of the knowledge base.

Metrics:
  1. Support Rate      — % of claims with traceable source URL
  2. Staleness Rate    — % of active claims past freshness SLA
  3. Source Diversity   — Distribution across source tiers
  4. Temporal Coverage  — Distribution of claim types
  5. Confidence Bands   — Distribution of confidence levels
"""

from datetime import datetime, timezone


def compute_scorecard(beliefs: list[dict]) -> dict:
    """
    Compute epistemic scorecard from a list of belief dicts.
    Works without a database — pure function on belief data.
    """
    total = len(beliefs)
    if total == 0:
        return {"grade": "N/A", "total": 0, "message": "No beliefs"}

    # Support rate
    with_source = sum(1 for b in beliefs if b.get("source_url"))
    support_rate = with_source / total

    # Source tiers
    tiers = {}
    for b in beliefs:
        tier = b.get("source_tier", "unknown")
        tiers[tier] = tiers.get(tier, 0) + 1

    credible_tiers = {"wire", "major_news", "research_peer_reviewed", "institutional", "specialist_trade"}
    credible = sum(tiers.get(t, 0) for t in credible_tiers)
    credible_pct = credible / total

    # Confidence bands
    bands = {}
    for b in beliefs:
        band = b.get("confidence_band", "speculative")
        bands[band] = bands.get(band, 0) + 1

    # Temporal types
    temporal = {}
    for b in beliefs:
        tt = b.get("temporal_type", "timeless")
        temporal[tt] = temporal.get(tt, 0) + 1

    # Grade
    score = 0
    if support_rate >= 0.9: score += 25
    elif support_rate >= 0.7: score += 15
    if credible_pct >= 0.3: score += 25
    elif credible_pct >= 0.15: score += 15
    if bands.get("well_supported", 0) > 0: score += 25
    if temporal.get("forecast", 0) > 0: score += 25

    if score >= 80: grade = "A"
    elif score >= 60: grade = "B"
    elif score >= 40: grade = "C"
    else: grade = "D"

    return {
        "grade": grade,
        "score": score,
        "total_beliefs": total,
        "support_rate": round(support_rate, 3),
        "credible_source_pct": round(credible_pct, 3),
        "source_tiers": tiers,
        "confidence_bands": bands,
        "temporal_types": temporal,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
