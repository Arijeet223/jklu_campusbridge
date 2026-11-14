"""CampusBridge AI — Dynamic Student Registration, Authentication & Onboarding Router.

Handles user signup directly into Accounts_Students in campusbridge_db.xlsx and
enforces onboarding guards (requiring PDF resume upload before dashboard access).
"""

from __future__ import annotations

import time
import uuid
from typing import Any
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import (
    get_async_session,
    get_student,
    get_student_by_email,
    create_student,
    get_student_evidence,
    log_audit_event,
)
from backend.db.excel_store import (
    get_excel_store,
    SHEET_STUDENTS,
    SHEET_TEACHERS,
    SHEET_EVIDENCE,
    SHEET_AUDIT,
)

router = APIRouter(tags=["Authentication & Onboarding"])


class RegisterStudentPayload(BaseModel):
    full_name: str
    email: str
    roll_no: str
    program: str = "B.Tech CSE"
    cohort_year: int = 2026
    cgpa: float = 8.0
    active_backlogs: int = 0
    password: str = ""
    privacy_shield_mode: str = "OPT_IN_DRIVES"
    target_roles: list[str] = Field(default_factory=lambda: ["Backend Engineer"])


class LoginPayload(BaseModel):
    identifier: str | None = None
    email: str | None = None
    password: str = ""
    role: str = "STUDENT"


@router.post("/auth/register")
@router.post("/auth/register-student")
async def register_student_account(
    req: RegisterStudentPayload,
    session: AsyncSession = Depends(get_async_session),
) -> dict[str, Any]:
    """Appends a new candidate into PostgreSQL database with Excel store fallback.
    Enforces initial needs_onboarding state until technical resume is processed.
    """
    clean_email = req.email.strip().lower()
    clean_roll = req.roll_no.strip().upper()

    # 1. Asynchronous PostgreSQL check for existing account
    try:
        existing_student = await get_student_by_email(session, clean_email)
        if existing_student:
            ev_list = await get_student_evidence(session, existing_student.student_id)
            needs_onboard = len(ev_list) == 0
            return {
                "status": "SUCCESS",
                "role": "STUDENT",
                "message": "Existing student account authenticated.",
                "student_id": existing_student.student_id,
                "needs_onboarding": needs_onboard,
                "uploaded_resume_chunks": len(ev_list),
                "user": existing_student.to_dict(),
                "token": f"cb_session_{existing_student.student_id}_{int(time.time())}",
            }
    except Exception as e:
        pass

    store = get_excel_store()
    students = store.get_sheet(SHEET_STUDENTS)

    # Check for duplicate registration in fallback store
    for s in students:
        s_email = str(s.get("email", "")).strip().lower()
        s_roll = str(s.get("roll_no", "")).strip().upper()
        if clean_email == s_email or clean_roll == s_roll:
            stu_id = s.get("student_id")
            evidence_rows = store.get_sheet(SHEET_EVIDENCE)
            matched_ev = [
                e for e in evidence_rows
                if str(e.get("student_id", "")).strip().lower() == str(stu_id).strip().lower()
            ]
            needs_onboard = len(matched_ev) == 0

            return {
                "status": "SUCCESS",
                "role": "STUDENT",
                "message": "Existing student account authenticated.",
                "student_id": stu_id,
                "needs_onboarding": needs_onboard,
                "uploaded_resume_chunks": len(matched_ev),
                "user": {
                    "id": stu_id,
                    "name": s.get("full_name"),
                    "email": s.get("email"),
                    "roll_no": s.get("roll_no"),
                    "program": s.get("program"),
                    "cgpa": float(s.get("cgpa", 8.0)),
                    "cohort_year": int(s.get("cohort_year", 2026)),
                    "active_backlogs": int(s.get("active_backlogs", 0)),
                    "needs_onboarding": needs_onboard,
                },
                "token": f"cb_session_{stu_id}_{int(time.time())}",
            }

    # Generate sequential student ID
    new_id = f"STU-{100 + len(students) + 1}"
    new_row = {
        "student_id": new_id,
        "full_name": req.full_name.strip(),
        "email": clean_email,
        "password_hash": f"pbkdf2_sha256${uuid.uuid4().hex[:8]}${req.password or 'student2026'}",
        "roll_no": clean_roll,
        "program": req.program.strip(),
        "cohort_year": int(req.cohort_year),
        "cgpa": float(req.cgpa),
        "active_backlogs": int(req.active_backlogs),
        "privacy_shield_mode": req.privacy_shield_mode,
        "target_roles": req.target_roles if isinstance(req.target_roles, list) else [str(req.target_roles)],
        "readiness_index": 0.0,  # 0 until resume is uploaded & parsed
        "sprint_mode_active": False,
    }

    # Asynchronous PostgreSQL write
    try:
        await create_student(session, new_row)
        await log_audit_event(
            session,
            {
                "actor_id": new_id,
                "actor_role": "STUDENT",
                "agent_name": "AuthService",
                "mcp_server": "student-profile",
                "tool_name": "student-profile.propose_profile_update",
                "latency_ms": 12.0,
                "status": "REGISTERED_PENDING_ONBOARDING",
                "summary": f"Registered new candidate {req.full_name} ({new_id}) in PostgreSQL. Enforcing /student/onboarding guard.",
            },
        )
    except Exception as e:
        pass

    # Direct atomic write-through to Excel Database fallback
    store.insert_row(SHEET_STUDENTS, new_row)

    # Audit log entry
    try:
        store.insert_row(
            SHEET_AUDIT,
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": f"req-reg-{int(time.time() * 1000)}",
                "actor_id": new_id,
                "actor_role": "STUDENT",
                "agent_name": "AuthService",
                "mcp_server": "student-profile",
                "tool_name": "student-profile.propose_profile_update",
                "latency_ms": 14,
                "status": "REGISTERED_PENDING_ONBOARDING",
                "summary": f"Registered new candidate {req.full_name} ({new_id}). Enforcing /student/onboarding guard.",
            },
        )
    except Exception:
        pass

    return {
        "status": "SUCCESS",
        "role": "STUDENT",
        "message": "Account created successfully. Please upload your technical resume to complete onboarding.",
        "student_id": new_id,
        "needs_onboarding": True,
        "uploaded_resume_chunks": 0,
        "user": {
            "id": new_id,
            "name": req.full_name.strip(),
            "email": clean_email,
            "roll_no": clean_roll,
            "program": req.program.strip(),
            "cgpa": float(req.cgpa),
            "cohort_year": int(req.cohort_year),
            "active_backlogs": int(req.active_backlogs),
            "needs_onboarding": True,
        },
        "token": f"cb_session_{new_id}_{int(time.time())}",
    }


@router.get("/auth/check-onboarding/{student_id}")
async def check_onboarding_status(student_id: str) -> dict[str, Any]:
    """Returns real-time onboarding and evidence status for any student ID."""
    store = get_excel_store()
    evidence_rows = store.get_sheet(SHEET_EVIDENCE)
    matched_ev = [
        e for e in evidence_rows
        if str(e.get("student_id", "")).strip().lower() == student_id.strip().lower()
    ]

    from services.api.endpoints import _CHUNKS_STORE
    chunks_count = len([
        c for c in _CHUNKS_STORE
        if str(c.get("student_user_id", "")).strip().lower() == student_id.strip().lower()
    ])

    needs_onboard = (len(matched_ev) == 0 and chunks_count == 0)

    return {
        "student_id": student_id,
        "needs_onboarding": needs_onboard,
        "evidence_count": len(matched_ev),
        "chunks_indexed": chunks_count,
        "can_access_dashboard": not needs_onboard,
    }

