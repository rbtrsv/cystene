"""Load server/.env into the environment before importing the FastAPI app, so
`from main import app` finds DATABASE_URL etc. The webhook tests monkey-patch the
DB session factory, so no real DB connection is made during the tests themselves.
"""
import os
from pathlib import Path

_env = Path(__file__).resolve().parents[3] / ".env"  # server/.env
if _env.exists():
    for line in _env.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key, value)
