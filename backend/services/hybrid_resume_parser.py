"""CampusBridge AI — Production-Ready Hybrid Resume Parser & Skill Extraction.

Handles in-memory parsing of PDF (PyMuPDF / pdfplumber) and DOCX (python-docx).
Executes two-step hybrid skill extraction:
  - Step A: Qwen 2.5 LLM JSON extraction
  - Step B: Massive hardcoded skill dictionary correlation
"""

from __future__ import annotations

import io
import json
import logging
import re
from typing import Any, Optional

from core.model_gateway import ModelGateway
from utils.skill_dictionary import scan_text_against_dictionary

logger = logging.getLogger("campusbridge.hybrid_parser")


def extract_raw_text_from_bytes(file_bytes: bytes, filename: str) -> tuple[str, list[tuple[int, str]]]:
    """Extracts raw text and per-page tuples (page_num, text) completely in memory."""
    lower_name = filename.lower()
    pages_text: list[tuple[int, str]] = []
    full_text = ""

    # 1. PDF Parsing
    if lower_name.endswith(".pdf"):
        # Try PyMuPDF (fitz) first
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_idx in range(len(doc)):
                page = doc.load_page(page_idx)
                p_text = page.get_text()
                if p_text and p_text.strip():
                    pages_text.append((page_idx + 1, p_text.strip()))
            full_text = "\n\n".join([t[1] for t in pages_text])
        except Exception as e:
            logger.warning("PyMuPDF in-memory parsing failed, attempting pdfplumber fallback: %s", e)
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for idx, page in enumerate(pdf.pages):
                        p_text = page.extract_text()
                        if p_text and p_text.strip():
                            pages_text.append((idx + 1, p_text.strip()))
                full_text = "\n\n".join([t[1] for t in pages_text])
            except Exception as e2:
                logger.error("pdfplumber in-memory parsing failed: %s", e2)

    # 2. DOCX Parsing
    elif lower_name.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            para_texts = []
            for p in doc.paragraphs:
                if p.text and p.text.strip():
                    para_texts.append(p.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_content = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_content:
                        para_texts.append(" | ".join(row_content))
            full_text = "\n".join(para_texts)
            pages_text = [(1, full_text)]
        except Exception as e:
            logger.error("python-docx in-memory parsing failed: %s", e)

    # 3. Fallback / Plain text
    if not full_text:
        try:
            full_text = file_bytes.decode("utf-8", errors="ignore").strip()
            pages_text = [(1, full_text)]
        except Exception:
            full_text = ""
            pages_text = []

    return full_text, pages_text


def extract_candidate_metadata(raw_text: str) -> dict[str, Any]:
    """Heuristic layout extraction for candidate profile info."""
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    metadata: dict[str, Any] = {
        "name": "Candidate",
        "email": None,
        "phone": None,
        "cgpa": None,
        "program": "B.Tech Computer Science & Engineering",
    }

    if lines:
        for l in lines[:5]:
            if len(l.split()) <= 4 and not re.search(r"@|github|linkedin|http|\.com|\d{5}", l, re.I):
                metadata["name"] = l
                break

    email_m = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text)
    if email_m:
        metadata["email"] = email_m.group(0)

    phone_m = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", raw_text)
    if phone_m:
        metadata["phone"] = phone_m.group(0)

    cgpa_m = re.search(r"(?:cgpa|gpa|score)\s*[:=-]?\s*(\d+\.?\d*)\s*(?:\/\s*10|\/\s*4)?", raw_text, re.I)
    if cgpa_m:
        try:
            val = float(cgpa_m.group(1))
            if 0.0 <= val <= 10.0:
                metadata["cgpa"] = val
        except ValueError:
            pass

    return metadata


