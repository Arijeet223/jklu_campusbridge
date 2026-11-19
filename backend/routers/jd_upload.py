"""CampusBridge AI — Faculty JD Ingestion & Policy Calibration Router.

Faculty upload JD text → Qwen 2.5 AI Agent & Qdrant extract skills & criteria →
Faculty toggles Mandatory (Hard Gate) vs Preferred (Soft Factor) & calibrates baseline preferences →
Live Opportunities evaluated deterministically with R.O.N.E.N. for Students.
"""

import json
import logging
import os
import re
import uuid
import time
from typing import Any, Optional

import requests
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel

logger = logging.getLogger("campusbridge.jd_upload")

router = APIRouter(prefix="/jd", tags=["job-descriptions"])

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
DEFAULT_MODEL = "qwen2.5:7b"


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
    uploaded_by: str = "FAC-JKLU-014"


class UpdateCriteriaRequest(BaseModel):
    job_id: str
    mandatory_skills: list[str]
    preferred_skills: list[str]
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    allowed_branches: Optional[list[str]] = None
    status: Optional[str] = "APPROVED"


# ── Skill Taxonomy & Fallback Extraction ─────────────────────────────────────

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

    mandatory_section = ""
    preferred_section = ""

    mand_patterns = [
        r"(?:required|mandatory|must[\s-]have|essential|minimum)[\s:]*(?:skills?|qualifications?|requirements?)?[:\n]+(.*?)(?=(?:preferred|nice|good|bonus|desired|optional)|$)",
    ]
    for pat in mand_patterns:
        m = re.search(pat, jd_text, re.IGNORECASE | re.DOTALL)
        if m:
            mandatory_section = m.group(1)
            break

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
        pattern = r'\b' + re.escape(skill_lower) + r'\b'

        if mandatory_section and re.search(pattern, mandatory_section.lower()):
            mandatory_skills.append(skill)
        elif preferred_section and re.search(pattern, preferred_section.lower()):
            preferred_skills.append(skill)
        elif re.search(pattern, text_lower):
            mandatory_skills.append(skill)

    return mandatory_skills, preferred_skills


def extract_jd_criteria_with_qwen(
    jd_text: str, default_cgpa: float = 7.0, default_branches: list[str] = None
) -> dict[str, Any]:
    """Extract mandatory and preferred criteria using Qwen 2.5 with deterministic fallback."""
    if default_branches is None:
        default_branches = ["B.Tech CSE", "B.Tech IT", "B.Tech AI"]

    fallback_mand, fallback_pref = extract_skills_from_jd(jd_text)

    # Prompt Qwen 2.5 for structured extraction
    prompt = (
        "You are the CampusBridge Deterministic JD Extraction Engine for Faculty Placement Review.\n"
        "Extract the technical skills and academic constraints from the following job description.\n\n"
        "STRICT JSON OUTPUT FORMAT:\n"
        "{\n"
        '  "mandatory_skills": ["Python", "FastAPI"],\n'
        '  "preferred_skills": ["Docker", "Kubernetes"],\n'
        '  "min_cgpa": 7.5,\n'
        '  "max_backlogs": 0,\n'
        '  "allowed_branches": ["B.Tech CSE", "B.Tech IT"]\n'
        "}\n\n"
        "RULES:\n"
        "1. mandatory_skills: explicitly required hard skills.\n"
        "2. preferred_skills: bonus, nice-to-have, or optional skills.\n"
        "3. Only extract skills mentioned in the JD text.\n"
        "4. Do NOT hallucinate. Return valid JSON only.\n\n"
        f"JOB DESCRIPTION:\n{jd_text[:3500]}"
    )

    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": DEFAULT_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.0,
                    "num_predict": 512,
                },
            },
            timeout=18.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            raw_response = data.get("response", "{}")
            parsed = json.loads(raw_response)
            mand = [s.strip() for s in parsed.get("mandatory_skills", []) if isinstance(s, str) and s.strip()]
            pref = [s.strip() for s in parsed.get("preferred_skills", []) if isinstance(s, str) and s.strip()]
            
            cgpa_val = parsed.get("min_cgpa")
            try:
                min_cgpa = float(cgpa_val) if cgpa_val is not None else default_cgpa
            except (ValueError, TypeError):
                min_cgpa = default_cgpa

            branches = parsed.get("allowed_branches") or default_branches
            if not isinstance(branches, list):
                branches = default_branches

            if mand or pref:
                return {
                    "mandatory_skills": mand or fallback_mand or ["Python", "SQL"],
                    "preferred_skills": pref or fallback_pref,
                    "min_cgpa": min_cgpa,
                    "max_backlogs": int(parsed.get("max_backlogs", 0)),
                    "allowed_branches": branches,
                    "extraction_agent": "qwen2.5:7b",
                }
    except Exception as e:
        logger.warning(f"[QWEN_JD_EXTRACTION_NOTE] Ollama Qwen unavailable or timed out ({e}); activating deterministic regex taxonomy.")

    return {
        "mandatory_skills": fallback_mand or ["Python", "SQL", "Data Structures"],
        "preferred_skills": fallback_pref or ["Git", "Linux"],
        "min_cgpa": default_cgpa,
        "max_backlogs": 0,
        "allowed_branches": default_branches,
        "extraction_agent": "regex_taxonomy_deterministic",
    }


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


