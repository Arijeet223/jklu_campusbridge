"""CampusBridge AI — Production Database Package.

Unified exports for SQLAlchemy ORM models, asyncpg engine, session factories,
and asynchronous CRUD repositories.
"""

from backend.db.base import Base, TimestampMixin
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
from backend.db.session import (
    DATABASE_URL,
    AsyncSessionLocal,
    async_engine,
    check_db_health,
    get_async_session,
    init_db,
)
from backend.db.crud import (
    # Students
    get_student,
    get_student_by_email,
    list_students,
    create_student,
    update_student,
    upsert_student,
    # Staff
    get_staff,
    get_staff_by_email,
    list_staff,
    create_staff,
    # Evidence
    get_student_evidence,
    get_evidence_by_id,
    create_evidence,
    confirm_evidence,
    bulk_insert_evidence,
    # Applications
    list_applications,
    get_application,
    create_application,
    update_application_stage,
    # Disputes
    list_disputes,
    get_dispute,
    create_dispute,
    adjudicate_dispute,
    # Opportunities
    list_jobs,
    get_job,
    create_job,
    # Analytics
    get_cohort_summary,
    record_analytics_snapshot,
    # Practice
    list_dsa_problems,
    get_dsa_problem,
    list_sql_problems,
    get_sql_problem,
    # Audit
    log_audit_event,
)

# Backwards compatibility export
from backend.db.excel_store import ExcelStore, get_excel_store

__all__ = [
    # Base & Session
    "Base",
    "TimestampMixin",
    "async_engine",
    "AsyncSessionLocal",
    "get_async_session",
    "init_db",
    "check_db_health",
    "DATABASE_URL",
    # Models
    "StudentProfile",
    "StaffUser",
    "SkillEvidence",
    "Application",
    "EligibilityDispute",
    "OpportunityJD",
    "PlacementAnalyticsSnapshot",
    "DSAPracticeProblem",
    "SQLPracticeProblem",
    "MCPAuditLog",
    # CRUD
    "get_student",
    "get_student_by_email",
    "list_students",
    "create_student",
    "update_student",
    "upsert_student",
    "get_staff",
    "get_staff_by_email",
    "list_staff",
    "create_staff",
    "get_student_evidence",
    "get_evidence_by_id",
    "create_evidence",
    "confirm_evidence",
    "bulk_insert_evidence",
    "list_applications",
    "get_application",
    "create_application",
    "update_application_stage",
    "list_disputes",
    "get_dispute",
    "create_dispute",
    "adjudicate_dispute",
    "list_jobs",
    "get_job",
    "create_job",
    "get_cohort_summary",
    "record_analytics_snapshot",
    "list_dsa_problems",
    "get_dsa_problem",
    "list_sql_problems",
    "get_sql_problem",
    "log_audit_event",
    # Legacy
    "ExcelStore",
    "get_excel_store",
]
