"""CampusBridge AI — FastAPI application entry-point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.endpoints import router
from backend.routers.parser import router as parser_router

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

# Core domain & diagnostic routers
app.include_router(router)
app.include_router(router, prefix="/api")

# Real PDF parser routers
app.include_router(parser_router, prefix="/v1")
app.include_router(parser_router, prefix="/api/v1")
app.include_router(parser_router, prefix="/api")
app.include_router(parser_router)
