"""CampusBridge AI — FastAPI application entry-point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.endpoints import router

app = FastAPI(
    title="CampusBridge AI API",
    version="1.1.0",
    description="Deterministic career readiness, Excel two-way engine, and MCP matching platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support both /v1 and /api/v1 prefixes for proxy flexibility
app.include_router(router)
app.include_router(router, prefix="/api")
