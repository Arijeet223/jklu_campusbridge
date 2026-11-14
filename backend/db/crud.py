"""CampusBridge AI — Asynchronous SQLAlchemy CRUD Repository (crud.py).

High-performance, non-blocking asynchronous database operations replacing legacy
openpyxl and pandas file read/write routines.
"""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple

from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import (
    Application,
    DSAPracticeProblem,
    EligibilityDispute,
    MCPAuditLog,
    OpportunityJD,
    PlacementAnalyticsSnapshot,
    SkillEvidence,
    SQLPracticeProblem,
    StaffUser,
    StudentProfile,
)


# ═══════════════════════════════════════════════════════════════════════════
# 1. Student Profiles CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def get_student(session: AsyncSession, student_id: str) -> Optional[StudentProfile]:
    """Retrieve student profile by primary ID."""
    stmt = select(StudentProfile).where(StudentProfile.student_id == student_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_student_by_email(session: AsyncSession, email: str) -> Optional[StudentProfile]:
    """Retrieve student profile by institutional email."""
    stmt = select(StudentProfile).where(func.lower(StudentProfile.email) == email.lower().strip())
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_students(
    session: AsyncSession, limit: int = 100, offset: int = 0
) -> List[StudentProfile]:
    """List student profiles with pagination."""
    stmt = select(StudentProfile).order_by(StudentProfile.student_id).limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create_student(session: AsyncSession, data: dict[str, Any]) -> StudentProfile:
    """Insert a new student profile."""
    student = StudentProfile(
        student_id=data.get("student_id") or f"STU-{int(time.time() * 1000) % 100000}",
        full_name=data.get("full_name") or data.get("name") or "Unnamed Student",
        email=data["email"],
        password_hash=data.get("password_hash"),
        role=data.get("role", "STUDENT"),
        roll_no=data.get("roll_no"),
        program=data.get("program", "B.Tech CSE"),
        cohort_year=int(data.get("cohort_year", 2026)),
        cgpa=float(data.get("cgpa", 0.0)),
        active_backlogs=int(data.get("active_backlogs", 0)),
        privacy_shield_mode=data.get("privacy_shield_mode", "OPT_IN_DRIVES"),
        target_roles=data.get("target_roles", ["Backend Engineer"]),
        readiness_index=float(data.get("readiness_index", 50.0)),
        sprint_mode_active=bool(data.get("sprint_mode_active", True)),
        github_url=data.get("github_url"),
        institution_id=data.get("institution_id", "inst-nitk-001"),
        visibility_state=data.get("visibility_state", {}),
    )
    session.add(student)
    await session.flush()
    return student


async def update_student(
    session: AsyncSession, student_id: str, updates: dict[str, Any]
) -> Optional[StudentProfile]:
    """Update fields on an existing student profile."""
    student = await get_student(session, student_id)
    if not student:
        return None

    for key, value in updates.items():
        if hasattr(student, key) and key not in ("student_id", "created_at"):
            setattr(student, key, value)

    student.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return student


async def upsert_student(session: AsyncSession, data: dict[str, Any]) -> StudentProfile:
    """Idempotently create or update a student profile."""
    student_id = data.get("student_id")
    student = await get_student(session, student_id) if student_id else None

    if student:
        return await update_student(session, student_id, data)
    return await create_student(session, data)


# ═══════════════════════════════════════════════════════════════════════════
# 2. Staff & Institutional Officers CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def get_staff(session: AsyncSession, staff_id: str) -> Optional[StaffUser]:
    """Retrieve staff account by ID."""
    stmt = select(StaffUser).where(StaffUser.staff_id == staff_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_staff_by_email(session: AsyncSession, email: str) -> Optional[StaffUser]:
    """Retrieve staff account by email."""
    stmt = select(StaffUser).where(func.lower(StaffUser.email) == email.lower().strip())
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_staff(session: AsyncSession) -> List[StaffUser]:
    """List all institutional staff members."""
    stmt = select(StaffUser).order_by(StaffUser.staff_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create_staff(session: AsyncSession, data: dict[str, Any]) -> StaffUser:
    """Insert a new faculty or placement officer account."""
    staff = StaffUser(
        staff_id=data.get("staff_id") or f"STF-{uuid.uuid4().hex[:6]}",
        full_name=data.get("full_name") or data.get("name") or "Staff Member",
        email=data["email"],
        password_hash=data["password_hash"],
        role=data.get("role", "PLACEMENT_OFFICER"),
        department=data.get("department", "Central Placement Cell"),
        assigned_cohort=data.get("assigned_cohort"),
        permissions_scope=data.get("permissions_scope", "OFFICER_FULL"),
    )
    session.add(staff)
    await session.flush()
    return staff


# ═══════════════════════════════════════════════════════════════════════════
# 3. Skill Evidence Ledger CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def get_student_evidence(session: AsyncSession, student_id: str) -> List[SkillEvidence]:
    """Retrieve all verified or extracted skill evidence items for a student."""
    stmt = (
        select(SkillEvidence)
        .where(SkillEvidence.student_id == student_id)
        .order_by(desc(SkillEvidence.multiplier), SkillEvidence.skill_name)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_evidence_by_id(session: AsyncSession, evidence_id: str) -> Optional[SkillEvidence]:
    """Retrieve a single evidence item by ID."""
    stmt = select(SkillEvidence).where(SkillEvidence.evidence_id == evidence_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_evidence(session: AsyncSession, data: dict[str, Any]) -> SkillEvidence:
    """Insert a new evidence entry with source span provenance."""
    evidence = SkillEvidence(
        evidence_id=data.get("evidence_id") or f"EV-{int(time.time() * 1000)}-{uuid.uuid4().hex[:4]}",
        student_id=data["student_id"],
        skill_name=data["skill_name"],
        category=data.get("category", "Core CS"),
        tier=data.get("tier", "1_EXTRACTED_UNCONFIRMED"),
        multiplier=float(data.get("multiplier", 0.25)),
        source_doc=data.get("source_doc", "Resume_v3.pdf"),
        source_span_text=data.get("source_span_text", ""),
        confidence=float(data.get("confidence", 0.90)),
        verified_by=data.get("verified_by"),
        defense_attempt_id=data.get("defense_attempt_id"),
    )
    session.add(evidence)
    await session.flush()
    return evidence


async def confirm_evidence(
    session: AsyncSession, student_id: str, evidence_id: str
) -> Optional[SkillEvidence]:
    """Upgrade a provisional Ghost Card into a Student-Confirmed evidence row."""
    stmt = select(SkillEvidence).where(
        SkillEvidence.student_id == student_id,
        SkillEvidence.evidence_id == evidence_id,
    )
    result = await session.execute(stmt)
    ev = result.scalar_one_or_none()
    if not ev:
        return None

    ev.tier = "2_STUDENT_CONFIRMED"
    ev.multiplier = max(ev.multiplier, 0.50)
    ev.verified_at = datetime.now(timezone.utc)
    ev.verified_by = "Student Owner"
    ev.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return ev


async def bulk_insert_evidence(
    session: AsyncSession, items: list[dict[str, Any]]
) -> List[SkillEvidence]:
    """Insert multiple skill evidence entries in a single batch transaction."""
    created = []
    for d in items:
        ev = SkillEvidence(
            evidence_id=d.get("evidence_id") or f"EV-{int(time.time() * 1000)}-{uuid.uuid4().hex[:4]}",
            student_id=d["student_id"],
            skill_name=d["skill_name"],
            category=d.get("category", "Core CS"),
            tier=d.get("tier", "1_EXTRACTED_UNCONFIRMED"),
            multiplier=float(d.get("multiplier", 0.25)),
            source_doc=d.get("source_doc", "Resume.pdf"),
            source_span_text=d.get("source_span_text", ""),
            confidence=float(d.get("confidence", 0.90)),
            verified_by=d.get("verified_by"),
        )
        session.add(ev)
        created.append(ev)
    await session.flush()
    return created


# ═══════════════════════════════════════════════════════════════════════════
# 4. 4-Stage Applications Tracker CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def list_applications(
    session: AsyncSession,
    student_id: Optional[str] = None,
    stage: Optional[str] = None,
) -> List[Application]:
    """List applications filtered by student and/or recruitment stage."""
    stmt = select(Application)
    if student_id:
        stmt = stmt.where(Application.student_id == student_id)
    if stage:
        stmt = stmt.where(Application.current_stage == stage)
    stmt = stmt.order_by(desc(Application.applied_at))

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_application(session: AsyncSession, application_id: str) -> Optional[Application]:
    """Retrieve an application by ID."""
    stmt = select(Application).where(Application.id == application_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_application(session: AsyncSession, data: dict[str, Any]) -> Application:
    """Create a new job application in Stage 1: APPLIED."""
    app = Application(
        id=data.get("id") or f"app-{uuid.uuid4().hex[:8]}",
        student_id=data["student_id"],
        job_id=data["job_id"],
        job_title=data.get("job_title", "Software Engineer"),
        company=data.get("company", "Company"),
        applied_at=data.get("applied_at") or datetime.now(timezone.utc),
        current_stage=data.get("current_stage", "APPLIED"),
        eligibility_status=data.get("eligibility_status", "UNKNOWN"),
        match_score=float(data.get("match_score", 0.0)),
        next_milestone=data.get("next_milestone", "Awaiting Eligibility Check"),
        dispute_ticket_id=data.get("dispute_ticket_id"),
    )
    session.add(app)
    await session.flush()
    return app


async def update_application_stage(
    session: AsyncSession,
    application_id: str,
    new_stage: str,
    next_milestone: Optional[str] = None,
) -> Optional[Application]:
    """Advance an application along the 4-stage pipeline."""
    app = await get_application(session, application_id)
    if not app:
        return None

    app.current_stage = new_stage
    if next_milestone:
        app.next_milestone = next_milestone
    app.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return app


# ═══════════════════════════════════════════════════════════════════════════
# 5. Dispute Drawer & Exception Queue CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def list_disputes(
    session: AsyncSession,
    student_id: Optional[str] = None,
    officer_status: Optional[str] = None,
) -> List[EligibilityDispute]:
    """List disputes with optional filtering by student and resolution status."""
    stmt = select(EligibilityDispute)
    if student_id:
        stmt = stmt.where(EligibilityDispute.student_id == student_id)
    if officer_status:
        stmt = stmt.where(EligibilityDispute.officer_status == officer_status)
    stmt = stmt.order_by(desc(EligibilityDispute.submitted_at))

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_dispute(session: AsyncSession, ticket_id: str) -> Optional[EligibilityDispute]:
    """Retrieve dispute ticket by ID."""
    stmt = select(EligibilityDispute).where(EligibilityDispute.ticket_id == ticket_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_dispute(session: AsyncSession, data: dict[str, Any]) -> EligibilityDispute:
    """Submit a new dispute ticket into the Placement Officer Exception Queue."""
    ticket = EligibilityDispute(
        ticket_id=data.get("ticket_id") or f"DISP-{int(time.time() * 1000) % 100000}",
        match_result_id=data.get("match_result_id"),
        student_id=data["student_id"],
        type=data.get("type", "ELIGIBILITY_DISPUTE"),
        target_job_or_skill=data.get("target_job_or_skill", "General Requirement"),
        rule_id=data.get("rule_id"),
        rule_label=data.get("rule_label"),
        artifact_file=data.get("artifact_file"),
        attached_document_id=data.get("attached_document_id"),
        attached_span=data.get("attached_span"),
        questions_and_answers_json=data.get("questions_and_answers_json"),
        student_note=data.get("student_note", ""),
        ai_rubric_score=float(data["ai_rubric_score"]) if data.get("ai_rubric_score") is not None else None,
        officer_status=data.get("officer_status", "PENDING_REVIEW"),
        reason_code=data.get("reason_code"),
        reviewed_by=data.get("reviewed_by"),
    )
    session.add(ticket)
    await session.flush()
    return ticket


async def adjudicate_dispute(
    session: AsyncSession,
    ticket_id: str,
    officer_status: str,
    reason_code: str,
    reviewed_by: str,
) -> Optional[EligibilityDispute]:
    """Adjudicate a dispute ticket (APPROVED_OVERRIDE or REJECTED) with mandatory reason code."""
    ticket = await get_dispute(session, ticket_id)
    if not ticket:
        return None

    ticket.officer_status = officer_status
    ticket.reason_code = reason_code
    ticket.reviewed_by = reviewed_by
    ticket.resolved_at = datetime.now(timezone.utc)
    ticket.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return ticket


# ═══════════════════════════════════════════════════════════════════════════
# 6. Opportunities & Job Descriptions CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def list_jobs(session: AsyncSession, approved_only: bool = False) -> List[OpportunityJD]:
    """List opportunities from the registry."""
    stmt = select(OpportunityJD)
    if approved_only:
        stmt = stmt.where(OpportunityJD.approved_by_officer == True)  # noqa: E712
    stmt = stmt.order_by(desc(OpportunityJD.created_at))

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_job(session: AsyncSession, job_id: str) -> Optional[OpportunityJD]:
    """Retrieve a job posting by ID."""
    stmt = select(OpportunityJD).where(OpportunityJD.job_id == job_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_job(session: AsyncSession, data: dict[str, Any]) -> OpportunityJD:
    """Create a new job posting."""
    job = OpportunityJD(
        job_id=data.get("job_id") or f"job-{uuid.uuid4().hex[:6]}",
        company_name=data["company_name"],
        role_title=data["role_title"],
        ctc_band=data.get("ctc_band", "12-18 LPA"),
        deadline_hours=int(data.get("deadline_hours", 48)),
        min_cgpa=float(data.get("min_cgpa", 7.0)),
        max_backlogs=int(data.get("max_backlogs", 0)),
        allowed_branches=data.get("allowed_branches", ["B.Tech CSE", "B.Tech IT"]),
        mandatory_skills_json=data.get("mandatory_skills_json", []),
        preferred_skills_json=data.get("preferred_skills_json", []),
        approved_by_officer=bool(data.get("approved_by_officer", True)),
        status=data.get("status", "APPROVED"),
    )
    session.add(job)
    await session.flush()
    return job


# ═══════════════════════════════════════════════════════════════════════════
# 7. Placement Analytics & Cohort Intelligence CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def get_cohort_summary(
    session: AsyncSession, cohort_year: int = 2026, min_k_anonymity: int = 5
) -> dict[str, Any]:
    """Calculate aggregate cohort liquidity with DPDP small-cell suppression (< 5 counts masked)."""
    # Total students in cohort
    stmt_total = select(func.count()).select_from(StudentProfile).where(StudentProfile.cohort_year == cohort_year)
    total_students = (await session.execute(stmt_total)).scalar() or 0

    # High readiness (>= 80)
    stmt_ready = (
        select(func.count())
        .select_from(StudentProfile)
        .where(StudentProfile.cohort_year == cohort_year, StudentProfile.readiness_index >= 80)
    )
    raw_ready = (await session.execute(stmt_ready)).scalar() or 0

    # Developing readiness (60-79)
    stmt_dev = (
        select(func.count())
        .select_from(StudentProfile)
        .where(
            StudentProfile.cohort_year == cohort_year,
            StudentProfile.readiness_index >= 60,
            StudentProfile.readiness_index < 80,
        )
    )
    raw_developing = (await session.execute(stmt_dev)).scalar() or 0

    # Needs verification (< 60)
    stmt_needs = (
        select(func.count())
        .select_from(StudentProfile)
        .where(StudentProfile.cohort_year == cohort_year, StudentProfile.readiness_index < 60)
    )
    raw_needs = (await session.execute(stmt_needs)).scalar() or 0

    # Backlog cases
    stmt_backlog = (
        select(func.count())
        .select_from(StudentProfile)
        .where(StudentProfile.cohort_year == cohort_year, StudentProfile.active_backlogs > 0)
    )
    raw_backlog = (await session.execute(stmt_backlog)).scalar() or 0

    def _suppress(count: int) -> str | int:
        if 0 < count < min_k_anonymity:
            return f"< {min_k_anonymity}"
        return count

    return {
        "cohort_year": cohort_year,
        "total_cohort_size": total_students,
        "k_anonymity_applied": True,
        "readiness_tiers": {
            "high_alignment_verified": _suppress(raw_ready),
            "moderate_developing": _suppress(raw_developing),
            "unverified_needs_micro_defense": _suppress(raw_needs),
            "academic_exception_cases": _suppress(raw_backlog),
        },
        "privacy_disclosure": "Counts below threshold (5) are masked per DPDP k-anonymity compliance.",
    }


async def record_analytics_snapshot(
    session: AsyncSession, data: dict[str, Any]
) -> PlacementAnalyticsSnapshot:
    """Record an immutable cohort liquidity snapshot for historical tracking."""
    snap = PlacementAnalyticsSnapshot(
        id=data.get("id") or f"snap-{uuid.uuid4().hex[:8]}",
        cohort_id=data.get("cohort_id", "cohort-2026-cs"),
        institution_id=data.get("institution_id", "inst-nitk-001"),
        snapshot_date=data.get("snapshot_date") or datetime.now(timezone.utc),
        total_cohort_size=int(data.get("total_cohort_size", 240)),
        eligible_count=int(data.get("eligible_count", 142)),
        shortlisted_count=int(data.get("shortlisted_count", 38)),
        placed_count=int(data.get("placed_count", 24)),
        readiness_distribution=data.get("readiness_distribution", {}),
        requirement_funnel=data.get("requirement_funnel", []),
        liquidity_index=float(data.get("liquidity_index", 74.5)),
        k_anonymity_applied=bool(data.get("k_anonymity_applied", True)),
    )
    session.add(snap)
    await session.flush()
    return snap


# ═══════════════════════════════════════════════════════════════════════════
# 8. Practice Banks CRUD (DSA & SQL)
# ═══════════════════════════════════════════════════════════════════════════

async def list_dsa_problems(
    session: AsyncSession, topic: Optional[str] = None
) -> List[DSAPracticeProblem]:
    """Retrieve practice problems from the DSA bank."""
    stmt = select(DSAPracticeProblem)
    if topic:
        stmt = stmt.where(DSAPracticeProblem.topic == topic)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_dsa_problem(session: AsyncSession, problem_id: str) -> Optional[DSAPracticeProblem]:
    """Retrieve a single DSA problem by ID."""
    stmt = select(DSAPracticeProblem).where(DSAPracticeProblem.problem_id == problem_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_sql_problems(
    session: AsyncSession, concept: Optional[str] = None
) -> List[SQLPracticeProblem]:
    """Retrieve practice problems from the SQL bank."""
    stmt = select(SQLPracticeProblem)
    if concept:
        stmt = stmt.where(SQLPracticeProblem.concept == concept)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_sql_problem(session: AsyncSession, sql_id: str) -> Optional[SQLPracticeProblem]:
    """Retrieve a single SQL problem by ID."""
    stmt = select(SQLPracticeProblem).where(SQLPracticeProblem.sql_id == sql_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# ═══════════════════════════════════════════════════════════════════════════
# 9. MCP Append-Only Audit Logs CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def log_audit_event(session: AsyncSession, data: dict[str, Any]) -> MCPAuditLog:
    """Append-only audit logging for all MCP operations and officer reviews."""
    log = MCPAuditLog(
        id=data.get("id") or f"log-{uuid.uuid4().hex[:10]}",
        timestamp=data.get("timestamp") or datetime.now(timezone.utc),
        request_id=data.get("request_id") or f"req-{uuid.uuid4().hex[:8]}",
        actor_id=data.get("actor_id", "system"),
        actor_role=data.get("actor_role", "STUDENT"),
        agent_name=data.get("agent_name", "CognitiveOrchestrator"),
        mcp_server=data.get("mcp_server", "student-profile"),
        tool_name=data.get("tool_name", "unknown"),
        latency_ms=float(data.get("latency_ms", 0.0)),
        status=data.get("status", "SUCCESS"),
        summary=data.get("summary", ""),
    )
    session.add(log)
    await session.flush()
    return log



# ═══════════════════════════════════════════════════════════════════════════
# 10. Email Drafts CRUD
# ═══════════════════════════════════════════════════════════════════════════

async def create_email_draft(session: AsyncSession, data: dict[str, Any]) -> "EmailDraft":
    """Create a new email draft generated by the voice agent."""
    from backend.db.models import EmailDraft
    draft = EmailDraft(
        draft_id=data.get("draft_id") or f"draft-{uuid.uuid4().hex[:8]}",
        student_id=data["student_id"],
        professor_name=data["professor_name"],
        professor_email=data.get("professor_email"),
        topic=data["topic"],
        subject_line=data["subject_line"],
        body_text=data["body_text"],
        status=data.get("status", "DRAFT"),
    )
    session.add(draft)
    await session.flush()
    return draft


async def list_email_drafts(session: AsyncSession, student_id: str) -> list:
    """List all email drafts for a student."""
    from backend.db.models import EmailDraft
    stmt = select(EmailDraft).where(EmailDraft.student_id == student_id).order_by(desc(EmailDraft.created_at))
    result = await session.execute(stmt)
    return list(result.scalars().all())
