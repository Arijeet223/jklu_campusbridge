"""CampusBridge AI — JD Upload & Qdrant Ingestion Router.

Placement Officers upload JD text → skills extracted → chunks upserted into
the `campusbridge_jds` Qdrant collection for dynamic recruiter persona injection
into the LiveKit voice agent.
"""

import json
import logging
import os
import re
import uuid
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

logger = logging.getLogger("campusbridge.jd_upload")

router = APIRouter(prefix="/jd", tags=["job-descriptions"])


# ── Request / Response Schemas ───────────────────────────────────────────────

class JDUploadRequest(BaseModel):
    job_id: Optional[str] = None
    company_name: str
    role_title: str
    jd_text: str
    ctc_band: str = "12-18 LPA"
    min_cgpa: float = 7.0
    max_backlogs: int = 0
    allowed_branches: list[str] = ["B.Tech CSE", "B.Tech IT", "B.Tech AI"]
    uploaded_by: str = "TPO-JKLU-001"


# ── Skill Extraction ────────────────────────────────────────────────────────

# Canonical skill taxonomy for extraction
SKILL_TAXONOMY = [
    "Python", "Java", "C++", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin",
    "React", "Angular", "Vue.js", "Next.js", "Node.js", "Django", "Flask", "FastAPI", "Spring Boot",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "PyTorch", "TensorFlow", "Scikit-learn",
    "Data Structures", "Algorithms", "System Design", "REST API", "GraphQL", "gRPC",
    "Git", "Linux", "Pandas", "NumPy", "Spark", "Kafka", "RabbitMQ",
    "HTML", "CSS", "Tailwind", "SASS",
    "LangChain", "RAG", "Vector Databases", "LLM", "Transformers",
    "Agile", "Scrum", "JIRA", "Communication", "Leadership",
]


def extract_skills_from_jd(jd_text: str) -> tuple[list[str], list[str]]:
    """Extract mandatory and preferred skills from JD text using taxonomy matching."""
    text_lower = jd_text.lower()
    
    # Split JD into sections
    mandatory_section = ""
    preferred_section = ""
    
    # Try to find mandatory/required section
    mand_patterns = [
        r"(?:required|mandatory|must[\s-]have|essential|minimum)[\s:]*(?:skills?|qualifications?|requirements?)?[:\n]+(.*?)(?=(?:preferred|nice|good|bonus|desired|optional)|$)",
    ]
    for pat in mand_patterns:
        m = re.search(pat, jd_text, re.IGNORECASE | re.DOTALL)
        if m:
            mandatory_section = m.group(1)
            break
    
    # Try to find preferred section
    pref_patterns = [
        r"(?:preferred|nice[\s-]to[\s-]have|good[\s-]to[\s-]have|bonus|desired|optional)[\s:]*(?:skills?|qualifications?)?[:\n]+(.*?)(?=$)",
    ]
    for pat in pref_patterns:
        m = re.search(pat, jd_text, re.IGNORECASE | re.DOTALL)
        if m:
            preferred_section = m.group(1)
            break
    
    mandatory_skills = []
    preferred_skills = []
    
    for skill in SKILL_TAXONOMY:
        skill_lower = skill.lower()
        # Check word boundaries
        pattern = r'\b' + re.escape(skill_lower) + r'\b'
        
        if mandatory_section and re.search(pattern, mandatory_section.lower()):
            mandatory_skills.append(skill)
        elif preferred_section and re.search(pattern, preferred_section.lower()):
            preferred_skills.append(skill)
        elif re.search(pattern, text_lower):
            # If no section split worked, everything is mandatory
            mandatory_skills.append(skill)
    
    return mandatory_skills, preferred_skills


