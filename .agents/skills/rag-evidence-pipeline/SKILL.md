---
name: rag-evidence-pipeline
description: Use whenever building or modifying document ingestion, chunking, pgvector embeddings, hybrid BM25 + vector search, reranking, or citation validation for CampusBridge AI.
---
# CampusBridge AI — RAG & Evidence Pipeline Skill

## Instructions
1. **Quarantine & Safe Parsing:** Validate MIME type by file content, enforce a 20MB cap, and extract text with page/section bounding anchors (`page_no`, `section_path`, `source_span`).
2. **Document-Aware Chunking:** Never use blind fixed-character splitting. Chunk resumes by section (`Education`, `Projects`, `Skills`, `Experience`), JDs by requirement blocks, and policies by clause (400–800 tokens, 60–120 overlap).
3. **Pre-Filtered Hybrid Search:** 
   - Enforce `institution_id`, `owner_user_id`, and `acl_scope` in SQL/RLS *prior* to vector/lexical scoring.
   - Combine PostgreSQL Full-Text Search (`tsvector` / BM25) with `pgvector` HNSW cosine similarity, followed by Cross-Encoder reranking.
4. **Strict Citation Validator:** Every synthesized claim must resolve to a stored `document_version_id` and `chunk_id`. If a claim lacks a source span, mark it as `INSUFFICIENT_EVIDENCE` or model guidance—never fabricate a citation.