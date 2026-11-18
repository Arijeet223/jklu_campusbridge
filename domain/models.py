"""CampusBridge AI — Pydantic v2 domain models.

Every skill or match claim carries ``source_document_id``, ``source_span``,
and ``evidence_status`` so provenance is always machine-verifiable.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class EvidenceStatus(str, Enum):
    """Tiered evidence verification levels (highest trust last)."""

    EXTRACTED = "EXTRACTED"
    STUDENT_CONFIRMED = "STUDENT_CONFIRMED"
    ARTIFACT_LINKED = "ARTIFACT_LINKED"
    ASSESSMENT_VERIFIED = "ASSESSMENT_VERIFIED"
    INSTITUTION_VERIFIED = "INSTITUTION_VERIFIED"
    EXPIRED = "EXPIRED"
    DOUBT_GHOST = "DOUBT_GHOST"


class EligibilityStatus(str, Enum):
    """Hard, deterministic eligibility outcome — no probabilities."""

    MEETS = "MEETS"
    DOES_NOT_MEET = "DOES_NOT_MEET"
    UNKNOWN = "UNKNOWN"


class RequirementType(str, Enum):
    """Whether a job requirement is mandatory or preferred."""

    MANDATORY = "MANDATORY"
    PREFERRED = "PREFERRED"


class RequirementCategory(str, Enum):
    """Broad taxonomy of requirement kinds."""

    SKILL = "SKILL"
    ACADEMIC = "ACADEMIC"
    EXPERIENCE = "EXPERIENCE"
    CERTIFICATION = "CERTIFICATION"
    OTHER = "OTHER"


# ---------------------------------------------------------------------------
# Value Objects
# ---------------------------------------------------------------------------

class SourceSpan(BaseModel):
    """Byte/char span inside a source document, with optional spatial bbox."""

    start_char: int = Field(..., ge=0, description="Inclusive start character offset.")
    end_char: int = Field(..., ge=0, description="Exclusive end character offset.")
    bbox: dict | None = Field(
        default=None,
        description="Optional bounding-box for PDF/image sources, e.g. {x0, y0, x1, y1, page}.",
    )
    section_path: str | None = Field(
        default=None,
        description="Hierarchical section path within the document, e.g. 'Education > GPA'.",
    )


# ---------------------------------------------------------------------------
# Core Evidence & Requirements
# ---------------------------------------------------------------------------

class SkillEvidence(BaseModel):
    """A single, traceable evidence item linking a student to a skill."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Unique evidence record ID.")
    student_user_id: str = Field(..., description="Owning student identifier.")
    skill_id: str = Field(..., description="Canonical skill identifier.")
    skill_name: str = Field(..., description="Human-readable skill name.")
    proficiency_level: float = Field(
        ..., ge=0.0, le=1.0, description="Normalised rubric proficiency (0-1)."
    )
    source_document_id: str = Field(..., description="Document from which evidence was extracted.")
    source_span: SourceSpan = Field(..., description="Exact span inside the source document.")
    evidence_status: EvidenceStatus = Field(..., description="Current verification tier.")
    extraction_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Model confidence at extraction time."
    )
    defense_attempt_id: str | None = Field(
        default=None, description="ID of micro-defense session, if any."
    )
    verified_by: str | None = Field(
        default=None, description="Verifier user/system ID, if verified."
    )
    verified_at: datetime | None = Field(
        default=None, description="Timestamp of verification, if verified."
    )


