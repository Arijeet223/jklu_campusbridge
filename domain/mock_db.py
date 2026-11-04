"""CampusBridge AI — Canonical In-Memory Mock Data Store.

Decouples data access from API endpoints to prevent circular dependencies
between MCP servers, domain services, and FastAPI routers.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from domain.models import (
    EvidenceStatus,
    JobRequirement,
    RequirementCategory,
    RequirementType,
    SkillEvidence,
    SourceSpan,
)

_NOW = datetime(2026, 10, 28, 10, 0, 0, tzinfo=timezone.utc)

# Stable identifiers
_SKILL_PYTHON = "skill-python-001"
_SKILL_FASTAPI = "skill-fastapi-002"
_SKILL_SQL = "skill-sql-003"
_SKILL_DOCKER = "skill-docker-004"
_SKILL_KUBERNETES = "skill-k8s-005"
_SKILL_REACT = "skill-react-006"
_SKILL_TYPESCRIPT = "skill-ts-007"
_SKILL_NODEJS = "skill-nodejs-008"
_SKILL_AWS = "skill-aws-009"
_SKILL_GIT = "skill-git-010"

_JOB_BACKEND = "job-backend-techcorp-001"
_JOB_FULLSTACK = "job-fullstack-innovateco-002"

_PRIYA_ID = "student-priya-001"
_PRIYA_EXTRACTED_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

def _ev(
    student_id: str,
    skill_id: str,
    skill_name: str,
    proficiency: float,
    status: EvidenceStatus,
    doc_id: str = "resume-001",
    start: int = 0,
    end: int = 50,
    confidence: float = 0.92,
    *,
    ev_id: uuid.UUID | None = None,
) -> SkillEvidence:
    return SkillEvidence(
        id=ev_id or uuid.uuid4(),
        student_user_id=student_id,
        skill_id=skill_id,
        skill_name=skill_name,
        proficiency_level=proficiency,
        source_document_id=doc_id,
        source_span=SourceSpan(start_char=start, end_char=end, section_path="Skills"),
        evidence_status=status,
        extraction_confidence=confidence,
        verified_by="system" if status in {EvidenceStatus.ASSESSMENT_VERIFIED, EvidenceStatus.INSTITUTION_VERIFIED} else None,
        verified_at=_NOW if status in {EvidenceStatus.ASSESSMENT_VERIFIED, EvidenceStatus.INSTITUTION_VERIFIED} else None,
    )

_AARAV_ID = "STU-101"
_AARAV_PROFILE = {
    "name": "Aarav Sharma",
    "degree": "B.Tech",
    "branch": "Computer Science & Engineering",
    "program": "B.Tech CSE",
    "grad_year": 2026,
    "cgpa": 8.42,
    "institution": "National Institute of Technology, Surathkal",
    "career_preferences": {
        "role_families": ["Backend Engineering", "Distributed Systems", "Cloud Architecture"],
        "locations": ["Bangalore", "Hyderabad", "Remote"],
        "work_mode": "HYBRID",
    },
}
_AARAV_EVIDENCE: list[SkillEvidence] = [
    _ev(_AARAV_ID, _SKILL_PYTHON, "Python", 0.90, EvidenceStatus.ASSESSMENT_VERIFIED, "assessment-py-101", 0, 50),
    _ev(_AARAV_ID, _SKILL_FASTAPI, "FastAPI Microservices", 0.85, EvidenceStatus.ASSESSMENT_VERIFIED, "resume-001", 0, 50),
    _ev(_AARAV_ID, _SKILL_SQL, "SQL & Database Design", 0.88, EvidenceStatus.ASSESSMENT_VERIFIED, "project-db-app", 0, 50),
    _ev(_AARAV_ID, _SKILL_DOCKER, "Docker Containerization", 0.78, EvidenceStatus.STUDENT_CONFIRMED, "resume-001", 0, 50),
    _ev(_AARAV_ID, _SKILL_GIT, "Git Version Control", 0.85, EvidenceStatus.INSTITUTION_VERIFIED, "lms-records", 0, 50),
    _ev(_AARAV_ID, _SKILL_REACT, "React & Next.js", 0.70, EvidenceStatus.STUDENT_CONFIRMED, "resume-001", 0, 50),
]


_PRIYA_PROFILE = {
    "name": "Priya Sharma",
    "degree": "B.Tech",
    "branch": "Computer Science",
    "grad_year": 2027,
    "cgpa": 8.2,
    "institution": "National Institute of Technology, Surathkal",
    "career_preferences": {
        "role_families": ["Backend Engineering", "Distributed Systems"],
        "locations": ["Bangalore", "Hyderabad", "Remote"],
        "work_mode": "HYBRID",
    },
}

_PRIYA_EVIDENCE: list[SkillEvidence] = [
    _ev(_PRIYA_ID, _SKILL_PYTHON, "Python", 0.85, EvidenceStatus.ASSESSMENT_VERIFIED, "assessment-py-101", 0, 50),
    _ev(_PRIYA_ID, _SKILL_FASTAPI, "FastAPI", 0.70, EvidenceStatus.STUDENT_CONFIRMED, "resume-001", 0, 50),
    _ev(_PRIYA_ID, _SKILL_SQL, "SQL", 0.75, EvidenceStatus.ARTIFACT_LINKED, "project-db-app", 0, 50),
    _ev(_PRIYA_ID, _SKILL_DOCKER, "Docker", 0.60, EvidenceStatus.STUDENT_CONFIRMED, "resume-001", 0, 50),
    _ev(_PRIYA_ID, _SKILL_REACT, "React", 0.50, EvidenceStatus.EXTRACTED, "resume-001", 0, 50, ev_id=_PRIYA_EXTRACTED_ID),
    _ev(_PRIYA_ID, _SKILL_GIT, "Git", 0.80, EvidenceStatus.INSTITUTION_VERIFIED, "lms-records", 0, 50),
]

_STUDENTS_BY_ID: dict[str, tuple[dict, list[SkillEvidence]]] = {
    _PRIYA_ID: (_PRIYA_PROFILE, _PRIYA_EVIDENCE),
    _AARAV_ID: (_AARAV_PROFILE, _AARAV_EVIDENCE),
    "STU-101": (_AARAV_PROFILE, _AARAV_EVIDENCE),
    "aarav.sharma@university.edu.in": (_AARAV_PROFILE, _AARAV_EVIDENCE),
    "aarav.sharma@nitk.edu": (_AARAV_PROFILE, _AARAV_EVIDENCE),
    "student-aarav-002": (
        {"name": "Aarav Patel", "degree": "B.Tech", "branch": "Computer Science", "grad_year": 2027, "cgpa": 9.1},
        [_ev("student-aarav-002", _SKILL_PYTHON, "Python", 0.95, EvidenceStatus.ASSESSMENT_VERIFIED)],
    ),
    "student-ananya-003": (
        {"name": "Ananya Iyer", "degree": "B.Tech", "branch": "Information Technology", "grad_year": 2027, "cgpa": 7.4},
        [_ev("student-ananya-003", _SKILL_FASTAPI, "FastAPI", 0.65, EvidenceStatus.STUDENT_CONFIRMED)],
    ),
}

_MOCK_STUDENTS = [
    (_AARAV_ID, _AARAV_PROFILE, _AARAV_EVIDENCE),
    (_PRIYA_ID, _PRIYA_PROFILE, _PRIYA_EVIDENCE),
]

_JOB_BACKEND_REQS: list[JobRequirement] = [
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111101"), job_id=_JOB_BACKEND, skill_id=_SKILL_PYTHON, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.SKILL, description="Proficiency in Python (3.10+)"),
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111102"), job_id=_JOB_BACKEND, skill_id=_SKILL_FASTAPI, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.SKILL, description="Experience with FastAPI or similar async frameworks"),
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111103"), job_id=_JOB_BACKEND, skill_id=_SKILL_SQL, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.SKILL, description="Strong SQL and relational DB skills"),
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111104"), job_id=_JOB_BACKEND, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.ACADEMIC, description="CGPA >= 7.0", rule_expression={"field": "cgpa", "op": ">=", "value": 7.0}),
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111105"), job_id=_JOB_BACKEND, skill_id=_SKILL_DOCKER, requirement_type=RequirementType.PREFERRED, category=RequirementCategory.SKILL, description="Familiarity with Docker containerization", weight=0.8),
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111106"), job_id=_JOB_BACKEND, skill_id=_SKILL_KUBERNETES, requirement_type=RequirementType.PREFERRED, category=RequirementCategory.SKILL, description="Knowledge of Kubernetes orchestration", weight=0.6),
    JobRequirement(id=uuid.UUID("11111111-1111-1111-1111-111111111107"), job_id=_JOB_BACKEND, skill_id=_SKILL_GIT, requirement_type=RequirementType.PREFERRED, category=RequirementCategory.SKILL, description="Proficient with Git version control", weight=0.8),
]

_JOB_FULLSTACK_REQS: list[JobRequirement] = [
    JobRequirement(id=uuid.UUID("22222222-2222-2222-2222-222222222201"), job_id=_JOB_FULLSTACK, skill_id=_SKILL_REACT, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.SKILL, description="Solid React experience"),
    JobRequirement(id=uuid.UUID("22222222-2222-2222-2222-222222222202"), job_id=_JOB_FULLSTACK, skill_id=_SKILL_TYPESCRIPT, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.SKILL, description="TypeScript proficiency"),
    JobRequirement(id=uuid.UUID("22222222-2222-2222-2222-222222222203"), job_id=_JOB_FULLSTACK, requirement_type=RequirementType.MANDATORY, category=RequirementCategory.ACADEMIC, description="CGPA >= 6.5", rule_expression={"field": "cgpa", "op": ">=", "value": 6.5}),
]

_JOBS: dict[str, list[JobRequirement]] = {
    _JOB_BACKEND: _JOB_BACKEND_REQS,
    _JOB_FULLSTACK: _JOB_FULLSTACK_REQS,
    "job-techcorp-001": _JOB_BACKEND_REQS,
    "job-backend-001": _JOB_BACKEND_REQS,
    "JOB-2026-01": _JOB_BACKEND_REQS,
    "JOB-2026-02": _JOB_BACKEND_REQS,
    "JOB-2026-03": _JOB_FULLSTACK_REQS,
    "JOB-2026-04": _JOB_BACKEND_REQS,
    "JOB-2026-05": _JOB_BACKEND_REQS,
}

