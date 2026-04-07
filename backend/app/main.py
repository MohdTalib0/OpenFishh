"""
OpenFishh — Open-source swarm intelligence for the open web.

Run 10,000+ AI agents reading the internet. You ask the questions.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.investigate import router as investigate_router
from app.api.society import router as society_router
from app.api.cycle import router as cycle_router

app = FastAPI(
    title="OpenFishh",
    description="Open-source swarm intelligence for the open web",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(investigate_router, prefix="/api")
app.include_router(society_router, prefix="/api")
app.include_router(cycle_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "name": "openfishh"}
