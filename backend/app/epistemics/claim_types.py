"""
Claim Type System — The 5 epistemic layers.

Every output of the society is classified into exactly one of these types.
They cannot be mixed. A hypothesis cannot pretend to be a fact.
A forecast cannot pretend to be an observation.

This is the single most important file in the epistemics layer.
"""


# ══════════════════════════════════════════════════════════════════════
# The 5 Claim Types
# ══════════════════════════════════════════════════════════════════════

CLAIM_TYPES = {
    "observation": {
        "description": "A source says X. We have not yet verified it.",
        "example": "Reuters reports that Tesla announced robotaxi service in Austin",
        "confidence_cap": 1.0,  # Source says it, we record it
        "can_be_surfaced": False,  # Never shown to users directly
        "requires_source": True,
        "requires_corroboration": False,
    },
    "claim": {
        "description": "X is sufficiently supported by independent evidence.",
        "example": "Tesla is launching a robotaxi service in Austin",
        "confidence_cap": 1.0,
        "can_be_surfaced": True,
        "requires_source": True,
        "requires_corroboration": True,  # Must have >= 1 independent corroboration
    },
    "hypothesis": {
        "description": "X may imply Y. Plausible but not yet proven.",
        "example": "Tesla's robotaxi launch could disrupt Uber's Austin market share",
        "confidence_cap": 0.7,  # Never higher than 0.7
        "can_be_surfaced": True,  # Labeled clearly as hypothesis
        "requires_source": False,  # Can be synthesized
        "requires_corroboration": False,
        "requires_citation": True,  # Must cite the claims it's based on
    },
    "forecast": {
        "description": "Y may happen by date Z. Scoreable when date passes.",
        "example": "Tesla robotaxis will cover 70% of US population by Q4 2026",
        "confidence_cap": 0.85,
        "can_be_surfaced": True,
        "requires_source": False,
        "requires_corroboration": False,
        "requires_check_date": True,  # Must have a date to check against
    },
    "recommendation": {
        "description": "Therefore do A. Only generated for user queries.",
        "example": "Monitor Tesla's Austin pilot for competitive implications",
        "confidence_cap": 0.8,
        "can_be_surfaced": True,
        "requires_source": False,
        "requires_corroboration": False,
        "only_in_reports": True,  # Never stored as a persistent belief
    },
}


# ══════════════════════════════════════════════════════════════════════
# Claim Lifecycle — states a claim passes through
# ══════════════════════════════════════════════════════════════════════

CLAIM_LIFECYCLE = {
    "observed": {
        "description": "Extracted from a source. Not yet validated.",
        "next_states": ["supported", "insufficient"],
        "auto_transition": "If corroboration >= 1 and source_tier >= 'industry' → supported",
    },
    "supported": {
        "description": "Has independent evidence. Safe to surface.",
        "next_states": ["disputed", "stale", "well_supported"],
        "auto_transition": "If corroboration >= 3 and independence >= 2 → well_supported",
    },
    "well_supported": {
        "description": "Strong independent evidence from multiple sources.",
        "next_states": ["disputed", "stale"],
    },
    "disputed": {
        "description": "Contradictory evidence exists. Flagged for review.",
        "next_states": ["supported", "invalidated"],
        "auto_transition": "After debate, winner's side → supported, loser's → invalidated or demoted",
    },
    "stale": {
        "description": "No fresh evidence in 21+ days. May no longer be current.",
        "next_states": ["supported", "invalidated", "archived"],
        "auto_transition": "If refreshed with new evidence → supported. If 60 days stale → archived",
    },
    "invalidated": {
        "description": "Counter-evidence outweighs supporting evidence.",
        "next_states": ["archived"],
        "auto_transition": "After 30 days → archived",
    },
    "archived": {
        "description": "No longer active. Kept for history and calibration.",
        "next_states": [],
    },
    "insufficient": {
        "description": "Not enough evidence to make any determination.",
        "next_states": ["observed", "archived"],
    },
}


# ══════════════════════════════════════════════════════════════════════
# Confidence Bands — what users see
# ══════════════════════════════════════════════════════════════════════

