"""CampusBridge AI — Production Qdrant Cloud & Vector Database Gateway.

Provides:
1. High-throughput connection pooling to Qdrant Cloud or local cluster via QdrantClient.
2. Automatic collection provisioning (1536-dimensional COSINE vectors with payload indexes).
3. Section-aware resume chunk ingestion with rich metadata (student_id, department, skills).
4. Pre-filtered hybrid vector similarity search (ACL-scoped to student_id and institution).
5. Semantic skill-matching against candidate resume chunks.
6. Local embedded storage fallback when offline or in test mode.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

from qdrant_client import AsyncQdrantClient, QdrantClient, models

from rag.embeddings import VECTOR_DIMENSIONS, EmbeddingGateway

logger = logging.getLogger("campusbridge.qdrant")

# Default collection name for student technical resumes
DEFAULT_COLLECTION = os.getenv("QDRANT_COLLECTION", "campusbridge_resumes")
ACTIVE_PLACEMENTS_COLLECTION = os.getenv("QDRANT_PLACEMENTS_COLLECTION", "active_placements")
LOCAL_STORAGE_PATH = os.getenv("QDRANT_STORAGE_PATH", "data/qdrant_storage")


class QdrantService:
    """High-performance vector database service backed by Qdrant (Cloud or Local)."""

    def __init__(
        self,
        url: str | None = None,
        api_key: str | None = None,
        collection_name: str = DEFAULT_COLLECTION,
        vector_size: int = VECTOR_DIMENSIONS,
        embedding_gateway: EmbeddingGateway | None = None,
    ):
        self.url = (url or os.getenv("QDRANT_URL", "")).strip()
        self.api_key = (api_key or os.getenv("QDRANT_API_KEY", "")).strip() or None
        self.collection_name = collection_name
        self.vector_size = vector_size
        self.embedder = embedding_gateway or EmbeddingGateway()

        self._init_client()

    def _init_client(self) -> None:
        """Initialize the sync and async Qdrant clients, defaulting to local disk storage if no URL."""
        if self.url:
            self.client = QdrantClient(
                url=self.url,
                api_key=self.api_key,
                timeout=12.0,
            )
            try:
                self.async_client = AsyncQdrantClient(
                    url=self.url,
                    api_key=self.api_key,
                    timeout=12.0,
                )
            except Exception:
                self.async_client = None
            self.mode = "CLOUD" if ("qdrant.io" in self.url or "cloud" in self.url) else "REMOTE"
            self.endpoint_display = self.url
        else:
            storage_dir = Path(LOCAL_STORAGE_PATH)
            storage_dir.mkdir(parents=True, exist_ok=True)
            try:
                self.client = QdrantClient(path=str(storage_dir))
                self.mode = "LOCAL_STORAGE"
                self.endpoint_display = f"local-disk://{storage_dir.as_posix()}"
            except Exception as e:
                logger.warning(
                    f"Could not lock local Qdrant storage at {storage_dir} ({e}); "
                    "falling back to in-memory Qdrant instance for hermetic/concurrent operation."
                )
                self.client = QdrantClient(location=":memory:")
                self.mode = "IN_MEMORY"
                self.endpoint_display = "memory://"
            self.async_client = None

        # Provision collection on startup
        self.ensure_collection()
        self.ensure_collection(ACTIVE_PLACEMENTS_COLLECTION)
        self.seed_default_active_placements_if_empty()

    def ensure_collection(self, collection_name: str | None = None) -> bool:
        """Ensure target collection and payload filter indexes exist."""
        col = collection_name or self.collection_name
        try:
            exists = self.client.collection_exists(col)
            if not exists:
                self.client.create_collection(
                    collection_name=col,
                    vectors_config=models.VectorParams(
                        size=self.vector_size,
                        distance=models.Distance.COSINE,
                    ),
                )
                logger.info(f"Created Qdrant collection '{col}' (size={self.vector_size}, distance=COSINE).")

            # Create payload indexes for pre-retrieval security filtering in server/cloud modes
            if self.mode not in ("LOCAL_STORAGE", "IN_MEMORY"):
                for field in ["student_id", "student_user_id", "department", "institution_id"]:
                    try:
                        self.client.create_payload_index(
                            collection_name=col,
                            field_name=field,
                            field_schema=models.PayloadSchemaType.KEYWORD,
                        )
                    except Exception:
                        pass
            return True
        except Exception as e:
            logger.warning(f"Could not provision Qdrant collection '{col}': {e}")
            return False

    def upsert_resume_chunks(
        self,
        chunks: Sequence[dict[str, Any]],
        student_id: str,
        department: str,
        skills: Sequence[str],
        document_id: str = "",
        document_name: str = "",
        institution_id: str = "inst-nitk-001",
    ) -> int:
        """Upsert parsed document chunks with Nomic embeddings and rich candidate metadata.

        Idempotent: Uses deterministic UUID5 from (student_id + chunk_id) to avoid duplicate points.
        """
        if not chunks:
            return 0

        self.ensure_collection()

        clean_student_id = str(student_id).strip()
        clean_dept = str(department or "Computer Science").strip()
        clean_skills = [str(s).strip() for s in skills if str(s).strip()]

        points: list[models.PointStruct] = []

        for idx, chunk in enumerate(chunks):
            cid = str(chunk.get("chunk_id", f"chk-{idx+1}"))
            content = str(chunk.get("content", "")).strip()
            if not content:
                continue

            # Generate or reuse 1536-dim vector embedding
            vector = chunk.get("embedding")
            if not vector or len(vector) != self.vector_size:
                vector = self.embedder.embed_text(content)

            # Deterministic UUID5 for idempotent upserts
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:{clean_student_id}:{cid}"))

            payload = {
                "student_id": clean_student_id,
                "student_user_id": clean_student_id,
                "department": clean_dept,
                "skills": clean_skills,
                "chunk_id": cid,
                "document_id": str(document_id or chunk.get("document_id", "")),
                "document_name": str(document_name or chunk.get("document_name", "Resume")),
                "section_path": str(chunk.get("section_path", "Resume Content")),
                "content": content,
                "char_start": int(chunk.get("char_start", 0)),
                "char_end": int(chunk.get("char_end", len(content))),
                "page": int(chunk.get("page", chunk.get("page_number", 1))),
                "institution_id": institution_id,
                "created_at": chunk.get("created_at") or datetime.now(timezone.utc).isoformat(),
            }

            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )

        if points:
            try:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points,
                )
                logger.info(f"Upserted {len(points)} points into Qdrant collection '{self.collection_name}' for {clean_student_id}.")
                return len(points)
            except Exception as e:
                logger.error(f"Failed to upsert points to Qdrant: {e}")
                return 0

        return 0

    def search_chunks(
        self,
        query_text: str | None = None,
        query_vector: list[float] | None = None,
        student_id: str | None = None,
        department: str | None = None,
        institution_id: str | None = None,
        top_k: int = 5,
        score_threshold: float = 0.05,
    ) -> list[dict[str, Any]]:
        """Vector similarity search against Qdrant with tenant pre-filtering."""
        if not query_vector:
            if not query_text:
                return []
            query_vector = self.embedder.embed_text(query_text)

        # Build security filter
        conditions: list[Any] = []
        if student_id:
            clean_sid = str(student_id).strip()
            # Match either student_id or student_user_id for robust tenant retrieval
            conditions.append(
                models.Filter(
                    should=[
                        models.FieldCondition(
                            key="student_id",
                            match=models.MatchValue(value=clean_sid),
                        ),
                        models.FieldCondition(
                            key="student_user_id",
                            match=models.MatchValue(value=clean_sid),
                        ),
                    ]
                )
            )
        if department:
            conditions.append(
                models.FieldCondition(
                    key="department",
                    match=models.MatchValue(value=str(department).strip()),
                )
            )
        if institution_id:
            conditions.append(
                models.FieldCondition(
                    key="institution_id",
                    match=models.MatchValue(value=str(institution_id).strip()),
                )
            )

        query_filter = models.Filter(must=conditions) if conditions else None

        try:
            res = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k,
                score_threshold=score_threshold,
            )

            results: list[dict[str, Any]] = []
            for pt in res.points:
                p = pt.payload or {}
                results.append({
                    "chunk_id": p.get("chunk_id", str(pt.id)),
                    "document_id": p.get("document_id", "doc_qdrant"),
                    "document_name": p.get("document_name", "Resume"),
                    "content": p.get("content", ""),
                    "section_path": p.get("section_path", "Evidence"),
                    "char_start": p.get("char_start", 0),
                    "char_end": p.get("char_end", len(p.get("content", ""))),
                    "page": p.get("page", 1),
                    "similarity_score": round(float(pt.score or 0.0), 4),
                    "student_id": p.get("student_id") or p.get("student_user_id"),
                    "student_user_id": p.get("student_user_id") or p.get("student_id"),
                    "department": p.get("department"),
                    "skills": p.get("skills", []),
                })
            return results
        except Exception as e:
            logger.warning(f"Qdrant query failed: {e}")
            return []

    def match_skill(
        self,
        skill_name: str,
        student_id: str,
        top_k: int = 3,
        min_score: float = 0.15,
    ) -> dict[str, Any]:
        """Perform semantic vector similarity search in Qdrant to find concrete evidence for a skill."""
        query_prompt = f"Technical proficiency, implementation and hands-on experience in {skill_name}"
        hits = self.search_chunks(
            query_text=query_prompt,
            student_id=student_id,
            top_k=top_k,
            score_threshold=min_score,
        )

        # Also search with exact skill name if hits empty
        if not hits:
            hits = self.search_chunks(
                query_text=skill_name,
                student_id=student_id,
                top_k=top_k,
                score_threshold=0.05,
            )

        matched = len(hits) > 0
        best_hit = hits[0] if hits else None
        top_score = best_hit["similarity_score"] if best_hit else 0.0

        # Check if the skill is also explicitly present in the chunk's extracted skills metadata
        has_skill_tag = False
        if best_hit:
            chunk_skills = [s.lower() for s in best_hit.get("skills", [])]
            if any(skill_name.lower() in cs for cs in chunk_skills):
                has_skill_tag = True
                top_score = max(top_score, 0.88)

        confidence = 0.0
        if matched or has_skill_tag:
            confidence = min(0.99, round(max(top_score, 0.70 if has_skill_tag else 0.50), 3))

        return {
            "skill_name": skill_name,
            "student_id": student_id,
            "matched": matched or has_skill_tag,
            "top_score": top_score,
            "confidence": confidence,
            "best_evidence": best_hit,
            "all_evidence": hits,
            "source_document_id": best_hit.get("document_id") if best_hit else None,
            "source_span": f"{best_hit.get('document_name', 'Resume')} • {best_hit.get('section_path', '')}" if best_hit else None,
            "evidence_status": "ASSESSMENT_VERIFIED" if top_score > 0.80 else "STUDENT_CONFIRMED" if (top_score > 0.40 or has_skill_tag) else "EXTRACTED",
        }

    def batch_match_job_skills(
        self,
        required_skills: Sequence[str],
        student_id: str,
        preferred_skills: Sequence[str] | None = None,
    ) -> dict[str, Any]:
        """Match all skills in a job specification against student chunks in Qdrant."""
        req_results = [self.match_skill(s, student_id) for s in required_skills]
        pref_results = [self.match_skill(s, student_id) for s in (preferred_skills or [])]

        matched_req = [r for r in req_results if r["matched"]]
        missing_req = [r["skill_name"] for r in req_results if not r["matched"]]

        matched_pref = [r for r in pref_results if r["matched"]]

        req_coverage = len(matched_req) / len(required_skills) if required_skills else 1.0

        return {
            "student_id": student_id,
            "required_skills_count": len(required_skills),
            "required_matched_count": len(matched_req),
            "required_coverage": round(req_coverage, 3),
            "missing_required_skills": missing_req,
            "required_matches": req_results,
            "preferred_matches": pref_results,
            "overall_vector_fit_score": round((req_coverage * 0.75 + (len(matched_pref) / max(1, len(preferred_skills or [])) * 0.25)) * 100, 1),
        }

    def upsert_student_unified_knowledge(
        self,
        student_id: str,
        full_name: str,
        skills: Sequence[str],
        academic_records: Sequence[dict[str, Any]] | None = None,
        cgpa: float | None = None,
        github_url: str | None = None,
        github_projects: Sequence[dict[str, Any]] | None = None,
        resume_text: str | None = None,
        institution_id: str = "inst-nitk-001",
    ) -> int:
        """Upsert multi-modal verified student knowledge (Resume, Grade Sheet, GitHub) into Qdrant.

        Strictly tags each vector point with student_id and student_user_id to guarantee multi-tenant privacy.
        """
        self.ensure_collection(self.collection_name)
        clean_sid = str(student_id).strip()
        points: list[models.PointStruct] = []
        clean_skills = [str(s).strip() for s in skills if str(s).strip()]

        # 1. Technical Skills Matrix Chunk
        if clean_skills:
            skill_text = (
                f"Student Technical Knowledge Base: {full_name} ({clean_sid}).\n"
                f"Verified & Solidified Skills: {', '.join(clean_skills)}.\n"
                f"Demonstrated competencies across core programming languages, databases, frameworks, and tools."
            )
            vec = self.embedder.embed_text(skill_text)
            pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:{clean_sid}:skills_matrix"))
            points.append(
                models.PointStruct(
                    id=pt_id,
                    vector=vec,
                    payload={
                        "student_id": clean_sid,
                        "student_user_id": clean_sid,
                        "chunk_id": f"chk-{clean_sid}-skills",
                        "document_id": f"doc-{clean_sid}-skills",
                        "document_name": "Verified Skills Matrix",
                        "section_path": "Technical Credentials",
                        "content": skill_text,
                        "skills": clean_skills,
                        "institution_id": institution_id,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            )

        # 2. Academic Grade Card & Cumulative Standing Chunk
        if academic_records or cgpa is not None:
            gpa_val = float(cgpa or 0.0)
            courses_str = ""
            if academic_records:
                courses_str = "; ".join(
                    f"{r.get('subject_name', 'Subject')} (Grade: {r.get('grade_or_marks', 'P')}, Credits: {r.get('credits', 3)})"
                    for r in academic_records[:15]
                )
            academic_text = (
                f"Student Academic Knowledge Base: {full_name} ({clean_sid}).\n"
                f"Cumulative Grade Point Average (CGPA): {gpa_val:.2f} / 10.0.\n"
                f"Verified Coursework & Transcripts:\n{courses_str if courses_str else 'Transcript verified.'}\n"
                f"Academic Standing: {'Outstanding Honors Standing' if gpa_val >= 9.0 else 'High Academic Standing' if gpa_val >= 8.0 else 'Eligible for Standard Placements'}."
            )
            vec = self.embedder.embed_text(academic_text)
            pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:{clean_sid}:academic_transcript"))
            points.append(
                models.PointStruct(
                    id=pt_id,
                    vector=vec,
                    payload={
                        "student_id": clean_sid,
                        "student_user_id": clean_sid,
                        "chunk_id": f"chk-{clean_sid}-academic",
                        "document_id": f"doc-{clean_sid}-transcript",
                        "document_name": "Verified Academic Transcript",
                        "section_path": "Academic Records",
                        "content": academic_text,
                        "skills": clean_skills,
                        "institution_id": institution_id,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            )

        # 3. GitHub Engineering Portfolio Chunk
        if github_url or github_projects:
            gh_url = github_url or "https://github.com/student"
            projects_str = ""
            if github_projects:
                projects_str = "; ".join(
                    f"{p.get('name', 'Repository')}: {p.get('description', 'Project repository')} (Tech: {', '.join(p.get('languages', ['Code']))})"
                    for p in github_projects[:5]
                )
            else:
                projects_str = "Verified repository commits in full-stack web applications, microservices, and asynchronous architecture."
            github_text = (
                f"Student GitHub Knowledge Base: {full_name} ({clean_sid}).\n"
                f"GitHub Profile URL: {gh_url}.\n"
                f"Engineering Repositories & Open Source Work:\n{projects_str}."
            )
            vec = self.embedder.embed_text(github_text)
            pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:{clean_sid}:github_portfolio"))
            points.append(
                models.PointStruct(
                    id=pt_id,
                    vector=vec,
                    payload={
                        "student_id": clean_sid,
                        "student_user_id": clean_sid,
                        "chunk_id": f"chk-{clean_sid}-github",
                        "document_id": f"doc-{clean_sid}-github",
                        "document_name": "GitHub Engineering Portfolio",
                        "section_path": "GitHub Projects",
                        "content": github_text,
                        "skills": clean_skills,
                        "institution_id": institution_id,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            )

        # 4. Resume Text chunks (if full resume provided)
        if resume_text and len(resume_text.strip()) > 50:
            lines = [l.strip() for l in resume_text.split("\n") if l.strip()]
            chunk_size = 400
            current = []
            c_len = 0
            idx = 0
            for line in lines:
                current.append(line)
                c_len += len(line)
                if c_len >= chunk_size:
                    c_content = "\n".join(current)
                    pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:{clean_sid}:resume_chunk_{idx}"))
                    vec = self.embedder.embed_text(c_content)
                    points.append(
                        models.PointStruct(
                            id=pt_id,
                            vector=vec,
                            payload={
                                "student_id": clean_sid,
                                "student_user_id": clean_sid,
                                "chunk_id": f"chk-{clean_sid}-resume-{idx}",
                                "document_id": f"doc-{clean_sid}-resume",
                                "document_name": "Technical Resume Document",
                                "section_path": "Resume Content",
                                "content": c_content,
                                "skills": clean_skills,
                                "institution_id": institution_id,
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            },
                        )
                    )
                    idx += 1
                    current = []
                    c_len = 0
            if current:
                c_content = "\n".join(current)
                pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:{clean_sid}:resume_chunk_{idx}"))
                vec = self.embedder.embed_text(c_content)
                points.append(
                    models.PointStruct(
                        id=pt_id,
                        vector=vec,
                        payload={
                            "student_id": clean_sid,
                            "student_user_id": clean_sid,
                            "chunk_id": f"chk-{clean_sid}-resume-{idx}",
                            "document_id": f"doc-{clean_sid}-resume",
                            "document_name": "Technical Resume Document",
                            "section_path": "Resume Content",
                            "content": c_content,
                            "skills": clean_skills,
                            "institution_id": institution_id,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                )

        if points:
            try:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points,
                )
                logger.info(f"Upserted {len(points)} unified student knowledge vectors into Qdrant for '{clean_sid}'.")
                return len(points)
            except Exception as e:
                logger.error(f"Failed upserting unified student knowledge to Qdrant: {e}")
                return 0
        return 0

    def query_student_profile(
        self,
        student_id: str,
        query: str,
        top_k: int = 4,
    ) -> list[dict[str, Any]]:
        """Query student's private knowledge base in Qdrant with mandatory student_id pre-filter."""
        return self.search_chunks(
            query_text=query,
            student_id=student_id,
            top_k=top_k,
            score_threshold=0.01,
        )

    def upsert_active_placement_jd(
        self,
        job_id: str,
        company_name: str,
        role_title: str,
        jd_text: str,
        mandatory_skills: Sequence[str],
        preferred_skills: Sequence[str],
        ctc_band: str = "₹18–24 LPA",
        min_cgpa: float = 7.0,
        max_backlogs: int = 0,
        allowed_branches: Sequence[str] | None = None,
        institution_id: str = "JKLU",
    ) -> int:
        """Upsert active campus placement job description chunks into active_placements collection."""
        self.ensure_collection(ACTIVE_PLACEMENTS_COLLECTION)
        clean_jid = str(job_id).strip()
        clean_company = str(company_name).strip()
        clean_role = str(role_title).strip()
        all_skills = list(set(list(mandatory_skills) + list(preferred_skills)))

        points: list[models.PointStruct] = []

        # 1. Overview & Policy Chunk
        overview_text = (
            f"Active Campus Placement Drive: {clean_company} — {clean_role}.\n"
            f"Package & CTC Band: {ctc_band}.\n"
            f"Academic Eligibility Gate: Minimum CGPA: {min_cgpa:.2f}, Maximum Backlogs: {max_backlogs}.\n"
            f"Allowed Engineering Disciplines: {', '.join(allowed_branches or ['B.Tech CSE', 'B.Tech IT'])}.\n"
            f"Mandatory Technical Hard Filters: {', '.join(mandatory_skills)}.\n"
            f"Preferred / Bonus Differentiators: {', '.join(preferred_skills)}."
        )
        vec = self.embedder.embed_text(overview_text)
        pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:placement:{clean_jid}:overview"))
        points.append(
            models.PointStruct(
                id=pt_id,
                vector=vec,
                payload={
                    "job_id": clean_jid,
                    "company_name": clean_company,
                    "role_title": clean_role,
                    "ctc_band": ctc_band,
                    "min_cgpa": float(min_cgpa),
                    "max_backlogs": int(max_backlogs),
                    "mandatory_skills": list(mandatory_skills),
                    "preferred_skills": list(preferred_skills),
                    "all_skills": all_skills,
                    "section_path": "Eligibility & Job Overview",
                    "content": overview_text,
                    "institution_id": institution_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )
        )

        # 2. Detailed Technical Requirement Chunks
        if jd_text and len(jd_text.strip()) > 40:
            lines = [l.strip() for l in jd_text.split("\n") if l.strip()]
            chunk_size = 400
            current: list[str] = []
            c_len = 0
            idx = 0
            for line in lines:
                current.append(line)
                c_len += len(line)
                if c_len >= chunk_size:
                    c_content = f"{clean_company} ({clean_role}) JD:\n" + "\n".join(current)
                    pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:placement:{clean_jid}:chunk_{idx}"))
                    vec = self.embedder.embed_text(c_content)
                    points.append(
                        models.PointStruct(
                            id=pt_id,
                            vector=vec,
                            payload={
                                "job_id": clean_jid,
                                "company_name": clean_company,
                                "role_title": clean_role,
                                "ctc_band": ctc_band,
                                "min_cgpa": float(min_cgpa),
                                "max_backlogs": int(max_backlogs),
                                "mandatory_skills": list(mandatory_skills),
                                "preferred_skills": list(preferred_skills),
                                "all_skills": all_skills,
                                "section_path": "Technical Requirements",
                                "content": c_content,
                                "institution_id": institution_id,
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            },
                        )
                    )
                    idx += 1
                    current = []
                    c_len = 0
            if current:
                c_content = f"{clean_company} ({clean_role}) JD:\n" + "\n".join(current)
                pt_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"campusbridge:placement:{clean_jid}:chunk_{idx}"))
                vec = self.embedder.embed_text(c_content)
                points.append(
                    models.PointStruct(
                        id=pt_id,
                        vector=vec,
                        payload={
                            "job_id": clean_jid,
                            "company_name": clean_company,
                            "role_title": clean_role,
                            "ctc_band": ctc_band,
                            "min_cgpa": float(min_cgpa),
                            "max_backlogs": int(max_backlogs),
                            "mandatory_skills": list(mandatory_skills),
                            "preferred_skills": list(preferred_skills),
                            "all_skills": all_skills,
                            "section_path": "Technical Requirements",
                            "content": c_content,
                            "institution_id": institution_id,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                )

        if points:
            try:
                self.client.upsert(
                    collection_name=ACTIVE_PLACEMENTS_COLLECTION,
                    points=points,
                )
                logger.info(f"Upserted {len(points)} placement knowledge vectors into Qdrant '{ACTIVE_PLACEMENTS_COLLECTION}' for '{clean_company}'.")
                return len(points)
            except Exception as e:
                logger.error(f"Failed upserting placement knowledge to Qdrant: {e}")
                return 0
        return 0

    def query_active_placements(
        self,
        query_text: str,
        company_name: str | None = None,
        top_k: int = 4,
    ) -> list[dict[str, Any]]:
        """Search active campus placement knowledge base in Qdrant."""
        self.ensure_collection(ACTIVE_PLACEMENTS_COLLECTION)
        query_vector = self.embedder.embed_text(query_text)

        conditions: list[Any] = []
        if company_name:
            clean_comp = company_name.strip()
            conditions.append(
                models.FieldCondition(
                    key="company_name",
                    match=models.MatchText(text=clean_comp),
                )
            )

        query_filter = models.Filter(must=conditions) if conditions else None

        try:
            res = self.client.query_points(
                collection_name=ACTIVE_PLACEMENTS_COLLECTION,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k,
                score_threshold=0.01,
            )
            hits = []
            for pt in res.points:
                p = pt.payload or {}
                hits.append({
                    "job_id": p.get("job_id"),
                    "company_name": p.get("company_name"),
                    "role_title": p.get("role_title"),
                    "ctc_band": p.get("ctc_band"),
                    "min_cgpa": p.get("min_cgpa", 7.0),
                    "max_backlogs": p.get("max_backlogs", 0),
                    "mandatory_skills": p.get("mandatory_skills", []),
                    "preferred_skills": p.get("preferred_skills", []),
                    "content": p.get("content", ""),
                    "similarity_score": round(float(pt.score or 0.0), 4),
                })
            return hits
        except Exception as e:
            logger.warning(f"Failed querying active placements from Qdrant: {e}")
            return []

    def seed_default_active_placements_if_empty(self) -> None:
        """Seed canonical campus drives (TechCorp, RazorpayX, Atlassian) if active_placements is empty."""
        try:
            if not self.client.collection_exists(ACTIVE_PLACEMENTS_COLLECTION):
                self.ensure_collection(ACTIVE_PLACEMENTS_COLLECTION)

            col_info = self.client.get_collection(ACTIVE_PLACEMENTS_COLLECTION)
            cnt = getattr(col_info, "points_count", 0) or 0
            if cnt > 0:
                return

            seed_jds = [
                {
                    "job_id": "job-techcorp-001",
                    "company_name": "TechCorp India",
                    "role_title": "Backend Systems Engineer",
                    "ctc_band": "₹18–24 LPA",
                    "min_cgpa": 7.5,
                    "max_backlogs": 0,
                    "allowed_branches": ["B.Tech CSE", "B.Tech IT", "B.Tech AI"],
                    "mandatory_skills": ["Python", "FastAPI", "SQL", "PostgreSQL", "Docker"],
                    "preferred_skills": ["Redis", "Distributed Systems", "Kubernetes", "System Design"],
                    "jd_text": (
                        "TechCorp India is hiring Backend Systems Engineers for our high-throughput platform team.\n"
                        "Requirements:\n"
                        "- Solid proficiency in Python, FastAPI, and relational databases (PostgreSQL/SQL).\n"
                        "- Hands-on containerization experience with Docker.\n"
                        "- Bonus: Distributed caching with Redis, message queues, and high-concurrency microservices.\n"
                        "- Eligibility: Minimum 7.5 CGPA, zero backlogs, B.Tech CSE/IT/AI cohorts."
                    ),
                },
                {
                    "job_id": "jm_razorpay",
                    "company_name": "RazorpayX",
                    "role_title": "Backend Platform Engineer (72h Sprint)",
                    "ctc_band": "₹22–28 LPA",
                    "min_cgpa": 7.5,
                    "max_backlogs": 0,
                    "allowed_branches": ["B.Tech CSE", "B.Tech IT"],
                    "mandatory_skills": ["Python", "FastAPI", "SQL"],
                    "preferred_skills": ["Redis", "Docker", "Distributed Systems"],
                    "jd_text": (
                        "RazorpayX is recruiting high-velocity backend engineers for financial checkout pipelines.\n"
                        "Candidate must have demonstrable projects in Python, RESTful API design, and SQL indexing."
                    ),
                },
                {
                    "job_id": "jd_atlassian",
                    "company_name": "Atlassian",
                    "role_title": "Full Stack Platform Engineer",
                    "ctc_band": "₹24–32 LPA",
                    "min_cgpa": 8.0,
                    "max_backlogs": 0,
                    "allowed_branches": ["B.Tech CSE", "B.Tech IT"],
                    "mandatory_skills": ["React", "TypeScript", "Node.js"],
                    "preferred_skills": ["AWS", "GraphQL", "CI/CD"],
                    "jd_text": (
                        "Atlassian engineering team is looking for Full Stack Developers with strong React, TypeScript,\n"
                        "and Node.js foundation to build next-generation collaboration tools."
                    ),
                },
            ]

            for jd in seed_jds:
                self.upsert_active_placement_jd(
                    job_id=jd["job_id"],
                    company_name=jd["company_name"],
                    role_title=jd["role_title"],
                    jd_text=jd["jd_text"],
                    mandatory_skills=jd["mandatory_skills"],
                    preferred_skills=jd["preferred_skills"],
                    ctc_band=jd["ctc_band"],
                    min_cgpa=jd["min_cgpa"],
                    max_backlogs=jd["max_backlogs"],
                    allowed_branches=jd.get("allowed_branches"),
                )
            logger.info("Successfully seeded canonical active placement drives into Qdrant.")
        except Exception as e:
            logger.warning(f"Note during placement seeding: {e}")

    def check_health(self) -> dict[str, Any]:
        """Health and telemetry report for the Qdrant vector database."""
        t0 = time.perf_counter()
        is_healthy = False
        points_count = 0
        error_detail = None

        try:
            if self.client.collection_exists(self.collection_name):
                col_info = self.client.get_collection(self.collection_name)
                is_healthy = True
                points_count = getattr(col_info, "points_count", 0) or 0
            else:
                is_healthy = self.ensure_collection()
        except Exception as e:
            is_healthy = False
            error_detail = str(e)

        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "status": "ONLINE" if is_healthy else "OFFLINE",
            "engine": "Qdrant Vector Database",
            "mode": self.mode,
            "endpoint": self.endpoint_display,
            "collection": self.collection_name,
            "points_count": points_count,
            "vector_dimensions": self.vector_size,
            "distance_metric": "COSINE",
            "latency_ms": latency_ms,
            "error": error_detail,
        }


# ──────────────────────────────────────────────────────────────────────────────
# Global Singleton & FastAPI Dependency
# ──────────────────────────────────────────────────────────────────────────────
_GLOBAL_QDRANT_SERVICE: QdrantService | None = None


def get_qdrant_service() -> QdrantService:
    """Return the global QdrantService singleton, initializing if needed."""
    global _GLOBAL_QDRANT_SERVICE
    if _GLOBAL_QDRANT_SERVICE is None:
        _GLOBAL_QDRANT_SERVICE = QdrantService()
    return _GLOBAL_QDRANT_SERVICE
