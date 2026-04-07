from __future__ import annotations

from typing import Any


SOURCE_TIER_SCORES: dict[str, float] = {
    "wire": 0.9,
    "major_news": 0.82,
    "major": 0.8,
    "research_peer_reviewed": 0.85,
    "research_preprint": 0.65,
    "institutional": 0.8,
    "specialist_trade": 0.72,
    "industry": 0.7,
    "reference": 0.55,
    "aggregator": 0.4,
    "social": 0.2,
    "blog": 0.25,
    "unknown": 0.3,
}

INVERSE_PREDICATE_RULES: list[tuple[str, str]] = [
    (" acquired by", "acquires"),
    (" owned by", "owns"),
    (" funded by", "funds"),
    (" backed by", "backs"),
    (" invested in by", "invests in"),
]

FAMILY_RULES: list[tuple[tuple[str, ...], str, str]] = [
    (("acquires", "acquired", "buys", "bought", "purchases", "purchased"), "acquisition", "acquires"),
    (("partners with", "partnered with", "collaborates with", "works with", "allies with"), "partnership", "partners with"),
    (("competes with", "rival", "rivals", "challenges"), "competition", "competes with"),
    (("invests in", "backs", "funds"), "funding", "invests in"),
    (("launches", "launched", "ships", "released", "unveils", "rolls out"), "launch", "launches"),
    (("expands to", "enters", "moves into"), "expansion", "expands to"),
    (("merges with", "merged with"), "merger", "merges with"),
    (("wins", "won", "loses", "lost", "beats"), "competitive_outcome", "wins against"),
    (("growing", "grows", "surging", "rising", "increasing", "expanding", "accelerating",
      "declining", "shrinking", "falling", "decreasing", "contracting", "slowing"), "trend", "is trending in"),
    (("threatens", "threatens to", "risks", "endangers", "undermines"), "threat", "threatens"),
    (("supports", "supported", "endorses", "backs", "enables"), "support", "supports"),
    (("replaces", "replaced", "displaces", "displaced", "supersedes"), "replacement", "replaces"),
    (("adopts", "adopted", "uses", "using", "implements", "leverages"), "adoption", "adopts"),
]

NEGATIVE_MARKERS = (
    " not ",
    " no longer ",
    " never ",
    " fails to",
    " failed to",
    " cancel",
    " delay",
    " block",
    " reject",
    " deny",
    " withdraw",
    " exits",
    " shuts down",
    " decline",
    " declining",
    " shrinking",
    " falling",
    " decreasing",
    " contracting",
    " slowing",
    " loses",
    " losing",
    " lost",
    " threatening",
    " threatened",
    " refused",
    " refusing",
    " suffered",
    " suffering",
    " exiting",
    " exit ",
    " restrict",
    " limiting",
    " limits ",
    " destabiliz",
    " disrupt",
    " erode",
    " weaken",
    " worsen",
    " harm",
    " hurt",
    " crash",
    " damag",
    " undermin",
    " rescind",
    " displaces",
    " threatens",
    " undermines",
    " falls short",
    " misses",
)


def analyze_predicate(subject: str, predicate: str, object_name: str) -> dict[str, str]:
    raw_predicate = f" {predicate.strip().lower()} "
    normalized_subject = (subject or "").strip()
    normalized_object = (object_name or "").strip()
    working = raw_predicate

    for needle, canonical in INVERSE_PREDICATE_RULES:
        if needle in working:
            normalized_subject, normalized_object = normalized_object or normalized_subject, normalized_subject
            working = f" {canonical} "
            break

    family = working.strip().replace(" ", "_")
    canonical_predicate = working.strip()
    for needles, family_name, canonical in FAMILY_RULES:
        if any(f" {needle} " in working for needle in needles):
            family = family_name
            canonical_predicate = canonical
            break

    stance = "positive"
    if any(marker in working for marker in NEGATIVE_MARKERS):
        stance = "negative"
    elif any(token in working for token in (" may ", " could ", " might ", " possible ", " considering ")):
        stance = "uncertain"

    return {
        "family": family,
        "canonical_predicate": canonical_predicate,
        "stance": stance,
        "normalized_subject": normalized_subject,
        "normalized_object": normalized_object,
    }


