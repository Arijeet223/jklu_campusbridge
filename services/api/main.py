"""CampusBridge AI — FastAPI application entry-point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.endpoints import router
from backend.routers.parser import router as parser_router
from backend.routers.auth import router as auth_router
from backend.routers.voice import router as voice_router
from backend.routers.jd_upload import router as jd_router

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


@app.get("/health")
@app.get("/v1/health")
@app.get("/api/v1/health")
async def health_check():
    import os
    db_mode = "NEON_POSTGRES_ACTIVE" if os.getenv("DATABASE_URL") else "LOCAL_FALLBACK"
    qdrant_mode = "QDRANT_CLOUD_ACTIVE" if os.getenv("QDRANT_URL") else "LOCAL_EMBEDDED"
    return {
        "status": "HEALTHY",
        "service": "CampusBridge AI API",
        "version": "1.1.0",
        "environment": os.getenv("APP_ENV", "production"),
        "postgres": db_mode,
        "qdrant": qdrant_mode,
        "livekit_worker_target": os.getenv("LIVEKIT_AGENT_NAME", "campusbridge-local"),
    }

# Authentication & Onboarding routers (Registered first for precise route matching)
app.include_router(auth_router, prefix="/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api")
app.include_router(auth_router)

# Real PDF parser routers
app.include_router(parser_router, prefix="/v1")
app.include_router(parser_router, prefix="/api/v1")
app.include_router(parser_router, prefix="/api")
app.include_router(parser_router)

# LiveKit WebRTC voice token routers
app.include_router(voice_router, prefix="/v1")
app.include_router(voice_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api")
app.include_router(voice_router)

# Job Description Upload & Qdrant Ingestion routers
app.include_router(jd_router, prefix="/v1")
app.include_router(jd_router, prefix="/api/v1")
app.include_router(jd_router, prefix="/api")
app.include_router(jd_router)

# Core domain & diagnostic routers
app.include_router(router)
app.include_router(router, prefix="/api")