def extract_hybrid_skills(
    raw_text: str,
    filename: str = "Resume.pdf",
    gateway: Optional[ModelGateway] = None,
) -> list[dict[str, Any]]:
    """Two-step hybrid skill extraction:
    Step A: Qwen 2.5 AI extraction (technical_skills + soft_skills).
    Step B: Massive dictionary correlation scan.
    Merges & deduplicates into unconfirmed Ghost Cards.
    """
    if not raw_text or not raw_text.strip():
        return []

    gw = gateway or ModelGateway()

    # ── Step A: AI Extraction (Qwen 2.5) ──────────────────────────────────
    qwen_tech_skills: list[str] = []
    qwen_soft_skills: list[str] = []

    system_instruction = (
        "You are an expert technical resume parser for CampusBridge AI. "
        "Extract all technical skills (languages, frameworks, databases, tools, cloud) "
        "and soft skills (communication, leadership, collaboration, problem solving) "
        "explicitly evidenced in the resume. "
        "Respond ONLY with valid JSON with exact keys: "
        "'technical_skills' (array of strings) and 'soft_skills' (array of strings). "
        "Do not invent skills. Output raw JSON only."
    )
    user_prompt = f"Resume excerpt:\n\"\"\"\n{raw_text[:3500]}\n\"\"\"\nExtract JSON:"

    try:
        res = gw.generate(
            prompt=user_prompt,
            system_instruction=system_instruction,
            temperature=0.1,
            max_tokens=400,
        )
        if res.content and not res.degraded_mode:
            text = res.content.strip()
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                qwen_tech_skills = [str(s).strip() for s in data.get("technical_skills", []) if s]
                qwen_soft_skills = [str(s).strip() for s in data.get("soft_skills", []) if s]
    except Exception as e:
        logger.warning("Step A (Qwen extraction) failed or offline: %s", e)

    # ── Step B: Dictionary Correlation ────────────────────────────────────
    dict_skills = scan_text_against_dictionary(raw_text)

    # ── Merge & Deduplicate ───────────────────────────────────────────────
    merged: list[dict[str, Any]] = []
    seen_normalized: set[str] = set()

    # 1. Add all dictionary skills
    for item in dict_skills:
        norm = item["name"].strip().lower()
        if norm not in seen_normalized:
            seen_normalized.add(norm)
            item["id"] = f"ghost_{len(merged) + 1}_{norm.replace(' ', '_')}"
            merged.append(item)

    # 2. Add AI-extracted technical skills not yet in dictionary
    for sk in qwen_tech_skills:
        clean_name = sk.strip()
        norm = clean_name.lower()
        if len(clean_name) >= 2 and norm not in seen_normalized:
            seen_normalized.add(norm)
            snippet = ""
            pos = raw_text.lower().find(norm)
            if pos != -1:
                start = max(0, pos - 40)
                end = min(len(raw_text), pos + len(clean_name) + 40)
                snippet = " ".join(raw_text[start:end].replace("\n", " ").split())

            merged.append({
                "id": f"ghost_{len(merged) + 1}_{norm.replace(' ', '_')}",
                "name": clean_name,
                "category": "Technical Skills",
                "proficiency": "Intermediate",
                "confidence": 0.95,
                "is_soft_skill": False,
                "sourceSpan": f"{filename} • Technical Skills",
                "snippet": snippet or f"Extracted from {filename}",
                "evidenceStatus": "EXTRACTED",
                "confirmed": False,
            })

    # 3. Add AI-extracted soft skills not yet in dictionary
    for sk in qwen_soft_skills:
        clean_name = sk.strip()
        norm = clean_name.lower()
        if len(clean_name) >= 2 and norm not in seen_normalized:
            seen_normalized.add(norm)
            snippet = ""
            pos = raw_text.lower().find(norm)
            if pos != -1:
                start = max(0, pos - 40)
                end = min(len(raw_text), pos + len(clean_name) + 40)
                snippet = " ".join(raw_text[start:end].replace("\n", " ").split())

            merged.append({
                "id": f"ghost_{len(merged) + 1}_{norm.replace(' ', '_')}",
                "name": clean_name,
                "category": "Soft Skills",
                "proficiency": "Intermediate",
                "confidence": 0.93,
                "is_soft_skill": True,
                "sourceSpan": f"{filename} • Soft Skills",
                "snippet": snippet or f"Extracted from {filename}",
                "evidenceStatus": "EXTRACTED",
                "confirmed": False,
            })

    return merged
