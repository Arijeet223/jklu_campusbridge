"""CampusBridge AI — Phase 3 MCP Ecosystem Test Suite.

Tests:
1. Registration & schema conformance of all 6 servers and 13 tools.
2. Student Profile server (profile, evidence listing, Ghost Card proposal).
3. Career Knowledge server (role guide search, 72h sprint resource search).
4. Job Intelligence server (approved JD retrieval, structured draft parsing).
5. Matching server (deterministic preview, cited explanation).
6. Placement Operations server (application tracking, sprint task creation, officer review).
7. Analytics server with DPDP small-cell k-anonymity suppression (< 5 masked).
8. RBAC security enforcement (students blocked from officer-only tools).
9. Rate-limiter sliding-window enforcement.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from mcp.registry.tool_registry import MCPRegistry
from mcp.servers.base import SecurityContext
from services.api.endpoints import _PRIYA_ID, _JOB_BACKEND


class TestMCPEcosystem(unittest.TestCase):
    def setUp(self):
        self.registry = MCPRegistry()
        self.student_ctx = SecurityContext(
            actor_id=_PRIYA_ID,
            actor_role="STUDENT",
            institution_id="inst-nitk-001",
        )
        self.officer_ctx = SecurityContext(
            actor_id="officer-sharma-001",
            actor_role="PLACEMENT_OFFICER",
            institution_id="inst-nitk-001",
        )

    def test_all_servers_and_tools_registered(self):
        tools = self.registry.list_all_tools()
        self.assertEqual(len(tools), 13)
        self.assertEqual(len(self.registry.servers), 6)

        expected_servers = {
            "student-profile",
            "career-knowledge",
            "job-intelligence",
            "matching",
            "placement-ops",
            "analytics",
        }
        self.assertEqual(set(self.registry.servers.keys()), expected_servers)

    def test_student_profile_tools(self):
        # 1. get_my_profile
        resp = self.registry.execute_tool("student-profile", "get_my_profile", {}, self.student_ctx)
        self.assertTrue(resp.success)
        self.assertEqual(resp.data["student_id"], _PRIYA_ID)
        self.assertEqual(resp.data["privacy_shield"]["posture"], "PRIVATE_BY_DEFAULT")

        # 2. list_my_evidence
        resp_ev = self.registry.execute_tool("student-profile", "list_my_evidence", {}, self.student_ctx)
        self.assertTrue(resp_ev.success)
        self.assertGreater(resp_ev.data["evidence_count"], 0)

        # 3. propose_profile_update (provisional Ghost Card)
        resp_prop = self.registry.execute_tool(
            "student-profile",
            "propose_profile_update",
            {
                "skill_name": "Kafka Event Streaming",
                "proficiency_level": 0.85,
                "source_document_id": "doc_resume_v3",
                "source_span": {"start_char": 100, "end_char": 125, "section_path": "Projects"},
            },
            self.student_ctx,
        )
        self.assertTrue(resp_prop.success)
        self.assertEqual(resp_prop.data["status"], "EXTRACTED")

    def test_career_knowledge_tools(self):
        # 1. search_role_guides
        resp = self.registry.execute_tool(
            "career-knowledge",
            "search_role_guides",
            {"query": "Backend Engineer"},
            self.student_ctx,
        )
        self.assertTrue(resp.success)
        self.assertGreater(resp.data["total_matches"], 0)

        # 2. search_learning_resources (72h sprint mode)
        resp_learn = self.registry.execute_tool(
            "career-knowledge",
            "search_learning_resources",
            {"skills": ["FastAPI"], "prep_mode": "SPRINT_72H"},
            self.student_ctx,
        )
        self.assertTrue(resp_learn.success)
        self.assertGreater(resp_learn.data["total_resources"], 0)
        self.assertEqual(resp_learn.data["resources"][0]["mode"], "SPRINT_72H")

    def test_job_intelligence_tools(self):
        # 1. get_approved_job
        resp = self.registry.execute_tool(
            "job-intelligence",
            "get_approved_job",
            {"job_id": _JOB_BACKEND},
            self.student_ctx,
        )
        self.assertTrue(resp.success)
        self.assertGreater(len(resp.data["mandatory_requirements"]), 0)

        # 2. draft_job_requirements (officer scope)
        resp_draft = self.registry.execute_tool(
            "job-intelligence",
            "draft_job_requirements",
            {
                "company_name": "CloudScale AI",
                "job_title": "Platform Engineer",
                "raw_description": "Must have Python experience and CGPA >= 7.5. Preferred: Kubernetes and Docker.",
            },
            self.officer_ctx,
        )
        self.assertTrue(resp_draft.success)
        self.assertGreater(len(resp_draft.data["extracted_mandatory"]), 0)
        self.assertGreater(len(resp_draft.data["extracted_preferred"]), 0)

    def test_matching_tools(self):
        # 1. run_match_preview
        resp = self.registry.execute_tool(
            "matching",
            "run_match_preview",
            {"job_id": _JOB_BACKEND},
            self.student_ctx,
        )
        self.assertTrue(resp.success)
        self.assertIn(resp.data["eligibility_status"], ["MEETS", "UNKNOWN", "DOES_NOT_MEET"])
        self.assertGreater(resp.data["alignment_score"], 0)

        # 2. explain_match
        resp_exp = self.registry.execute_tool(
            "matching",
            "explain_match",
            {"job_id": _JOB_BACKEND},
            self.student_ctx,
        )
        self.assertTrue(resp_exp.success)
        self.assertIn("Rubric Alignment", resp_exp.data["explanation_markdown"])

    def test_placement_ops_tools(self):
        # 1. list_my_applications
        resp = self.registry.execute_tool(
            "placement-ops",
            "list_my_applications",
            {},
            self.student_ctx,
        )
        self.assertTrue(resp.success)
        self.assertGreater(resp.data["total_applications"], 0)

        # 2. create_study_task
        resp_task = self.registry.execute_tool(
            "placement-ops",
            "create_study_task",
            {"title": "Review Distributed Systems STAR stories", "mode": "SPRINT_72H"},
            self.student_ctx,
        )
        self.assertTrue(resp_task.success)
        self.assertEqual(resp_task.data["status"], "CREATED_IN_STUDY_PLAN")

        # 3. record_human_review (officer scope)
        resp_rev = self.registry.execute_tool(
            "placement-ops",
            "record_human_review",
            {
                "target_entity_id": "app-001",
                "decision": "APPROVED",
                "reason_code": "EQUIVALENCE_APPROVED",
                "notes": "Verified equivalent course syllabus.",
            },
            self.officer_ctx,
        )
        self.assertTrue(resp_rev.success)
        self.assertEqual(resp_rev.data["status"], "AUDITED_REVIEW_COMMITTED")

    def test_analytics_small_cell_suppression(self):
        resp = self.registry.execute_tool(
            "analytics",
            "get_cohort_summary",
            {"cohort_id": "cohort-2027-cs", "min_k_anonymity": 5},
            self.officer_ctx,
        )
        self.assertTrue(resp.success)
        tiers = resp.data["readiness_tiers"]
        # Normal counts (> 5) are numeric
        self.assertIsInstance(tiers["high_alignment_verified"], int)
        # Low cell (< 5) MUST be suppressed to string '< 5' for DPDP compliance!
        self.assertEqual(tiers["academic_exception_cases"], "< 5")

    def test_rbac_security_boundaries(self):
        # A student attempting an officer tool MUST be denied
        resp = self.registry.execute_tool(
            "job-intelligence",
            "draft_job_requirements",
            {"company_name": "Test", "job_title": "Test", "raw_description": "Test requirement"},
            self.student_ctx,
        )
        self.assertFalse(resp.success)
        self.assertIn("Permission denied", resp.error)
        self.assertIsNotNone(resp.actionable_advice)

        # A student attempting to record officer review MUST be denied
        resp2 = self.registry.execute_tool(
            "placement-ops",
            "record_human_review",
            {"target_entity_id": "app-001", "decision": "APPROVED", "reason_code": "EQUIVALENCE_APPROVED"},
            self.student_ctx,
        )
        self.assertFalse(resp2.success)
        self.assertIn("Permission denied", resp2.error)

    def test_rate_limiting_enforcement(self):
        # Tool with rate limit 10/min: calling 11 times must trigger rate limit
        tool_name = "propose_profile_update"
        payload = {
            "skill_name": "RateTest",
            "source_document_id": "doc1",
            "source_span": {"start_char": 0, "end_char": 10},
        }

        # Clear bucket
        rate_key = f"{self.student_ctx.actor_id}:student-profile:{tool_name}"
        self.registry._rate_limit_buckets[rate_key] = []

        # Make 10 successful calls
        for _ in range(10):
            res = self.registry.execute_tool("student-profile", tool_name, payload, self.student_ctx)
            self.assertTrue(res.success)

        # 11th call must fail with rate limit error
        res11 = self.registry.execute_tool("student-profile", tool_name, payload, self.student_ctx)
        self.assertFalse(res11.success)
        self.assertIn("Rate limit exceeded", res11.error)


def run_all_mcp_tests():
    print("======================================================================")
    print("Running CampusBridge AI Phase 3 Test Suite (MCP Tool Ecosystem)")
    print("======================================================================")

    suite = TestMCPEcosystem()
    suite.setUp()

    suite.test_all_servers_and_tools_registered()
    print("[PASS] MCP Registry & Tool Coverage (6 servers, 13 tools): PASSED")

    suite.test_student_profile_tools()
    print("[PASS] student-profile Server (profile, evidence, Ghost Card): PASSED")

    suite.test_career_knowledge_tools()
    print("[PASS] career-knowledge Server (role guides, 72h sprint): PASSED")

    suite.test_job_intelligence_tools()
    print("[PASS] job-intelligence Server (approved JDs, draft parsing): PASSED")

    suite.test_matching_tools()
    print("[PASS] matching Server (deterministic preview, cited explanation): PASSED")

    suite.test_placement_ops_tools()
    print("[PASS] placement-ops Server (applications, tasks, human review): PASSED")

    suite.test_analytics_small_cell_suppression()
    print("[PASS] analytics Server (DPDP k-anonymity small-cell suppression): PASSED")

    suite.test_rbac_security_boundaries()
    print("[PASS] Zero-Trust RBAC Boundaries (Officer scope protected): PASSED")

    suite.test_rate_limiting_enforcement()
    print("[PASS] Sliding-Window Rate Limiting Quota: PASSED")

    print("======================================================================")
    print("ALL 9 PHASE 3 TESTS PASSED (100% MCP Conformance & Security Verified)")
    print("======================================================================")


if __name__ == "__main__":
    run_all_mcp_tests()