CONFIDENCE_BANDS = {
    "well_supported": {
        "label": "Well-Supported",
        "description": "Multiple independent sources confirm this.",
        "min_evidence_strength": 0.7,
        "min_source_quality": 0.7,
        "min_independence": 2,
        "max_age_days": 21,
    },
    "supported": {
        "label": "Supported",
        "description": "At least one credible source with corroboration.",
        "min_evidence_strength": 0.5,
        "min_source_quality": 0.5,
        "min_independence": 1,
        "max_age_days": 30,
    },
    "tentative": {
        "label": "Tentative",
        "description": "Limited evidence. Treat with caution.",
        "min_evidence_strength": 0.3,
        "min_source_quality": 0.3,
        "min_independence": 0,
        "max_age_days": 30,
    },
    "speculative": {
        "label": "Speculative",
        "description": "Based on a single source or inference. Not verified.",
        "min_evidence_strength": 0.0,
        "min_source_quality": 0.0,
        "min_independence": 0,
        "max_age_days": None,
    },
    "stale": {
        "label": "Stale",
        "description": "No fresh evidence in 21+ days. May no longer be accurate.",
    },
    "disputed": {
        "label": "Disputed",
        "description": "Contradictory evidence exists. Under review.",
    },
}


# ══════════════════════════════════════════════════════════════════════
# Source Tiers — static, not dynamic
# ══════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════════
# Source Tiers — editorial priors, NOT empirically calibrated scores
#
# v1 KNOWN LIMITATIONS (do not treat these as settled):
#   - Scores are heuristic weights, not measured truth probabilities
#   - "institutional" mixes government (high trust) with corporate blogs (lower)
#   - "aggregator" mixes elite Substacks with random Medium posts
#   - get_source_tier() is substring-based, not robust URL parsing
#   - No beat-specific priors yet (Nature is stronger for science than for policy)
#   - Scores should eventually be validated against claim survival rates
#
# NEXT MATURITY STEPS (not v1):
#   - Beat-sensitive source priors
#   - Split institutional into government / corporate / academic
#   - Split aggregator into curated / user-platform
#   - Empirically calibrate scores from claim outcome data
# ══════════════════════════════════════════════════════════════════════

