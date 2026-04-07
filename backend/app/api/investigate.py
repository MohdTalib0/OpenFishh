"""
Investigate API — Generate Blueprint intelligence reports.

POST /api/investigate → SSE stream → report + trust_summary
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter()

REPORTS_DIR = Path("data/reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/investigate")
async def investigate(request: Request):
    """Generate a Blueprint report. Streams via SSE."""
    body = await request.json()
    question = body.get("question", "").strip()

    if not question:
        return JSONResponse({"error": "Question is required"}, status_code=400)

    from app.config import LLM_API_KEY
    if not LLM_API_KEY:
        return JSONResponse({"error": "LLM_API_KEY not configured. Add it to .env"}, status_code=500)

    from app.report.blueprint import generate_report

    report_id = str(uuid.uuid4())

    async def event_stream():
        final_report = None
        async for event in generate_report(question):
            yield event

            if "event: result" in event:
                try:
                    data_line = event.split("data: ", 1)[1].split("\n")[0]
                    final_report = json.loads(data_line)
                except Exception:
                    pass

        # Save report
        if final_report:
            report_data = {
                "id": report_id,
                "question": question,
                "report": final_report.get("report", ""),
                "trust_summary": final_report.get("trust_summary", {}),
                "beliefs": final_report.get("beliefs", []),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            (REPORTS_DIR / f"{report_id}.json").write_text(
                json.dumps(report_data, default=str), encoding="utf-8"
            )

        yield f"event: saved\ndata: {json.dumps({'id': report_id})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/report/{report_id}")
async def get_report(report_id: str):
    """Retrieve a saved report."""
    report_file = REPORTS_DIR / f"{report_id}.json"
    if not report_file.exists():
        return JSONResponse({"error": "Report not found"}, status_code=404)
    return json.loads(report_file.read_text(encoding="utf-8"))


@router.get("/reports")
async def list_reports():
    """List recent reports."""
    reports = []
    for f in sorted(REPORTS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            reports.append({
                "id": data.get("id"),
                "question": data.get("question"),
                "trust_summary": data.get("trust_summary"),
                "created_at": data.get("created_at"),
            })
        except Exception:
            continue
    return {"reports": reports[:20]}
