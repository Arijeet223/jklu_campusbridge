"""CampusBridge AI — Academic Grade Sheet Ingestion & Scoring Router.

Implements "Deterministic Shell, Probabilistic Core":
- Accepts .pdf, .png, .jpg, .jpeg grade sheets/transcripts in-memory.
- In-memory OCR (RapidOCR) & PyMuPDF text/table extraction.
- Qwen 2.5 LLM deterministic extraction of subjects and grades.
- Pure Python deterministic GPA, marks mapping, and performance scoring.
- "Ghost Grade Card" provisional review before database mutation.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel

from backend.agents.academic_agent import extract_grades_with_qwen
from backend.db.excel_store import (
    SHEET_AUDIT,
    SHEET_STUDENTS,
    get_excel_store,
)
from backend.utils.academic_scorer import (
    calculate_academic_performance,
    parse_grade_or_marks,
)
from backend.utils.ocr_pipeline import extract_text_and_tables_from_grade_file

logger = logging.getLogger("campusbridge.academic_router")

router = APIRouter(tags=["Academic Records & Performance"])


class ConfirmedGradeItem(BaseModel):
    id: Optional[str] = None
    subject_name: str
    grade_or_marks: str
    credits: Optional[float] = 3.0


class ConfirmGradesPayload(BaseModel):
    student_id: str = "STU-101"
    confirmed_grades: list[ConfirmedGradeItem]
    semester: Optional[str] = "Semester 1"


# ──────────────────────────────────────────────────────────────────────────────
# 1. GRADE SHEET UPLOAD & OCR EXTRACTION ENDPOINT
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/upload-grades")
async def upload_grade_sheet_endpoint(
    request: Request,
    file: UploadFile = File(...),
    student_id: Optional[str] = Form("STU-101"),
) -> dict[str, Any]:
    """Upload grade sheet/transcript (PDF, PNG, JPG, JPEG).
    Executes in-memory OCR or PDF text extraction, Qwen 2.5 entity extraction,
    and returns provisional Ghost Grade Cards for student verification.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No valid file uploaded.")

    file_name = file.filename
    lower_name = file_name.lower()
    allowed_exts = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp"]
    if not any(lower_name.endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_name}'. Supported formats: PDF, PNG, JPG, JPEG.",
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file bytes: {e}")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    target_student_id = (student_id or request.query_params.get("student_id") or "STU-101").strip()

    # Step 1: In-memory OCR / PDF Parsing
    t0 = time.time()
    try:
        raw_text, method, page_count = extract_text_and_tables_from_grade_file(
            file_bytes=file_bytes,
            file_name=file_name,
            content_type=file.content_type or "",
        )
    except Exception as e:
        logger.error(f"OCR/PDF extraction error: {e}")
        raw_text, method, page_count = "", "ERROR", 0

    ocr_duration_ms = round((time.time() - t0) * 1000, 2)
    logger.info(f"Extracted {len(raw_text)} chars from {file_name} via {method} in {ocr_duration_ms}ms")

    # Step 2: AI Extraction Agent (Qwen 2.5 with regex fallback)
    extracted_grades, llm_model, llm_latency_ms = extract_grades_with_qwen(raw_text)

    # Step 3: Deterministic Scoring (Pure Python)
    provisional_perf = calculate_academic_performance(extracted_grades)

    # Build provisional Ghost Grade Cards
    ghost_grade_cards = []
    for idx, item in enumerate(extracted_grades):
        pts, is_fail = parse_grade_or_marks(item.get("grade_or_marks", "P"))
        ghost_grade_cards.append({
            "id": item.get("id") or f"grade_ghost_{int(time.time())}_{idx}",
            "subject_name": item.get("subject_name", f"Subject {idx + 1}"),
            "grade_or_marks": str(item.get("grade_or_marks", "P")).strip().upper(),
            "grade_point": pts,
            "credits": item.get("credits") or 3.0,
            "is_failed": is_fail,
            "is_confirmed": False,  # Unconfirmed Ghost Card
            "source_doc": file_name,
        })

    return {
        "status": "EXTRACTED_GHOST_CARDS",
        "file_name": file_name,
        "student_id": target_student_id,
        "extraction_method": method,
        "ocr_duration_ms": ocr_duration_ms,
        "llm_model": llm_model,
        "llm_latency_ms": llm_latency_ms,
        "page_count": page_count,
        "grades_count": len(ghost_grade_cards),
        "ghost_grade_cards": ghost_grade_cards,
        "provisional_performance": provisional_perf,
        "message": f"Successfully parsed {file_name}. Extracted {len(ghost_grade_cards)} subjects as provisional Ghost Grade Cards. Please review and confirm your grades.",
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2. STUDENT CONFIRMATION & PROFILE ACTIVATION ENDPOINT
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/confirm-grades")
async def confirm_grades_endpoint(payload: ConfirmGradesPayload) -> dict[str, Any]:
    """Student verifies/edits and confirms their extracted grades.
    Triggers deterministic Python scoring and updates student database records.
    """
    if not payload.confirmed_grades:
        raise HTTPException(status_code=400, detail="Cannot confirm an empty grade list.")

    # Convert Pydantic items to dicts
    records_dict = [g.model_dump() for g in payload.confirmed_grades]

    # Calculate 100% deterministic score
    perf = calculate_academic_performance(records_dict)

    student_id = payload.student_id or "STU-101"

    # Step A: Update Excel Store
    try:
        store = get_excel_store()
        store.update_row(
            sheet_name=SHEET_STUDENTS,
            key_col="student_id",
            key_val=student_id,
            updates={
                "academic_records": json.dumps(records_dict, ensure_ascii=False),
                "calculated_academic_score": perf["performance_score"],
                "cgpa": perf["gpa"],
                "active_backlogs": perf["failed_subjects"],
            },
            sync=True,
        )

        # Record Audit Log
        store.insert_row(
            SHEET_AUDIT,
            {
                "log_id": f"log_acad_{int(time.time())}_{uuid.uuid4().hex[:6]}",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "actor": f"Student ({student_id})",
                "action": "CONFIRM_ACADEMIC_GRADES",
                "entity_affected": f"StudentProfile/{student_id}",
                "status": "SUCCESS",
                "execution_ms": 12.0,
                "summary": f"Confirmed {len(records_dict)} academic grades. GPA: {perf['gpa']}, Academic Score: {perf['performance_score']}.",
            },
            sync=False,
        )
    except Exception as e:
        logger.warning(f"Excel store update warning: {e}")

    # Step B: Update PostgreSQL if active
    try:
        from backend.db.session import async_session_factory
        from backend.db.models import StudentProfile
        from sqlalchemy import select

        async with async_session_factory() as session:
            stmt = select(StudentProfile).where(StudentProfile.student_id == student_id)
            res = await session.execute(stmt)
            sp = res.scalar_one_or_none()
            if sp:
                sp.academic_records = records_dict
                sp.calculated_academic_score = perf["performance_score"]
                sp.cgpa = perf["gpa"]
                sp.active_backlogs = perf["failed_subjects"]
                await session.commit()
    except Exception as e:
        logger.debug(f"PostgreSQL store update skipped: {e}")

    # Step C: Sync confirmed academic records to Qdrant personal knowledge base
    try:
        from rag.qdrant_service import get_qdrant_service
        qs = get_qdrant_service()
        qs.upsert_student_unified_knowledge(
            student_id=student_id,
            full_name="Aarav Sharma",
            skills=[],
            academic_records=records_dict,
            cgpa=perf["gpa"],
        )
    except Exception as e:
        logger.warning(f"Qdrant academic knowledge base sync notice: {e}")

    return {
        "status": "CONFIRMED",
        "student_id": student_id,
        "calculated_academic_score": perf["performance_score"],
        "cgpa": perf["gpa"],
        "percentage": perf["percentage"],
        "academic_standing": perf["academic_standing"],
        "honors_eligible": perf["honors_eligible"],
        "total_subjects": perf["total_subjects"],
        "failed_subjects": perf["failed_subjects"],
        "confirmed_grades": perf["processed_records"],
        "insights": perf["insights"],
        "message": f"Academic profile successfully updated! Calculated GPA: {perf['gpa']}/10.0 ({perf['percentage']}%).",
    }


# ──────────────────────────────────────────────────────────────────────────────
# 3. RETRIEVE STUDENT ACADEMIC RECORDS
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/grades/{student_id}")
async def get_student_academic_records(student_id: str) -> dict[str, Any]:
    """Retrieve verified academic records and performance metrics for a student."""
    records: list[dict[str, Any]] = []

    try:
        store = get_excel_store()
        all_students = store.get_sheet(SHEET_STUDENTS)
        for row in all_students:
            if str(row.get("student_id", "")).strip().upper() == student_id.upper():
                raw_rec = row.get("academic_records")
                if raw_rec:
                    if isinstance(raw_rec, str):
                        try:
                            records = json.loads(raw_rec)
                        except json.JSONDecodeError:
                            records = []
                    elif isinstance(raw_rec, list):
                        records = raw_rec
                break
    except Exception:
        pass

    perf = calculate_academic_performance(records)
    return {
        "student_id": student_id,
        "has_academic_records": len(records) > 0,
        "records_count": len(records),
        "records": records,
        "performance_metrics": perf,
    }