def compute_belief_semantic_fields(
    *,
    subject_entity_id: Any,
    object_entity_id: Any,
    subject_name: str,
    predicate: str,
    object_name: str,
) -> dict[str, Any]:
    analysis = analyze_predicate(subject_name, predicate, object_name)
    canonical_subject_entity_id = subject_entity_id
    canonical_object_entity_id = object_entity_id

    if analysis["normalized_subject"].strip().lower() == (object_name or "").strip().lower() and object_entity_id:
        canonical_subject_entity_id = object_entity_id
        canonical_object_entity_id = subject_entity_id

    return {
        "canonical_subject_entity_id": canonical_subject_entity_id,
        "canonical_object_entity_id": canonical_object_entity_id,
        "canonical_predicate": analysis["canonical_predicate"],
        "predicate_family": analysis["family"],
        "predicate_stance": analysis["stance"],
        "normalized_subject": analysis["normalized_subject"],
        "normalized_object": analysis["normalized_object"],
    }


def get_belief_semantics(belief: dict[str, Any]) -> dict[str, Any]:
    if belief.get("predicate_family") and belief.get("canonical_predicate"):
        return {
            "family": str(belief.get("predicate_family")),
            "canonical_predicate": str(belief.get("canonical_predicate")),
            "stance": str(belief.get("predicate_stance") or "positive"),
            "canonical_subject_entity_id": belief.get("canonical_subject_entity_id"),
            "canonical_object_entity_id": belief.get("canonical_object_entity_id"),
            "normalized_subject": str(belief.get("subject") or ""),
            "normalized_object": str(belief.get("object") or ""),
        }

    computed = compute_belief_semantic_fields(
        subject_entity_id=belief.get("subject_entity_id"),
        object_entity_id=belief.get("object_entity_id"),
        subject_name=str(belief.get("subject") or ""),
        predicate=str(belief.get("predicate") or ""),
        object_name=str(belief.get("object") or ""),
    )
    return {
        "family": computed["predicate_family"],
        "canonical_predicate": computed["canonical_predicate"],
        "stance": computed["predicate_stance"],
        "canonical_subject_entity_id": computed["canonical_subject_entity_id"],
        "canonical_object_entity_id": computed["canonical_object_entity_id"],
        "normalized_subject": computed["normalized_subject"],
        "normalized_object": computed["normalized_object"],
    }


def belief_evidence_score(belief: dict[str, Any]) -> float:
    tier_score = SOURCE_TIER_SCORES.get(str(belief.get("source_tier") or "unknown"), 0.3)
    corroboration = min(len(belief.get("corroborated_by") or []) / 3, 1.0)
    independence = min(float(belief.get("independence") or 0) / 2, 1.0)
    band = str(belief.get("confidence_band") or "speculative")
    if band == "well_supported":
        band_bonus = 0.15
    elif band == "supported":
        band_bonus = 0.10
    elif band == "tentative":
        band_bonus = 0.04
    else:
        band_bonus = 0.0
    return (
        float(belief.get("confidence") or 0) * 0.55
        + tier_score * 0.25
        + corroboration * 0.10
        + independence * 0.10
        + band_bonus
    )


