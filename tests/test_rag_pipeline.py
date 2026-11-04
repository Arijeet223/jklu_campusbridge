"""CampusBridge AI — Phase 2 Automated Test Suite.

Tests:
1. Quarantine & MIME Validation (FileValidator).
2. Section-Aware Chunking with layout offsets (SectionAwareChunker).
3. 1536-dimensional Local Embeddings & Cosine Similarity (EmbeddingGateway).
4. Pre-Filtered Hybrid Retrieval (BM25 + Vector + RRF) with Zero Tenant Leakage.
5. Strict Citation & Claim Validator (CitationValidator).
6. FastAPI Ingestion, Search, and Validation Endpoints.
"""

import os
import sys
import unittest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.validation import FileValidator
from rag.chunking import SectionAwareChunker
from rag.embeddings import EmbeddingGateway
from rag.reranking import CrossEncoderReranker
from rag.retrieval import HybridRetrievalEngine, RetrievalQuery
from rag.validator import CitationValidator
from services.worker.ingestion_worker import IngestionWorker
from services.api.endpoints import (
    _PRIYA_ID,
    upload_document,
    hybrid_search,
    validate_citations,
    DocumentUploadRequest,
    HybridSearchRequest,
    CitationValidationRequest,
)


def run_coro(coro):
    """Hermetic coroutine runner for synchronous test execution."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


class TestFileValidator(unittest.TestCase):
    def test_valid_pdf_magic_bytes(self):
        pdf_bytes = b"%PDF-1.5 Sample content for resume verification"
        res = FileValidator.validate_content(pdf_bytes, "resume.pdf")
        self.assertTrue(res.is_valid)
        self.assertEqual(res.mime_type, "application/pdf")
        self.assertEqual(res.quarantine_status, "CLEAN")
        self.assertIsNotNone(res.sha256_hash)

    def test_valid_plain_text(self):
        txt_bytes = b"Skills: Python, FastAPI, React"
        res = FileValidator.validate_content(txt_bytes, "skills.txt")
        self.assertTrue(res.is_valid)
        self.assertEqual(res.mime_type, "text/plain")

    def test_empty_file_fails(self):
        res = FileValidator.validate_content(b"", "empty.pdf")
        self.assertFalse(res.is_valid)
        self.assertEqual(res.quarantine_status, "PARSE_FAILED")

    def test_disallowed_mime_fails(self):
        bad_bytes = b"\x7fELF\x02\x01\x01\x00BinaryExecutable"
        res = FileValidator.validate_content(bad_bytes, "malware.exe")
        self.assertFalse(res.is_valid)
        self.assertEqual(res.quarantine_status, "PARSE_FAILED")


class TestSectionAwareChunker(unittest.TestCase):
    def setUp(self):
        self.chunker = SectionAwareChunker()
        self.sample_resume = (
            "Priya Sharma — Candidate Profile\n\n"
            "EDUCATION\n"
            "B.Tech Computer Science, NIT Surathkal (2023 - 2027), CGPA: 8.2\n\n"
            "PROJECTS\n"
            "Order Processing Service: High-throughput async pipeline using FastAPI and PostgreSQL.\n"
            "Inventory Stream: Distributed event streaming using Redis Streams.\n\n"
            "TECHNICAL SKILLS\n"
            "Python, FastAPI, React, SQL & Database Design, Docker, Distributed Systems."
        )

    def test_section_splitting_and_offsets(self):
        chunks = self.chunker.chunk_document(self.sample_resume, page_number=1)
        self.assertGreaterEqual(len(chunks), 3)

        section_names = [c.section_path.lower() for c in chunks]
        self.assertTrue(any("education" in s for s in section_names))
        self.assertTrue(any("projects" in s for s in section_names))
        self.assertTrue(any("skills" in s for s in section_names))

        # Check accurate character offset indexing
        for c in chunks:
            self.assertGreater(c.char_end, c.char_start)
            # Extracted span must match original text substring
            extracted = self.sample_resume[c.char_start:c.char_end].strip()
            self.assertEqual(extracted, c.content.strip())


class TestEmbeddingGateway(unittest.TestCase):
    def setUp(self):
        self.gateway = EmbeddingGateway()

    def test_1536_dimension_vector(self):
        vec = self.gateway.embed_text("FastAPI backend microservice with PostgreSQL")
        self.assertEqual(len(vec), 1536)

    def test_cosine_similarity_semantic_ordering(self):
        v1 = self.gateway.embed_text("FastAPI and Python backend")
        v2 = self.gateway.embed_text("Python FastAPI web server development")
        v3 = self.gateway.embed_text("Classical English Renaissance literature")

        sim_related = self.gateway.cosine_similarity(v1, v2)
        sim_unrelated = self.gateway.cosine_similarity(v1, v3)

        self.assertGreater(sim_related, sim_unrelated)


class TestPreFilteredHybridRetrieval(unittest.TestCase):
    def setUp(self):
        self.engine = HybridRetrievalEngine()
        self.chunks = [
            {
                "chunk_id": "c1",
                "document_id": "doc1",
                "student_user_id": "student-A",
                "institution_id": "inst-1",
                "content": "Developed an order processing microservice using FastAPI and PostgreSQL.",
                "section_path": "Projects",
                "page_number": 1,
                "char_start": 0,
                "char_end": 72,
            },
            {
                "chunk_id": "c2",
                "document_id": "doc1",
                "student_user_id": "student-A",
                "institution_id": "inst-1",
                "content": "Proficient in Python, SQL database optimization, and Docker containers.",
                "section_path": "Skills",
                "page_number": 1,
                "char_start": 75,
                "char_end": 140,
            },
            {
                "chunk_id": "c3",
                "document_id": "doc2",
                "student_user_id": "student-B",  # Other student
                "institution_id": "inst-1",
                "content": "FastAPI expert with 5 years experience.",
                "section_path": "Experience",
                "page_number": 1,
                "char_start": 0,
                "char_end": 40,
            },
        ]

    def test_acl_pre_filter_zero_leakage(self):
        # Querying as student-A must NEVER return student-B chunks
        q = RetrievalQuery(
            query_text="FastAPI microservice",
            student_user_id="student-A",
            institution_id="inst-1",
            top_k=5,
        )
        res = self.engine.search_in_memory(q, self.chunks)
        self.assertGreater(len(res.results), 0)
        returned_ids = {r.chunk_id for r in res.results}
        self.assertIn("c1", returned_ids)
        self.assertNotIn("c3", returned_ids)  # Verified zero student-B leakage!

    def test_cross_tenant_isolation(self):
        q = RetrievalQuery(
            query_text="FastAPI",
            student_user_id="student-A",
            institution_id="inst-OTHER",
            top_k=5,
        )
        res = self.engine.search_in_memory(q, self.chunks)
        self.assertEqual(len(res.results), 0)


class TestCitationValidator(unittest.TestCase):
    def setUp(self):
        self.validator = CitationValidator()
        self.retrieved_chunks = [
            {
                "chunk_id": "chunk-01",
                "document_id": "doc-resume",
                "content": "Implemented high throughput order service handling 2000 concurrent requests with FastAPI.",
                "section_path": "Projects > Order Service",
            }
        ]

    def test_valid_grounded_citation(self):
        text = "Student demonstrated high throughput API design handling concurrent requests [chunk-01]."
        sanitized, details = self.validator.validate_agent_text(text, self.retrieved_chunks)
        self.assertEqual(len(details), 1)
        self.assertTrue(details[0].is_valid)
        self.assertEqual(details[0].status, "VERIFIED")
        self.assertIn("[chunk-01]", sanitized)

    def test_unresolved_citation_sanitized(self):
        text = "Student led team of 50 engineers at Google [chunk-hallucinated]."
        sanitized, details = self.validator.validate_agent_text(text, self.retrieved_chunks)
        self.assertEqual(len(details), 1)
        self.assertFalse(details[0].is_valid)
        self.assertEqual(details[0].status, "UNRESOLVED_CITATION")
        self.assertIn("[INSUFFICIENT_EVIDENCE]", sanitized)
        self.assertNotIn("[chunk-hallucinated]", sanitized)


class TestPhase2APIEndpoints(unittest.TestCase):
    def test_upload_document_endpoint(self):
        req = DocumentUploadRequest(
            file_name="capstone_summary.txt",
            content_text="Projects:\nBuilt an automated placement assistant using FastAPI, React, and PostgreSQL.\n\nSkills:\nPython, React, PostgreSQL",
            student_user_id=_PRIYA_ID,
            institution_id="inst-nitk-001",
        )
        res = run_coro(upload_document(req))
        self.assertEqual(res["quarantine_status"], "CLEAN")
        self.assertGreater(res["chunks_count"], 0)
        self.assertGreater(res["provisional_skills_count"], 0)

    def test_hybrid_search_endpoint(self):
        req = HybridSearchRequest(
            query="order processing microservice FastAPI",
            student_user_id=_PRIYA_ID,
            institution_id="inst-nitk-001",
            top_k=3,
        )
        res = run_coro(hybrid_search(req))
        self.assertGreater(len(res["results"]), 0)
        self.assertIn("FastAPI", res["results"][0]["content"])

    def test_validate_citations_endpoint(self):
        req = CitationValidationRequest(
            agent_text="The candidate developed a distributed microservice using FastAPI [chunk-priya-002].",
        )
        res = run_coro(validate_citations(req))
        self.assertTrue(res["all_citations_verified"])
        self.assertEqual(res["total_citations"], 1)


def run_all_phase2_tests():
    print("======================================================================")
    print("Running CampusBridge AI Phase 2 Test Suite (RAG & Evidence Pipeline)")
    print("======================================================================")

    # 1. File Validator Tests
    t1 = TestFileValidator()
    t1.test_valid_pdf_magic_bytes()
    t1.test_valid_plain_text()
    t1.test_empty_file_fails()
    t1.test_disallowed_mime_fails()
    print("[PASS] File Quarantine & MIME Sniffing: 4/4 tests PASSED")

    # 2. Section Chunker Tests
    t2 = TestSectionAwareChunker()
    t2.setUp()
    t2.test_section_splitting_and_offsets()
    print("[PASS] Section-Aware Layout & Offset Chunker: 1/1 test PASSED")

    # 3. Embedding Gateway Tests
    t3 = TestEmbeddingGateway()
    t3.setUp()
    t3.test_1536_dimension_vector()
    t3.test_cosine_similarity_semantic_ordering()
    print("[PASS] 1536-Dimensional Embeddings & Cosine Engine: 2/2 tests PASSED")

    # 4. Pre-Filtered Hybrid Retrieval Tests
    t4 = TestPreFilteredHybridRetrieval()
    t4.setUp()
    t4.test_acl_pre_filter_zero_leakage()
    t4.test_cross_tenant_isolation()
    print("[PASS] Pre-Filtered Hybrid Retrieval (Zero Tenant Leakage): 2/2 tests PASSED")

    # 5. Citation Validator Tests
    t5 = TestCitationValidator()
    t5.setUp()
    t5.test_valid_grounded_citation()
    t5.test_unresolved_citation_sanitized()
    print("[PASS] Strict Citation & Hallucination Sanitizer: 2/2 tests PASSED")

    # 6. API Endpoints Tests
    t6 = TestPhase2APIEndpoints()
    t6.test_upload_document_endpoint()
    t6.test_hybrid_search_endpoint()
    t6.test_validate_citations_endpoint()
    print("[PASS] Phase 2 API Endpoints (Upload, Search, Validate): 3/3 tests PASSED")

    print("======================================================================")
    print("ALL 14 PHASE 2 TESTS PASSED SUCCESSFULLY (Zero Leakage, Fully Verified)")
    print("======================================================================")


if __name__ == "__main__":
    run_all_phase2_tests()