SOURCE_TIERS = {
    # ── Tier 1: Wire services — independent, multi-sourced, verified ──
    "wire": {
        "score": 0.90,
        "domains": [
            "reuters.com", "apnews.com", "afp.com",
        ],
    },
    # ── Tier 2: Major news — large editorial teams, fact-checking, corrections ──
    "major_news": {
        "score": 0.82,
        "domains": [
            "nytimes.com", "wsj.com", "ft.com", "washingtonpost.com",
            "economist.com", "bloomberg.com", "cnbc.com", "theguardian.com",
            "bbc.com", "bbc.co.uk", "aljazeera.com",
            "fortune.com", "independent.co.uk", "spiegel.de",
            "economictimes.indiatimes.com", "m.economictimes.com",
            "marketwatch.com", "finance.yahoo.com",
            "thenation.com", "hindustantimes.com",
            "axios.com", "vox.com",
            "pewresearch.org",  # nonpartisan polling/research
        ],
    },
    # ── Tier 3: Peer-reviewed research — highest evidentiary standard ──
    "research_peer_reviewed": {
        "score": 0.85,
        "domains": [
            "nature.com", "science.org", "sciencemag.org",
            "thelancet.com", "nejm.org", "cell.com",
            "pnas.org", "journals.ama-assn.org",  # JAMA
        ],
    },
    # ── Tier 4: Research preprints — unreviewed but often first-to-publish ──
    "research_preprint": {
        "score": 0.65,
        "domains": [
            "arxiv.org", "biorxiv.org", "medrxiv.org", "ssrn.com",
            "phail.ai",  # Physical AI benchmark — original empirical data
        ],
    },
    # ── Tier 5: Institutional/primary — the source itself, not reporting about it ──
    "institutional": {
        "score": 0.80,
        "domains": [
            "nasa.gov", "news.un.org", "who.int",
            "sec.gov", "fda.gov", "nih.gov", "cdc.gov",
            "blog.research.google", "openai.com", "anthropic.com",
            "github.com",  # primary artifact for software
            "ebc.com",  # forex brokerage — institutional about itself only
        ],
    },
    # ── Tier 6: Specialist trade press — domain experts, beat reporters ──
    "specialist_trade": {
        "score": 0.72,
        "domains": [
            # Tech
            "techcrunch.com", "arstechnica.com", "theverge.com", "wired.com",
            "venturebeat.com", "technologyreview.com", "tomshardware.com",
            # Health / biotech
            "statnews.com", "fiercebiotech.com", "fiercepharma.com",
            "medcitynews.com", "genengnews.com", "biopharmadive.com",
            # Security / defense
            "defensenews.com", "breakingdefense.com", "c4isrnet.com",
            "thehackernews.com", "krebsonsecurity.com", "darkreading.com",
            # Energy / climate
            "cleantechnica.com", "electrek.co", "carbonbrief.org", "utilitydive.com",
            # Finance / VC
            "coindesk.com", "inc42.com", "yourstory.com",
            # Media / entertainment
            "variety.com", "hollywoodreporter.com", "polygon.com", "gamesindustry.biz",
            # Supply chain / logistics
            "supplychaindive.com", "retaildive.com", "freightwaves.com",
            # Space
            "spacenews.com",
            # Food / agriculture
            "fooddive.com", "agfundernews.com", "foodtechconnect.com",
            # Real estate / architecture
            "archdaily.com", "therealdeal.com",
            # Regional / global south
            "restofworld.org", "mercopress.com", "thediplomat.com",
            # Education
            "highereddive.com", "edsurge.com", "edweek.org",
            # Culture
            "aeon.co", "artnews.com",
            # Sports business
            "sportico.com", "frontofficesports.com",
            # Healthcare trade
            "healthcaredive.com", "medpagetoday.com", "beckershospitalreview.com",
            "kffhealthnews.org", "endpts.com", "fiercehealthcare.com",
            # Crypto trade
            "theblock.co", "decrypt.co", "cointelegraph.com", "blockworks.co", "cryptoslate.com",
            # Other specialist
            "gizmodo.com", "esports-news.co.uk", "lawandcrime.com", "sfstandard.com",
        ],
    },
    # ── Tier 7: Reference — encyclopedic, not current reporting ──
    "reference": {
        "score": 0.60,
        "domains": [
            "en.wikipedia.org", "plato.stanford.edu",
            "sciencedaily.com",  # popularized science summaries
            "nationaltoday.com",
            "theconversation.com",  # academic experts writing for general audience
        ],
    },
    # ── Tier 8: Aggregator/community — curated but user-submitted ──
    "aggregator": {
        "score": 0.50,
        "domains": [
            "hnrss.org", "news.ycombinator.com", "producthunt.com",
            "medium.com", "substack.com", "dev.to",
            "ccunpacked.dev", "bearblog.dev",  # developer/personal blogs
        ],
    },
    # ── Tier 9: Social — user-generated, no editorial process ──
    "social": {
        "score": 0.40,
        "domains": [
            "reddit.com", "twitter.com", "x.com",
            "v.redd.it",
            "youtube.com", "youtu.be",
        ],
    },
    # ── Tier 10: Unknown — cannot classify ──
    "unknown": {
        "score": 0.30,
        "domains": [],
    },
}


def get_source_tier(url: str) -> tuple[str, float]:
    """Get the tier name and credibility score for a URL."""
    if not url:
        return "unknown", 0.30

    url_lower = url.lower()
    for tier_name, tier in SOURCE_TIERS.items():
        for domain in tier["domains"]:
            if domain in url_lower:
                return tier_name, tier["score"]
    return "unknown", 0.30


# ══════════════════════════════════════════════════════════════════════
# Temporal Classification — regex-based, zero LLM cost
# ══════════════════════════════════════════════════════════════════════

import re

_FUTURE_PATTERNS = re.compile(
    r'\b(will|plans? to|is expected to|aims to|intends to|is set to|'
    r'could|may|might|should|is likely to|is projected to|'
    r'forecast|predict|anticipat|is poised to)\b',
    re.IGNORECASE
)
_PAST_PATTERNS = re.compile(
    r'\b(launched|acquired|raised|announced|released|signed|'
    r'completed|closed|merged|sold|bought|partnered|'
    r'reported|published|filed|settled|was |were |has been|had been)\b',
    re.IGNORECASE
)


def classify_temporal_type(predicate: str) -> str:
    """Classify a belief predicate into a temporal type."""
    if _FUTURE_PATTERNS.search(predicate):
        return "forecast"
    if _PAST_PATTERNS.search(predicate):
        return "past_fact"
    if predicate.strip().startswith(("is ", "are ", "has ", "uses ", "provides ")):
        return "present_state"
    return "timeless"


