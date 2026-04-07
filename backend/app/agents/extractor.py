"""
Belief Extractor — Extracts structured claims from articles.

Uses any OpenAI-compatible LLM to extract:
  - Subject (entity)
  - Predicate (relationship)
  - Object (entity)
  - Confidence (0-1)
  - Stance (positive/negative/uncertain)
"""

import json
import os

from openai import AsyncOpenAI

# LLM configuration
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4.1-nano")


def get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=LLM_API_KEY,
        base_url=LLM_BASE_URL,
    )


EXTRACTION_PROMPT = """You are an intelligence analyst. Extract structured claims from this article.

Return ONLY valid JSON:
{
  "summary": "<2-3 sentence summary>",
  "claims": [
    {
      "subject": "<Entity A>",
      "predicate": "<relationship>",
      "object": "<Entity B>",
      "confidence": <float 0.0-1.0>,
      "stance": "<positive|negative|uncertain>"
    }
  ]
}

Rules:
- Max 5 claims per article
- Subject and object must be named entities
- Stance: "positive" if constructive/growing, "negative" if destructive/declining/threatening, "uncertain" if speculative
- Confidence: how certain the source is about this claim
"""


async def extract_beliefs(articles: list[dict], question: str) -> list[dict]:
    """
    Extract beliefs from articles using LLM.
    Returns list of belief dicts with epistemic metadata.
    """
    if not articles or not LLM_API_KEY:
        return []

    client = get_client()
    all_beliefs = []

    # Combine articles into a digest
    digest = "\n\n".join(
        f"[{i+1}] {a.get('title', '')}\nSource: {a.get('url', '')}\n{a.get('content', '')[:800]}"
        for i, a in enumerate(articles[:5])
    )

    try:
        resp = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": EXTRACTION_PROMPT},
                {"role": "user", "content": f"QUESTION: {question}\n\nARTICLES:\n{digest}"},
            ],
            max_tokens=1500,
            temperature=0.1,
        )

        content = resp.choices[0].message.content.strip()
        if "```" in content:
            content = content.split("```")[1].split("```")[0]
            if content.startswith("json"):
                content = content[4:]

        data = json.loads(content.strip())
        claims = data.get("claims", [])

        from .epistemics_helper import enrich_belief

        for claim in claims:
            if not claim.get("subject") or not claim.get("predicate") or not claim.get("object"):
                continue
            # Find which article this claim came from
            source_url = ""
            for a in articles:
                if (claim["subject"].lower() in a.get("content", "").lower() or
                    claim["object"].lower() in a.get("content", "").lower()):
                    source_url = a.get("url", "")
                    break

            belief = enrich_belief({
                "subject": claim["subject"],
                "predicate": claim["predicate"],
                "object": claim["object"],
                "confidence": max(0.0, min(1.0, float(claim.get("confidence", 0.5)))),
                "stance": claim.get("stance", "positive"),
                "source_url": source_url,
            })
            all_beliefs.append(belief)

        # Add summary as metadata
        if data.get("summary"):
            all_beliefs.insert(0, {"_summary": data["summary"]})

    except Exception as e:
        print(f"Extraction failed: {e}")

    return all_beliefs
