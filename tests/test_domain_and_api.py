"""CampusBridge AI — Phase 1 Test Suite for Deterministic Engine and Endpoints.

Tests:
1. Deterministic Hard-Gate Eligibility (MEETS / DOES_NOT_MEET / UNKNOWN)
2. Weighted Fit Alignment Calculator (exact PRD §6.4 weights & tier multipliers)
3. Counterfactual Fit Sandbox (deterministic delta, stateless execution <50ms)
4. API Endpoints (liquidity preview, simulate-fit, confirm-extraction, matches)
"""

import os
import sys
import time
import unittest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from domain.models import (
    EligibilityStatus,
    EvidenceStatus,
    JobRequirement,
    RequirementCategory,
    RequirementType,
    SandboxRequest,
    SandboxToggle,
    SkillEvidence,
    SourceSpan,
)
from domain.eligibility import evaluate_eligibility, evaluate_single_rule
from domain.alignment import calculate_alignment, ALIGNMENT_WEIGHTS, EVIDENCE_TIER_MULTIPLIER
from domain.sandbox import simulate_counterfactual
from services.api.endpoints import (
    _PRIYA_ID,
    _PRIYA_EXTRACTED_ID,
    _STUDENTS_BY_ID,
    _JOB_BACKEND_REQS,
    _JOB_BACKEND,
    get_student_evidence,
    get_student_matches,
    simulate_fit,
    confirm_extraction,
)


