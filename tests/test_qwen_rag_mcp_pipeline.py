"""CampusBridge AI — Live Qwen 2.5 + Hybrid RAG + MCP Pipeline Test Suite.

Verifies end-to-end integration:
1. Qwen 2.5 Model Gateway with Ollama auto-detection & hard guardrails.
2. nomic-embed-text Local Embeddings & Cosine Similarity.
3. GET /v1/ai/health Telemetry Endpoint (Ollama, RAG, 6 MCP servers, 13 tools).
4. Live Orchestrator Grounded Pipeline (MCP Tools -> Hybrid RAG -> Qwen 2.5 -> Citation Validator).
5. POST /v1/ai/chat REST API Endpoint.
"""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.model_gateway import ModelGateway, ModelGatewayBudgetExceeded
from rag.embeddings import EmbeddingGateway
from mcp.servers.base import SecurityContext
from services.api.endpoints import (
    _PRIYA_ID,
    _CHUNKS_STORE,
    _orchestrator,
    get_ai_health,
    ai_chat,
    AIChatRequest,
)


def run_coro(coro):
    """Hermetic coroutine runner."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    raise RuntimeError("Coroutine did not return")


class TestQwen25ModelGateway(unittest.TestCase):
    def setUp(self):
        self.gateway = ModelGateway()

    def test_qwen_model_detection_and_health(self):
        health = self.gateway.check_health()
        self.assertIn("status", health)
        self.assertIn("qwen", self.gateway.model_name.lower())
        self.assertGreater(self.gateway.timeout_seconds, 0)

    def test_greeting_mentor_behavior(self):
        resp = self.gateway.generate("hey there!")
        self.assertIn("Hey", resp.content)
        self.assertGreater(resp.total_tokens, 0)

    def test_prompt_budget_exceeded(self):
        oversized = "X" * 8500
        with self.assertRaises(ModelGatewayBudgetExceeded):
            self.gateway.generate(oversized)


class TestNomicEmbeddingsGateway(unittest.TestCase):
    def setUp(self):
        self.gateway = EmbeddingGateway()

    def test_nomic_embed_dimensions_and_health(self):
        health = self.gateway.check_health()
        self.assertIn("status", health)
        vec = self.gateway.embed_text("Distributed backend microservices in Python")
        self.assertEqual(len(vec), 1536)

    def test_cosine_similarity_accuracy(self):
        v1 = self.gateway.embed_text("FastAPI backend microservices")
        v2 = self.gateway.embed_text("Python FastAPI web services development")
        v3 = self.gateway.embed_text("Ancient Egyptian hieroglyphics translation")

        sim_rel = self.gateway.cosine_similarity(v1, v2)
        sim_unrel = self.gateway.cosine_similarity(v1, v3)
        self.assertGreater(sim_rel, sim_unrel)


class TestAIHealthAndChatEndpoints(unittest.TestCase):
    def setUp(self):
        self.ctx = SecurityContext(
            actor_id=_PRIYA_ID,
            actor_role="STUDENT",
            institution_id="inst-nitk-001",
            purpose="placement_readiness",
        )

    def test_ai_health_telemetry_structure(self):
        health = run_coro(get_ai_health())
        self.assertEqual(health["status"], "HEALTHY")

        # Verify Ollama telemetry
        self.assertIn("ollama", health)
        self.assertIn("active_model", health["ollama"])

        # Verify RAG telemetry
        self.assertIn("rag", health)
        self.assertGreaterEqual(health["rag"]["indexed_chunks_count"], 3)
        self.assertEqual(health["rag"]["vector_dimensions"], 1536)

        # Verify MCP telemetry (6 servers, 13 tools)
        self.assertIn("mcp", health)
        self.assertEqual(health["mcp"]["servers_count"], 6)
        self.assertEqual(health["mcp"]["tools_count"], 13)
        self.assertIn("student-profile", health["mcp"]["active_servers"])
        self.assertIn("matching", health["mcp"]["active_servers"])

    def test_live_grounded_orchestrator_pipeline(self):
        prompt = "How is my match standing for TechCorp backend roles?"
        res = _orchestrator.run_live_grounded_pipeline(
            prompt=prompt,
            context=self.ctx,
            stored_chunks=_CHUNKS_STORE,
        )

        self.assertIn("response", res)
        self.assertIn("trace", res)
        trace = res["trace"]

        # Step 1: MCP tools verification (4 tools called)
        self.assertIn("mcp_tools", trace)
        self.assertEqual(len(trace["mcp_tools"]), 4)
        for tool in trace["mcp_tools"]:
            self.assertEqual(tool["status"], "ALLOWED")
            self.assertGreaterEqual(tool["execution_time_ms"], 0.0)

        # Step 2: Hybrid RAG retrieval verification
        self.assertIn("rag_chunks", trace)
        self.assertGreater(len(trace["rag_chunks"]), 0)
        for chunk in trace["rag_chunks"]:
            self.assertIn("similarity_score", chunk)
            self.assertIn("char_span", chunk)

        # Step 3: Engine & Citation Guardrail verification
        self.assertIn("engine", trace)
        self.assertIn("guardrail", trace)
        self.assertIn("Verified Grounded", trace["guardrail"]["status"])
        self.assertEqual(trace["guardrail"]["hallucinations_detected"], 0)

    def test_ai_chat_endpoint(self):
        req = AIChatRequest(
            message="Hi! Can you tell me about my match score?",
            actor_id=_PRIYA_ID,
        )
        data = run_coro(ai_chat(req))
        self.assertTrue(data["success"])
        self.assertIn("response", data)
        self.assertIn("trace", data)
        self.assertEqual(len(data["trace"]["mcp_tools"]), 4)

    def test_intent_5_workspace_copilot_scheduling(self):
        """Verifies Intent 5 workspace automation routes correctly and produces workspace card."""
        req = AIChatRequest(
            message="Schedule a mock interview on my calendar for tomorrow at 4pm",
            actor_id=_PRIYA_ID,
        )
        data = run_coro(ai_chat(req))
        self.assertTrue(data["success"])
        self.assertEqual(data["widget_type"], "workspace_card")
        self.assertEqual(data["delegated_agent"], "workspace_copilot")
        self.assertIn("calendar", data["response"].lower())

    def test_intent_5_workspace_copilot_email_draft(self):
        """Verifies Intent 5 Gmail drafting action."""
        req = AIChatRequest(
            message="Draft an email to Prof. Rao asking for research internship",
            actor_id=_PRIYA_ID,
        )
        data = run_coro(ai_chat(req))
        self.assertTrue(data["success"])
        self.assertEqual(data["widget_type"], "workspace_card")
        self.assertEqual(data["delegated_agent"], "workspace_copilot")
        self.assertIn("draft", data["response"].lower())

    def test_zero_canned_answers_rich_technical_response(self):
        """Verifies dynamic rich technical response for DSA and systems questions."""
        sec_ctx = SecurityContext(actor_id=_PRIYA_ID, actor_role="STUDENT", institution_id="inst-nitk-001")
        res = _orchestrator.run_live_grounded_pipeline(
            prompt="Explain how sliding window optimization reduces time complexity in subarray problems",
            context=sec_ctx,
        )
        self.assertIn("response", res)
        self.assertIn("J.A.R.V.I.S.", res["response"])
        self.assertIn("Sliding Window", res["response"])


if __name__ == "__main__":
    unittest.main()


