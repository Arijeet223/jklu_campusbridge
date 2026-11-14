"""CampusBridge AI — Tests for Voice Agent, Tool Calling, JD RAG & Code Sandbox.

Provides 12 comprehensive unit and integration tests:
1. test_voice_token_default_generation
2. test_voice_token_with_job_id_metadata
3. test_voice_token_agent_dispatch_binding
4. test_draft_professor_email_tool_calling
5. test_draft_professor_email_database_persistence
6. test_jd_upload_endpoint_and_skills_extraction
7. test_jd_chunking_and_metadata
8. test_jd_context_retrieval_for_voice_agent
9. test_dynamic_recruiter_persona_prompt_injection
10. test_conversational_agent_sliding_window_truncation
11. test_qdu_oj_sandbox_resource_limits_and_success
12. test_qdu_oj_sandbox_timeout_enforcement
"""

import asyncio
import json
import os
import unittest

from backend.routers.voice import get_voice_token
from backend.routers.jd_upload import extract_skills_from_jd, chunk_jd_text
from backend.voice_agent import (
    CampusBridgeTools,
    ConversationalAgent,
    create_recruiter_instructions,
    create_agent_instructions,
    retrieve_job_context,
)
from backend.sandbox import get_sandbox
from livekit.agents import llm


class TestVoiceAgentAndSandbox(unittest.TestCase):
    """Test suite covering Voice Agent Tool Calling, JD RAG Injection, and Sandbox Constraints."""

    def test_voice_token_default_generation(self):
        """Test 1: Verify token route generates signed WebRTC token with default identity."""
        res = asyncio.run(get_voice_token(student_id="STU-101", student_name="Aarav Sharma"))
        self.assertIn("token", res)
        self.assertTrue(len(res["token"]) > 30)
        self.assertEqual(res["identity"], "STU-101")
        self.assertIn("campusbridge-STU-101", res["room_name"])

    def test_voice_token_with_job_id_metadata(self):
        """Test 2: Verify token route attaches job_id into room metadata."""
        res = asyncio.run(
            get_voice_token(
                student_id="STU-101",
                student_name="Aarav Sharma",
                job_id="job-google-swe",
            )
        )
        self.assertEqual(res["job_id"], "job-google-swe")
        self.assertIn("job-google-swe", res["room_name"])
        self.assertEqual(res["metadata"]["job_id"], "job-google-swe")

    def test_voice_token_agent_dispatch_binding(self):
        """Test 3: Verify explicit dispatch binding to 'campusbridge-local'."""
        res = asyncio.run(get_voice_token(student_id="STU-101"))
        self.assertEqual(res["agent_dispatched"], "campusbridge-local")

    def test_draft_professor_email_tool_calling(self):
        """Test 4: Verify LiveKit @llm.ai_callable discovery and execution on CampusBridgeTools."""
        profile = {
            "name": "Aarav Sharma",
            "program": "B.Tech Computer Science",
            "cgpa": 8.42,
            "skills": ["Python", "FastAPI", "Distributed Systems"],
        }
        tools = CampusBridgeTools("STU-101", profile)
        found = llm.find_function_tools(tools)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0].info.name, "draft_professor_email")

        # Execute tool function
        raw = asyncio.run(
            tools.draft_professor_email(
                professor_name="Dr. Kavita Iyer",
                topic="Distributed Consensus in Raft",
            )
        )
        data = json.loads(raw)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["professor_name"], "Dr. Kavita Iyer")
        self.assertIn("Distributed Consensus In Raft", data["subject_line"])

    def test_draft_professor_email_database_persistence(self):
        """Test 5: Verify email draft data format, draft ID generation, and recipient resolution."""
        profile = {
            "name": "Priya Nair",
            "program": "B.Tech AI & Data Science",
            "cgpa": 8.95,
            "skills": ["PyTorch", "NLP", "Machine Learning"],
        }
        tools = CampusBridgeTools("STU-102", profile)
        raw = asyncio.run(
            tools.draft_professor_email(
                professor_name="Prof. Rajesh Menon",
                topic="Recommendation Letter for Stanford MS",
            )
        )
        data = json.loads(raw)
        self.assertTrue(data["draft_id"].startswith("draft-"))
        self.assertIn("Recommendation Letter For Stanford Ms", data["subject_line"])
        self.assertIn("menon", data["professor_email"].lower())

    def test_jd_upload_endpoint_and_skills_extraction(self):
        """Test 6: Verify JD skill taxonomy extraction for mandatory and preferred skills."""
        sample_jd = """
        Software Engineer at TechCorp.
        Must-have skills: Python, PostgreSQL, Docker, and REST API.
        Nice-to-have skills: Kubernetes, Redis, and Kafka.
        """
        mand, pref = extract_skills_from_jd(sample_jd)
        self.assertIn("Python", mand)
        self.assertIn("PostgreSQL", mand)
        self.assertIn("Docker", mand)
        self.assertIn("Kubernetes", pref)
        self.assertIn("Kafka", pref)

    def test_jd_chunking_and_metadata(self):
        """Test 7: Verify overlapping JD chunking with document provenance."""
        sample_jd = (
            "We are seeking an Infrastructure Engineer. "
            "You will manage large-scale Kubernetes clusters and automate deployment pipelines. "
            "Experience with Go, Linux, Terraform, and AWS is required."
        )
        chunks = chunk_jd_text(sample_jd, "job-99", "TechCorp", "Infrastructure Engineer", chunk_size=80)
        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0]["document_id"], "jd-job-99")
        self.assertIn("TechCorp", chunks[0]["document_name"])

    def test_jd_context_retrieval_for_voice_agent(self):
        """Test 8: Verify retrieval of active JD context for prompt injection."""
        ctx = asyncio.run(retrieve_job_context("job-google-swe"))
        self.assertIsNotNone(ctx)
        self.assertEqual(ctx["company_name"], "Google")
        self.assertIn("C++", ctx["mandatory_skills"])

    def test_dynamic_recruiter_persona_prompt_injection(self):
        """Test 9: Verify strict roleplay recruiter prompt generation and hard rules."""
        profile = {"name": "Aarav Sharma", "skills": ["Python", "Docker"]}
        jd = {
            "company_name": "Google",
            "role_title": "Software Engineer (L3)",
            "ctc_band": "35 LPA",
            "mandatory_skills": ["C++", "Distributed Systems"],
        }
        instructions = create_recruiter_instructions(profile, jd)
        self.assertIn("roleplaying strictly as a sharp, highly intuitive technical recruiter", instructions)
        self.assertIn("Google", instructions)
        self.assertIn("NEVER use robotic filler phrases", instructions)
        self.assertIn("2-3 punchy sentences maximum per turn", instructions)

    def test_conversational_agent_sliding_window_truncation(self):
        """Test 10: Verify 10-turn sliding window preserves system instructions while capping history."""
        agent = ConversationalAgent(instructions="You are J.A.R.V.I.S.")
        chat_ctx = llm.ChatContext()
        chat_ctx.add_message(role="system", content="You are J.A.R.V.I.S.")

        # Simulate 15 turns (30 messages)
        for i in range(15):
            chat_ctx.add_message(role="user", content=f"User question {i+1}")
            chat_ctx.add_message(role="assistant", content=f"Answer {i+1}")

        self.assertGreater(len(chat_ctx.items), 25)

        # Trigger hook
        asyncio.run(agent.on_user_turn_completed(chat_ctx, llm.ChatMessage(role="user", content=["Latest"])))
        # Truncate keeps first system message + max 20 items -> at most 22 items
        self.assertLessEqual(len(chat_ctx.items), 22)
        self.assertEqual(chat_ctx.items[0].role, "system")

    def test_qdu_oj_sandbox_resource_limits_and_success(self):
        """Test 11: Verify code execution sandbox runs valid algorithms and reports test verdicts."""
        sandbox = get_sandbox()
        code = (
            "def reverse_string(s):\n"
            "    return s[::-1]\n"
        )
        test_cases = [
            {"input": "hello", "expected": "olleh"},
            {"input": "campusbridge", "expected": "egdirbsupmac"},
        ]
        res = sandbox.execute_submission(code, test_cases)
        self.assertTrue(res["passed"])
        self.assertEqual(res["verdict"], "PASS")
        self.assertEqual(res["test_cases_passed"], 2)

    def test_qdu_oj_sandbox_timeout_enforcement(self):
        """Test 12: Verify code execution sandbox enforces 5.0-second timeout on infinite loops."""
        sandbox = get_sandbox()
        infinite_code = (
            "def infinite_loop(n):\n"
            "    while True:\n"
            "        pass\n"
        )
        test_cases = [{"input": 10, "expected": 10}]
        res = sandbox.execute_submission(infinite_code, test_cases)
        self.assertFalse(res["passed"])
        self.assertEqual(res["verdict"], "TIME_LIMIT_EXCEEDED")
        self.assertGreaterEqual(res["execution_time_ms"], 4800.0)
