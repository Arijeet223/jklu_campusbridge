"""CampusBridge AI — Academic Grade Sheet Extraction Agent (Qwen 2.5).

Follows "Deterministic Shell, Probabilistic Core":
- The LLM's ONLY job is deterministic extraction of subject names, raw grades/marks, and credits.
- The LLM NEVER calculates the final GPA or performance score (handled strictly in Python).
- Includes deterministic regex fallback if Ollama/Qwen is offline.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Optional

import requests

logger = logging.getLogger("campusbridge.academic_agent")

OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5:7b"


def fallback_regex_grade_parser(text: str) -> list[dict[str, Any]]:
    """Deterministic regex fallback parser when LLM is unavailable.
    
    Parses common Indian university transcript & TCS iON portal tables:
    - Pipe/tab delimited rows: e.g. "KCS501 | Machine Learning Foundations | 4.0 | A+ | 10.0"
    - Colon/dash formats: e.g. "Compiler Design: A+ (Credits: 4.0)"
    Returns empty list if no genuine courses are detected (no mock fallback).
    """
    records = []
    lines = text.split("\n")

    grade_token_regex = r"^(O|A\+|A|A-|B\+|B|B-|C\+|C|C-|P|D|F|PASS|FAIL|\d{1,3}(?:\.\d+)?%?)$"
    seen_subjects = set()

    # Ignore table header rows and portal metadata
    skip_header_regex = re.compile(
        r"\b(subject\s*code|course\s*code|subject\s*name|course\s*title|earned\s*credit|credit\s*point|grade\s*point|semester|university|institute|transcript|cgpa|sgpa|sl\s*no|serial\s*no)\b",
        re.I,
    )

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 4:
            continue

        if skip_header_regex.search(line_clean) and ("grade" in line_clean.lower() or "credit" in line_clean.lower()):
            continue

        # Check for pipe-separated table rows (common in TCS iON OCR output)
        if "|" in line_clean:
            parts = [p.strip() for p in line_clean.split("|") if p.strip()]
            if len(parts) >= 2:
                found_grade: Optional[str] = None
                found_subject: Optional[str] = None
                found_credits: Optional[float] = None

                for p in parts:
                    clean_p = p.strip()
                    # Grade match (letter grade or numerical)
                    if re.match(r"^(O|A\+|A|A-|B\+|B|B-|C\+|C|P|D|F)$", clean_p, re.I):
                        found_grade = clean_p.upper()
                    elif re.match(r"^\d{1,2}(?:\.0|\.5)?$", clean_p) and not found_credits:
                        # Earned credit point (typically 1.0 to 6.0)
                        val = float(clean_p)
                        if 0.5 <= val <= 10.0:
                            found_credits = val
                    elif len(clean_p) > 3 and not re.match(r"^\d+(\.\d+)?$", clean_p) and not re.match(r"^(Pass|Fail|Audit|Regular)$", clean_p, re.I):
                        # Potential subject name or course code
                        # If it has alphabetic course title (e.g. "Machine Learning Foundations")
                        if re.search(r"[A-Za-z]{3,}", clean_p) and not re.match(r"^[A-Z0-9]{3,8}$", clean_p):
                            found_subject = clean_p
                        elif not found_subject and re.search(r"[A-Za-z]{2,}", clean_p):
                            found_subject = clean_p

                if found_grade and found_subject:
                    key = found_subject.lower()
                    if key not in seen_subjects:
                        seen_subjects.add(key)
                        records.append({
                            "id": f"grade_{len(records) + 1}",
                            "subject_name": found_subject,
                            "grade_or_marks": found_grade,
                            "credits": found_credits or 3.0,
                            "extraction_confidence": 0.88,
                        })
            continue

        # Check for colon / dash format e.g. "Applied Linear Algebra: A+" or "Web Tech - A"
        kv_match = re.search(r"^([A-Za-z0-9\s,&.-]+?)[\s:=-]+([A-Za-z0-9+/%.-]+)(?:\s*\(?Credits?:\s*(\d+(?:\.\d+)?)\)?)?", line_clean)
        if kv_match:
            sub = kv_match.group(1).strip()
            grd = kv_match.group(2).strip()
            crd = kv_match.group(3)

            # Validate grd looks like a letter grade or marks
            if re.match(r"^(O|A\+|A|A-|B\+|B|B-|C\+|C|P|D|F|\d{1,3}(?:/\d{2,3})?%?)$", grd, re.I) and len(sub) > 2:
                if not skip_header_regex.search(sub):
                    key = sub.lower()
                    if key not in seen_subjects:
                        seen_subjects.add(key)
                        records.append({
                            "id": f"grade_{len(records) + 1}",
                            "subject_name": sub,
                            "grade_or_marks": grd.upper(),
                            "credits": float(crd) if crd else 3.0,
                            "extraction_confidence": 0.85,
                        })

    return records


def extract_grades_with_qwen(raw_text: str, timeout_seconds: float = 25.0) -> tuple[list[dict[str, Any]], str, float]:
    """Extract academic subjects, grades, and credits using Qwen 2.5 with strict anti-hallucination prompting.

    Returns:
        (extracted_records, model_name, latency_ms)
    """
    if not raw_text.strip():
        return [], "NONE", 0.0

    prompt = (
        "You are an academic grade extraction engine for CampusBridge AI.\n"
        "Your task is to extract academic subjects, grades, and credits STRICTLY from the provided OCR text of a student grade sheet or portal screenshot (e.g., TCS iON, college transcripts).\n\n"
        "CRITICAL DIRECTIVES:\n"
        "1. Extract ONLY subjects and courses that are EXPLICITLY present in the OCR text below.\n"
        "2. Extract the exact 'Subject Name', 'Grade' (letter grade or marks), and 'Subject Earned Credit Point' (credits).\n"
        "3. Do NOT invent, extrapolate, or hallucinate standard computer science subjects (e.g., Database Management Systems, Computer Networks, Operating Systems, Data Structures) if they are not explicitly written in the OCR text.\n"
        "4. If no genuine academic subjects or grades are found in the text, you MUST return an empty array: {\"grades\": []}.\n"
        "5. Do NOT calculate any GPA, SGPA, CGPA, or final percentage. The LLM's only job is deterministic data extraction.\n"
        "6. Output valid JSON only.\n\n"
        "STRICT JSON OUTPUT FORMAT:\n"
        "{\n"
        '  "grades": [\n'
        '    {"subject_name": "Exact Subject Name", "grade_or_marks": "A+", "credits": 4.0}\n'
        "  ]\n"
        "}\n\n"
        f"GRADE SHEET OCR RAW TEXT:\n{raw_text[:4000]}"
    )

    t0 = time.time()
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
                    "num_predict": 1024,
                },
            },
            timeout=timeout_seconds,
        )

        latency_ms = round((time.time() - t0) * 1000, 2)

        if resp.status_code == 200:
            raw_response = resp.json().get("response", "").strip()

            # Parse JSON safely
            try:
                parsed = json.loads(raw_response)
                items = []

                if isinstance(parsed, list):
                    items = parsed
                elif isinstance(parsed, dict):
                    # Check for nested keys like "grades", "subjects", "courses"
                    for key in ["grades", "subjects", "courses", "records", "results"]:
                        if key in parsed and isinstance(parsed[key], list):
                            items = parsed[key]
                            break
                    if not items and "subject_name" in parsed:
                        items = [parsed]

                valid_records = []
                for itm in items:
                    if isinstance(itm, dict):
                        sub_name = itm.get("subject_name") or itm.get("subject") or itm.get("course")
                        grade_val = itm.get("grade_or_marks") or itm.get("grade") or itm.get("marks")
                        if sub_name and grade_val:
                            crd = itm.get("credits")
                            try:
                                crd_float = float(crd) if crd is not None else None
                            except (ValueError, TypeError):
                                crd_float = None

                            valid_records.append({
                                "id": f"grade_{len(valid_records) + 1}",
                                "subject_name": str(sub_name).strip(),
                                "grade_or_marks": str(grade_val).strip().upper(),
                                "credits": crd_float or 3.0,
                                "extraction_confidence": 0.95,
                            })

                if valid_records:
                    logger.info(f"Qwen 2.5 successfully extracted {len(valid_records)} grade records in {latency_ms}ms")
                    return valid_records, DEFAULT_MODEL, latency_ms
                elif isinstance(parsed, dict) and "grades" in parsed:
                    # Model explicitly and legitimately found no academic courses in text
                    logger.info(f"Qwen 2.5 confirmed zero subjects present in OCR text in {latency_ms}ms")
                    return [], DEFAULT_MODEL, latency_ms

            except json.JSONDecodeError as e:
                logger.warning(f"Failed to decode Qwen JSON response: {e}")

    except Exception as e:
        logger.warning(f"Ollama Qwen 2.5 grade extraction call failed: {e}")

    # Fallback: Deterministic Regex Parser
    latency_ms = round((time.time() - t0) * 1000, 2)
    fallback_records = fallback_regex_grade_parser(raw_text)
    logger.info(f"Using deterministic fallback grade parser: extracted {len(fallback_records)} subjects")
    return fallback_records, "Deterministic Regex Engine (Fallback)", latency_ms