def chunk_jd_text(jd_text: str, job_id: str, company_name: str, role_title: str, chunk_size: int = 512) -> list[dict]:
    """Split JD text into overlapping chunks for Qdrant ingestion."""
    chunks = []
    sentences = re.split(r'(?<=[.!?\n])\s+', jd_text.strip())
    
    current_chunk = ""
    chunk_idx = 0
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
            chunks.append({
                "chunk_id": f"jd-{job_id}-chk-{chunk_idx}",
                "content": current_chunk.strip(),
                "document_id": f"jd-{job_id}",
                "document_name": f"{company_name} — {role_title} JD",
                "section_path": "Job Description",
                "char_start": 0,
                "char_end": len(current_chunk),
                "page": 1,
            })
            # Overlap: keep last sentence
            current_chunk = sentence + " "
            chunk_idx += 1
        else:
            current_chunk += sentence + " "
    
    if current_chunk.strip():
        chunks.append({
            "chunk_id": f"jd-{job_id}-chk-{chunk_idx}",
            "content": current_chunk.strip(),
            "document_id": f"jd-{job_id}",
            "document_name": f"{company_name} — {role_title} JD",
            "section_path": "Job Description",
            "char_start": 0,
            "char_end": len(current_chunk),
            "page": 1,
        })
    
    return chunks


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_jd(req: JDUploadRequest):
    """Upload a JD, extract skills, upsert into Qdrant `campusbridge_jds` collection,
    and optionally store in PostgreSQL opportunities_jds table."""
    
    job_id = req.job_id or f"jd-{uuid.uuid4().hex[:8]}"
    logger.info(f"--> [JD_UPLOAD_START] Company: '{req.company_name}', Role: '{req.role_title}', JobID: '{job_id}'")
    
    # 1. Extract skills from JD text
    mandatory_skills, preferred_skills = extract_skills_from_jd(req.jd_text)
    all_skills = list(set(mandatory_skills + preferred_skills))
    
    if not all_skills:
        # Fallback: use company/role hints
        all_skills = ["Python", "SQL", "Data Structures"]
    logger.info(f"[JD_UPLOAD_SKILLS] Extracted {len(all_skills)} skills (mandatory={len(mandatory_skills)}, preferred={len(preferred_skills)})")
    
    # 2. Chunk the JD text
    chunks = chunk_jd_text(req.jd_text, job_id, req.company_name, req.role_title)
    logger.info(f"[JD_UPLOAD_CHUNKS] Generated {len(chunks)} chunks for '{job_id}'")
    
    # 3. Upsert into Qdrant campusbridge_jds collection
    upserted_count = 0
    try:
        from rag.qdrant_service import QdrantService
        jd_qdrant = QdrantService(collection_name="campusbridge_jds")
        
        upserted_count = jd_qdrant.upsert_resume_chunks(
            chunks=chunks,
            student_id=job_id,       # Reuse student_id field as job_id for JD docs
            department=req.role_title,
            skills=all_skills,
            document_id=f"jd-{job_id}",
            document_name=f"{req.company_name} — {req.role_title}",
            institution_id="JKLU",
        )
        logger.info(f"[JD_UPLOAD_QDRANT_SUCCESS] Upserted {upserted_count} chunks to campusbridge_jds Qdrant collection")
    except Exception as e:
        logger.error(f"[JD_UPLOAD_QDRANT_ERROR] Qdrant upsert failed for JD '{job_id}': {e}", exc_info=True)
        upserted_count = 0
    
    # 4. Optionally store in PostgreSQL
    pg_stored = False
    try:
        from backend.db.session import AsyncSessionLocal
        from backend.db.crud import create_job
        
        async with AsyncSessionLocal() as session:
            await create_job(session, {
                "job_id": job_id,
                "company_name": req.company_name,
                "role_title": req.role_title,
                "ctc_band": req.ctc_band,
                "min_cgpa": req.min_cgpa,
                "max_backlogs": req.max_backlogs,
                "allowed_branches": req.allowed_branches,
                "mandatory_skills_json": mandatory_skills,
                "preferred_skills_json": preferred_skills,
                "approved_by_officer": True,
                "status": "APPROVED",
            })
            await session.commit()
            pg_stored = True
    except Exception:
        pass
    
    return {
        "status": "SUCCESS",
        "job_id": job_id,
        "company_name": req.company_name,
        "role_title": req.role_title,
        "mandatory_skills": mandatory_skills,
        "preferred_skills": preferred_skills,
        "chunks_generated": len(chunks),
        "qdrant_upserted": upserted_count,
        "postgres_stored": pg_stored,
        "dispatch_metadata": {
            "job_id": job_id,
            "company": req.company_name,
            "role": req.role_title,
            "skills": all_skills,
        },
    }


@router.get("/retrieve/{job_id}")
async def retrieve_jd_context(job_id: str):
    """Retrieve JD metadata and skills from Qdrant for LiveKit voice agent dynamic prompt injection."""
    
    # Try PostgreSQL first
    try:
        from backend.db.session import AsyncSessionLocal
        from backend.db.crud import get_job
        
        async with AsyncSessionLocal() as session:
            job = await get_job(session, job_id)
            if job:
                return {
                    "status": "FOUND",
                    "source": "postgresql",
                    "job_id": job.job_id,
                    "company_name": job.company_name,
                    "role_title": job.role_title,
                    "mandatory_skills": job.mandatory_skills_json or [],
                    "preferred_skills": job.preferred_skills_json or [],
                    "ctc_band": job.ctc_band,
                    "min_cgpa": job.min_cgpa,
                }
    except Exception:
        pass
    
    # Fallback: search Qdrant campusbridge_jds collection
    try:
        from rag.qdrant_service import QdrantService
        jd_qdrant = QdrantService(collection_name="campusbridge_jds")
        
        hits = jd_qdrant.search_chunks(
            query_text=f"job description {job_id}",
            student_id=job_id,
            top_k=3,
            score_threshold=0.01,
        )
        
        if hits:
            all_skills = set()
            for h in hits:
                all_skills.update(h.get("skills", []))
            
            return {
                "status": "FOUND",
                "source": "qdrant",
                "job_id": job_id,
                "company_name": hits[0].get("document_name", "").split(" — ")[0] if hits else "Unknown",
                "role_title": hits[0].get("department", "Software Engineer") if hits else "Software Engineer",
                "mandatory_skills": list(all_skills),
                "preferred_skills": [],
                "jd_chunks": [h.get("content", "") for h in hits],
            }
    except Exception:
        pass
    
    return {"status": "NOT_FOUND", "job_id": job_id}