# ── Faculty In-Memory Managed JD Store ────────────────────────────────────────

FACULTY_MANAGED_JDS: dict[str, dict[str, Any]] = {
    "jm_razorpay": {
        "job_id": "jm_razorpay",
        "company_name": "RazorpayX",
        "role_title": "Backend Platform Engineer (72h Sprint)",
        "ctc_band": "₹22–28 LPA",
        "min_cgpa": 7.5,
        "max_backlogs": 0,
        "allowed_branches": ["B.Tech CSE", "B.Tech IT"],
        "mandatory_skills": ["Python", "FastAPI", "SQL"],
        "preferred_skills": ["Redis", "Docker", "Distributed Systems"],
        "status": "APPROVED",
        "uploaded_by": "FAC-JKLU-014",
        "uploaded_at": "2026-11-18T10:00:00Z",
    },
    "jd_quantumscale": {
        "job_id": "jd_quantumscale",
        "company_name": "QuantumScale Systems",
        "role_title": "Systems Infrastructure Intern",
        "ctc_band": "₹16–22 LPA",
        "min_cgpa": 7.5,
        "max_backlogs": 0,
        "allowed_branches": ["B.Tech CSE", "B.Tech IT", "B.Tech AI"],
        "mandatory_skills": ["C++", "Linux", "Data Structures"],
        "preferred_skills": ["Docker", "Kubernetes", "Go"],
        "status": "APPROVED",
        "uploaded_by": "FAC-JKLU-014",
        "uploaded_at": "2026-11-18T11:00:00Z",
    },
    "jd_atlassian": {
        "job_id": "jd_atlassian",
        "company_name": "Atlassian",
        "role_title": "Full Stack Platform Engineer",
        "ctc_band": "₹24–32 LPA",
        "min_cgpa": 8.0,
        "max_backlogs": 0,
        "allowed_branches": ["B.Tech CSE", "B.Tech IT"],
        "mandatory_skills": ["React", "TypeScript", "Node.js"],
        "preferred_skills": ["AWS", "GraphQL", "CI/CD"],
        "status": "APPROVED",
        "uploaded_by": "FAC-JKLU-001",
        "uploaded_at": "2026-11-18T12:00:00Z",
    },
}


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_jd(req: JDUploadRequest, background_tasks: BackgroundTasks):
    """Faculty uploads a JD → extracts skills using Qwen 2.5 → upserts chunks to Qdrant."""
    job_id = req.job_id or f"jd-{uuid.uuid4().hex[:8]}"
    logger.info(f"--> [FACULTY_JD_UPLOAD] Company: '{req.company_name}', Role: '{req.role_title}', JobID: '{job_id}'")

    # 1. AI Criteria Extraction (Qwen 2.5 + Deterministic Fallback)
    extracted = extract_jd_criteria_with_qwen(
        jd_text=req.jd_text,
        default_cgpa=req.min_cgpa,
        default_branches=req.allowed_branches,
    )
    mandatory_skills = extracted["mandatory_skills"]
    preferred_skills = extracted["preferred_skills"]
    min_cgpa = extracted.get("min_cgpa", req.min_cgpa)
    allowed_branches = extracted.get("allowed_branches", req.allowed_branches)
    max_backlogs = extracted.get("max_backlogs", req.max_backlogs)

    all_skills = list(set(mandatory_skills + preferred_skills))
    logger.info(f"[FACULTY_JD_CRITERIA] Extracted {len(all_skills)} skills via {extracted.get('extraction_agent')}")

    # 2. Chunk text for Qdrant ingestion
    chunks = chunk_jd_text(req.jd_text, job_id, req.company_name, req.role_title)

    # 3. Upsert into Qdrant collections (`campusbridge_jds` and shared `active_placements`)
    upserted_count = 0
    try:
        from rag.qdrant_service import get_qdrant_service
        qs = get_qdrant_service()
        # Embed into active_placements collection
        upserted_count = qs.upsert_active_placement_jd(
            job_id=job_id,
            company_name=req.company_name,
            role_title=req.role_title,
            jd_text=req.jd_text,
            mandatory_skills=mandatory_skills,
            preferred_skills=preferred_skills,
            ctc_band=req.ctc_band,
            min_cgpa=min_cgpa,
            max_backlogs=max_backlogs,
            allowed_branches=allowed_branches,
            institution_id="JKLU",
        )
        # Also maintain legacy campusbridge_jds chunks
        qs.upsert_resume_chunks(
            chunks=chunks,
            student_id=job_id,
            department=req.role_title,
            skills=all_skills,
            document_id=f"jd-{job_id}",
            document_name=f"{req.company_name} — {req.role_title}",
            institution_id="JKLU",
        )
    except Exception as e:
        logger.warning(f"[JD_UPLOAD_QDRANT_WARNING] Qdrant upsert note: {e}")

    # 4. Save to in-memory store
    FACULTY_MANAGED_JDS[job_id] = {
        "job_id": job_id,
        "company_name": req.company_name,
        "role_title": req.role_title,
        "ctc_band": req.ctc_band,
        "min_cgpa": min_cgpa,
        "max_backlogs": max_backlogs,
        "allowed_branches": allowed_branches,
        "mandatory_skills": mandatory_skills,
        "preferred_skills": preferred_skills,
        "status": "APPROVED",
        "uploaded_by": req.uploaded_by,
        "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "raw_text": req.jd_text,
    }

    # 5. Optionally store in PostgreSQL
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
                "min_cgpa": min_cgpa,
                "max_backlogs": max_backlogs,
                "allowed_branches": allowed_branches,
                "mandatory_skills_json": mandatory_skills,
                "preferred_skills_json": preferred_skills,
                "approved_by_officer": True,
                "status": "APPROVED",
            })
            await session.commit()
            pg_stored = True
    except Exception:
        pass

    # 6. Automated Trigger on JD Upload: Broadcast dual-channel & in-app alerts to students
    try:
        from services.notifications import get_notification_dispatcher
        dispatcher = get_notification_dispatcher()
        background_tasks.add_task(
            dispatcher.broadcast_new_jd_alert,
            company_name=req.company_name,
            role_title=req.role_title,
            min_cgpa=min_cgpa,
            ctc_band=req.ctc_band,
            job_id=job_id,
        )
        logger.info(f"[FACULTY_JD_BROADCAST] Scheduled background notification broadcast for {req.company_name} ({req.role_title})")
    except Exception as e:
        logger.warning(f"[FACULTY_JD_BROADCAST_WARN] Could not schedule notification broadcast: {e}")

    return {
        "status": "SUCCESS",
        "job_id": job_id,
        "company_name": req.company_name,
        "role_title": req.role_title,
        "ctc_band": req.ctc_band,
        "min_cgpa": min_cgpa,
        "max_backlogs": max_backlogs,
        "allowed_branches": allowed_branches,
        "mandatory_skills": mandatory_skills,
        "preferred_skills": preferred_skills,
        "extraction_agent": extracted.get("extraction_agent"),
        "chunks_generated": len(chunks),
        "qdrant_upserted": upserted_count,
        "postgres_stored": pg_stored,
    }


