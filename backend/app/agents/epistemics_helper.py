"""
Epistemics Helper — Enriches raw beliefs with epistemic metadata.

Bridges the extraction output to the epistemics framework.
"""

from app.epistemics.claim_types import (
    get_source_tier,
    classify_temporal_type,
    compute_confidence,
    assess_known_unknowns,
)


def enrich_belief(belief: dict) -> dict:
    """
    Take a raw extracted belief and add epistemic metadata:
    source tier, temporal type, confidence band, known unknowns.
    """
    source_url = belief.get("source_url", "")
    predicate = belief.get("predicate", "")
    raw_confidence = belief.get("confidence", 0.5)

    # Source tier
    tier, tier_score = get_source_tier(source_url)

    # Temporal type
    temporal = classify_temporal_type(predicate)

    # Confidence decomposition
    conf = compute_confidence(
        llm_confidence=raw_confidence,
        source_url=source_url,
        corroboration_count=0,
        independent_chains=0,
        age_days=0,
    )

    # Known unknowns
    unknowns = assess_known_unknowns(
        source_url=source_url,
        source_tier=tier,
        corroboration_count=0,
        independent_chains=0,
        age_days=0,
        temporal_type=temporal,
    )

    return {
        **belief,
        "source_tier": tier,
        "source_tier_score": tier_score,
        "temporal_type": temporal,
        "confidence": conf["composite"],
        "confidence_band": conf["band"],
        "confidence_band_label": conf["band_label"],
        "evidence_strength": conf["evidence_strength"],
        "known_unknowns": unknowns,
        "claim_type": "observation",
    }
