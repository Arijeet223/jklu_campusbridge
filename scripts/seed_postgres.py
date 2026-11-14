"""CampusBridge AI — Production PostgreSQL Database Seeder (seed_postgres.py).

Migrates and seeds initial data from db/seed_data.json and campusbridge_db.xlsx
directly into PostgreSQL using asynchronous SQLAlchemy operations.

Usage:
    python scripts/seed_postgres.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select

from backend.db.base import Base
from backend.db.crud import (
    create_application,
    create_dispute,
    create_evidence,
    create_job,
    create_staff,
    create_student,
    get_job,
    get_staff,
    get_student,
    record_analytics_snapshot,
)
from backend.db.models import (
    Application,
    DSAPracticeProblem,
    EligibilityDispute,
    OpportunityJD,
    PlacementAnalyticsSnapshot,
    SkillEvidence,
    SQLPracticeProblem,
    StaffUser,
    StudentProfile,
)
from backend.db.session import AsyncSessionLocal, async_engine, get_database_url

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("campusbridge.seeder")

SEED_JSON_PATH = PROJECT_ROOT / "db" / "seed_data.json"


async def seed_database() -> None:
    """Creates tables and populates initial institutional records asynchronously."""
    db_url = get_database_url()
    logger.info("Connecting to PostgreSQL at: %s", db_url.split("@")[-1] if "@" in db_url else db_url)

    # 1. Create all tables
    async with async_engine.begin() as conn:
        logger.info("Creating schema tables (if not already existing)...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Schema tables created successfully.")

    # 2. Load JSON seeds if available
    seed_data = {}
    if SEED_JSON_PATH.exists():
        with open(SEED_JSON_PATH, "r", encoding="utf-8") as f:
            seed_data = json.load(f)

    async with AsyncSessionLocal() as session:
        # ── Seed Student Profiles ──────────────────────────────────────────
        students_seeded = 0
        raw_students = seed_data.get("accounts_students", [])
        if not raw_students:
            raw_students = [
                {
                    "student_id": "STU-101",
                    "full_name": "Aarav Sharma",
                    "email": "aarav.sharma@university.edu.in",
                    "roll_no": "22BCON104",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 8.42,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": ["Backend Engineer", "AI Engineer"],
                    "readiness_index": 74.0,
                    "sprint_mode_active": True,
                    "github_url": "https://github.com/aaravsharma-dev",
                },
                {
                    "student_id": "STU-102",
                    "full_name": "Priya Nair",
                    "email": "priya.nair@university.edu.in",
                    "roll_no": "22BCON118",
                    "program": "B.Tech CSE (AI & DS)",
                    "cohort_year": 2026,
                    "cgpa": 8.95,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": ["Data Scientist", "ML Engineer"],
                    "readiness_index": 86.0,
                    "sprint_mode_active": False,
                    "github_url": "https://github.com/priyanair-ai",
                },
                {
                    "student_id": "STU-128",
                    "full_name": "Arijeet Basak",
                    "email": "arijeet.basak2005@gmail.com",
                    "roll_no": "JKLU-2024-AI-042",
                    "program": "B.Tech Computer Science (Artificial Intelligence)",
                    "cohort_year": 2028,
                    "cgpa": 8.406,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "STANDARD",
                    "target_roles": ["AI/ML Engineer", "LLM Systems", "Agentic Workflows"],
                    "readiness_index": 94.2,
                    "sprint_mode_active": True,
                    "github_url": "https://github.com/Arijeet223",
                },
            ]

        for s in raw_students:
            stu_id = s.get("student_id")
            existing = await get_student(session, stu_id)
            if not existing:
                await create_student(session, s)
                students_seeded += 1

        # ── Seed Staff Users ───────────────────────────────────────────────
        staff_seeded = 0
        raw_staff = seed_data.get("accounts_teachers", [
            {
                "staff_id": "TPO-001",
                "full_name": "Prof. Rajesh Menon",
                "email": "rajesh.menon@university.edu.in",
                "password_hash": "sha256:officer123",
                "role": "PLACEMENT_OFFICER",
                "department": "Central Placement Cell",
                "permissions_scope": "OFFICER_FULL",
            },
            {
                "staff_id": "STF-014",
                "full_name": "Dr. Kavita Iyer",
                "email": "kavita.iyer@university.edu.in",
                "password_hash": "sha256:faculty123",
                "role": "FACULTY_MENTOR",
                "department": "Computer Science",
                "permissions_scope": "FACULTY_ADVISOR",
            },
        ])
        for st in raw_staff:
            staff_id = st.get("staff_id")
            existing = await get_staff(session, staff_id)
            if not existing:
                await create_staff(session, st)
                staff_seeded += 1

        # ── Seed Opportunities (JDs) ───────────────────────────────────────
        jobs_seeded = 0
        raw_jobs = seed_data.get("opportunities_jds", [
            {
                "job_id": "JOB-2026-01",
                "company_name": "RazorpayX Labs",
                "role_title": "SDE-1 (Backend & Distributed Systems)",
                "ctc_band": "18 - 22 LPA",
                "deadline_hours": 48,
                "min_cgpa": 7.5,
                "max_backlogs": 0,
                "allowed_branches": ["B.Tech CSE", "B.Tech CSE (AI & DS)"],
                "mandatory_skills_json": ["Python", "SQL & Query Optimization", "Data Structures & Algorithms"],
                "preferred_skills_json": ["Docker & Linux", "FastAPI"],
                "approved_by_officer": True,
                "status": "APPROVED",
            },
            {
                "job_id": "JOB-2026-03",
                "company_name": "TechCorp India",
                "role_title": "Core Backend Engineer",
                "ctc_band": "16 - 20 LPA",
                "deadline_hours": 72,
                "min_cgpa": 7.0,
                "max_backlogs": 0,
                "allowed_branches": ["B.Tech CSE", "B.Tech CSE (AI & DS)", "B.Tech ECE (Minor in CS)"],
                "mandatory_skills_json": ["Python", "FastAPI", "SQL & Query Optimization"],
                "preferred_skills_json": ["Docker & Linux", "Git & CI/CD"],
                "approved_by_officer": True,
                "status": "APPROVED",
            },
        ])
        for j in raw_jobs:
            job_id = j.get("job_id")
            existing = await get_job(session, job_id)
            if not existing:
                await create_job(session, j)
                jobs_seeded += 1

        # ── Seed 4-Stage Applications ──────────────────────────────────────
        apps_seeded = 0
        raw_apps = [
            {
                "id": "app-001",
                "student_id": "STU-101",
                "job_id": "JOB-2026-03",
                "job_title": "Core Backend Engineer",
                "company": "TechCorp India",
                "current_stage": "SHORTLISTED",
                "eligibility_status": "MEETS",
                "match_score": 88.5,
                "next_milestone": "Technical Interview Round 1",
            },
            {
                "id": "app-002",
                "student_id": "STU-101",
                "job_id": "JOB-2026-01",
                "job_title": "SDE-1 (Backend & Distributed Systems)",
                "company": "RazorpayX Labs",
                "current_stage": "ELIGIBILITY_VERIFIED",
                "eligibility_status": "MEETS",
                "match_score": 78.0,
                "next_milestone": "120s Proof-of-Work Micro-Defense",
            },
            {
                "id": "app-003",
                "student_id": "STU-128",
                "job_id": "JOB-2026-01",
                "job_title": "SDE-1 (Backend & Distributed Systems)",
                "company": "RazorpayX Labs",
                "current_stage": "SHORTLISTED",
                "eligibility_status": "MEETS",
                "match_score": 94.2,
                "next_milestone": "System Architecture On-Site Interview",
            },
        ]
        for a in raw_apps:
            stmt = select(Application).where(Application.id == a["id"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                await create_application(session, a)
                apps_seeded += 1

        # ── Seed Dispute Tickets ───────────────────────────────────────────
        disputes_seeded = 0
        raw_disputes = [
            {
                "ticket_id": "DISP-101",
                "match_result_id": "mr-razorpay-01",
                "student_id": "STU-101",
                "type": "ELIGIBILITY_DISPUTE",
                "target_job_or_skill": "RazorpayX Labs • Backend SDE-1",
                "rule_id": "rule-cgpa-7.5",
                "rule_label": "Min CGPA 7.5 Gate",
                "student_note": "Registrar cleared re-evaluation grade; CGPA updated from 7.42 to 8.42.",
                "officer_status": "APPROVED_OVERRIDE",
                "reason_code": "REGISTRAR_GRADE_AMENDMENT",
                "reviewed_by": "TPO-001",
            },
            {
                "ticket_id": "DISP-102",
                "match_result_id": "mr-techcorp-02",
                "student_id": "STU-101",
                "type": "MICRO_DEFENSE_CHALLENGE",
                "target_job_or_skill": "TechCorp India • Docker Containerization",
                "rule_id": "rule-docker-verified",
                "rule_label": "Production Container Proof",
                "student_note": "Submitted Docker Compose architectural repo with Prometheus telemetry.",
                "officer_status": "PENDING_REVIEW",
            },
        ]
        for d in raw_disputes:
            stmt = select(EligibilityDispute).where(EligibilityDispute.ticket_id == d["ticket_id"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                await create_dispute(session, d)
                disputes_seeded += 1

        # ── Seed Initial Placement Analytics Snapshot ──────────────────────
        stmt_snap = select(PlacementAnalyticsSnapshot).limit(1)
        existing_snap = (await session.execute(stmt_snap)).scalar_one_or_none()
        if not existing_snap:
            await record_analytics_snapshot(
                session,
                {
                    "cohort_id": "cohort-2026-cs",
                    "institution_id": "inst-nitk-001",
                    "total_cohort_size": 240,
                    "eligible_count": 142,
                    "shortlisted_count": 38,
                    "placed_count": 24,
                    "readiness_distribution": {
                        "high_alignment_verified": 142,
                        "moderate_developing": 74,
                        "unverified_needs_micro_defense": 21,
                        "academic_exception_cases": "< 5",
                    },
                    "requirement_funnel": [
                        {"stage": "Enrolled", "count": 240},
                        {"stage": "CGPA Cutoff Met", "count": 180},
                        {"stage": "Zero Backlogs", "count": 165},
                        {"stage": "Mandatory Skills Verified", "count": 142},
                    ],
                    "liquidity_index": 78.4,
                    "k_anonymity_applied": True,
                },
            )
            logger.info("Seeded initial cohort placement analytics snapshot.")

        await session.commit()

        logger.info(
            "Database seeding complete: %d students, %d staff, %d JDs, %d applications, %d disputes.",
            students_seeded,
            staff_seeded,
            jobs_seeded,
            apps_seeded,
            disputes_seeded,
        )


if __name__ == "__main__":
    asyncio.run(seed_database())

