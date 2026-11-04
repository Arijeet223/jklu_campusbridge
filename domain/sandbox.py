"""CampusBridge AI — Counterfactual Fit Sandbox.

Statelessly computes "what-if" alignment deltas so students can explore
the impact of verifying a skill, completing an assessment, or adding an
artifact — without mutating any real data.

Guaranteed <50 ms for typical inputs — no I/O, no LLM, pure computation.
"""

from __future__ import annotations

import copy
import uuid
from typing import TYPE_CHECKING

from domain.alignment import calculate_alignment
from domain.models import (
    AlignmentResult,
    SandboxResult,
    SandboxToggle,
    SkillEvidence,
    SourceSpan,
    JobRequirement,
)

if TYPE_CHECKING:
    pass  # placeholder for future type-only imports


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def simulate_counterfactual(
    requirements: list[JobRequirement],
    current_evidence: list[SkillEvidence],
    student_profile: dict,
    toggles: list[SandboxToggle],
    rubric_version: int = 1,
) -> SandboxResult:
    """Statelessly compute a counterfactual alignment delta.

    Workflow
    --------
    1. Calculate the **base** alignment from ``current_evidence``.
    2. For each toggle, create a *synthetic* evidence item with the
       simulated ``evidence_status``.
    3. Re-calculate alignment with the augmented evidence set.
    4. Return both results, the delta, and per-toggle impact.

    Guarantees
    ----------
    * **Stateless** — input lists are never mutated; copies are used.
    * **Deterministic** — same inputs always produce the same output.
    * **Fast** — pure computation, no I/O.
    """

    # 1. Base alignment ─────────────────────────────────────────────────────
    base: AlignmentResult = calculate_alignment(
        requirements, current_evidence, student_profile, rubric_version,
    )

    # 2. Build augmented evidence set ──────────────────────────────────────
    augmented = list(current_evidence)  # shallow copy (items are immutable models)

    toggle_impacts: list[dict] = []

    for toggle in toggles:
        skill_id_str = str(toggle.skill_id) if toggle.skill_id else None

        # Determine the skill_id to use: from the toggle directly, or
        # resolved from the requirement.
        resolved_skill_id = skill_id_str
        if resolved_skill_id is None and toggle.requirement_id is not None:
            for req in requirements:
                if req.id == toggle.requirement_id and req.skill_id is not None:
                    resolved_skill_id = req.skill_id
                    break

        if resolved_skill_id is None:
            toggle_impacts.append({
                "toggle": toggle.model_dump(mode="json"),
                "note": "Could not resolve a skill_id; toggle skipped.",
                "marginal_delta": 0.0,
            })
            continue

        synthetic = SkillEvidence(
            id=uuid.uuid4(),
            student_user_id="simulated",
            skill_id=resolved_skill_id,
            skill_name=f"simulated-{resolved_skill_id}",
            proficiency_level=0.8,  # default assumed proficiency for simulation
            source_document_id="sandbox-simulation",
            source_span=SourceSpan(start_char=0, end_char=0),
            evidence_status=toggle.simulated_evidence_status,
            extraction_confidence=1.0,
        )
        augmented.append(synthetic)

    # 3. Simulated alignment ───────────────────────────────────────────────
    simulated: AlignmentResult = calculate_alignment(
        requirements, augmented, student_profile, rubric_version,
    )

    # 4. Per-toggle marginal impact (sequential attribution) ───────────────
    if not toggle_impacts:
        # Compute marginal attribution: add toggles one-by-one.
        running = list(current_evidence)
        prev_score = base.total_score

        for toggle in toggles:
            skill_id_str = str(toggle.skill_id) if toggle.skill_id else None
            resolved_skill_id = skill_id_str
            if resolved_skill_id is None and toggle.requirement_id is not None:
                for req in requirements:
                    if req.id == toggle.requirement_id and req.skill_id is not None:
                        resolved_skill_id = req.skill_id
                        break

            if resolved_skill_id is None:
                toggle_impacts.append({
                    "toggle": toggle.model_dump(mode="json"),
                    "note": "Could not resolve a skill_id; toggle skipped.",
                    "marginal_delta": 0.0,
                })
                continue

            synth = SkillEvidence(
                id=uuid.uuid4(),
                student_user_id="simulated",
                skill_id=resolved_skill_id,
                skill_name=f"simulated-{resolved_skill_id}",
                proficiency_level=0.8,
                source_document_id="sandbox-simulation",
                source_span=SourceSpan(start_char=0, end_char=0),
                evidence_status=toggle.simulated_evidence_status,
                extraction_confidence=1.0,
            )
            running.append(synth)
            step_result = calculate_alignment(
                requirements, running, student_profile, rubric_version,
            )
            marginal = round(step_result.total_score - prev_score, 2)
            toggle_impacts.append({
                "toggle": toggle.model_dump(mode="json"),
                "marginal_delta": marginal,
            })
            prev_score = step_result.total_score

    delta = round(simulated.total_score - base.total_score, 2)

    return SandboxResult(
        base_alignment=base,
        simulated_alignment=simulated,
        delta=delta,
        toggle_impacts=toggle_impacts,
    )
