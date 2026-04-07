"""Configuration — all from environment variables."""

import os

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4.1-nano")
DB_PATH = os.getenv("DB_PATH", "data/openfishh.db")
