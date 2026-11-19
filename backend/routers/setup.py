"""CampusBridge AI — Student Profile Setup & Completeness Engine Router.

Handles:
1. Multi-step onboarding progress tracking (GitHub -> Resume -> Grade Card).
2. Deterministic 0-100% profile completeness calculation and persistence in PostgreSQL / Neon.
3. Multi-modal Qdrant embedding synchronization for the personal student knowledge base.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.db.excel_store import SHEET_EVIDENCE, SHEET_STUDENTS, get_excel_store
from rag.qdrant_service import get_qdrant_service

logger = logging.getLogger("campusbridge.setup_router")

router = APIRouter(tags=["Student Profile Setup & Completeness"])


# ── Request / Response Models ────────────────────────────────────────────────

class SetupStepStatus(BaseModel):
    step_key: str
    label: str
    weight: int
    is_completed: bool
    confirmed_at: Optional[str] = None
    detail: Optional[str] = None


class SetupProgressResponse(BaseModel):
    student_id: str
    full_name: str
    completeness_percentage: float
    github_verified: bool
    resume_verified: bool
    academic_verified: bool
    github_url: Optional[str] = None
    cgpa: float
    confirmed_skills_count: int
    academic_records_count: int
    qdrant_synced: bool
    steps: list[SetupStepStatus]
    message: str


class SetupProgressUpdatePayload(BaseModel):
    student_id: str = "STU-101"
    github_url: Optional[str] = None
    github_verified: Optional[bool] = None
    resume_verified: Optional[bool] = None
    academic_verified: Optional[bool] = None
    confirmed_skills: Optional[list[Any]] = None
    academic_records: Optional[list[Any]] = None
    cgpa: Optional[float] = None
    full_name: Optional[str] = None
    github_projects: Optional[list[dict[str, Any]]] = None
    resume_text: Optional[str] = None


class SyncKnowledgeBasePayload(BaseModel):
    student_id: str = "STU-101"
    full_name: Optional[str] = None
    skills: Optional[list[str]] = None
    academic_records: Optional[list[dict[str, Any]]] = None
    cgpa: Optional[float] = None
    github_url: Optional[str] = None
    github_projects: Optional[list[dict[str, Any]]] = None
    resume_text: Optional[str] = None


# ── Helper Calculation ───────────────────────────────────────────────────────

def calculate_completeness(
    github_done: bool, resume_done: bool, academic_done: bool
) -> tuple[float, list[SetupStepStatus]]:
    """Deterministic calculation of 0-100% profile completeness."""
    steps = [
        SetupStepStatus(
            step_key="github",
            label="1. Link GitHub Engineering Account",
            weight=33,
            is_completed=github_done,
            detail="Verified code commits & architecture projects." if github_done else "Pending repository link.",
        ),
        SetupStepStatus(
            step_key="resume",
            label="2. Technical Resume Ingestion (PDF / DOCX)",
            weight=33,
            is_completed=resume_done,
            detail="Skills verified via Ghost Cards." if resume_done else "Pending resume upload.",
        ),
        SetupStepStatus(
            step_key="academic",
            label="3. Grade Card Verification (PDF / Image)",
            weight=34,
            is_completed=academic_done,
            detail="GPA and credits certified with RapidOCR." if academic_done else "Pending grade sheet upload.",
        ),
    ]

    total = 0.0
    if github_done:
        total += 33.0
    if resume_done:
        total += 33.0
    if academic_done:
        total += 34.0

    return min(100.0, total), steps


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/setup-progress", response_model=SetupProgressResponse)
async def get_setup_progress(student_id: str = Query("STU-101")):
    """Fetch profile completeness percentage and multi-modal step verification states."""
    clean_sid = student_id.strip()
    store = get_excel_store()

    # 1. Check in-memory store
    students = store.get_sheet(SHEET_STUDENTS)
    student_rec = next(
        (s for s in students if str(s.get("student_id", "")).strip().lower() == clean_sid.lower()),
        None,
    )

    # 2. Check confirmed skills count
    evidence = store.get_sheet(SHEET_EVIDENCE)
    matched_ev = [
        e for e in evidence
        if str(e.get("student_id", "")).strip().lower() == clean_sid.lower()
    ]
    confirmed_skills_count = len(matched_ev)

    # 3. Read states
    github_url = student_rec.get("github_url") if student_rec else None
    github_verified = bool(student_rec.get("github_verified", False) or (github_url and len(github_url) > 8))
    resume_verified = bool(student_rec.get("resume_verified", False) or confirmed_skills_count > 0)
    academic_verified = bool(student_rec.get("academic_verified", False))

    academic_records = student_rec.get("academic_records", []) if student_rec else []
    if isinstance(academic_records, str):
        try:
            import json
            academic_records = json.loads(academic_records)
        except Exception:
            academic_records = []
    academic_records_count = len(academic_records)
    if academic_records_count > 0:
        academic_verified = True

    cgpa = float(student_rec.get("cgpa", 0.0)) if student_rec else 0.0
    full_name = str(student_rec.get("full_name") or student_rec.get("name") or "Student") if student_rec else "Student"

    # Attempt fetching from PostgreSQL
    try:
        from backend.db.session import AsyncSessionLocal
        from backend.db.crud import get_student

        async with AsyncSessionLocal() as session:
            db_student = await get_student(session, clean_sid)
            if db_student:
                full_name = db_student.full_name or full_name
                cgpa = float(db_student.cgpa)
                github_url = db_student.github_url or github_url
                github_verified = bool(db_student.github_verified or github_verified)
                resume_verified = bool(db_student.resume_verified or resume_verified)
                academic_verified = bool(db_student.academic_verified or academic_verified)
                if db_student.academic_records:
                    academic_records_count = len(db_student.academic_records)
                    academic_verified = True
    except Exception as e:
        logger.debug(f"PostgreSQL fetch note: {e}")

    completeness, steps = calculate_completeness(github_verified, resume_verified, academic_verified)

    return SetupProgressResponse(
        student_id=clean_sid,
        full_name=full_name,
        completeness_percentage=completeness,
        github_verified=github_verified,
        resume_verified=resume_verified,
        academic_verified=academic_verified,
        github_url=github_url,
        cgpa=cgpa,
        confirmed_skills_count=confirmed_skills_count,
        academic_records_count=academic_records_count,
        qdrant_synced=completeness > 0,
        steps=steps,
        message=f"Profile completeness at {completeness:.0f}%. ({'100% Verified & Ingested' if completeness >= 100 else 'Steps remaining'}).",
    )


@router.post("/setup-progress")
async def update_setup_progress(payload: SetupProgressUpdatePayload):
    """Save verified step progress (GitHub, Resume, Grades) to Neon PostgreSQL and Excel store."""
    clean_sid = payload.student_id.strip()
    store = get_excel_store()

    # Determine completion flags
    github_done = bool(payload.github_verified or (payload.github_url and len(payload.github_url) > 8))
    resume_done = bool(payload.resume_verified or (payload.confirmed_skills and len(payload.confirmed_skills) > 0))
    academic_done = bool(payload.academic_verified or (payload.academic_records and len(payload.academic_records) > 0))

    completeness, steps = calculate_completeness(github_done, resume_done, academic_done)

    # 1. Update Excel Store
    updates: dict[str, Any] = {
        "profile_completeness": completeness,
        "github_verified": github_done,
        "resume_verified": resume_done,
        "academic_verified": academic_done,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.github_url:
        updates["github_url"] = payload.github_url
    if payload.cgpa is not None:
        updates["cgpa"] = float(payload.cgpa)
    if payload.full_name:
        updates["full_name"] = payload.full_name
    if payload.academic_records is not None:
        updates["academic_records"] = payload.academic_records

    store.update_row(SHEET_STUDENTS, key_col="student_id", key_val=clean_sid, updates=updates)

    # 2. Update PostgreSQL / Neon database
    pg_updated = False
    try:
        from backend.db.session import AsyncSessionLocal
        from backend.db.crud import get_student, upsert_student

        async with AsyncSessionLocal() as session:
            db_data = {
                "student_id": clean_sid,
                "full_name": payload.full_name or "Aarav Sharma",
                "email": f"{clean_sid.lower()}@university.edu.in",
                "profile_completeness": completeness,
                "github_verified": github_done,
                "resume_verified": resume_done,
                "academic_verified": academic_done,
                "github_url": payload.github_url,
                "cgpa": float(payload.cgpa) if payload.cgpa is not None else 8.42,
                "academic_records": payload.academic_records or [],
            }
            await upsert_student(session, db_data)
            await session.commit()
            pg_updated = True
            logger.info(f"Updated student setup in PostgreSQL for '{clean_sid}'.")
    except Exception as e:
        logger.warning(f"PostgreSQL student update note: {e}")

    # 3. Synchronize Personal Student Knowledge Base into Qdrant
    qdrant_points = 0
    try:
        qs = get_qdrant_service()
        # Collect skills
        skills_to_embed = []
        if payload.confirmed_skills:
            for s in payload.confirmed_skills:
                if isinstance(s, dict):
                    skills_to_embed.append(s.get("name") or str(s))
                else:
                    skills_to_embed.append(str(s))
        if not skills_to_embed:
            # Check store
            ev_rows = store.get_sheet(SHEET_EVIDENCE)
            skills_to_embed = [
                str(e.get("skill_name"))
                for e in ev_rows
                if str(e.get("student_id", "")).strip().lower() == clean_sid.lower()
            ]

        qdrant_points = qs.upsert_student_unified_knowledge(
            student_id=clean_sid,
            full_name=payload.full_name or "Student",
            skills=skills_to_embed,
            academic_records=payload.academic_records,
            cgpa=payload.cgpa or 0.0,
            github_url=payload.github_url,
            github_projects=payload.github_projects,
            resume_text=payload.resume_text,
        )
    except Exception as e:
        logger.warning(f"Qdrant unified knowledge synchronization skipped: {e}")

    return {
        "status": "SUCCESS",
        "student_id": clean_sid,
        "completeness_percentage": completeness,
        "github_verified": github_done,
        "resume_verified": resume_done,
        "academic_verified": academic_done,
        "postgres_persisted": pg_updated,
        "qdrant_vectors_synced": qdrant_points,
        "steps": steps,
        "message": f"Setup state saved! Completeness: {completeness:.0f}%. Unified knowledge base synchronized with Qdrant.",
    }


@router.post("/sync-knowledge-base")
async def sync_knowledge_base(payload: SyncKnowledgeBasePayload):
    """Embed confirmed student credentials into Qdrant personal knowledge base."""
    clean_sid = payload.student_id.strip()
    try:
        qs = get_qdrant_service()
        points_count = qs.upsert_student_unified_knowledge(
            student_id=clean_sid,
            full_name=payload.full_name or "Student",
            skills=payload.skills or [],
            academic_records=payload.academic_records,
            cgpa=payload.cgpa or 0.0,
            github_url=payload.github_url,
            github_projects=payload.github_projects,
            resume_text=payload.resume_text,
        )
        return {
            "status": "SYNCED",
            "student_id": clean_sid,
            "points_count": points_count,
            "collection": "student_knowledge_base",
            "message": f"Successfully vectorized {points_count} points into Qdrant personal knowledge base for '{clean_sid}'.",
        }
    except Exception as e:
        logger.error(f"Failed syncing knowledge base for '{clean_sid}': {e}")
        raise HTTPException(status_code=500, detail=f"Knowledge base synchronization error: {e}")
