-- =============================================================================
-- CampusBridge AI — Initial Migration (001)
-- =============================================================================
-- This migration creates the core schema for the CampusBridge AI platform.
--
-- Design invariants (from PRD):
--   • Hard eligibility (MEETS / DOES_NOT_MEET / UNKNOWN) and fit scoring
--     are 100 % deterministic in Python/SQL — no LLM in the loop.
--   • Every skill or match claim carries source_document_id, source_span,
--     and evidence_status for full auditability.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ---------------------------------------------------------------------------
-- Reusable trigger: set_updated_at()
-- Automatically stamps updated_at = NOW() on every UPDATE.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. student_profiles
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_profiles (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id    UUID        NOT NULL,
    student_user_id   UUID        UNIQUE NOT NULL,
    program_id        UUID        NOT NULL,
    cohort_id         UUID        NOT NULL,
    full_name         TEXT        NOT NULL,
    email             TEXT        NOT NULL,
    profile_version   INT         NOT NULL DEFAULT 1,
    -- Privacy Shield: per-purpose / per-opportunity visibility grants
    visibility_state  JSONB       NOT NULL DEFAULT '{}'::jsonb,
    -- Role families, preferred locations, work-mode preferences
    career_preferences JSONB      DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_institution_cohort
    ON student_profiles (institution_id, cohort_id);

DROP TRIGGER IF EXISTS trg_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER trg_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. documents
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS documents (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id   UUID        NOT NULL REFERENCES student_profiles(student_user_id),
    file_name         TEXT        NOT NULL,
    mime_type         TEXT        NOT NULL,
    file_size_bytes   BIGINT      NOT NULL,
    storage_path      TEXT        NOT NULL,   -- MinIO object path
    quarantine_status TEXT        NOT NULL DEFAULT 'PENDING'
        CHECK (quarantine_status IN ('PENDING', 'SCANNING', 'CLEAN', 'INFECTED', 'PARSE_FAILED')),
    parsed_at         TIMESTAMPTZ,
    version           INT         NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. document_chunks
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS document_chunks (
    id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id    UUID           NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index    INT            NOT NULL,
    content        TEXT           NOT NULL,
    section_path   TEXT,                       -- e.g. "Experience > Software Intern"
    page_number    INT,
    char_start     INT            NOT NULL,
    char_end       INT            NOT NULL,
    bbox           JSONB,                      -- bounding-box coordinates
    embedding      vector(1536),               -- pgvector — OpenAI ada-002 / similar
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_document_chunk UNIQUE (document_id, chunk_index)
);

-- HNSW index for fast approximate-nearest-neighbour search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. skill_evidence  (PRD §11 DDL — evidence-backed skill claims)
-- ═══════════════════════════════════════════════════════════════════════════
-- Every extracted skill is anchored to a source document span so it can be
-- audited, challenged (120 s Micro-Defense), or expired.
CREATE TABLE IF NOT EXISTS skill_evidence (
    id                     UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_user_id        UUID           NOT NULL REFERENCES student_profiles(student_user_id),
    skill_id               UUID           NOT NULL,   -- references governed skill ontology
    skill_name             TEXT           NOT NULL,    -- denormalized for display
    proficiency_level      TEXT,                        -- Beginner / Intermediate / Advanced
    -- ── Provenance (mandatory per PRD) ──
    source_document_id     UUID           NOT NULL REFERENCES documents(id),
    source_page            INT,
    source_span            JSONB          NOT NULL,    -- {start_char, end_char, bbox, section_path}
    evidence_status        TEXT           NOT NULL
        CHECK (evidence_status IN (
            'EXTRACTED',
            'STUDENT_CONFIRMED',
            'ARTIFACT_LINKED',
            'ASSESSMENT_VERIFIED',
            'INSTITUTION_VERIFIED',
            'EXPIRED'
        )),
    extraction_confidence  NUMERIC(4,3),               -- 0.000 → 1.000
    defense_attempt_id     UUID,                        -- 120 s Proof-of-Work Micro-Defense transcript
    verified_by            UUID,
    verified_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_evidence_student_skill
    ON skill_evidence (student_user_id, skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_evidence_status
    ON skill_evidence (evidence_status);

DROP TRIGGER IF EXISTS trg_skill_evidence_updated_at ON skill_evidence;
CREATE TRIGGER trg_skill_evidence_updated_at
    BEFORE UPDATE ON skill_evidence
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. jobs
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jobs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id  UUID        NOT NULL,
    title           TEXT        NOT NULL,
    company_name    TEXT        NOT NULL,
    raw_description TEXT,                        -- original JD text
    status          TEXT        NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CLOSED', 'ARCHIVED')),
    deadline        TIMESTAMPTZ,
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    rubric_version  INT         NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_institution_status
    ON jobs (institution_id, status);

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. job_requirements
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_requirements (
    id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id            UUID           NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id          UUID,                         -- nullable for non-skill requirements
    requirement_type  TEXT           NOT NULL
        CHECK (requirement_type IN ('MANDATORY', 'PREFERRED')),
    category          TEXT           NOT NULL
        CHECK (category IN ('SKILL', 'ACADEMIC', 'EXPERIENCE', 'CERTIFICATION', 'OTHER')),
    description       TEXT           NOT NULL,
    -- Deterministic rule definition, e.g. {"field": "cgpa", "op": ">=", "value": 7.0}
    rule_expression   JSONB,
    source_span       JSONB,                        -- from parsed JD
    weight            NUMERIC(4,3)   DEFAULT 1.000, -- for preferred requirements
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. match_runs
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS match_runs (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id           UUID        NOT NULL REFERENCES jobs(id),
    rubric_version   INT         NOT NULL,
    total_eligible   INT,
    total_unknown    INT,
    total_ineligible INT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. match_results
-- ═══════════════════════════════════════════════════════════════════════════
-- Eligibility is deterministic: MEETS / DOES_NOT_MEET / UNKNOWN.
-- alignment_score (0–100) is computed purely from rule_expression weights.
CREATE TABLE IF NOT EXISTS match_results (
    id                    UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_run_id          UUID           NOT NULL REFERENCES match_runs(id) ON DELETE CASCADE,
    student_user_id       UUID           NOT NULL REFERENCES student_profiles(student_user_id),
    eligibility_status    TEXT           NOT NULL
        CHECK (eligibility_status IN ('MEETS', 'DOES_NOT_MEET', 'UNKNOWN')),
    -- Per-rule breakdown: [{rule_id, status, evidence}]
    eligibility_details   JSONB          NOT NULL DEFAULT '[]'::jsonb,
    alignment_score       NUMERIC(5,2),  -- 0.00 → 100.00
    -- Factor breakdown: {required_skills: 35, projects: 20, …}
    factor_breakdown      JSONB          NOT NULL DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_match_run_student UNIQUE (match_run_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_results_student_eligibility
    ON match_results (student_user_id, eligibility_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. audit_events  (APPEND-ONLY)
-- ═══════════════════════════════════════════════════════════════════════════
-- This table is strictly append-only. UPDATE and DELETE are revoked from
-- the application role after creation (see bottom of file).
CREATE TABLE IF NOT EXISTS audit_events (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id       UUID        NOT NULL,
    actor_role     TEXT        NOT NULL,
    action         TEXT        NOT NULL,
    resource_type  TEXT        NOT NULL,
    resource_id    UUID,
    metadata       JSONB       DEFAULT '{}'::jsonb,
    ip_address     INET,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_time
    ON audit_events (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
    ON audit_events (resource_type, resource_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- Application Role & Row-Level Security
-- ═══════════════════════════════════════════════════════════════════════════

-- Create the application role (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusbridge_app') THEN
        CREATE ROLE campusbridge_app NOLOGIN;
    END IF;
END
$$;

-- Grant baseline table access to the app role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campusbridge_app;

-- ── Audit events: revoke UPDATE & DELETE → append-only ──
REVOKE UPDATE, DELETE ON audit_events FROM campusbridge_app;

-- ---------------------------------------------------------------------------
-- Enable RLS on student-scoped tables
-- ---------------------------------------------------------------------------
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence   ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events     ENABLE ROW LEVEL SECURITY;

-- ── student_profiles: students see/modify only their own rows ──
DROP POLICY IF EXISTS student_own_data ON student_profiles;
CREATE POLICY student_own_data ON student_profiles
    FOR ALL
    USING (student_user_id = current_setting('app.current_user_id')::uuid);

-- ── documents: students see/modify only their own documents ──
DROP POLICY IF EXISTS student_own_documents ON documents;
CREATE POLICY student_own_documents ON documents
    FOR ALL
    USING (student_user_id = current_setting('app.current_user_id')::uuid);

-- ── document_chunks: inherit access from parent document ownership ──
DROP POLICY IF EXISTS chunk_access ON document_chunks;
CREATE POLICY chunk_access ON document_chunks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_chunks.document_id
              AND d.student_user_id = current_setting('app.current_user_id')::uuid
        )
        OR current_setting('app.current_role') IN ('PLACEMENT_OFFICER', 'ADMIN')
    );

-- ── skill_evidence: students see/modify only their own evidence ──
DROP POLICY IF EXISTS student_own_evidence ON skill_evidence;
CREATE POLICY student_own_evidence ON skill_evidence
    FOR ALL
    USING (student_user_id = current_setting('app.current_user_id')::uuid);

-- ── match_results: students see own; placement officers see all ──
DROP POLICY IF EXISTS student_match_results ON match_results;
CREATE POLICY student_match_results ON match_results
    FOR SELECT
    USING (
        student_user_id = current_setting('app.current_user_id')::uuid
        OR current_setting('app.current_role') = 'PLACEMENT_OFFICER'
    );

-- ── audit_events: only ADMIN and AUDITOR roles can read ──
DROP POLICY IF EXISTS audit_read_policy ON audit_events;
CREATE POLICY audit_read_policy ON audit_events
    FOR SELECT
    USING (
        current_setting('app.current_role') IN ('ADMIN', 'AUDITOR')
    );

-- =============================================================================
-- End of 001_init.sql
-- =============================================================================
