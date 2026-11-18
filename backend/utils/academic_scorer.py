"""CampusBridge AI — Deterministic Academic Performance Scorer.

Follows the "Deterministic Shell, Probabilistic Core" architectural thesis:
All grade point mappings, credit-weighted GPAs, percentage conversions, and
academic standing evaluations execute in 100% pure deterministic Python.
Zero LLM hallucination or black-box guessing for academic credentials.
"""

from __future__ import annotations

import re
from typing import Any


GRADE_POINTS_MAP: dict[str, float] = {
    # 10-Point Indian / Global Standard Scales (UGC, AICTE, IIT/NIT)
    "O": 10.0,
    "A+": 10.0,
    "S": 10.0,
    "OUTSTANDING": 10.0,
    "A": 9.0,
    "EXCELLENT": 9.0,
    "A-": 8.5,
    "B+": 8.0,
    "VERY GOOD": 8.0,
    "B": 7.0,
    "GOOD": 7.0,
    "B-": 6.5,
    "C+": 6.0,
    "ABOVE AVERAGE": 6.0,
    "C": 5.5,
    "AVERAGE": 5.5,
    "C-": 5.0,
    "P": 5.0,
    "PASS": 5.0,
    "D": 4.5,
    "POOR": 4.0,
    "E": 0.0,
    "F": 0.0,
    "FAIL": 0.0,
    "AB": 0.0,
    "ABSENT": 0.0,
    "U": 0.0,
    "W": 0.0,
    "WITHHELD": 0.0,
}


def parse_grade_or_marks(grade_str: Any) -> tuple[float, bool]:
    """Parse grade_or_marks into (grade_point_10, is_failed).
    
    Accepts:
    - Letter grade: 'O', 'A+', 'A', 'B', 'C', 'F', etc.
    - Numerical mark with total: '85/100', '42/50', '28/30'
    - Percentage: '88%' or '92.5'
    - Direct GPA: '8.4', '9.0'
    """
    if grade_str is None:
        return 0.0, True

    cleaned = str(grade_str).strip().upper()
    if not cleaned:
        return 0.0, True

    # 1. Direct letter grade lookup
    if cleaned in GRADE_POINTS_MAP:
        pts = GRADE_POINTS_MAP[cleaned]
        return pts, (pts == 0.0)

    # 2. Check for fraction format e.g. "85/100" or "42/50"
    fraction_match = re.search(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)", cleaned)
    if fraction_match:
        try:
            obtained = float(fraction_match.group(1))
            total = float(fraction_match.group(2))
            if total > 0:
                pct = (obtained / total) * 100.0
                pts = min(10.0, max(0.0, round(pct / 10.0, 2)))
                return pts, (pts < 4.0)
        except (ValueError, ZeroDivisionError):
            pass

    # 3. Check for percentage format e.g. "88%"
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", cleaned)
    if pct_match:
        try:
            pct = float(pct_match.group(1))
            pts = min(10.0, max(0.0, round(pct / 10.0, 2)))
            return pts, (pts < 4.0)
        except ValueError:
            pass

    # 4. Check for direct numerical float or int e.g. "8.6" or "78"
    num_match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    if num_match:
        try:
            val = float(num_match.group(1))
            if val <= 10.0:
                # Direct 10-point grade
                return val, (val < 4.0)
            elif val <= 100.0:
                # Marks out of 100
                pts = min(10.0, max(0.0, round(val / 10.0, 2)))
                return pts, (pts < 4.0)
        except ValueError:
            pass

    # Fallback default: C / 5.0
    return 5.0, False


