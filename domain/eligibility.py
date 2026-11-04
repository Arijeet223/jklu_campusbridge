"""CampusBridge AI — Deterministic Eligibility Engine.

Pure-function module.  Zero LLM calls, zero side-effects, zero network I/O.

Every evaluation is 100 % reproducible given the same inputs.
"""

from __future__ import annotations

from domain.models import (
    EligibilityRuleResult,
    EligibilityStatus,
    EvidenceStatus,
    JobRequirement,
    RequirementCategory,
    RequirementType,
    SkillEvidence,
)

# ---------------------------------------------------------------------------
# Evidence tier multiplier table (PRD §6.3)
# ---------------------------------------------------------------------------

EVIDENCE_TIER_MULTIPLIER: dict[EvidenceStatus, float] = {
    EvidenceStatus.EXTRACTED: 0.0,
    EvidenceStatus.STUDENT_CONFIRMED: 0.5,
    EvidenceStatus.ARTIFACT_LINKED: 0.75,
    EvidenceStatus.ASSESSMENT_VERIFIED: 1.0,
    EvidenceStatus.INSTITUTION_VERIFIED: 1.0,
    EvidenceStatus.EXPIRED: 0.25,
}

# Statuses considered "confirmed enough" for a MEETS verdict on skill checks.
_CONFIRMED_STATUSES: frozenset[EvidenceStatus] = frozenset(
    s for s, m in EVIDENCE_TIER_MULTIPLIER.items() if m >= 0.5
)

# Supported comparison operators for rule_expression evaluation.
_OPS: dict[str, callable] = {
    ">=": lambda a, b: a >= b,
    ">": lambda a, b: a > b,
    "<=": lambda a, b: a <= b,
    "<": lambda a, b: a < b,
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    "in": lambda a, b: a in b,
}


# ---------------------------------------------------------------------------
# Single-rule evaluator
# ---------------------------------------------------------------------------

def evaluate_single_rule(
    requirement: JobRequirement,
    student_evidence: list[SkillEvidence],
    student_profile: dict,
) -> EligibilityRuleResult:
    """Evaluate one requirement against a student's evidence & profile.

    Returns an ``EligibilityRuleResult`` with status MEETS, DOES_NOT_MEET,
    or UNKNOWN.

    Decision logic by category:

    * **SKILL** — look up evidence items matching ``requirement.skill_id``.
      - No evidence at all → UNKNOWN.
      - Evidence exists but *only* at EXTRACTED tier → UNKNOWN (unconfirmed).
      - Any evidence at STUDENT_CONFIRMED or higher → MEETS.

    * **ACADEMIC** with ``rule_expression`` — evaluate the expression
      (e.g. ``{"field": "cgpa", "op": ">=", "value": 7.0}``) against
      ``student_profile``.
      - Field missing from profile → UNKNOWN.
      - Comparison fails → DOES_NOT_MEET.
      - Comparison passes → MEETS.

    * **All other categories** — check whether *any* evidence for the
      requirement's ``skill_id`` exists at a confirmed tier.
      - Confirmed evidence found → MEETS, else UNKNOWN.
    """

    req_id = requirement.id
    desc = requirement.description

    # --- SKILL requirements ------------------------------------------------
    if requirement.category == RequirementCategory.SKILL:
        matching = [
            e for e in student_evidence if e.skill_id == requirement.skill_id
        ]
        if not matching:
            return EligibilityRuleResult(
                requirement_id=req_id,
                requirement_description=desc,
                status=EligibilityStatus.UNKNOWN,
                evidence_used=None,
                reason=f"No evidence found for skill '{requirement.skill_id}'.",
            )
        confirmed = [
            e for e in matching if e.evidence_status in _CONFIRMED_STATUSES
        ]
        if confirmed:
            return EligibilityRuleResult(
                requirement_id=req_id,
                requirement_description=desc,
                status=EligibilityStatus.MEETS,
                evidence_used=confirmed,
                reason=(
                    f"Confirmed evidence found for skill '{requirement.skill_id}' "
                    f"at tier(s): {', '.join(e.evidence_status.value for e in confirmed)}."
                ),
            )
        # Evidence exists but only at EXTRACTED (unconfirmed)
        return EligibilityRuleResult(
            requirement_id=req_id,
            requirement_description=desc,
            status=EligibilityStatus.UNKNOWN,
            evidence_used=matching,
            reason=(
                f"Evidence for skill '{requirement.skill_id}' exists but is "
                f"unconfirmed (EXTRACTED only)."
            ),
        )

    # --- ACADEMIC requirements with rule_expression -----------------------
    if requirement.category == RequirementCategory.ACADEMIC and requirement.rule_expression:
        expr = requirement.rule_expression
        field = expr.get("field")
        op = expr.get("op")
        threshold = expr.get("value")

        if field is None or op is None or threshold is None:
            return EligibilityRuleResult(
                requirement_id=req_id,
                requirement_description=desc,
                status=EligibilityStatus.UNKNOWN,
                evidence_used=None,
                reason="Malformed rule_expression; cannot evaluate.",
            )

        actual = student_profile.get(field)
        if actual is None:
            return EligibilityRuleResult(
                requirement_id=req_id,
                requirement_description=desc,
                status=EligibilityStatus.UNKNOWN,
                evidence_used=None,
                reason=f"Profile field '{field}' is missing.",
            )

        comparator = _OPS.get(op)
        if comparator is None:
            return EligibilityRuleResult(
                requirement_id=req_id,
                requirement_description=desc,
                status=EligibilityStatus.UNKNOWN,
                evidence_used=None,
                reason=f"Unsupported operator '{op}' in rule_expression.",
            )

        if comparator(actual, threshold):
            return EligibilityRuleResult(
                requirement_id=req_id,
                requirement_description=desc,
                status=EligibilityStatus.MEETS,
                evidence_used=None,
                reason=f"Profile {field}={actual} {op} {threshold} → MEETS.",
            )
        return EligibilityRuleResult(
            requirement_id=req_id,
            requirement_description=desc,
            status=EligibilityStatus.DOES_NOT_MEET,
            evidence_used=None,
            reason=f"Profile {field}={actual} does not satisfy {op} {threshold}.",
        )

    # --- Catch-all for EXPERIENCE / CERTIFICATION / OTHER ------------------
    matching = [
        e
        for e in student_evidence
        if e.skill_id == requirement.skill_id
        and e.evidence_status in _CONFIRMED_STATUSES
    ]
    if matching:
        return EligibilityRuleResult(
            requirement_id=req_id,
            requirement_description=desc,
            status=EligibilityStatus.MEETS,
            evidence_used=matching,
            reason=f"Confirmed evidence found for requirement '{desc}'.",
        )
    return EligibilityRuleResult(
        requirement_id=req_id,
        requirement_description=desc,
        status=EligibilityStatus.UNKNOWN,
        evidence_used=None,
        reason=f"No confirmed evidence for requirement '{desc}'.",
    )


