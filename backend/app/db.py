"""
Database — SQLite for zero-config local setup.

Creates all tables on first run. No migrations needed.
Async via aiosqlite for non-blocking operations.
"""

import aiosqlite
import os
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", "data/openfishh.db")


def _ensure_dir():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


async def get_db() -> aiosqlite.Connection:
    _ensure_dir()
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Create all tables. Safe to call multiple times."""
    _ensure_dir()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS beings (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                beat TEXT NOT NULL,
                backstory TEXT DEFAULT '',
                boldness REAL DEFAULT 0.5,
                sociability REAL DEFAULT 0.5,
                creativity REAL DEFAULT 0.5,
                patience REAL DEFAULT 0.5,
                empathy REAL DEFAULT 0.5,
                energy REAL DEFAULT 1.0,
                mood TEXT DEFAULT 'curious',
                status TEXT DEFAULT 'active',
                articles_read INTEGER DEFAULT 0,
                beliefs_formed INTEGER DEFAULT 0,
                cycles_completed INTEGER DEFAULT 0,
                last_cycle_at TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS entities (
                id TEXT PRIMARY KEY,
                canonical_name TEXT UNIQUE NOT NULL,
                mention_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS episodes (
                id TEXT PRIMARY KEY,
                being_id TEXT NOT NULL REFERENCES beings(id),
                source_url TEXT,
                raw_content TEXT DEFAULT '',
                sentiment REAL DEFAULT 0.0,
                resonance_score REAL DEFAULT 0.5,
                beat TEXT,
                source_name TEXT,
                ingested_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS beliefs (
                id TEXT PRIMARY KEY,
                being_id TEXT NOT NULL REFERENCES beings(id),
                subject_entity_id TEXT REFERENCES entities(id),
                predicate TEXT NOT NULL,
                object_entity_id TEXT REFERENCES entities(id),
                confidence REAL DEFAULT 0.5,
                source_episode_id TEXT REFERENCES episodes(id),
                -- Epistemic metadata
                claim_type TEXT DEFAULT 'observation',
                temporal_type TEXT DEFAULT 'timeless',
                source_tier TEXT DEFAULT 'unknown',
                source_tier_score REAL DEFAULT 0.3,
                confidence_band TEXT DEFAULT 'speculative',
                status TEXT DEFAULT 'observed',
                stance TEXT DEFAULT 'positive',
                source_url TEXT,
                independence_count INTEGER DEFAULT 0,
                valid_from TEXT DEFAULT (datetime('now')),
                valid_until TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                report TEXT,
                trust_summary TEXT,
                beliefs_used TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_beliefs_active ON beliefs(being_id) WHERE valid_until IS NULL;
            CREATE INDEX IF NOT EXISTS idx_beliefs_subject ON beliefs(subject_entity_id) WHERE valid_until IS NULL;
            CREATE INDEX IF NOT EXISTS idx_beliefs_object ON beliefs(object_entity_id) WHERE valid_until IS NULL;
            CREATE INDEX IF NOT EXISTS idx_beliefs_status ON beliefs(status) WHERE valid_until IS NULL;
            CREATE INDEX IF NOT EXISTS idx_beliefs_band ON beliefs(confidence_band) WHERE valid_until IS NULL;
            CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(canonical_name);
            CREATE INDEX IF NOT EXISTS idx_episodes_being ON episodes(being_id);
            CREATE INDEX IF NOT EXISTS idx_beings_beat ON beings(beat) WHERE status = 'active';
        """)
        await db.commit()


async def get_stats() -> dict:
    """Quick stats about the local society."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        beings = (await (await db.execute("SELECT COUNT(*) FROM beings WHERE status='active'")).fetchone())[0]
        beliefs = (await (await db.execute("SELECT COUNT(*) FROM beliefs WHERE valid_until IS NULL")).fetchone())[0]
        entities = (await (await db.execute("SELECT COUNT(*) FROM entities")).fetchone())[0]
        episodes = (await (await db.execute("SELECT COUNT(*) FROM episodes")).fetchone())[0]
        beats = (await (await db.execute("SELECT COUNT(DISTINCT beat) FROM beings WHERE status='active'")).fetchone())[0]
        return {
            "beings": beings, "beliefs": beliefs, "entities": entities,
            "episodes": episodes, "beats": beats,
        }