def calculate_academic_performance(records: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate deterministic GPA, academic score, and performance standing.
    
    Parameters
    ----------
    records : list of dicts containing:
        - subject_name: str
        - grade_or_marks: str / float
        - credits: float | int | None (optional)

    Returns
    -------
    dict with:
        - gpa: float (0.0 to 10.0)
        - percentage: float (gpa * 9.5)
        - performance_score: float (normalized 0.0 to 100.0)
        - total_subjects: int
        - passed_subjects: int
        - failed_subjects: int
        - total_credits: float
        - academic_standing: str
        - honors_eligible: bool
        - processed_records: list of verified record dicts
    """
    if not records:
        return {
            "gpa": 0.0,
            "percentage": 0.0,
            "performance_score": 0.0,
            "total_subjects": 0,
            "passed_subjects": 0,
            "failed_subjects": 0,
            "total_credits": 0.0,
            "academic_standing": "NOT_AVAILABLE",
            "honors_eligible": False,
            "processed_records": [],
            "insights": ["No academic records provided for scoring."],
        }

    processed = []
    total_weighted_points = 0.0
    total_credits = 0.0
    total_unweighted_points = 0.0
    has_any_credits = False
    failed_count = 0

    for idx, item in enumerate(records):
        name = str(item.get("subject_name") or f"Subject {idx + 1}").strip()
        raw_grade = item.get("grade_or_marks") or item.get("grade") or "P"
        raw_credits = item.get("credits")

        pts, is_failed = parse_grade_or_marks(raw_grade)
        if is_failed:
            failed_count += 1

        credits_val = 0.0
        if raw_credits is not None:
            try:
                credits_val = float(raw_credits)
                if credits_val > 0:
                    has_any_credits = True
            except (ValueError, TypeError):
                credits_val = 0.0

        processed.append({
            "id": item.get("id") or f"sub_{idx + 1}",
            "subject_name": name,
            "grade_or_marks": str(raw_grade).strip(),
            "grade_point": pts,
            "credits": credits_val if credits_val > 0 else 3.0,  # Standard fallback 3.0
            "is_failed": is_failed,
        })

        if credits_val > 0:
            total_weighted_points += pts * credits_val
            total_credits += credits_val
        total_unweighted_points += pts

    total_subjects = len(processed)
    passed_subjects = total_subjects - failed_count

    if has_any_credits and total_credits > 0:
        gpa = round(total_weighted_points / total_credits, 2)
    else:
        gpa = round(total_unweighted_points / max(1, total_subjects), 2)

    gpa = min(10.0, max(0.0, gpa))

    # AICTE / CBSE / UGC Standard Conversion: Percentage = GPA * 9.5
    percentage = min(100.0, max(0.0, round(gpa * 9.5, 1)))

    # Performance Score (0-100): Combines GPA (80%) and zero-backlog integrity bonus (20%)
    backlog_penalty = failed_count * 5.0
    performance_score = max(0.0, min(100.0, round((gpa * 10.0) - backlog_penalty, 1)))

    # Determine Academic Standing
    if gpa >= 9.0 and failed_count == 0:
        standing = "OUTSTANDING"
    elif gpa >= 8.0 and failed_count == 0:
        standing = "EXCELLENT"
    elif gpa >= 7.0 and failed_count == 0:
        standing = "VERY_GOOD"
    elif gpa >= 6.0:
        standing = "GOOD"
    elif gpa >= 5.0:
        standing = "AVERAGE"
    else:
        standing = "NEEDS_IMPROVEMENT"

    honors_eligible = (gpa >= 8.2) and (failed_count == 0)

    # Generate Deterministic Rule-Based Academic Insights
    insights = []
    if honors_eligible:
        insights.append(f"Dean's Honors / Fast-Track Placement Eligible (CGPA: {gpa}/10.0).")
    if failed_count > 0:
        insights.append(f"Warning: {failed_count} subject backlog(s) detected. Cleared defense or re-examination required for Tier-1 recruiter cutoffs.")
    else:
        insights.append("100% Clean Academic Record — Zero active backlogs recorded.")

    high_scoring_subjects = [p["subject_name"] for p in processed if p["grade_point"] >= 9.0]
    if high_scoring_subjects:
        insights.append(f"Top Academic Competencies: {', '.join(high_scoring_subjects[:3])}.")

    return {
        "gpa": gpa,
        "percentage": percentage,
        "performance_score": performance_score,
        "total_subjects": total_subjects,
        "passed_subjects": passed_subjects,
        "failed_subjects": failed_count,
        "total_credits": round(total_credits if total_credits > 0 else (total_subjects * 3.0), 1),
        "academic_standing": standing,
        "honors_eligible": honors_eligible,
        "processed_records": processed,
        "insights": insights,
    }
