"""CampusBridge AI — SQLAlchemy Declarative Base & Model Mixins.

Design Invariants (PRD v1.1):
- Asynchronous PostgreSQL with pgvector and Row-Level Security (RLS) support.
- Auditability: Every model tracks timestamps and immutable record provenance.
"""

from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(AsyncAttrs, DeclarativeBase):
    """Base declarative class for all CampusBridge AI PostgreSQL models."""
    pass


class TimestampMixin:
    """Standard audit timestamps for relational entities."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