def cluster_contested_beliefs(
    beliefs: list[dict[str, Any]],
    *,
    limit: int = 20,
) -> list[dict[str, Any]]:
    families: dict[str, list[dict[str, Any]]] = {}

    for belief in beliefs:
        if not belief.get("object"):
            continue
        analysis = get_belief_semantics(belief)
        subject_key = str(analysis.get("canonical_subject_entity_id") or analysis["normalized_subject"]).lower()
        object_key = str(analysis.get("canonical_object_entity_id") or analysis["normalized_object"]).lower()
        if not subject_key or not object_key or subject_key == object_key:
            continue
        pair_key = "||".join(sorted([subject_key, object_key]))
        # Group by entity pair ONLY — not by family
        # This allows "threatens" and "supports" about the same entities to be compared
        item = dict(belief)
        item["_analysis"] = analysis
        families.setdefault(pair_key, []).append(item)

    contested: list[dict[str, Any]] = []
    for family_beliefs in families.values():
        # Group into sides by stance (positive vs negative vs uncertain)
        side_map: dict[str, list[dict[str, Any]]] = {}
        for belief in family_beliefs:
            analysis = belief["_analysis"]
            stance = analysis["stance"]
            side_map.setdefault(stance, []).append(belief)

        sides: list[dict[str, Any]] = []
        for side_beliefs in side_map.values():
            # Pick the most common predicate as representative for this side
            pred_counts: dict[str, int] = {}
            for b in side_beliefs:
                p = b["_analysis"]["canonical_predicate"]
                pred_counts[p] = pred_counts.get(p, 0) + 1
            representative_pred = max(pred_counts, key=pred_counts.get) if pred_counts else ""

            scores = [belief_evidence_score(b) for b in side_beliefs]
            top_tier = sorted(
                (str(b.get("source_tier") or "unknown") for b in side_beliefs),
                key=lambda tier: SOURCE_TIER_SCORES.get(tier, 0),
                reverse=True,
            )[0]
            sides.append({
                "predicate": representative_pred,
                "beliefs": [{k: v for k, v in belief.items() if k != "_analysis"} for belief in side_beliefs],
                "avg_confidence": round(sum(float(b.get("confidence") or 0) for b in side_beliefs) / max(1, len(side_beliefs)), 3),
                "beings": sorted({str(b.get("being") or "") for b in side_beliefs if b.get("being")}),
                "evidence_score": round(sum(scores) / max(1, len(scores)), 3),
                "top_tier": top_tier,
                "stance": side_beliefs[0]["_analysis"]["stance"],
            })

        sides.sort(key=lambda side: side["evidence_score"], reverse=True)
        stance_set = {side["stance"] for side in sides}
        disagreement_type = "contradiction" if {"positive", "negative"}.issubset(stance_set) else "variation"

        if len(sides) < 2:
            continue
        # Only show contradictions (positive vs negative) or explicit disputes
        if disagreement_type == "variation" and not any(str(b.get("status") or "") == "disputed" for b in family_beliefs):
            continue

        total_beings = len({str(b.get("being") or "") for b in family_beliefs if b.get("being")})
        top_two_score = sum(float(side["evidence_score"]) for side in sides[:2])
        dispute_score = round(top_two_score + min(total_beings / 8, 1) * 0.25 + (0.35 if disagreement_type == "contradiction" else 0.10), 3)
        contested.append({
            "subject": family_beliefs[0]["_analysis"]["normalized_subject"],
            "object": family_beliefs[0]["_analysis"]["normalized_object"],
            "family": family_beliefs[0]["_analysis"]["family"],
            "sides": sides,
            "total_beings": total_beings,
            "dispute_score": dispute_score,
            "disagreement_type": disagreement_type,
        })

    contested.sort(key=lambda item: item["dispute_score"], reverse=True)
    return contested[:limit]


def beliefs_are_semantically_contested(a: dict[str, Any], b: dict[str, Any]) -> bool:
    if not a.get("object") or not b.get("object"):
        return False
    aa = get_belief_semantics(a)
    bb = get_belief_semantics(b)
    pair_a = tuple(sorted([
        str(aa.get("canonical_subject_entity_id") or aa["normalized_subject"]).lower(),
        str(aa.get("canonical_object_entity_id") or aa["normalized_object"]).lower(),
    ]))
    pair_b = tuple(sorted([
        str(bb.get("canonical_subject_entity_id") or bb["normalized_subject"]).lower(),
        str(bb.get("canonical_object_entity_id") or bb["normalized_object"]).lower(),
    ]))
    if pair_a != pair_b:
        return False
    # Same family + different stance = clear contradiction
    if aa["family"] == bb["family"] and aa["stance"] != bb["stance"]:
        return True
    # Different families but opposite stances (positive vs negative) on same entity pair
    # = likely contradiction even if predicates don't match a family rule
    if aa["stance"] != bb["stance"] and "uncertain" not in (aa["stance"], bb["stance"]):
        return True
    # Either side explicitly marked disputed
    return str(a.get("status") or "") == "disputed" or str(b.get("status") or "") == "disputed"
