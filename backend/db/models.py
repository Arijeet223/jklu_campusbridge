"""CampusBridge AI — PostgreSQL SQLAlchemy ORM Models (models.py).

Implements the relational architecture defined in PRD v1.1:
1. Student Profiles & Academic Standing (Accounts_Students)
2. Skill Evidence & Multi-Tier Verification Ledger (Skill_Evidence)
3. 4-Stage Applications & Recruitment Pipeline Tracker (Applications)
4. Bidirectional Dispute Drawer & Exception Queue (Disputes_And_Defenses)
5. Recruiter Opportunities & Job Descriptions (Opportunities_JDs)
6. Cohort Placement Analytics & Liquidity Funnel (Placement_Analytics)
7. Practice Banks (DSA & SQL Practice Arenas)
8. MCP Append-Only Audit Logs (MCP_Audit_Logs)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from backend.db.base import Base, TimestampMixin

# Use JSONB for PostgreSQL; JSON as portable fallback for SQLite/tests
JsonType = JSON().with_variant(JSONB, "postgresql")


# ═══════════════════════════════════════════════════════════════════════════
# 1. Student Profiles & Credentials
# ═══════════════════════════════════════════════════════════════════════════

class StudentProfile(Base, TimestampMixin):
    """Institutional student profile with deterministic academic gates & DPDP privacy."""

    __tablename__ = "student_profiles"

    student_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="STUDENT", nullable=False)
    roll_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    program: Mapped[str] = mapped_column(String(128), default="B.Tech CSE", nullable=False)
    cohort_year: Mapped[int] = mapped_column(Integer, default=2026, nullable=False)
    cgpa: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    active_backlogs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    privacy_shield_mode: Mapped[str] = mapped_column(
        String(64), default="OPT_IN_DRIVES", nullable=False
    )
    target_roles: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    readiness_index: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    sprint_mode_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    github_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    sms_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    telegram_chat_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    telegram_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    institution_id: Mapped[str] = mapped_column(String(64), default="inst-nitk-001", nullable=False)
    visibility_state: Mapped[dict[str, Any]] = mapped_column(JsonType, default=dict, nullable=False)
    academic_records: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    calculated_academic_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    profile_completeness: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    github_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resume_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    academic_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    selected_drives: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    share_info_with_juniors: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    evidence: Mapped[List[SkillEvidence]] = relationship(
        "SkillEvidence", back_populates="student", cascade="all, delete-orphan", lazy="selectin"
    )
    applications: Mapped[List[Application]] = relationship(
        "Application", back_populates="student", cascade="all, delete-orphan", lazy="selectin"
    )
    disputes: Mapped[List[EligibilityDispute]] = relationship(
        "EligibilityDispute", back_populates="student", cascade="all, delete-orphan", lazy="selectin"
    )

    def to_dict(self) -> dict[str, Any]:
        """Convert student record to API dict format."""
        return {
            "student_id": self.student_id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "roll_no": self.roll_no or "",
            "program": self.program,
            "cohort_year": self.cohort_year,
            "cgpa": float(self.cgpa),
            "active_backlogs": self.active_backlogs,
            "privacy_shield_mode": self.privacy_shield_mode,
            "target_roles": self.target_roles if isinstance(self.target_roles, list) else [],
            "readiness_index": float(self.readiness_index),
            "sprint_mode_active": bool(self.sprint_mode_active),
            "github_url": self.github_url or "",
            "phone_number": self.phone_number or (self.visibility_state or {}).get("phone_number") or "",
            "sms_notifications_enabled": bool(self.sms_notifications_enabled or (self.visibility_state or {}).get("sms_notifications_enabled", False)),
            "telegram_chat_id": self.telegram_chat_id or (self.visibility_state or {}).get("telegram_chat_id") or (self.visibility_state or {}).get("telegram_id") or "",
            "telegram_notifications_enabled": bool(self.telegram_notifications_enabled or (self.visibility_state or {}).get("telegram_notifications_enabled", (self.visibility_state or {}).get("allow_telegram_notifications", False))),
            "telegram_id": self.telegram_chat_id or (self.visibility_state or {}).get("telegram_id") or "",
            "allow_telegram_notifications": bool(self.telegram_notifications_enabled or (self.visibility_state or {}).get("allow_telegram_notifications", False)),
            "bio": (self.visibility_state or {}).get("bio") or "",
            "institution_id": self.institution_id,
            "visibility_state": self.visibility_state or {},
            "academic_records": self.academic_records if isinstance(self.academic_records, list) else [],
            "calculated_academic_score": float(self.calculated_academic_score or 0.0),
            "profile_completeness": float(self.profile_completeness or 0.0),
            "github_verified": bool(self.github_verified),
            "resume_verified": bool(self.resume_verified),
            "academic_verified": bool(self.academic_verified),
            "selected_drives": self.selected_drives if isinstance(self.selected_drives, list) else (self.visibility_state or {}).get("selected_drives", []),
            "share_info_with_juniors": bool(
                self.share_info_with_juniors
                or (self.visibility_state or {}).get("share_info_with_juniors", False)
            ),
        }


# ═══════════════════════════════════════════════════════════════════════════
# 2. Staff & Institutional Officers (Faculty Mentors & TPO)
# ═══════════════════════════════════════════════════════════════════════════

class StaffUser(Base, TimestampMixin):
    """Placement cell officers, faculty mentors, and academic administrators."""

    __tablename__ = "staff_users"

    staff_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(32), default="FACULTY", nullable=False
    )  # Strict 2-way system: STUDENT vs FACULTY
    department: Mapped[str] = mapped_column(String(128), default="Department of Computer Science & Placements")
    assigned_cohort: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    permissions_scope: Mapped[Optional[str]] = mapped_column(String(255), default="FACULTY_PLACEMENT_AUTHORITY")

    def to_dict(self) -> dict[str, Any]:
        return {
            "staff_id": self.staff_id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "assigned_cohort": self.assigned_cohort or "",
            "permissions_scope": self.permissions_scope or "",
        }


# ═══════════════════════════════════════════════════════════════════════════
# 3. Multi-Tier Skill Evidence Ledger
# ═══════════════════════════════════════════════════════════════════════════

class SkillEvidence(Base, TimestampMixin):
    """Evidence record tying student to verified capability with source provenance."""

    __tablename__ = "skill_evidence"

    evidence_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    student_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), index=True, nullable=False
    )
    skill_name: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="Core CS", nullable=False)
    tier: Mapped[str] = mapped_column(
        String(64), default="1_EXTRACTED_UNCONFIRMED", nullable=False
    )  # 1_EXTRACTED_UNCONFIRMED, 2_STUDENT_CONFIRMED, 3_ARTIFACT_LINKED, 4_ASSESSMENT_VERIFIED, 5_INSTITUTION_VERIFIED
    multiplier: Mapped[float] = mapped_column(Float, default=0.25, nullable=False)
    source_doc: Mapped[str] = mapped_column(String(255), default="Resume_v3.pdf", nullable=False)
    source_span_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.90, nullable=False)
    verified_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    defense_attempt_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationship
    student: Mapped[StudentProfile] = relationship("StudentProfile", back_populates="evidence")

    def to_dict(self) -> dict[str, Any]:
        return {
            "evidence_id": self.evidence_id,
            "student_id": self.student_id,
            "skill_name": self.skill_name,
            "category": self.category,
            "tier": self.tier,
            "multiplier": float(self.multiplier),
            "source_doc": self.source_doc,
            "source_span_text": self.source_span_text,
            "confidence": float(self.confidence),
            "verified_by": self.verified_by,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "defense_attempt_id": self.defense_attempt_id,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 4. 4-Stage Applications & Recruitment Pipeline Tracker
# ═══════════════════════════════════════════════════════════════════════════

class Application(Base, TimestampMixin):
    """PRD §5.1 & FR-037: 4-Stage Student Application Pipeline Tracker.

    Stage 1: APPLIED
    Stage 2: ELIGIBILITY_VERIFIED
    Stage 3: MICRO_DEFENSE_COMPLETE
    Stage 4: SHORTLISTED
    """

    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    student_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), index=True, nullable=False
    )
    job_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("opportunities_jds.job_id", ondelete="CASCADE"), index=True, nullable=False
    )
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    current_stage: Mapped[str] = mapped_column(
        String(32), default="APPLIED", nullable=False
    )  # APPLIED, ELIGIBILITY_VERIFIED, MICRO_DEFENSE_COMPLETE, SHORTLISTED
    eligibility_status: Mapped[str] = mapped_column(
        String(32), default="UNKNOWN", nullable=False
    )  # MEETS, DOES_NOT_MEET, UNKNOWN
    match_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0 to 100
    next_milestone: Mapped[str] = mapped_column(
        String(255), default="Awaiting Round 1 Shortlist", nullable=False
    )
    dispute_ticket_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("eligibility_disputes.ticket_id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    student: Mapped[StudentProfile] = relationship("StudentProfile", back_populates="applications")
    job: Mapped[OpportunityJD] = relationship("OpportunityJD", back_populates="applications")
    dispute: Mapped[Optional[EligibilityDispute]] = relationship("EligibilityDispute")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "jobId": self.job_id,
            "jobTitle": self.job_title,
            "company": self.company,
            "appliedAt": self.applied_at.isoformat() if self.applied_at else None,
            "currentStage": self.current_stage,
            "eligibilityStatus": self.eligibility_status,
            "matchScore": float(self.match_score),
            "nextMilestone": self.next_milestone,
            "disputeTicketId": self.dispute_ticket_id,
            "dispute": self.dispute.to_dict() if self.dispute else None,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 5. Dispute Drawer (Disputes & Defenses Exception Queue)
# ═══════════════════════════════════════════════════════════════════════════

class EligibilityDispute(Base, TimestampMixin):
    """PRD §4.6 & §11: Bidirectional Explain-or-Dispute Clarification Tickets."""

    __tablename__ = "eligibility_disputes"

    ticket_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    match_result_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    student_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(64), default="ELIGIBILITY_DISPUTE", nullable=False
    )  # ELIGIBILITY_DISPUTE, MICRO_DEFENSE_CHALLENGE
    target_job_or_skill: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    rule_label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    artifact_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    attached_document_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    attached_span: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    questions_and_answers_json: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JsonType, nullable=True
    )
    student_note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    ai_rubric_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    officer_status: Mapped[str] = mapped_column(
        String(32), default="PENDING_REVIEW", nullable=False
    )  # PENDING_REVIEW, APPROVED_OVERRIDE, REJECTED
    reason_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship
    student: Mapped[StudentProfile] = relationship("StudentProfile", back_populates="disputes")

    def to_dict(self) -> dict[str, Any]:
        return {
            "ticket_id": self.ticket_id,
            "id": self.ticket_id,
            "student_id": self.student_id,
            "matchResultId": self.match_result_id or "",
            "type": self.type,
            "target_job_or_skill": self.target_job_or_skill,
            "jobTitle": self.target_job_or_skill,
            "company": self.rule_label or "Placement Drive",
            "ruleId": self.rule_id or "",
            "ruleLabel": self.rule_label or "",
            "artifact_file": self.artifact_file or "",
            "attachedDocumentId": self.attached_document_id,
            "attachedSpan": self.attached_span,
            "questions_and_answers_json": self.questions_and_answers_json or {},
            "studentNote": self.student_note,
            "student_note": self.student_note,
            "ai_rubric_score": float(self.ai_rubric_score) if self.ai_rubric_score is not None else None,
            "officer_status": self.officer_status,
            "status": self.officer_status,
            "reason_code": self.reason_code or "",
            "reviewReasonCode": self.reason_code or "",
            "reviewed_by": self.reviewed_by or "",
            "reviewedBy": self.reviewed_by or "",
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
            "resolvedAt": self.resolved_at.isoformat() if self.resolved_at else None,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 6. Recruiter Opportunities & Job Descriptions (JDs)
# ═══════════════════════════════════════════════════════════════════════════

class OpportunityJD(Base, TimestampMixin):
    """Job Descriptions with hard academic cutoffs and weighted skills."""

    __tablename__ = "opportunities_jds"

    job_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    company_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    ctc_band: Mapped[str] = mapped_column(String(64), default="12-18 LPA", nullable=False)
    deadline_hours: Mapped[int] = mapped_column(Integer, default=48, nullable=False)
    min_cgpa: Mapped[float] = mapped_column(Float, default=7.0, nullable=False)
    max_backlogs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    allowed_branches: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    mandatory_skills_json: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    preferred_skills_json: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    approved_by_officer: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="APPROVED", nullable=False)
    announcement_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    resources: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)

    # Relationship
    applications: Mapped[List[Application]] = relationship(
        "Application", back_populates="job", cascade="all, delete-orphan", lazy="selectin"
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "job_id": self.job_id,
            "company_name": self.company_name,
            "role_title": self.role_title,
            "ctc_band": self.ctc_band,
            "deadline_hours": self.deadline_hours,
            "min_cgpa": float(self.min_cgpa),
            "max_backlogs": self.max_backlogs,
            "allowed_branches": self.allowed_branches if isinstance(self.allowed_branches, list) else [],
            "mandatory_skills_json": self.mandatory_skills_json if isinstance(self.mandatory_skills_json, list) else [],
            "preferred_skills_json": self.preferred_skills_json if isinstance(self.preferred_skills_json, list) else [],
            "approved_by_officer": bool(self.approved_by_officer),
            "status": self.status,
            "announcement_text": self.announcement_text or "",
            "external_link": self.external_link or "",
            "resources": self.resources if isinstance(self.resources, list) else [],
        }


# ═══════════════════════════════════════════════════════════════════════════
# 7. Placement Analytics & Cohort Liquidity Intelligence
# ═══════════════════════════════════════════════════════════════════════════

class PlacementAnalyticsSnapshot(Base, TimestampMixin):
    """PRD §11 & §13: K-Anonymous Placement Analytics with Small-Cell Suppression."""

    __tablename__ = "placement_analytics"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"snap-{uuid.uuid4().hex[:8]}")
    cohort_id: Mapped[str] = mapped_column(String(64), default="cohort-2026-cs", index=True, nullable=False)
    institution_id: Mapped[str] = mapped_column(String(64), default="inst-nitk-001", nullable=False)
    snapshot_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    total_cohort_size: Mapped[int] = mapped_column(Integer, default=240, nullable=False)
    eligible_count: Mapped[int] = mapped_column(Integer, default=142, nullable=False)
    shortlisted_count: Mapped[int] = mapped_column(Integer, default=38, nullable=False)
    placed_count: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    readiness_distribution: Mapped[dict[str, Any]] = mapped_column(JsonType, default=dict, nullable=False)
    requirement_funnel: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    liquidity_index: Mapped[float] = mapped_column(Float, default=74.5, nullable=False)
    k_anonymity_applied: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "cohort_id": self.cohort_id,
            "institution_id": self.institution_id,
            "snapshot_date": self.snapshot_date.isoformat() if self.snapshot_date else None,
            "total_cohort_size": self.total_cohort_size,
            "eligible_count": self.eligible_count,
            "shortlisted_count": self.shortlisted_count,
            "placed_count": self.placed_count,
            "readiness_distribution": self.readiness_distribution or {},
            "requirement_funnel": self.requirement_funnel or [],
            "liquidity_index": float(self.liquidity_index),
            "k_anonymity_applied": self.k_anonymity_applied,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 8. Practice Bank Arenas (DSA & SQL)
# ═══════════════════════════════════════════════════════════════════════════

class DSAPracticeProblem(Base, TimestampMixin):
    """Algorithmic challenges with test vectors and complexity constraints."""

    __tablename__ = "dsa_practice_bank"

    problem_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    topic: Mapped[str] = mapped_column(String(128), default="Algorithms", nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), default="Medium", nullable=False)
    company_tags: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    starter_code_python: Mapped[str] = mapped_column(Text, nullable=False)
    test_cases_json: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)
    optimal_time_complexity: Mapped[str] = mapped_column(String(64), default="O(n)", nullable=False)
    role_weight_impact: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            "problem_id": self.problem_id,
            "title": self.title,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "company_tags": self.company_tags,
            "problem_statement": self.problem_statement,
            "starter_code_python": self.starter_code_python,
            "test_cases_json": self.test_cases_json,
            "optimal_time_complexity": self.optimal_time_complexity,
            "role_weight_impact": float(self.role_weight_impact),
        }


class SQLPracticeProblem(Base, TimestampMixin):
    """SQL challenges with in-memory execution schema and expected output vectors."""

    __tablename__ = "sql_practice_bank"

    sql_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    concept: Mapped[str] = mapped_column(String(128), default="Window Functions", nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), default="Medium", nullable=False)
    schema_ddl: Mapped[str] = mapped_column(Text, nullable=False)
    sample_data_json: Mapped[dict[str, Any]] = mapped_column(JsonType, default=dict, nullable=False)
    question_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    expected_query: Mapped[str] = mapped_column(Text, nullable=False)
    expected_output_json: Mapped[list[Any]] = mapped_column(JsonType, default=list, nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            "sql_id": self.sql_id,
            "title": self.title,
            "concept": self.concept,
            "difficulty": self.difficulty,
            "schema_ddl": self.schema_ddl,
            "sample_data_json": self.sample_data_json,
            "question_prompt": self.question_prompt,
            "expected_query": self.expected_query,
            "expected_output_json": self.expected_output_json,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 9. Append-Only MCP Audit Trail
# ═══════════════════════════════════════════════════════════════════════════

class MCPAuditLog(Base):
    """Immutable audit trail for all MCP tool calls and officer reviews."""

    __tablename__ = "mcp_audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"log-{uuid.uuid4().hex[:10]}")
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False
    )
    request_id: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    actor_role: Mapped[str] = mapped_column(String(32), default="STUDENT", nullable=False)
    agent_name: Mapped[str] = mapped_column(String(64), default="CognitiveOrchestrator", nullable=False)
    mcp_server: Mapped[str] = mapped_column(String(64), default="student-profile", nullable=False)
    tool_name: Mapped[str] = mapped_column(String(64), nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS", nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "request_id": self.request_id,
            "actor_id": self.actor_id,
            "actor_role": self.actor_role,
            "agent_name": self.agent_name,
            "mcp_server": self.mcp_server,
            "tool_name": self.tool_name,
            "latency_ms": float(self.latency_ms),
            "status": self.status,
            "summary": self.summary,
        }



# ═══════════════════════════════════════════════════════════════════════════
# 10. Email Drafts (AI Voice Agent → Professor Outreach)
# ═══════════════════════════════════════════════════════════════════════════

class EmailDraft(Base, TimestampMixin):
    """Drafts generated by J.A.R.V.I.S. voice agent tool calls for student→professor outreach."""

    __tablename__ = "email_drafts"

    draft_id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"draft-{uuid.uuid4().hex[:8]}")
    student_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), index=True, nullable=False
    )
    professor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    professor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    subject_line: Mapped[str] = mapped_column(String(512), nullable=False)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="DRAFT", nullable=False
    )  # DRAFT, SENT, REVIEWED

    # Relationship
    student: Mapped[StudentProfile] = relationship("StudentProfile")

    def to_dict(self) -> dict[str, Any]:
        return {
            "draft_id": self.draft_id,
            "student_id": self.student_id,
            "professor_name": self.professor_name,
            "professor_email": self.professor_email,
            "topic": self.topic,
            "subject_line": self.subject_line,
            "body_text": self.body_text,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 11. Notifications (Dual-Channel & In-App Alerts)
# ═══════════════════════════════════════════════════════════════════════════

class Notification(Base, TimestampMixin):
    """Institutional in-app notifications for placement alerts, gates, and skill verifications."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"notif-{uuid.uuid4().hex[:10]}")
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tag: Mapped[Optional[str]] = mapped_column(String(64), default="Job Drive", nullable=True)
    link: Mapped[Optional[str]] = mapped_column(String(255), default="/student/matches", nullable=True)

    # Relationship
    student: Mapped[Optional[StudentProfile]] = relationship("StudentProfile")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "description": self.message,
            "is_read": bool(self.is_read),
            "unread": not bool(self.is_read),
            "tag": self.tag or "Job Drive",
            "tagColor": "bg-primary-container text-on-primary-container",
            "link": self.link or "/student/matches",
            "href": self.link or "/student/matches",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "time": "Just now",
        }

