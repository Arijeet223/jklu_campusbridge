"""CampusBridge AI — Weighted Fit Alignment Calculator.

Implements PRD §6.4 formula:

    Alignment Index = Σ(i=1..5) w_i × (Σ(k∈K_i) s_k × m(tier_k) / |K_i|) × 100

Pure functions — no I/O, no LLM, 100 % deterministic.
"""

from __future__ import annotations

from domain.eligibility import EVIDENCE_TIER_MULTIPLIER
from domain.models import (
    AlignmentFactorResult,
    AlignmentResult,
    EvidenceStatus,
    JobRequirement,
    RequirementCategory,
    RequirementType,
    SkillEvidence,
)

# ---------------------------------------------------------------------------
# Default factor weights  (PRD §6.4 starting values)
# ---------------------------------------------------------------------------

ALIGNMENT_WEIGHTS: dict[str, float] = {
    "required_skills": 0.35,
    "projects_experience": 0.20,
    "preferred_skills": 0.15,
    "assessments": 0.15,
    "preferences": 0.15,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _best_evidence_for_skill(
    skill_id: str | None,
    evidence: list[SkillEvidence],
) -> SkillEvidence | None:
    """Return the evidence item with the highest tier multiplier for a skill.

    When multiple items share the highest multiplier, the one with the
    highest ``proficiency_level`` wins.
    """
    if skill_id is None:
        return None
    matching = [e for e in evidence if e.skill_id == skill_id]
    if not matching:
        return None
    return max(
        matching,
        key=lambda e: (
            EVIDENCE_TIER_MULTIPLIER.get(e.evidence_status, 0.0),
            e.proficiency_level,
        ),
    )


def _score_requirement(
    req: JobRequirement,
    evidence: list[SkillEvidence],
    student_profile: dict,
) -> tuple[float, float, dict]:
    """Score one requirement, returning ``(s_k, m_k, evidence_detail)``."""

    best = _best_evidence_for_skill(req.skill_id, evidence)
    if best is not None:
        s_k = best.proficiency_level
        m_k = EVIDENCE_TIER_MULTIPLIER.get(best.evidence_status, 0.0)
        detail = {
            "requirement_id": str(req.id),
            "skill_id": req.skill_id,
            "description": req.description,
            "proficiency": s_k,
            "tier": best.evidence_status.value,
            "multiplier": m_k,
            "product": round(s_k * m_k, 6),
        }
        return s_k, m_k, detail

    # Fallback: no evidence → contribution is 0.
    detail = {
        "requirement_id": str(req.id),
        "skill_id": req.skill_id,
        "description": req.description,
        "proficiency": 0.0,
        "tier": None,
        "multiplier": 0.0,
        "product": 0.0,
    }
    return 0.0, 0.0, detail


def _compute_factor(
    factor_name: str,
    weight: float,
    requirements: list[JobRequirement],
    evidence: list[SkillEvidence],
    student_profile: dict,
) -> AlignmentFactorResult:
    """Compute a single alignment factor."""

    if not requirements:
        return AlignmentFactorResult(
            factor_name=factor_name,
            weight=weight,
            raw_score=0.0,
            weighted_score=0.0,
            evidence_items=[],
        )

    items: list[dict] = []
    total_product = 0.0

    for req in requirements:
        s_k, m_k, detail = _score_requirement(req, evidence, student_profile)
        total_product += s_k * m_k
        items.append(detail)

    raw = total_product / len(requirements)  # average
    weighted = raw * weight

    return AlignmentFactorResult(
        factor_name=factor_name,
        weight=weight,
        raw_score=round(raw, 6),
        weighted_score=round(weighted, 6),
        evidence_items=items,
    )


# ---------------------------------------------------------------------------
# Partition helpers
# ---------------------------------------------------------------------------

def _partition_requirements(
    requirements: list[JobRequirement],
) -> dict[str, list[JobRequirement]]:
    """Split requirements into the five alignment factor buckets."""

    buckets: dict[str, list[JobRequirement]] = {
        "required_skills": [],
        "projects_experience": [],
        "preferred_skills": [],
        "assessments": [],
        "preferences": [],
    }

    for req in requirements:
        if (
            req.requirement_type == RequirementType.MANDATORY
            and req.category == RequirementCategory.SKILL
        ):
            buckets["required_skills"].append(req)
        elif req.category == RequirementCategory.EXPERIENCE:
            buckets["projects_experience"].append(req)
        elif (
            req.requirement_type == RequirementType.PREFERRED
            and req.category == RequirementCategory.SKILL
        ):
            buckets["preferred_skills"].append(req)
        elif req.category == RequirementCategory.CERTIFICATION:
            buckets["assessments"].append(req)
        else:
            # ACADEMIC, OTHER, and any remaining preferred → preferences
            buckets["preferences"].append(req)

    return buckets


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_alignment(
    requirements: list[JobRequirement],
    student_evidence: list[SkillEvidence],
    student_profile: dict,
    rubric_version: int = 1,
) -> AlignmentResult:
    """Calculate the transparent Alignment Index (0–100).

    For each of the five factors:

    1. Collect applicable requirements/evidence.
    2. For each requirement *k*, compute ``s_k`` (normalised rubric
       proficiency 0–1) and ``m(tier_k)`` from
       ``EVIDENCE_TIER_MULTIPLIER``.
    3. Average the products: ``(Σ s_k × m_k) / |K|``.
    4. Multiply by the factor weight.

    Edge cases
    ----------
    * Factor with zero applicable requirements → contributes 0 (not NaN).
    * Evidence at EXTRACTED tier → multiplier 0.0 (provisional).
    * Multiple evidence items for the same skill → highest tier wins.
    """

    buckets = _partition_requirements(requirements)

    factors: list[AlignmentFactorResult] = []
    total = 0.0

    for factor_name, weight in ALIGNMENT_WEIGHTS.items():
        factor = _compute_factor(
            factor_name, weight, buckets[factor_name], student_evidence, student_profile,
        )
        factors.append(factor)
        total += factor.weighted_score

    # Scale to 0–100.
    total_score = round(total * 100.0, 2)
    total_score = max(0.0, min(100.0, total_score))

    return AlignmentResult(
        total_score=total_score,
        factor_breakdown=factors,
        rubric_version=rubric_version,
    )
