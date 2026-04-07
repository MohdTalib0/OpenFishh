"""
Web Searcher — Finds relevant content for a question.

Uses DuckDuckGo (free, no API key) as the primary search engine.
Falls back to scraping if search fails.
"""

import asyncio
from typing import Any

import httpx


async def web_search(query: str, max_results: int = 8) -> list[dict]:
    """
    Search the web using DuckDuckGo Instant Answer API.
    Free, no API key required.
    """
    results = []

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # DuckDuckGo HTML search (lite version)
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers={"User-Agent": "Mozilla/5.0"},
                follow_redirects=True,
            )
            if resp.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.text, "html.parser")
                for result in soup.select(".result"):
                    title_el = result.select_one(".result__a")
                    snippet_el = result.select_one(".result__snippet")
                    url_el = result.select_one(".result__url")

                    if title_el:
                        title = title_el.get_text(strip=True)
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ""
                        url = title_el.get("href", "")
                        if url.startswith("//duckduckgo.com/l/"):
                            # Extract actual URL from DDG redirect
                            import urllib.parse
                            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
                            url = parsed.get("uddg", [url])[0]

                        results.append({
                            "title": title[:200],
                            "url": url,
                            "content": snippet[:500],
                            "source": "duckduckgo",
                        })
                        if len(results) >= max_results:
                            break
    except Exception:
        pass

    return results


async def fetch_article(url: str) -> dict | None:
    """Fetch and extract text from a URL."""
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; OpenFishh/1.0)",
            })
            if resp.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.text, "html.parser")
                # Remove scripts/styles
                for tag in soup(["script", "style", "nav", "footer", "header"]):
                    tag.decompose()
                text = soup.get_text(separator=" ", strip=True)
                return {
                    "url": url,
                    "title": soup.title.string if soup.title else "",
                    "content": text[:3000],
                }
    except Exception:
        pass
    return None