class JobRequirement(BaseModel):
    """A single requirement row inside a job description."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Unique requirement ID.")
    job_id: str = Field(..., description="Parent job identifier.")
    skill_id: str | None = Field(
        default=None, description="Linked canonical skill, if applicable."
    )
    requirement_type: RequirementType = Field(
        ..., description="MANDATORY or PREFERRED."
    )
    category: RequirementCategory = Field(
        ..., description="Broad category of the requirement."
    )
    description: str = Field(..., description="Free-text description of the requirement.")
    rule_expression: dict | None = Field(
        default=None,
        description=(
            "Optional deterministic rule, e.g. {'field': 'cgpa', 'op': '>=', 'value': 7.0}."
        ),
    )
    source_span: SourceSpan | None = Field(
        default=None, description="Span in the original JD document, if available."
    )
    weight: float = Field(
        default=1.0, ge=0.0, description="Relative weight within its factor group."
    )


# ---------------------------------------------------------------------------
# Eligibility Results
# ---------------------------------------------------------------------------

class EligibilityRuleResult(BaseModel):
    """Outcome of evaluating one requirement against a student."""

    requirement_id: uuid.UUID = Field(..., description="The evaluated requirement.")
    requirement_description: str = Field(..., description="Human-readable requirement text.")
    status: EligibilityStatus = Field(..., description="MEETS / DOES_NOT_MEET / UNKNOWN.")
    evidence_used: list[SkillEvidence] | None = Field(
        default=None, description="Evidence items that contributed to the decision."
    )
    reason: str = Field(..., description="Deterministic explanation of the outcome.")


# ---------------------------------------------------------------------------
# Alignment Results
# ---------------------------------------------------------------------------

class AlignmentFactorResult(BaseModel):
    """Per-factor breakdown inside an alignment score."""

    factor_name: str = Field(..., description="Factor identifier, e.g. 'required_skills'.")
    weight: float = Field(..., description="Factor weight (sums to 1.0 across factors).")
    raw_score: float = Field(
        ..., ge=0.0, le=1.0, description="Unweighted factor score (0-1)."
    )
    weighted_score: float = Field(
        ..., ge=0.0, description="raw_score × weight contribution."
    )
    evidence_items: list[dict] = Field(
        default_factory=list,
        description="Per-requirement evidence breakdown within this factor.",
    )


class AlignmentResult(BaseModel):
    """Full alignment index with transparent per-factor decomposition."""

    total_score: float = Field(
        ..., ge=0.0, le=100.0, description="Alignment Index (0-100)."
    )
    factor_breakdown: list[AlignmentFactorResult] = Field(
        ..., description="Ordered list of factor contributions."
    )
    rubric_version: int = Field(
        default=1, description="Version of the scoring rubric used."
    )


# ---------------------------------------------------------------------------
# Match Result (combines eligibility + alignment)
# ---------------------------------------------------------------------------

class MatchResult(BaseModel):
    """Complete matching output for one student × job pair."""

    student_user_id: str
    eligibility_status: EligibilityStatus
    eligibility_details: list[EligibilityRuleResult]
    alignment: AlignmentResult | None = None


# ---------------------------------------------------------------------------
# Sandbox (counterfactual / what-if)
# ---------------------------------------------------------------------------

class SandboxToggle(BaseModel):
    """One toggle in a what-if simulation request."""

    skill_id: str | uuid.UUID | None = Field(
        default=None, description="Skill to simulate evidence for."
    )
    requirement_id: str | uuid.UUID | None = Field(
        default=None, description="Requirement to simulate evidence for."
    )
    action: Literal["verify_skill", "complete_assessment", "add_artifact"] = Field(
        ..., description="Simulated student action."
    )
    simulated_evidence_status: EvidenceStatus = Field(
        ..., description="Evidence tier to simulate."
    )


class SandboxRequest(BaseModel):
    """What-if simulation request payload."""

    student_user_id: str
    job_id: str
    toggles: list[SandboxToggle]


class SandboxResult(BaseModel):
    """Side-by-side alignment comparison from a counterfactual simulation."""

    base_alignment: AlignmentResult
    simulated_alignment: AlignmentResult
    delta: float = Field(description="simulated - base total_score.")
    toggle_impacts: list[dict] = Field(
        default_factory=list,
        description="Per-toggle contribution to the delta.",
    )


# ---------------------------------------------------------------------------
# Liquidity Preview (employer-facing cohort analytics)
# ---------------------------------------------------------------------------

class LiquidityPreviewRequest(BaseModel):
    """Employer request to preview candidate-pool liquidity for a draft JD."""

    job_id: str
    requirements: list[JobRequirement]


class LiquidityPreviewResult(BaseModel):
    """K-anonymous cohort eligibility histogram."""

    total_cohort: int
    eligible_count: int
    unknown_count: int
    ineligible_count: int
    alignment_distribution: list[dict] = Field(
        default_factory=list,
        description="Histogram buckets, e.g. [{'range': '80-100', 'count': 12}, …].",
    )
    requirement_funnel: list[dict] = Field(
        default_factory=list,
        description="Per-requirement pass/fail/unknown counts.",
    )