@router.post("/update-criteria")
async def update_job_criteria(req: UpdateCriteriaRequest):
    """Faculty updates criteria toggles (Mandatory vs Preferred) and baseline preferences."""
    if req.job_id not in FACULTY_MANAGED_JDS:
        FACULTY_MANAGED_JDS[req.job_id] = {
            "job_id": req.job_id,
            "company_name": "Recruiter Drive",
            "role_title": "Software Engineer",
            "ctc_band": "14-20 LPA",
            "min_cgpa": req.min_cgpa or 7.0,
            "max_backlogs": req.max_backlogs or 0,
            "allowed_branches": req.allowed_branches or ["B.Tech CSE", "B.Tech IT"],
            "mandatory_skills": req.mandatory_skills,
            "preferred_skills": req.preferred_skills,
            "status": req.status or "APPROVED",
        }
    else:
        job = FACULTY_MANAGED_JDS[req.job_id]
        job["mandatory_skills"] = req.mandatory_skills
        job["preferred_skills"] = req.preferred_skills
        if req.min_cgpa is not None:
            job["min_cgpa"] = req.min_cgpa
        if req.max_backlogs is not None:
            job["max_backlogs"] = req.max_backlogs
        if req.allowed_branches is not None:
            job["allowed_branches"] = req.allowed_branches
        if req.status:
            job["status"] = req.status

    logger.info(f"[FACULTY_CRITERIA_UPDATED] Job: {req.job_id}, Mandatory: {req.mandatory_skills}, Preferred: {req.preferred_skills}")
    # 6. Automated Trigger on JD Upload: Broadcast dual-channel & in-app alerts to students
    try:
        from services.notifications import get_notification_dispatcher
        dispatcher = get_notification_dispatcher()
        background_tasks.add_task(
            dispatcher.broadcast_new_jd_alert,
            company_name=req.company_name,
            role_title=req.role_title,
            min_cgpa=min_cgpa,
            ctc_band=req.ctc_band,
            job_id=job_id,
        )
        logger.info(f"[FACULTY_JD_BROADCAST] Scheduled background notification broadcast for {req.company_name} ({req.role_title})")
    except Exception as e:
        logger.warning(f"[FACULTY_JD_BROADCAST_WARN] Could not schedule notification broadcast: {e}")

    return {
        "status": "SUCCESS",
        "message": "Faculty criteria preferences saved.",
        "job": FACULTY_MANAGED_JDS[req.job_id],
    }


