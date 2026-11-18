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
    """Deterministic regex fallback parser when LLM is unavailable."""
    records = []
    lines = text.split("\n")

    # Common Grade Patterns:
    # 1. Subject code + Name + Grade: e.g. "CS301 Data Structures A+" or "CS301 | Data Structures | A+ | 4"
    # 2. Key-value: "Operating Systems: A"
    # 3. Marks: "Mathematics - 88/100" or "Database Systems: 9.0"

    grade_token_regex = r"\b(O|A\+|A|A-|B\+|B|B-|C\+|C|C-|P|D|F|FAIL|PASS|\d{1,2}(?:\.\d+)?(?:\s*/\s*\d{2,3})?)\b"

    seen_subjects = set()

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 4:
            continue

        # Skip headers
        if re.search(r"\b(semester|university|institute|report|grade sheet|transcript|cgpa|sgpa|total credits)\b", line_clean, re.I):
            continue

        # Check for pipe separated table row
        if "|" in line_clean:
            parts = [p.strip() for p in line_clean.split("|") if p.strip()]
            if len(parts) >= 2:
                # Find which part looks like a grade
                found_grade = None
                found_subject = None
                found_credits = None

                for p in parts:
                    if re.match(r"^(O|A\+|A|B\+|B|C\+|C|P|D|F)$", p, re.I):
                        found_grade = p.upper()
                    elif re.match(r"^\d(\.0)?$", p):
                        found_credits = float(p)
                    elif len(p) > 3 and not re.match(r"^\d+$", p):
                        found_subject = p

                if found_grade and found_subject:
                    key = found_subject.lower()
                    if key not in seen_subjects:
                        seen_subjects.add(key)
                        records.append({
                            "subject_name": found_subject,
                            "grade_or_marks": found_grade,
                            "credits": found_credits or 3.0,
                            "extraction_confidence": 0.88,
                        })
            continue

        # Check for colon format e.g. "Data Structures: A+" or "Operating Systems - A"
        kv_match = re.search(r"^([A-Za-z0-9\s,&-]+?)[\s:=-]+([A-Za-z0-9+/%.-]+)(?:\s*\(Credits?:\s*(\d+)\))?", line_clean)
        if kv_match:
            sub = kv_match.group(1).strip()
            grd = kv_match.group(2).strip()
            crd = kv_match.group(3)

            # Validate grd looks like a grade
            if re.match(r"^(O|A\+|A|A-|B\+|B|B-|C\+|C|P|D|F|\d{1,3}(?:/\d{2,3})?%?)$", grd, re.I) and len(sub) > 2:
                key = sub.lower()
                if key not in seen_subjects:
                    seen_subjects.add(key)
                    records.append({
                        "subject_name": sub,
                        "grade_or_marks": grd.upper(),
                        "credits": float(crd) if crd else 3.0,
                        "extraction_confidence": 0.85,
                    })

    return records


def extract_grades_with_qwen(raw_text: str, timeout_seconds: float = 25.0) -> tuple[list[dict[str, Any]], str, float]:
    """Extract academic subjects, grades, and credits using Qwen 2.5.

    Returns:
        (extracted_records, model_name, latency_ms)
    """
    if not raw_text.strip():
        return [], "NONE", 0.0

    prompt = (
        "You are an academic grade extraction engine for CampusBridge AI.\n"
        "Extract ALL subjects, courses, and their corresponding letter grade or marks from this grade sheet text.\n\n"
        "STRICT JSON OUTPUT FORMAT:\n"
        "Return a JSON object with a single key 'grades' containing the array of ALL courses found in the text:\n"
        "{\n"
        '  "grades": [\n'
        '    {"subject_name": "Course Name", "grade_or_marks": "A+", "credits": 4.0},\n'
        '    {"subject_name": "Course Name", "grade_or_marks": "A", "credits": 3.0}\n'
        "  ]\n"
        "}\n\n"
        "STRICT RULES:\n"
        "1. Extract EVERY SINGLE academic subject found in the text. Do not omit any course.\n"
        "2. Do NOT calculate any GPA, SGPA, CGPA, or final percentage. Only extract raw course data.\n"
        "3. Output valid JSON only.\n\n"
        f"GRADE SHEET RAW TEXT:\n{raw_text[:4000]}"
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

            except json.JSONDecodeError as e:
                logger.warning(f"Failed to decode Qwen JSON response: {e}")

    except Exception as e:
        logger.warning(f"Ollama Qwen 2.5 grade extraction call failed: {e}")

    # Fallback: Deterministic Regex Parser
    latency_ms = round((time.time() - t0) * 1000, 2)
    fallback_records = fallback_regex_grade_parser(raw_text)
    logger.info(f"Using deterministic fallback grade parser: extracted {len(fallback_records)} subjects")
    return fallback_records, "Deterministic Regex Engine (Fallback)", latency_ms