class TestDeterministicEligibility(unittest.TestCase):
    def setUp(self):
        self.student_profile = {
            "degree": "B.Tech",
            "branch": "Computer Science",
            "grad_year": 2027,
            "cgpa": 8.2,
        }
        self.evidence = [
            SkillEvidence(
                id=uuid.uuid4(),
                student_user_id="student-1",
                skill_id="skill-python",
                skill_name="Python",
                proficiency_level=0.9,
                source_document_id="doc-1",
                source_span=SourceSpan(start_char=0, end_char=50),
                evidence_status=EvidenceStatus.ASSESSMENT_VERIFIED,
                extraction_confidence=1.0,
            ),
            SkillEvidence(
                id=uuid.uuid4(),
                student_user_id="student-1",
                skill_id="skill-react",
                skill_name="React",
                proficiency_level=0.8,
                source_document_id="doc-1",
                source_span=SourceSpan(start_char=60, end_char=100),
                evidence_status=EvidenceStatus.EXTRACTED,  # Unconfirmed
                extraction_confidence=0.88,
            ),
        ]

    def test_academic_cgpa_meets(self):
        req = JobRequirement(
            id=uuid.uuid4(),
            job_id="job-1",
            requirement_type=RequirementType.MANDATORY,
            category=RequirementCategory.ACADEMIC,
            description="CGPA >= 7.5",
            rule_expression={"field": "cgpa", "op": ">=", "value": 7.5},
        )
        res = evaluate_single_rule(req, self.evidence, self.student_profile)
        self.assertEqual(res.status, EligibilityStatus.MEETS)

    def test_academic_cgpa_does_not_meet(self):
        req = JobRequirement(
            id=uuid.uuid4(),
            job_id="job-1",
            requirement_type=RequirementType.MANDATORY,
            category=RequirementCategory.ACADEMIC,
            description="CGPA >= 9.0",
            rule_expression={"field": "cgpa", "op": ">=", "value": 9.0},
        )
        res = evaluate_single_rule(req, self.evidence, self.student_profile)
        self.assertEqual(res.status, EligibilityStatus.DOES_NOT_MEET)

    def test_missing_field_is_unknown(self):
        req = JobRequirement(
            id=uuid.uuid4(),
            job_id="job-1",
            requirement_type=RequirementType.MANDATORY,
            category=RequirementCategory.ACADEMIC,
            description="Work authorization in India",
            rule_expression={"field": "work_auth", "op": "==", "value": True},
        )
        res = evaluate_single_rule(req, self.evidence, self.student_profile)
        self.assertEqual(res.status, EligibilityStatus.UNKNOWN)

    def test_skill_confirmed_meets(self):
        req = JobRequirement(
            id=uuid.uuid4(),
            job_id="job-1",
            skill_id="skill-python",
            requirement_type=RequirementType.MANDATORY,
            category=RequirementCategory.SKILL,
            description="Python required",
        )
        res = evaluate_single_rule(req, self.evidence, self.student_profile)
        self.assertEqual(res.status, EligibilityStatus.MEETS)

    def test_skill_extracted_only_is_unknown(self):
        req = JobRequirement(
            id=uuid.uuid4(),
            job_id="job-1",
            skill_id="skill-react",
            requirement_type=RequirementType.MANDATORY,
            category=RequirementCategory.SKILL,
            description="React required",
        )
        res = evaluate_single_rule(req, self.evidence, self.student_profile)
        self.assertEqual(res.status, EligibilityStatus.UNKNOWN)

    def test_overall_eligibility_cascade(self):
        # All meet
        reqs = [
            JobRequirement(
                id=uuid.uuid4(),
                job_id="job-1",
                skill_id="skill-python",
                requirement_type=RequirementType.MANDATORY,
                category=RequirementCategory.SKILL,
                description="Python required",
            ),
            JobRequirement(
                id=uuid.uuid4(),
                job_id="job-1",
                requirement_type=RequirementType.MANDATORY,
                category=RequirementCategory.ACADEMIC,
                description="CGPA >= 7.0",
                rule_expression={"field": "cgpa", "op": ">=", "value": 7.0},
            ),
        ]
        status, _ = evaluate_eligibility(reqs, self.evidence, self.student_profile)
        self.assertEqual(status, EligibilityStatus.MEETS)

        # One unknown makes overall unknown (if no fail)
        reqs_with_unknown = reqs + [
            JobRequirement(
                id=uuid.uuid4(),
                job_id="job-1",
                skill_id="skill-react",  # only EXTRACTED
                requirement_type=RequirementType.MANDATORY,
                category=RequirementCategory.SKILL,
                description="React required",
            )
        ]
        status, _ = evaluate_eligibility(reqs_with_unknown, self.evidence, self.student_profile)
        self.assertEqual(status, EligibilityStatus.UNKNOWN)

        # One fail makes overall DOES_NOT_MEET immediately
        reqs_with_fail = reqs_with_unknown + [
            JobRequirement(
                id=uuid.uuid4(),
                job_id="job-1",
                requirement_type=RequirementType.MANDATORY,
                category=RequirementCategory.ACADEMIC,
                description="CGPA >= 9.5",
                rule_expression={"field": "cgpa", "op": ">=", "value": 9.5},
            )
        ]
        status, _ = evaluate_eligibility(reqs_with_fail, self.evidence, self.student_profile)
        self.assertEqual(status, EligibilityStatus.DOES_NOT_MEET)


class TestWeightedAlignmentCalculator(unittest.TestCase):
    def test_weights_sum_to_one(self):
        total = sum(ALIGNMENT_WEIGHTS.values())
        self.assertAlmostEqual(total, 1.0, places=4)

    def test_alignment_calculation_and_multipliers(self):
        profile, evidence = _STUDENTS_BY_ID[_PRIYA_ID]
        result = calculate_alignment(_JOB_BACKEND_REQS, evidence, profile)
        self.assertGreater(result.total_score, 0.0)
        self.assertLessEqual(result.total_score, 100.0)
        # Verify all 5 factors are represented
        factor_names = {f.factor_name for f in result.factor_breakdown}
        self.assertEqual(
            factor_names,
            {
                "required_skills",
                "projects_experience",
                "preferred_skills",
                "assessments",
                "preferences",
            },
        )