@router.get("/faculty-jobs")
async def list_faculty_jobs():
    """Retrieve all faculty-managed placement opportunities with criteria."""
    return list(FACULTY_MANAGED_JDS.values())


@router.get("/evaluate-student")
async def evaluate_student_for_job(
    job_id: str = Query(...),
    student_id: str = Query("STU-101"),
    student_cgpa: float = Query(8.42),
    student_branch: str = Query("B.Tech CSE"),
    student_backlogs: int = Query(0),
):
    """Deterministic evaluation of student against Faculty-set JD gates."""
    job = FACULTY_MANAGED_JDS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    min_cgpa = float(job.get("min_cgpa", 7.0))
    max_backlogs = int(job.get("max_backlogs", 0))
    allowed_branches = job.get("allowed_branches", ["B.Tech CSE", "B.Tech IT"])
    mandatory_skills = job.get("mandatory_skills", [])
    preferred_skills = job.get("preferred_skills", [])

    # Student confirmed skills (Mock / DB resolution)
    student_skills_pool = {
        "STU-101": ["python", "sql", "fastapi", "react", "git", "linux", "data structures"],
        "STU-102": ["python", "machine learning", "deep learning", "pytorch", "sql", "pandas"],
        "STU-103": ["c++", "linux", "embedded", "data structures"],
    }
    student_skills = student_skills_pool.get(student_id, ["python", "sql", "data structures"])

    # 1. Hard Academic Gates
    failed_reasons = []
    if student_cgpa < min_cgpa:
        failed_reasons.append(f"CGPA {student_cgpa:.2f} is below Faculty minimum gate of {min_cgpa:.2f}")

    if allowed_branches and student_branch not in allowed_branches:
        failed_reasons.append(f"Branch '{student_branch}' is not in permitted branches: {', '.join(allowed_branches)}")

    if student_backlogs > max_backlogs:
        failed_reasons.append(f"Active backlogs ({student_backlogs}) exceed allowed cutoff of {max_backlogs}")

    if failed_reasons:
        return {
            "job_id": job_id,
            "student_id": student_id,
            "status": "FILTERED OUT",
            "failed_reason": " • ".join(failed_reasons),
            "missing_skills": [],
            "meets_mandatory": False,
        }

    # 2. Mandatory Technical Skills Gate
    missing_mandatory = [
        s for s in mandatory_skills if s.lower() not in [sk.lower() for sk in student_skills]
    ]

    if missing_mandatory:
        return {
            "job_id": job_id,
            "student_id": student_id,
            "status": "ACTION REQUIRED",
            "failed_reason": f"Missing confirmed mandatory skill{'s' if len(missing_mandatory) > 1 else ''}: {', '.join(missing_mandatory)}",
            "missing_skills": missing_mandatory,
            "meets_mandatory": False,
        }

    return {
        "job_id": job_id,
        "student_id": student_id,
        "status": "ELIGIBLE",
        "failed_reason": None,
        "missing_skills": [],
        "meets_mandatory": True,
    }


@router.get("/retrieve/{job_id}")
async def retrieve_jd_context(job_id: str):
    """Retrieve JD metadata for LiveKit voice agent recruiter persona injection."""
    if job_id in FACULTY_MANAGED_JDS:
        j = FACULTY_MANAGED_JDS[job_id]
        return {
            "status": "FOUND",
            "source": "faculty_store",
            "job_id": j["job_id"],
            "company_name": j["company_name"],
            "role_title": j["role_title"],
            "mandatory_skills": j.get("mandatory_skills", []),
            "preferred_skills": j.get("preferred_skills", []),
            "ctc_band": j.get("ctc_band", "14-20 LPA"),
            "min_cgpa": j.get("min_cgpa", 7.0),
        }

    # Fallback: search Qdrant
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