# ══════════════════════════════════════════════════════════════════════
# Confidence Decomposition — the 4 components
# ══════════════════════════════════════════════════════════════════════

def compute_confidence(
    llm_confidence: float,
    source_url: str | None = None,
    corroboration_count: int = 0,
    independent_chains: int = 0,
    age_days: int = 0,
    has_contradiction: bool = False,
) -> dict:
    """
    Decompose confidence into structured components.
    Returns both the components and the final user-facing band.

    v1 KNOWN LIMITATIONS:
      - llm_confidence still has outsized influence (0.6 weight in evidence)
      - corroboration_count and independent_chains overlap conceptually
      - source_score is an editorial prior, not a measured truth metric
      - weights (0.35/0.25/0.25/0.15) are heuristic, not empirically calibrated
      - Should eventually be validated: do higher composites actually survive longer?
    """
    # Component 1: Evidence strength (from LLM + corroboration)
    evidence = min(1.0, llm_confidence * 0.6 + corroboration_count * 0.15)

    # Component 2: Source quality
    _, source_score = get_source_tier(source_url or "")

    # Component 3: Independence
    independence = min(1.0, independent_chains * 0.35) if independent_chains > 0 else 0.0

    # Component 4: Freshness (decays after 14 days)
    if age_days <= 14:
        freshness = 1.0
    elif age_days <= 30:
        freshness = 1.0 - (age_days - 14) / 32  # gradual decay
    else:
        freshness = max(0.2, 1.0 - (age_days - 14) / 32)

    # Contradiction penalty
    contradiction_penalty = 0.2 if has_contradiction else 0.0

    # Composite score
    composite = (
        evidence * 0.35 +
        source_score * 0.25 +
        independence * 0.25 +
        freshness * 0.15
    ) - contradiction_penalty
    composite = max(0.05, min(1.0, composite))

    # Determine band
    if has_contradiction:
        band = "disputed"
    elif age_days > 21 and corroboration_count == 0:
        band = "stale"
    elif composite >= 0.7 and independent_chains >= 2 and source_score >= 0.7:
        band = "well_supported"
    elif composite >= 0.5 and (corroboration_count >= 1 or source_score >= 0.6):
        band = "supported"
    elif composite >= 0.3:
        band = "tentative"
    else:
        band = "speculative"

    return {
        "composite": round(composite, 3),
        "evidence_strength": round(evidence, 3),
        "source_quality": round(source_score, 3),
        "independence": round(independence, 3),
        "freshness": round(freshness, 3),
        "has_contradiction": has_contradiction,
        "band": band,
        "band_label": CONFIDENCE_BANDS.get(band, {}).get("label", band),
    }


# ══════════════════════════════════════════════════════════════════════
# Known Unknowns — what we can't determine
# ══════════════════════════════════════════════════════════════════════

def assess_known_unknowns(
    source_url: str | None,
    source_tier: str,
    corroboration_count: int,
    independent_chains: int,
    age_days: int,
    temporal_type: str,
) -> list[str]:
    """
    Return a list of known unknowns — things the system cannot determine.
    These are displayed to users as transparency signals.
    """
    unknowns = []

    if not source_url:
        unknowns.append("No primary source URL available")
    if source_tier == "social":
        unknowns.append("Based on social media discussion, not primary reporting")
    if source_tier == "unknown":
        unknowns.append("Source credibility could not be assessed")
    if corroboration_count == 0:
        unknowns.append("No independent corroboration found")
    if independent_chains == 0 and corroboration_count > 0:
        unknowns.append("Corroboration may be from overlapping sources")
    if age_days > 14:
        unknowns.append(f"Evidence is {age_days} days old — may not reflect current state")
    if temporal_type == "forecast":
        unknowns.append("This is a prediction, not a verified fact")

    return unknowns


# ══════════════════════════════════════════════════════════════════════
# The Buyer Artifact — what every output should answer
# ══════════════════════════════════════════════════════════════════════

BUYER_ARTIFACT_REQUIREMENTS = {
    "what_we_know": "Claims that are supported or well-supported",
    "how_we_know": "Evidence citations, source tiers, corroboration count",
    "what_we_dont_know": "Known unknowns, insufficient evidence areas",
    "what_changed": "Claims that were recently created, disputed, or invalidated",
    "what_matters_most": "Highest-impact claims by entity relevance + evidence strength",
    "what_to_do_next": "Recommendations (only in user-facing reports, never stored as beliefs)",
}
