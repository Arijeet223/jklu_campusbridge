"""CampusBridge AI — FastAPI application entry-point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.endpoints import router
from backend.routers.parser import router as parser_router
from backend.routers.auth import router as auth_router
from backend.routers.voice import router as voice_router
from backend.routers.jd_upload import router as jd_router
from backend.routers.academic import router as academic_router
from backend.routers.setup import router as setup_router

app = FastAPI(
    title="CampusBridge AI API",
    version="1.1.0",
    description="Deterministic career readiness, Excel two-way engine, and MCP matching platform",
)

# ── Dynamic CORS Configuration for Vercel Deployments & Local Dev ─────────────
CORS_ORIGIN_REGEX = r"^https:\/\/.*\.vercel\.app$"
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
frontend_env = os.getenv("FRONTEND_URL")
if frontend_env:
    for origin in frontend_env.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
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

# Academic Grade Sheet Upload & Deterministic Performance routers
app.include_router(academic_router, prefix="/api/academic")
app.include_router(academic_router, prefix="/api/v1/academic")
app.include_router(academic_router, prefix="/v1/academic")
app.include_router(academic_router, prefix="/academic")

# Student Profile Setup & Completeness Engine routers
app.include_router(setup_router, prefix="/api/student")
app.include_router(setup_router, prefix="/api/v1/student")
app.include_router(setup_router, prefix="/v1/student")
app.include_router(setup_router, prefix="/student")

# Core domain & diagnostic routers
app.include_router(router)
app.include_router(router, prefix="/api")
