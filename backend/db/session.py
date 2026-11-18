"""CampusBridge AI — Asynchronous PostgreSQL Session & Engine (session.py).

Configured with asyncpg driver for high-concurrency, non-blocking I/O.
Provides session factories, FastAPI dependency generators, and health probes.
"""

from __future__ import annotations

import logging
import os
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.db.base import Base

logger = logging.getLogger("campusbridge.database")

# ═══════════════════════════════════════════════════════════════════════════
# URL Construction & Async Driver Normalization
# ═══════════════════════════════════════════════════════════════════════════

def get_database_url() -> str:
    """Constructs or normalizes the PostgreSQL connection URL with asyncpg."""
    raw_url = os.getenv("DATABASE_URL")

    if not raw_url:
        pg_user = os.getenv("POSTGRES_USER", "campusbridge")
        pg_pass = os.getenv("POSTGRES_PASSWORD", "campusbridge_dev")
        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "campusbridge")
        raw_url = f"postgresql+asyncpg://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

    # Ensure asyncpg dialect is specified for async SQLAlchemy
    if raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

    return raw_url


DATABASE_URL = get_database_url()

# ═══════════════════════════════════════════════════════════════════════════
# Asynchronous Engine & Session Factory
# ═══════════════════════════════════════════════════════════════════════════

# Create the async engine with connection pooling and pre-ping
async_engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() in ("true", "1"),
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    pool_pre_ping=True,
    pool_recycle=1800,  # recycle connections every 30 minutes
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)
async_session_factory = AsyncSessionLocal


# ═══════════════════════════════════════════════════════════════════════════
# FastAPI Dependency & Lifecycle Hooks
# ═══════════════════════════════════════════════════════════════════════════

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Database transaction rolled back due to error: %s", e)
            raise


async def init_db() -> None:
    """Creates database schema tables if they do not exist."""
    async with async_engine.begin() as conn:
        logger.info("Verifying database schema against SQLAlchemy models...")
        # Import models so they are registered with Base.metadata
        from backend.db import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema verification complete.")


async def check_db_health() -> dict[str, Any]:
    """Healthcheck probe for database connectivity and latency."""
    import time
    start = time.perf_counter()
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            scalar = result.scalar()
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "status": "HEALTHY" if scalar == 1 else "DEGRADED",
                "database": "PostgreSQL",
                "dialect": "asyncpg",
                "latency_ms": latency_ms,
            }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.warning("Database healthcheck failed: %s", e)
        return {
            "status": "DISCONNECTED",
            "database": "PostgreSQL",
            "dialect": "asyncpg",
            "latency_ms": latency_ms,
            "error": str(e),
        }