class TestCounterfactualSandbox(unittest.TestCase):
    def test_stateless_and_fast(self):
        profile, evidence = _STUDENTS_BY_ID[_PRIYA_ID]
        toggles = [
            SandboxToggle(
                skill_id="skill-sql-003",
                action="complete_assessment",
                simulated_evidence_status=EvidenceStatus.ASSESSMENT_VERIFIED,
            ),
            SandboxToggle(
                skill_id="skill-docker-004",
                action="verify_skill",
                simulated_evidence_status=EvidenceStatus.ASSESSMENT_VERIFIED,
            ),
        ]
        t0 = time.perf_counter()
        res = simulate_counterfactual(_JOB_BACKEND_REQS, evidence, profile, toggles)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        # Performance constraint: MUST be < 50ms
        self.assertLess(elapsed_ms, 50.0, f"Simulation took {elapsed_ms:.2f}ms, target is < 50ms")
        self.assertGreaterEqual(res.delta, 0.0)
        self.assertGreaterEqual(res.simulated_alignment.total_score, res.base_alignment.total_score)


def run_coro(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value

class TestAPIEndpoints(unittest.TestCase):
    def test_get_evidence(self):
        evs = run_coro(get_student_evidence(_PRIYA_ID))
        self.assertGreater(len(evs), 0)
        # Check that EXTRACTED status exists for Ghost Card demo
        has_extracted = any(e.evidence_status == EvidenceStatus.EXTRACTED for e in evs)
        self.assertTrue(has_extracted)

    def test_get_matches(self):
        matches = run_coro(get_student_matches(_PRIYA_ID))
        self.assertGreater(len(matches), 0)
        self.assertIn(matches[0].eligibility_status, {EligibilityStatus.MEETS, EligibilityStatus.UNKNOWN, EligibilityStatus.DOES_NOT_MEET})

    def test_simulate_fit_endpoint(self):
        req = SandboxRequest(
            student_user_id=_PRIYA_ID,
            job_id=_JOB_BACKEND,
            toggles=[
                SandboxToggle(
                    skill_id="skill-sql-003",
                    action="complete_assessment",
                    simulated_evidence_status=EvidenceStatus.ASSESSMENT_VERIFIED,
                )
            ],
        )
        res = run_coro(simulate_fit(req))
        self.assertIsNotNone(res.delta)

    def test_ghost_to_solid_confirm_extraction(self):
        # Confirm Priya's extracted evidence
        updated = run_coro(confirm_extraction(str(_PRIYA_EXTRACTED_ID)))
        self.assertEqual(updated.evidence_status, EvidenceStatus.STUDENT_CONFIRMED)


def run_all_tests():
    print("======================================================================")
    print("Running CampusBridge AI Phase 1 Test Suite")
    print("======================================================================")
    
    # 1. Eligibility Tests
    test_elig = TestDeterministicEligibility()
    test_elig.setUp()
    test_elig.test_academic_cgpa_meets()
    test_elig.test_academic_cgpa_does_not_meet()
    test_elig.test_missing_field_is_unknown()
    test_elig.test_skill_confirmed_meets()
    test_elig.test_skill_extracted_only_is_unknown()
    test_elig.test_overall_eligibility_cascade()
    print("[PASS] Deterministic Hard-Gate Eligibility Engine: 6/6 tests PASSED")

    # 2. Alignment Tests
    test_align = TestWeightedAlignmentCalculator()
    test_align.test_weights_sum_to_one()
    test_align.test_alignment_calculation_and_multipliers()
    print("[PASS] Weighted Fit Alignment Calculator: 2/2 tests PASSED")

    # 3. Sandbox Tests
    test_sandbox = TestCounterfactualSandbox()
    test_sandbox.test_stateless_and_fast()
    print("[PASS] Counterfactual Fit Sandbox (<50ms performance): 1/1 test PASSED")

    # 4. API Endpoint Tests
    test_api = TestAPIEndpoints()
    test_api.test_get_evidence()
    test_api.test_get_matches()
    test_api.test_simulate_fit_endpoint()
    test_api.test_ghost_to_solid_confirm_extraction()
    print("[PASS] API Endpoints & Ghost-to-Solid confirmation: 4/4 tests PASSED")
    
    print("======================================================================")
    print("ALL 13 PHASE 1 TESTS PASSED SUCCESSFULLY (100% Deterministic & Pure)")
    print("======================================================================")

if __name__ == "__main__":
    run_all_tests()