# ---------------------------------------------------------------------------
# Full eligibility evaluator (all mandatory requirements)
# ---------------------------------------------------------------------------

def evaluate_eligibility(
    requirements: list[JobRequirement],
    student_evidence: list[SkillEvidence],
    student_profile: dict,
) -> tuple[EligibilityStatus, list[EligibilityRuleResult]]:
    """Evaluate **all mandatory** requirements and return an overall verdict.

    Aggregation rules (deterministic, no weighting):

    * If **any** mandatory rule yields ``DOES_NOT_MEET`` → overall
      ``DOES_NOT_MEET``.
    * If **all** mandatory rules yield ``MEETS`` → overall ``MEETS``.
    * Otherwise (some ``UNKNOWN``, none ``DOES_NOT_MEET``) → overall
      ``UNKNOWN``.

    Preferred requirements are evaluated for informational purposes but do
    **not** affect the hard eligibility gate.

    Returns:
        A tuple of ``(overall_status, list_of_per_rule_results)``.
    """

    mandatory = [r for r in requirements if r.requirement_type == RequirementType.MANDATORY]
    preferred = [r for r in requirements if r.requirement_type == RequirementType.PREFERRED]

    results: list[EligibilityRuleResult] = []

    for req in mandatory:
        results.append(evaluate_single_rule(req, student_evidence, student_profile))

    for req in preferred:
        results.append(evaluate_single_rule(req, student_evidence, student_profile))

    # Determine overall status from mandatory results only.
    mandatory_statuses = [r.status for r in results[: len(mandatory)]]

    if not mandatory_statuses:
        overall = EligibilityStatus.MEETS
    elif any(s == EligibilityStatus.DOES_NOT_MEET for s in mandatory_statuses):
        overall = EligibilityStatus.DOES_NOT_MEET
    elif all(s == EligibilityStatus.MEETS for s in mandatory_statuses):
        overall = EligibilityStatus.MEETS
    else:
        overall = EligibilityStatus.UNKNOWN

    return overall, results
