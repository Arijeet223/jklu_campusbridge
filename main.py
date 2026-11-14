"""CampusBridge AI — Root FastAPI application entrypoint for Render and Koyeb."""

import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.api.main import app

__all__ = ["app"]

