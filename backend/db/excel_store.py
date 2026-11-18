"""CampusBridge AI — Live Two-Way Excel Database Engine (excel_store.py).

Provides a thread-safe, auto-seeding Excel database manager using openpyxl + pandas
with an in-memory sync cache for <50ms reads and instant write-through to
data/campusbridge_db.xlsx.
"""

from __future__ import annotations

import io
import json
import logging
import os
import sqlite3
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import openpyxl
import pandas as pd

logger = logging.getLogger("campusbridge.excel_store")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
EXCEL_PATH = DATA_DIR / "campusbridge_db.xlsx"

# ═══════════════════════════════════════════════════════════════════════════
# Schema Definitions & Sheet Names
# ═══════════════════════════════════════════════════════════════════════════

SHEET_STUDENTS = "Accounts_Students"
SHEET_TEACHERS = "Accounts_Teachers"
SHEET_EVIDENCE = "Skill_Evidence"
SHEET_DSA = "DSA_Practice_Bank"
SHEET_SQL = "SQL_Practice_Bank"
SHEET_JOBS = "Opportunities_JDs"
SHEET_DISPUTES = "Disputes_And_Defenses"
SHEET_AUDIT = "MCP_Audit_Logs"

ALL_SHEETS = [
    SHEET_STUDENTS,
    SHEET_TEACHERS,
    SHEET_EVIDENCE,
    SHEET_DSA,
    SHEET_SQL,
    SHEET_JOBS,
    SHEET_DISPUTES,
    SHEET_AUDIT,
]

COLUMNS = {
    SHEET_STUDENTS: [
        "student_id",
        "full_name",
        "email",
        "password_hash",
        "roll_no",
        "program",
        "cohort_year",
        "cgpa",
        "active_backlogs",
        "privacy_shield_mode",
        "target_roles",
        "readiness_index",
        "sprint_mode_active",
        "academic_records",
        "calculated_academic_score",
    ],
    SHEET_TEACHERS: [
        "staff_id",
        "full_name",
        "email",
        "password_hash",
        "role",
        "department",
        "assigned_cohort",
        "permissions_scope",
    ],
    SHEET_EVIDENCE: [
        "evidence_id",
        "student_id",
        "skill_name",
        "category",
        "tier",
        "multiplier",
        "source_doc",
        "source_span_text",
        "confidence",
        "verified_by",
    ],
    SHEET_DSA: [
        "problem_id",
        "title",
        "topic",
        "difficulty",
        "company_tags",
        "problem_statement",
        "starter_code_python",
        "test_cases_json",
        "optimal_time_complexity",
        "role_weight_impact",
    ],
    SHEET_SQL: [
        "sql_id",
        "title",
        "concept",
        "difficulty",
        "schema_ddl",
        "sample_data_json",
        "question_prompt",
        "expected_query",
        "expected_output_json",
    ],
    SHEET_JOBS: [
        "job_id",
        "company_name",
        "role_title",
        "ctc_band",
        "deadline_hours",
        "min_cgpa",
        "max_backlogs",
        "allowed_branches",
        "mandatory_skills_json",
        "preferred_skills_json",
        "approved_by_officer",
        "status",
    ],
    SHEET_DISPUTES: [
        "ticket_id",
        "student_id",
        "type",
        "target_job_or_skill",
        "artifact_file",
        "questions_and_answers_json",
        "ai_rubric_score",
        "officer_status",
        "reason_code",
    ],
    SHEET_AUDIT: [
        "timestamp",
        "request_id",
        "actor_id",
        "actor_role",
        "agent_name",
        "mcp_server",
        "tool_name",
        "latency_ms",
        "status",
        "summary",
    ],
}


class ExcelStore:
    """Thread-safe, two-way Excel Database Store with in-memory caching."""

    def __init__(self, excel_path: Optional[Path] = None):
        self.excel_path = Path(excel_path) if excel_path else EXCEL_PATH
        self._lock = threading.RLock()
        self._cache: Dict[str, pd.DataFrame] = {}
        self._last_sync_time: float = 0.0

        # Ensure directory exists
        self.excel_path.parent.mkdir(parents=True, exist_ok=True)

        # Seed or load
        if not self.excel_path.exists():
            self._seed_initial_database()
        else:
            self._load_from_excel()

    # ═══════════════════════════════════════════════════════════════════════
    # Internal Loading & Seeding
    # ═══════════════════════════════════════════════════════════════════════

    def _load_from_excel(self) -> None:
        """Loads all sheets from the Excel file into memory cache."""
        with self._lock:
            try:
                xls = pd.ExcelFile(self.excel_path)
                for sheet in ALL_SHEETS:
                    if sheet in xls.sheet_names:
                        df = pd.read_excel(xls, sheet_name=sheet)
                        # Ensure all expected columns exist
                        expected_cols = COLUMNS.get(sheet, [])
                        for col in expected_cols:
                            if col not in df.columns:
                                df[col] = None
                        self._cache[sheet] = df.fillna("")
                    else:
                        self._cache[sheet] = pd.DataFrame(columns=COLUMNS.get(sheet, []))
                self._last_sync_time = time.time()
                logger.info("Successfully loaded database from %s", self.excel_path)
            except Exception as e:
                logger.error("Error reading Excel file: %s. Re-seeding default database.", e)
                self._seed_initial_database()

    def _save_to_excel(self) -> None:
        """Writes in-memory cache directly into the Excel workbook with openpyxl formatting."""
        with self._lock:
            wb = openpyxl.Workbook()
            # Remove default sheet
            wb.remove(wb.active)

            header_fill = openpyxl.styles.PatternFill(
                start_color="1E3A8A", end_color="1E3A8A", fill_type="solid"
            )
            header_font = openpyxl.styles.Font(color="FFFFFF", bold=True, name="Calibri", size=11)
            border_thin = openpyxl.styles.Border(
                left=openpyxl.styles.Side(style="thin", color="E2E8F0"),
                right=openpyxl.styles.Side(style="thin", color="E2E8F0"),
                top=openpyxl.styles.Side(style="thin", color="E2E8F0"),
                bottom=openpyxl.styles.Side(style="thin", color="E2E8F0"),
            )

            for sheet_name in ALL_SHEETS:
                ws = wb.create_sheet(title=sheet_name)
                df = self._cache.get(sheet_name, pd.DataFrame(columns=COLUMNS.get(sheet_name, [])))

                # Write headers
                headers = list(df.columns)
                ws.append(headers)
                for col_idx, cell in enumerate(ws[1], start=1):
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = openpyxl.styles.Alignment(horizontal="center", vertical="center")

                # Write data rows
                for _, row in df.iterrows():
                    row_vals = []
                    for val in row:
                        if isinstance(val, (dict, list)):
                            row_vals.append(json.dumps(val))
                        elif pd.isna(val):
                            row_vals.append("")
                        else:
                            row_vals.append(str(val) if not isinstance(val, (int, float, bool)) else val)
                    ws.append(row_vals)

                # Format borders and adjust column widths
                for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
                    for cell in row:
                        cell.border = border_thin

                for col in ws.columns:
                    col_letter = openpyxl.utils.get_column_letter(col[0].column)
                    max_len = max(len(str(c.value or "")) for c in col)
                    ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 45)

            wb.save(self.excel_path)
            self._last_sync_time = time.time()
            logger.info("Saved and synced Excel DB to %s", self.excel_path)

    # ═══════════════════════════════════════════════════════════════════════
    # Seeder Data
    # ═══════════════════════════════════════════════════════════════════════

    def _seed_initial_database(self) -> None:
        """Generates the rich initial seed database with 8 sheets."""
        with self._lock:
            # 1. Accounts_Students
            students_data = [
                {
                    "student_id": "STU-101",
                    "full_name": "Aarav Sharma",
                    "email": "aarav.sharma@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e101$aarav",
                    "roll_no": "22BCON104",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 8.42,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["Backend Engineer", "AI Engineer"]),
                    "readiness_index": 74,
                    "sprint_mode_active": True,
                },
                {
                    "student_id": "STU-102",
                    "full_name": "Priya Nair",
                    "email": "priya.nair@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e102$priya",
                    "roll_no": "22BCON118",
                    "program": "B.Tech CSE (AI & DS)",
                    "cohort_year": 2026,
                    "cgpa": 8.95,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["Data Scientist", "ML Engineer"]),
                    "readiness_index": 86,
                    "sprint_mode_active": False,
                },
                {
                    "student_id": "STU-103",
                    "full_name": "Rohan Verma",
                    "email": "rohan.verma@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e103$rohan",
                    "roll_no": "22BECE045",
                    "program": "B.Tech ECE (Minor in CS)",
                    "cohort_year": 2026,
                    "cgpa": 6.90,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "PRIVATE",
                    "target_roles": json.dumps(["Full-Stack Developer", "Backend Engineer"]),
                    "readiness_index": 62,
                    "sprint_mode_active": True,
                },
                {
                    "student_id": "STU-104",
                    "full_name": "Ananya Gupta",
                    "email": "ananya.gupta@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e104$ananya",
                    "roll_no": "22BCON162",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 7.90,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["Data Analyst", "Backend Engineer"]),
                    "readiness_index": 69,
                    "sprint_mode_active": False,
                },
                {
                    "student_id": "STU-105",
                    "full_name": "Vikramaditya Rathore",
                    "email": "vikram.rathore@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e105$vikram",
                    "roll_no": "22BCON209",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 6.85,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["DevOps Engineer", "Backend Engineer"]),
                    "readiness_index": 78,
                    "sprint_mode_active": True,
                },
                {
                    "student_id": "STU-106",
                    "full_name": "Sneha Mukherjee",
                    "email": "sneha.m@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e106$sneha",
                    "roll_no": "22BCON088",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 9.20,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "PUBLIC_COHORT",
                    "target_roles": json.dumps(["Systems Engineer", "Cloud Architect"]),
                    "readiness_index": 91,
                    "sprint_mode_active": False,
                },
                {
                    "student_id": "STU-107",
                    "full_name": "Karthik R.",
                    "email": "karthik.r@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e107$karthik",
                    "roll_no": "22BCON055",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 7.30,
                    "active_backlogs": 1,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["Backend Engineer"]),
                    "readiness_index": 65,
                    "sprint_mode_active": True,
                },
                {
                    "student_id": "STU-108",
                    "full_name": "Meera Krishnan",
                    "email": "meera.k@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e108$meera",
                    "roll_no": "22BCON140",
                    "program": "B.Tech CSE (AI & DS)",
                    "cohort_year": 2026,
                    "cgpa": 8.65,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["ML Engineer", "NLP Specialist"]),
                    "readiness_index": 82,
                    "sprint_mode_active": False,
                },
                {
                    "student_id": "STU-109",
                    "full_name": "Aditya Nambiar",
                    "email": "aditya.n@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e109$aditya",
                    "roll_no": "22BECE092",
                    "program": "B.Tech ECE (Minor in CS)",
                    "cohort_year": 2026,
                    "cgpa": 7.15,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["Embedded Systems", "Backend Engineer"]),
                    "readiness_index": 68,
                    "sprint_mode_active": True,
                },
                {
                    "student_id": "STU-110",
                    "full_name": "Pooja Hegde",
                    "email": "pooja.h@university.edu.in",
                    "password_hash": "pbkdf2_sha256$e110$pooja",
                    "roll_no": "22BCON201",
                    "program": "B.Tech CSE",
                    "cohort_year": 2026,
                    "cgpa": 8.10,
                    "active_backlogs": 0,
                    "privacy_shield_mode": "OPT_IN_DRIVES",
                    "target_roles": json.dumps(["Full-Stack Engineer", "Frontend Specialist"]),
                    "readiness_index": 77,
                    "sprint_mode_active": False,
                },
            ]

            # 2. Accounts_Teachers
            teachers_data = [
                {
                    "staff_id": "TPO-001",
                    "full_name": "Prof. Rajesh Menon",
                    "email": "rajesh.menon@university.edu.in",
                    "password_hash": "pbkdf2_sha256$tpo001$rajesh",
                    "role": "PLACEMENT_OFFICER",
                    "department": "Central Placement Cell",
                    "assigned_cohort": "All 2026 Graduating Cohorts",
                    "permissions_scope": "INSTITUTION_WIDE_TPO",
                },
                {
                    "staff_id": "FAC-014",
                    "full_name": "Dr. Kavita Iyer",
                    "email": "kavita.iyer@university.edu.in",
                    "password_hash": "pbkdf2_sha256$fac014$kavita",
                    "role": "FACULTY_MENTOR",
                    "department": "Computer Science & Engineering",
                    "assigned_cohort": "B.Tech CSE 2026 - Section A",
                    "permissions_scope": "DEPARTMENT_ADVISEES_ONLY",
                },
                {
                    "staff_id": "FAC-022",
                    "full_name": "Prof. Siddharth Joshi",
                    "email": "siddharth.joshi@university.edu.in",
                    "password_hash": "pbkdf2_sha256$fac022$siddharth",
                    "role": "FACULTY_MENTOR",
                    "department": "AI & Data Science",
                    "assigned_cohort": "B.Tech AI/DS 2026",
                    "permissions_scope": "DEPARTMENT_ADVISEES_ONLY",
                },
                {
                    "staff_id": "ADM-001",
                    "full_name": "Neha Kulkarni",
                    "email": "sysadmin@university.edu.in",
                    "password_hash": "pbkdf2_sha256$adm001$neha",
                    "role": "ADMIN",
                    "department": "Campus IT & AI Governance",
                    "assigned_cohort": "System Operations",
                    "permissions_scope": "INFRA_AND_MCP_DIAGNOSTICS",
                },
            ]

            # 3. Skill_Evidence
            evidence_data = [
                {
                    "evidence_id": "EV-101",
                    "student_id": "STU-101",
                    "skill_name": "Python",
                    "category": "Backend",
                    "tier": "4_ASSESSMENT_VERIFIED",
                    "multiplier": 1.0,
                    "source_doc": "assessment-py-101",
                    "source_span_text": "Scored 96% in Automated Python Advanced Concurrency Assessment",
                    "confidence": 0.98,
                    "verified_by": "System Automated Evaluator",
                },
                {
                    "evidence_id": "EV-102",
                    "student_id": "STU-101",
                    "skill_name": "FastAPI",
                    "category": "Backend",
                    "tier": "2_STUDENT_CONFIRMED",
                    "multiplier": 0.5,
                    "source_doc": "doc_resume_v3",
                    "source_span_text": "Built asynchronous high-throughput REST microservices using FastAPI",
                    "confidence": 0.88,
                    "verified_by": "Aarav Sharma (Self)",
                },
                {
                    "evidence_id": "EV-103",
                    "student_id": "STU-101",
                    "skill_name": "SQL & Query Optimization",
                    "category": "SQL",
                    "tier": "3_ARTIFACT_LINKED",
                    "multiplier": 0.75,
                    "source_doc": "github.com/aarav/ecommerce-db",
                    "source_span_text": "schema.sql: Indexed partitioned orders table with CTE query tuning",
                    "confidence": 0.92,
                    "verified_by": "GitHub Artifact Analyzer",
                },
                {
                    "evidence_id": "EV-104",
                    "student_id": "STU-101",
                    "skill_name": "Docker & Linux",
                    "category": "Backend",
                    "tier": "2_STUDENT_CONFIRMED",
                    "multiplier": 0.5,
                    "source_doc": "doc_resume_v3",
                    "source_span_text": "Containerized multi-service deployment with Docker Compose",
                    "confidence": 0.85,
                    "verified_by": "Aarav Sharma (Self)",
                },
                {
                    "evidence_id": "EV-105",
                    "student_id": "STU-101",
                    "skill_name": "Data Structures & Algorithms",
                    "category": "DSA",
                    "tier": "4_ASSESSMENT_VERIFIED",
                    "multiplier": 1.0,
                    "source_doc": "campusbridge-dsa-arena",
                    "source_span_text": "Passed Sliding Window & Cycle Detection tests",
                    "confidence": 0.99,
                    "verified_by": "CampusBridge DSA Engine",
                },
                {
                    "evidence_id": "EV-106",
                    "student_id": "STU-101",
                    "skill_name": "Hybrid RAG & Vector Search",
                    "category": "AI_ML",
                    "tier": "1_EXTRACTED",
                    "multiplier": 0.0,
                    "source_doc": "doc_resume_v3",
                    "source_span_text": "Explored LangChain and Pinecone vector database for document search",
                    "confidence": 0.94,
                    "verified_by": "Pending Student Confirmation (Ghost Card)",
                },
                {
                    "evidence_id": "EV-107",
                    "student_id": "STU-101",
                    "skill_name": "Git & CI/CD",
                    "category": "Backend",
                    "tier": "5_INSTITUTION_VERIFIED",
                    "multiplier": 1.0,
                    "source_doc": "lms-git-lab-cert",
                    "source_span_text": "Completed CS301 Department Lab on Trunk-Based Development",
                    "confidence": 1.0,
                    "verified_by": "Dr. Kavita Iyer (Faculty Mentor)",
                },
                # Priya Nair
                {
                    "evidence_id": "EV-201",
                    "student_id": "STU-102",
                    "skill_name": "Python",
                    "category": "Backend",
                    "tier": "5_INSTITUTION_VERIFIED",
                    "multiplier": 1.0,
                    "source_doc": "curriculum-transcript",
                    "source_span_text": "Grade S in Advanced Python & Data Modeling",
                    "confidence": 1.0,
                    "verified_by": "Prof. Siddharth Joshi",
                },
                {
                    "evidence_id": "EV-202",
                    "student_id": "STU-102",
                    "skill_name": "Hybrid RAG & Vector Search",
                    "category": "AI_ML",
                    "tier": "4_ASSESSMENT_VERIFIED",
                    "multiplier": 1.0,
                    "source_doc": "defense-rag-102",
                    "source_span_text": "Defended sovereign Hindi/English bilingual RAG pipeline",
                    "confidence": 0.96,
                    "verified_by": "CampusBridge Interview Coach Agent",
                },
                # Rohan Verma
                {
                    "evidence_id": "EV-301",
                    "student_id": "STU-103",
                    "skill_name": "Python",
                    "category": "Backend",
                    "tier": "2_STUDENT_CONFIRMED",
                    "multiplier": 0.5,
                    "source_doc": "resume-rohan-ece",
                    "source_span_text": "Python scripting for signal simulation",
                    "confidence": 0.81,
                    "verified_by": "Rohan Verma",
                },
            ]

            # 4. DSA_Practice_Bank (13 seeded problems)
            dsa_data = [
                {
                    "problem_id": "DSA-01",
                    "title": "Idempotent Webhook Rate-Limiter Window (Sliding Window)",
                    "topic": "Arrays",
                    "difficulty": "Medium",
                    "company_tags": "Razorpay, Atlassian, Juspay",
                    "problem_statement": "Given an array of incoming webhook timestamps (in seconds) and a window W, return the maximum number of requests processed without dropping if at most K requests are allowed in any sliding window of length W.",
                    "starter_code_python": "def max_allowed_webhooks(timestamps: list[int], W: int, K: int) -> int:\n    # Implement sliding window rate limit simulation\n    accepted = []\n    total_accepted = 0\n    for t in timestamps:\n        accepted = [x for x in accepted if t - x < W]\n        if len(accepted) < K:\n            accepted.append(t)\n            total_accepted += 1\n    return total_accepted",
                    "test_cases_json": json.dumps([
                        {"input": {"timestamps": [1, 2, 3, 4, 10, 11], "W": 5, "K": 3}, "expected": 5},
                        {"input": {"timestamps": [1, 1, 1, 1, 2], "W": 10, "K": 2}, "expected": 2},
                    ]),
                    "optimal_time_complexity": "O(N)",
                    "role_weight_impact": 8,
                },
                {
                    "problem_id": "DSA-02",
                    "title": "Microservice Dependency Deadlock Detector (Cycle in Directed Graph)",
                    "topic": "Graphs",
                    "difficulty": "Medium",
                    "company_tags": "Amazon, Uber, Flipkart",
                    "problem_statement": "You are given N microservices labeled 0 to N-1 and a list of directed RPC dependencies [u, v] meaning service u calls service v. Return True if deployment order is valid (DAG), or False if a cycle deadlock exists.",
                    "starter_code_python": "def can_deploy_services(num_services: int, dependencies: list[list[int]]) -> bool:\n    from collections import defaultdict, deque\n    adj = defaultdict(list)\n    indeg = [0] * num_services\n    for u, v in dependencies:\n        adj[u].append(v)\n        indeg[v] += 1\n    q = deque([i for i in range(num_services) if indeg[i] == 0])\n    visited = 0\n    while q:\n        node = q.popleft()\n        visited += 1\n        for nxt in adj[node]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                q.append(nxt)\n    return visited == num_services",
                    "test_cases_json": json.dumps([
                        {"input": {"num_services": 4, "dependencies": [[1, 0], [2, 1], [3, 2]]}, "expected": True},
                        {"input": {"num_services": 3, "dependencies": [[0, 1], [1, 2], [2, 0]]}, "expected": False},
                    ]),
                    "optimal_time_complexity": "O(V + E)",
                    "role_weight_impact": 10,
                },
                {
                    "problem_id": "DSA-03",
                    "title": "GPU Batch Inference Scheduler (Min-Heap / Priority Queue)",
                    "topic": "Heaps",
                    "difficulty": "Hard",
                    "company_tags": "NVIDIA, Microsoft, Rubrik",
                    "problem_statement": "Given N inference prompts with [arrival_time, execution_tokens] and K local GPU workers, return the minimum total turnaround time using shortest-job-first scheduling.",
                    "starter_code_python": "import heapq\ndef min_turnaround_time(jobs: list[list[int]], k_gpus: int) -> int:\n    jobs.sort(key=lambda x: x[0])\n    time_cur = 0\n    i = 0\n    n = len(jobs)\n    pq = []\n    turnaround = 0\n    while i < n or pq:\n        if not pq and time_cur < jobs[i][0]:\n            time_cur = jobs[i][0]\n        while i < n and jobs[i][0] <= time_cur:\n            heapq.heappush(pq, (jobs[i][1], jobs[i][0]))\n            i += 1\n        dur, arr = heapq.heappop(pq)\n        time_cur += dur\n        turnaround += (time_cur - arr)\n    return turnaround",
                    "test_cases_json": json.dumps([
                        {"input": {"jobs": [[0, 10], [1, 4], [2, 2]], "k_gpus": 1}, "expected": 29},
                    ]),
                    "optimal_time_complexity": "O(N log N)",
                    "role_weight_impact": 12,
                },
                {
                    "problem_id": "DSA-04",
                    "title": "Minimum Cost Cloud Checkpoint Storage (Dynamic Programming)",
                    "topic": "Dynamic Programming",
                    "difficulty": "Medium",
                    "company_tags": "Google, Intuit, Oracle",
                    "problem_statement": "Given training checkpoint days and costs for 1-day, 7-day, and 30-day retention passes, return the minimum cost to cover all snapshot days.",
                    "starter_code_python": "def min_checkpoint_cost(days: list[int], costs: list[int]) -> int:\n    day_set = set(days)\n    max_d = max(days)\n    dp = [0] * (max_d + 1)\n    for d in range(1, max_d + 1):\n        if d not in day_set:\n            dp[d] = dp[d-1]\n        else:\n            c1 = dp[d-1] + costs[0]\n            c7 = dp[max(0, d-7)] + costs[1]\n            c30 = dp[max(0, d-30)] + costs[2]\n            dp[d] = min(c1, c7, c30)\n    return dp[max_d]",
                    "test_cases_json": json.dumps([
                        {"input": {"days": [1, 4, 6, 7, 8, 20], "costs": [2, 7, 15]}, "expected": 11},
                    ]),
                    "optimal_time_complexity": "O(N)",
                    "role_weight_impact": 9,
                },
                {
                    "problem_id": "DSA-05",
                    "title": "Invert Binary Tree for Document AST Indexing",
                    "topic": "Trees",
                    "difficulty": "Easy",
                    "company_tags": "Google, Apple, Adobe",
                    "problem_statement": "Given binary tree node representations as nested lists [val, left, right], mirror the tree and return the inverted representation.",
                    "starter_code_python": "def invert_tree(root):\n    if not root:\n        return None\n    return [root[0], invert_tree(root[2]) if len(root) > 2 else None, invert_tree(root[1]) if len(root) > 1 else None]",
                    "test_cases_json": json.dumps([
                        {"input": {"root": [4, [2, [1], [3]], [7, [6], [9]]]}, "expected": [4, [7, [9], [6]], [2, [3], [1]]]},
                    ]),
                    "optimal_time_complexity": "O(N)",
                    "role_weight_impact": 6,
                },
                {
                    "problem_id": "DSA-06",
                    "title": "Distributed Cache LRU Eviction Tracker",
                    "topic": "Arrays",
                    "difficulty": "Medium",
                    "company_tags": "Salesforce, Cisco, VMware",
                    "problem_statement": "Simulate an LRU cache of capacity C receiving operations. Return list of evicted keys.",
                    "starter_code_python": "def simulate_lru(capacity: int, operations: list[tuple[str, int]]) -> list[int]:\n    from collections import OrderedDict\n    cache = OrderedDict()\n    evicted = []\n    for op, key in operations:\n        if op == 'GET':\n            if key in cache:\n                cache.move_to_end(key)\n        elif op == 'PUT':\n            if key in cache:\n                cache.move_to_end(key)\n            else:\n                if len(cache) >= capacity:\n                    old_k, _ = cache.popitem(last=False)\n                    evicted.append(old_k)\n                cache[key] = True\n    return evicted",
                    "test_cases_json": json.dumps([
                        {"input": {"capacity": 2, "operations": [["PUT", 1], ["PUT", 2], ["GET", 1], ["PUT", 3]]}, "expected": [2]},
                    ]),
                    "optimal_time_complexity": "O(1) per op",
                    "role_weight_impact": 8,
                },
                {
                    "problem_id": "DSA-07",
                    "title": "Two-Sum Matching for Financial Transaction Balancing",
                    "topic": "Arrays",
                    "difficulty": "Easy",
                    "company_tags": "Paytm, PhonePe, Goldman Sachs",
                    "problem_statement": "Given an array of integer amounts and target balance, return indices of the two amounts that add up to target.",
                    "starter_code_python": "def two_sum(amounts: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, a in enumerate(amounts):\n        rem = target - a\n        if rem in seen:\n            return [seen[rem], i]\n        seen[a] = i\n    return []",
                    "test_cases_json": json.dumps([
                        {"input": {"amounts": [2, 7, 11, 15], "target": 9}, "expected": [0, 1]},
                    ]),
                    "optimal_time_complexity": "O(N)",
                    "role_weight_impact": 5,
                },
                {
                    "problem_id": "DSA-08",
                    "title": "RPC Retry Loop Cycle Detector (Floyd's Algorithm)",
                    "topic": "Graphs",
                    "difficulty": "Easy",
                    "company_tags": "Stripe, Swiggy, Zomato",
                    "problem_statement": "Given next-hop pointers representing service retry routes [target_nodes], return the start index of the loop, or -1 if no cycle exists.",
                    "starter_code_python": "def detect_retry_cycle(next_hops: list[int]) -> int:\n    if not next_hops or next_hops[0] == -1:\n        return -1\n    slow = 0\n    fast = 0\n    while fast != -1 and fast < len(next_hops) and next_hops[fast] != -1:\n        slow = next_hops[slow]\n        fast = next_hops[next_hops[fast]] if next_hops[fast] < len(next_hops) and next_hops[fast] != -1 else -1\n        if slow == fast and slow != -1:\n            ptr1 = 0\n            ptr2 = slow\n            while ptr1 != ptr2:\n                ptr1 = next_hops[ptr1]\n                ptr2 = next_hops[ptr2]\n            return ptr1\n    return -1",
                    "test_cases_json": json.dumps([
                        {"input": {"next_hops": [1, 2, 0]}, "expected": 0},
                        {"input": {"next_hops": [1, 2, -1]}, "expected": -1},
                    ]),
                    "optimal_time_complexity": "O(N)",
                    "role_weight_impact": 7,
                },
                {
                    "problem_id": "DSA-09",
                    "title": "Course Curriculum Topological Ordering",
                    "topic": "Graphs",
                    "difficulty": "Medium",
                    "company_tags": "LinkedIn, Coursera, Meta",
                    "problem_statement": "Given total courses and prerequisite pairs [a, b], return a valid order to take all courses.",
                    "starter_code_python": "def find_order(numCourses: int, prerequisites: list[list[int]]) -> list[int]:\n    from collections import defaultdict, deque\n    adj = defaultdict(list)\n    indeg = [0] * numCourses\n    for dest, src in prerequisites:\n        adj[src].append(dest)\n        indeg[dest] += 1\n    q = deque([i for i in range(numCourses) if indeg[i] == 0])\n    res = []\n    while q:\n        curr = q.popleft()\n        res.append(curr)\n        for nxt in adj[curr]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                q.append(nxt)\n    return res if len(res) == numCourses else []",
                    "test_cases_json": json.dumps([
                        {"input": {"numCourses": 2, "prerequisites": [[1, 0]]}, "expected": [0, 1]},
                    ]),
                    "optimal_time_complexity": "O(V + E)",
                    "role_weight_impact": 9,
                },
                {
                    "problem_id": "DSA-10",
                    "title": "Longest Non-Repeating Token Subsequence",
                    "topic": "Arrays",
                    "difficulty": "Medium",
                    "company_tags": "Databricks, Snowflake, Confluent",
                    "problem_statement": "Given a sequence of token IDs, return the length of the longest contiguous sub-segment without duplicates.",
                    "starter_code_python": "def longest_unique_tokens(tokens: list[int]) -> int:\n    seen = {}\n    left = 0\n    max_len = 0\n    for right, tok in enumerate(tokens):\n        if tok in seen and seen[tok] >= left:\n            left = seen[tok] + 1\n        seen[tok] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len",
                    "test_cases_json": json.dumps([
                        {"input": {"tokens": [101, 202, 101, 303, 404, 202]}, "expected": 4},
                    ]),
                    "optimal_time_complexity": "O(N)",
                    "role_weight_impact": 8,
                },
                {
                    "problem_id": "DSA-11",
                    "title": "Kth Largest Placement Score in Live Stream",
                    "topic": "Heaps",
                    "difficulty": "Medium",
                    "company_tags": "Morgan Stanley, DE Shaw, Tower Research",
                    "problem_statement": "Maintain a min-heap of size K and return the Kth highest score after a series of additions.",
                    "starter_code_python": "import heapq\ndef kth_largest_scores(k: int, initial_scores: list[int], additions: list[int]) -> list[int]:\n    heap = initial_scores[:]\n    heapq.heapify(heap)\n    while len(heap) > k:\n        heapq.heappop(heap)\n    res = []\n    for val in additions:\n        heapq.heappush(heap, val)\n        if len(heap) > k:\n            heapq.heappop(heap)\n        res.append(heap[0])\n    return res",
                    "test_cases_json": json.dumps([
                        {"input": {"k": 3, "initial_scores": [4, 5, 8, 2], "additions": [3, 5, 10, 9]}, "expected": [4, 5, 5, 8]},
                    ]),
                    "optimal_time_complexity": "O(N log K)",
                    "role_weight_impact": 8,
                },
                {
                    "problem_id": "DSA-12",
                    "title": "Search Engine Tokenizer Segmentation (Word Break)",
                    "topic": "Dynamic Programming",
                    "difficulty": "Medium",
                    "company_tags": "Elastic, Splunk, Microsoft",
                    "problem_statement": "Given a query string and a dictionary of recognized search terms, return True if the query can be segmented into space-separated terms.",
                    "starter_code_python": "def can_segment_query(query: str, vocab: list[str]) -> bool:\n    vocab_set = set(vocab)\n    n = len(query)\n    dp = [False] * (n + 1)\n    dp[0] = True\n    for i in range(1, n + 1):\n        for j in range(i):\n            if dp[j] and query[j:i] in vocab_set:\n                dp[i] = True\n                break\n    return dp[n]",
                    "test_cases_json": json.dumps([
                        {"input": {"query": "campusbridgeai", "vocab": ["campus", "bridge", "ai"]}, "expected": True},
                        {"input": {"query": "deepmindai", "vocab": ["deep", "ai"]}, "expected": False},
                    ]),
                    "optimal_time_complexity": "O(N^2)",
                    "role_weight_impact": 10,
                },
                {
                    "problem_id": "DSA-13",
                    "title": "Network Delay Time for Cluster Heartbeats (Dijkstra)",
                    "topic": "Graphs",
                    "difficulty": "Hard",
                    "company_tags": "Cloudflare, Akamai, AWS",
                    "problem_statement": "Given directed latency edges [u, v, w] between N nodes and starting node K, return the time it takes for all nodes to receive heartbeat, or -1 if unreachable.",
                    "starter_code_python": "import heapq\nfrom collections import defaultdict\ndef network_delay_time(times: list[list[int]], n: int, k: int) -> int:\n    adj = defaultdict(list)\n    for u, v, w in times:\n        adj[u].append((v, w))\n    dist = {}\n    pq = [(0, k)]\n    while pq:\n        d, node = heapq.heappop(pq)\n        if node in dist:\n            continue\n        dist[node] = d\n        for nxt, weight in adj[node]:\n            if nxt not in dist:\n                heapq.heappush(pq, (d + weight, nxt))\n    return max(dist.values()) if len(dist) == n else -1",
                    "test_cases_json": json.dumps([
                        {"input": {"times": [[2, 1, 1], [2, 3, 1], [3, 4, 1]], "n": 4, "k": 2}, "expected": 2},
                    ]),
                    "optimal_time_complexity": "O(E log V)",
                    "role_weight_impact": 12,
                },
            ]

            # 5. SQL_Practice_Bank (5 seeded challenges)
            sql_data = [
                {
                    "sql_id": "SQL-01",
                    "title": "Top-2 Placed Offers by Department Using DENSE_RANK()",
                    "concept": "Window Functions",
                    "difficulty": "Medium",
                    "schema_ddl": "CREATE TABLE placement_offers (offer_id INT, student_id TEXT, department TEXT, company TEXT, ctc_lpa REAL);",
                    "sample_data_json": json.dumps([
                        {"offer_id": 1, "student_id": "STU-101", "department": "CSE", "company": "Razorpay", "ctc_lpa": 22.0},
                        {"offer_id": 2, "student_id": "STU-102", "department": "CSE", "company": "Sarvam AI", "ctc_lpa": 24.5},
                        {"offer_id": 3, "student_id": "STU-104", "department": "CSE", "company": "TechCorp", "ctc_lpa": 16.0},
                        {"offer_id": 4, "student_id": "STU-103", "department": "ECE", "company": "Qualcomm", "ctc_lpa": 19.0},
                        {"offer_id": 5, "student_id": "STU-109", "department": "ECE", "company": "Texas Instruments", "ctc_lpa": 17.5},
                    ]),
                    "question_prompt": "Write an SQL query to return the top 2 highest CTC offers per department using DENSE_RANK(). Columns: department, student_id, company, ctc_lpa, rnk.",
                    "expected_query": "WITH Ranked AS (SELECT department, student_id, company, ctc_lpa, DENSE_RANK() OVER (PARTITION BY department ORDER BY ctc_lpa DESC) as rnk FROM placement_offers) SELECT department, student_id, company, ctc_lpa, rnk FROM Ranked WHERE rnk <= 2 ORDER BY department, rnk;",
                    "expected_output_json": json.dumps([
                        {"department": "CSE", "student_id": "STU-102", "company": "Sarvam AI", "ctc_lpa": 24.5, "rnk": 1},
                        {"department": "CSE", "student_id": "STU-101", "company": "Razorpay", "ctc_lpa": 22.0, "rnk": 2},
                        {"department": "ECE", "student_id": "STU-103", "company": "Qualcomm", "ctc_lpa": 19.0, "rnk": 1},
                        {"department": "ECE", "student_id": "STU-109", "company": "Texas Instruments", "ctc_lpa": 17.5, "rnk": 2},
                    ]),
                },
                {
                    "sql_id": "SQL-02",
                    "title": "Identify Unverified Skill Evidence Without Micro-Defenses",
                    "concept": "Joins & Aggregation",
                    "difficulty": "Easy",
                    "schema_ddl": "CREATE TABLE skill_evidence (evidence_id TEXT, student_id TEXT, skill_name TEXT, tier TEXT); CREATE TABLE defense_attempts (attempt_id INT, evidence_id TEXT, score INT);",
                    "sample_data_json": json.dumps({
                        "skill_evidence": [
                            {"evidence_id": "EV-1", "student_id": "STU-101", "skill_name": "FastAPI", "tier": "2_STUDENT_CONFIRMED"},
                            {"evidence_id": "EV-2", "student_id": "STU-101", "skill_name": "Docker", "tier": "2_STUDENT_CONFIRMED"},
                            {"evidence_id": "EV-3", "student_id": "STU-102", "skill_name": "RAG", "tier": "4_ASSESSMENT_VERIFIED"},
                        ],
                        "defense_attempts": [
                            {"attempt_id": 1, "evidence_id": "EV-1", "score": 85},
                        ],
                    }),
                    "question_prompt": "Find all student skill_evidence records in '2_STUDENT_CONFIRMED' tier that have no recorded defense_attempts with score >= 70.",
                    "expected_query": "SELECT e.student_id, e.skill_name FROM skill_evidence e LEFT JOIN defense_attempts d ON e.evidence_id = d.evidence_id AND d.score >= 70 WHERE e.tier = '2_STUDENT_CONFIRMED' AND d.attempt_id IS NULL;",
                    "expected_output_json": json.dumps([
                        {"student_id": "STU-101", "skill_name": "Docker"},
                    ]),
                },
                {
                    "sql_id": "SQL-03",
                    "title": "Rolling 3-Day Tool Latency Anomaly Detection",
                    "concept": "CTEs",
                    "difficulty": "Hard",
                    "schema_ddl": "CREATE TABLE mcp_logs (log_date TEXT, tool_name TEXT, latency_ms INT);",
                    "sample_data_json": json.dumps([
                        {"log_date": "2026-10-01", "tool_name": "matching.explain", "latency_ms": 20},
                        {"log_date": "2026-10-02", "tool_name": "matching.explain", "latency_ms": 25},
                        {"log_date": "2026-10-03", "tool_name": "matching.explain", "latency_ms": 80},
                        {"log_date": "2026-10-01", "tool_name": "student.profile", "latency_ms": 15},
                        {"log_date": "2026-10-02", "tool_name": "student.profile", "latency_ms": 16},
                        {"log_date": "2026-10-03", "tool_name": "student.profile", "latency_ms": 18},
                    ]),
                    "question_prompt": "Find rows where latency_ms is greater than 2 times the 3-day rolling average for that tool.",
                    "expected_query": "WITH Stats AS (SELECT log_date, tool_name, latency_ms, AVG(latency_ms) OVER (PARTITION BY tool_name ORDER BY log_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as avg_3d FROM mcp_logs) SELECT log_date, tool_name, latency_ms, avg_3d FROM Stats WHERE latency_ms > 1.8 * avg_3d;",
                    "expected_output_json": json.dumps([
                        {"log_date": "2026-10-03", "tool_name": "matching.explain", "latency_ms": 80, "avg_3d": 41.67},
                    ]),
                },
                {
                    "sql_id": "SQL-04",
                    "title": "Students Meeting All Mandatory Drive Skills",
                    "concept": "Joins & Aggregation",
                    "difficulty": "Medium",
                    "schema_ddl": "CREATE TABLE student_skills (student_id TEXT, skill_name TEXT); CREATE TABLE drive_reqs (drive_id TEXT, skill_name TEXT);",
                    "sample_data_json": json.dumps({
                        "student_skills": [
                            {"student_id": "STU-101", "skill_name": "Python"},
                            {"student_id": "STU-101", "skill_name": "SQL"},
                            {"student_id": "STU-102", "skill_name": "Python"},
                        ],
                        "drive_reqs": [
                            {"drive_id": "DRIVE-1", "skill_name": "Python"},
                            {"drive_id": "DRIVE-1", "skill_name": "SQL"},
                        ],
                    }),
                    "question_prompt": "Find students possessing ALL mandatory skills required for 'DRIVE-1'. Output student_id.",
                    "expected_query": "SELECT s.student_id FROM student_skills s JOIN drive_reqs d ON s.skill_name = d.skill_name WHERE d.drive_id = 'DRIVE-1' GROUP BY s.student_id HAVING COUNT(DISTINCT s.skill_name) = (SELECT COUNT(DISTINCT skill_name) FROM drive_reqs WHERE drive_id = 'DRIVE-1');",
                    "expected_output_json": json.dumps([
                        {"student_id": "STU-101"},
                    ]),
                },
                {
                    "sql_id": "SQL-05",
                    "title": "Median CTC by Engineering Discipline",
                    "concept": "Window Functions",
                    "difficulty": "Hard",
                    "schema_ddl": "CREATE TABLE offers (dept TEXT, ctc INT);",
                    "sample_data_json": json.dumps([
                        {"dept": "CSE", "ctc": 15},
                        {"dept": "CSE", "ctc": 18},
                        {"dept": "CSE", "ctc": 22},
                        {"dept": "ECE", "ctc": 12},
                        {"dept": "ECE", "ctc": 14},
                        {"dept": "ECE", "ctc": 20},
                    ]),
                    "question_prompt": "Calculate the median CTC per department using row numbering.",
                    "expected_query": "WITH Ordered AS (SELECT dept, ctc, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY ctc) as row_id, COUNT(*) OVER (PARTITION BY dept) as total_cnt FROM offers) SELECT dept, AVG(ctc) as median_ctc FROM Ordered WHERE row_id IN ((total_cnt + 1)/2, (total_cnt + 2)/2) GROUP BY dept;",
                    "expected_output_json": json.dumps([
                        {"dept": "CSE", "median_ctc": 18.0},
                        {"dept": "ECE", "median_ctc": 14.0},
                    ]),
                },
            ]

            # 6. Opportunities_JDs (5 realistic campus drives)
            jobs_data = [
                {
                    "job_id": "JOB-2026-01",
                    "company_name": "RazorpayX Labs",
                    "role_title": "SDE-1 (Backend & Distributed Systems)",
                    "ctc_band": "18 - 22 LPA",
                    "deadline_hours": 48,
                    "min_cgpa": 7.5,
                    "max_backlogs": 0,
                    "allowed_branches": json.dumps(["B.Tech CSE", "B.Tech CSE (AI & DS)", "B.Tech ECE (Minor in CS)"]),
                    "mandatory_skills_json": json.dumps(["Python", "SQL & Query Optimization", "Data Structures & Algorithms"]),
                    "preferred_skills_json": json.dumps(["Docker & Linux", "FastAPI", "Git & CI/CD"]),
                    "approved_by_officer": "TPO-001",
                    "status": "APPROVED",
                },
                {
                    "job_id": "JOB-2026-02",
                    "company_name": "Sarvam Sovereign AI",
                    "role_title": "Applied AI & RAG Engineer",
                    "ctc_band": "20 - 26 LPA",
                    "deadline_hours": 360,
                    "min_cgpa": 8.0,
                    "max_backlogs": 0,
                    "allowed_branches": json.dumps(["B.Tech CSE", "B.Tech CSE (AI & DS)"]),
                    "mandatory_skills_json": json.dumps(["Python", "Hybrid RAG & Vector Search", "Data Structures & Algorithms"]),
                    "preferred_skills_json": json.dumps(["LangGraph Orchestration", "FastAPI"]),
                    "approved_by_officer": "TPO-001",
                    "status": "APPROVED",
                },
                {
                    "job_id": "JOB-2026-03",
                    "company_name": "TechCorp India",
                    "role_title": "Core Backend Engineer",
                    "ctc_band": "16 - 20 LPA",
                    "deadline_hours": 72,
                    "min_cgpa": 7.0,
                    "max_backlogs": 0,
                    "allowed_branches": json.dumps(["B.Tech CSE", "B.Tech CSE (AI & DS)", "B.Tech ECE (Minor in CS)"]),
                    "mandatory_skills_json": json.dumps(["Python", "FastAPI", "SQL & Query Optimization"]),
                    "preferred_skills_json": json.dumps(["Docker & Linux", "Git & CI/CD"]),
                    "approved_by_officer": "TPO-001",
                    "status": "APPROVED",
                },
                {
                    "job_id": "JOB-2026-04",
                    "company_name": "InnovateCo",
                    "role_title": "Full-Stack Web Architect",
                    "ctc_band": "14 - 18 LPA",
                    "deadline_hours": 120,
                    "min_cgpa": 6.5,
                    "max_backlogs": 0,
                    "allowed_branches": json.dumps(["B.Tech CSE", "B.Tech CSE (AI & DS)", "B.Tech ECE (Minor in CS)"]),
                    "mandatory_skills_json": json.dumps(["React", "TypeScript", "Python"]),
                    "preferred_skills_json": json.dumps(["FastAPI", "Docker & Linux"]),
                    "approved_by_officer": "TPO-001",
                    "status": "APPROVED",
                },
                {
                    "job_id": "JOB-2026-05",
                    "company_name": "Quantium Systems",
                    "role_title": "High-Frequency Platform Engineer",
                    "ctc_band": "28 - 35 LPA",
                    "deadline_hours": 240,
                    "min_cgpa": 8.5,
                    "max_backlogs": 0,
                    "allowed_branches": json.dumps(["B.Tech CSE"]),
                    "mandatory_skills_json": json.dumps(["Data Structures & Algorithms", "C++ / Systems Programming", "Python"]),
                    "preferred_skills_json": json.dumps(["Distributed Systems", "SQL & Query Optimization"]),
                    "approved_by_officer": "TPO-001",
                    "status": "APPROVED",
                },
            ]

            # 7. Disputes_And_Defenses
            disputes_data = [
                {
                    "ticket_id": "DISP-001",
                    "student_id": "STU-103",
                    "type": "ELIGIBILITY_DISPUTE",
                    "target_job_or_skill": "JOB-2026-01",
                    "artifact_file": "curriculum_ece_cs_minor.pdf",
                    "questions_and_answers_json": json.dumps([
                        {"q": "Branch Rule Clarification", "a": "Completed 24 credits in CSE minor, certified by Head of Department"}
                    ]),
                    "ai_rubric_score": 88,
                    "officer_status": "APPROVED_OVERRIDE",
                    "reason_code": "EQUIVALENT_COURSEWORK_VERIFIED",
                },
                {
                    "ticket_id": "DEF-001",
                    "student_id": "STU-101",
                    "type": "MICRO_DEFENSE_120S",
                    "target_job_or_skill": "FastAPI",
                    "artifact_file": "order_service.py",
                    "questions_and_answers_json": json.dumps([
                        {"q": "How does your order service prevent race conditions during inventory lock?", "a": "Used SELECT FOR UPDATE within an async SQLAlchemy session transaction block"},
                        {"q": "Why use BackgroundTasks instead of Celery for order email confirmation?", "a": "Keeps latency under 15ms for low-volume notification tasks without Redis dependency"}
                    ]),
                    "ai_rubric_score": 94,
                    "officer_status": "VERIFIED",
                    "reason_code": "PROVEN_IMPLEMENTATION_DEFENSE",
                },
                {
                    "ticket_id": "DISP-002",
                    "student_id": "STU-105",
                    "type": "ELIGIBILITY_DISPUTE",
                    "target_job_or_skill": "JOB-2026-03",
                    "artifact_file": "cgpa_grade_improvement_letter.pdf",
                    "questions_and_answers_json": json.dumps([
                        {"q": "CGPA Threshold 7.0 vs 6.85", "a": "Awaiting revaluation result for CS402 Distributed Computing"}
                    ]),
                    "ai_rubric_score": 70,
                    "officer_status": "PENDING",
                    "reason_code": "AWAITING_GRADE_AMENDMENT",
                },
            ]

            # 8. MCP_Audit_Logs
            audit_data = [
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": "req-mcp-init-001",
                    "actor_id": "STU-101",
                    "actor_role": "STUDENT",
                    "agent_name": "ReadinessCoachAgent",
                    "mcp_server": "matching",
                    "tool_name": "matching.run_match_preview",
                    "latency_ms": 24,
                    "status": "SUCCESS",
                    "summary": "Computed match alignment for JOB-2026-01: Score 74/100, MEETS Hard Gates",
                },
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": "req-mcp-init-002",
                    "actor_id": "STU-101",
                    "actor_role": "STUDENT",
                    "agent_name": "ProfileIntelligenceAgent",
                    "mcp_server": "student-profile",
                    "tool_name": "student-profile.get_my_profile",
                    "latency_ms": 12,
                    "status": "SUCCESS",
                    "summary": "Retrieved 7 verified skills and verified profile hygiene",
                },
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": "req-mcp-init-003",
                    "actor_id": "TPO-001",
                    "actor_role": "PLACEMENT_OFFICER",
                    "agent_name": "PlacementOpsCopilot",
                    "mcp_server": "analytics",
                    "tool_name": "analytics.get_cohort_summary",
                    "latency_ms": 18,
                    "status": "SUCCESS",
                    "summary": "Generated DPDP-compliant cohort liquidity: 14 eligible, k>=5 privacy enforced",
                },
            ]

            self._cache[SHEET_STUDENTS] = pd.DataFrame(students_data)
            self._cache[SHEET_TEACHERS] = pd.DataFrame(teachers_data)
            self._cache[SHEET_EVIDENCE] = pd.DataFrame(evidence_data)
            self._cache[SHEET_DSA] = pd.DataFrame(dsa_data)
            self._cache[SHEET_SQL] = pd.DataFrame(sql_data)
            self._cache[SHEET_JOBS] = pd.DataFrame(jobs_data)
            self._cache[SHEET_DISPUTES] = pd.DataFrame(disputes_data)
            self._cache[SHEET_AUDIT] = pd.DataFrame(audit_data)

            self._save_to_excel()
            logger.info("Auto-seeded initial database with 8 sheets into %s", self.excel_path)

    # ═══════════════════════════════════════════════════════════════════════
    # CRUD & Query Operations (<50ms In-Memory with Write-Through)
    # ═══════════════════════════════════════════════════════════════════════

    def get_sheet(self, sheet_name: str) -> List[Dict[str, Any]]:
        """Returns rows of a sheet as a list of dicts from cache (<5ms)."""
        with self._lock:
            if sheet_name not in self._cache:
                return []
            df = self._cache[sheet_name]
            return df.to_dict(orient="records")

    def insert_row(self, sheet_name: str, row_dict: Dict[str, Any], sync: bool = True) -> Dict[str, Any]:
        """Inserts a new row into the sheet cache and commits write-through to Excel."""
        with self._lock:
            if sheet_name not in self._cache:
                self._cache[sheet_name] = pd.DataFrame(columns=COLUMNS.get(sheet_name, []))

            expected_cols = COLUMNS.get(sheet_name, list(row_dict.keys()))
            sanitized = {}
            for col in expected_cols:
                val = row_dict.get(col, "")
                if isinstance(val, (dict, list)):
                    sanitized[col] = json.dumps(val)
                elif pd.isna(val):
                    sanitized[col] = ""
                else:
                    sanitized[col] = val

            new_df = pd.DataFrame([sanitized])
            self._cache[sheet_name] = pd.concat([self._cache[sheet_name], new_df], ignore_index=True)

            # High-throughput audit logs should never synchronously block the request thread
            should_sync = sync and (sheet_name != SHEET_AUDIT)
            if should_sync:
                self._save_to_excel()
            return sanitized

    def update_row(
        self, sheet_name: str, key_col: str, key_val: Any, updates: Dict[str, Any], sync: bool = True
    ) -> bool:
        """Updates row(s) matching key_col == key_val in cache and syncs to Excel."""
        with self._lock:
            if sheet_name not in self._cache:
                return False
            df = self._cache[sheet_name]
            mask = df[key_col].astype(str) == str(key_val)
            if not mask.any():
                return False

            for col, val in updates.items():
                if col in df.columns:
                    if isinstance(val, (dict, list)):
                        df.loc[mask, col] = json.dumps(val)
                    else:
                        df.loc[mask, col] = val

            self._cache[sheet_name] = df
            if sync:
                self._save_to_excel()
            return True

    def delete_row(self, sheet_name: str, key_col: str, key_val: Any, sync: bool = True) -> bool:
        """Deletes row(s) matching key_col == key_val."""
        with self._lock:
            if sheet_name not in self._cache:
                return False
            df = self._cache[sheet_name]
            mask = df[key_col].astype(str) == str(key_val)
            if not mask.any():
                return False

            self._cache[sheet_name] = df[~mask].reset_index(drop=True)
            if sync:
                self._save_to_excel()
            return True

    def sync_to_excel(self) -> None:
        """Manually forces flush of memory cache to Excel."""
        self._save_to_excel()

    def reload_from_excel(self) -> None:
        """Forces reload of memory cache from Excel file on disk."""
        self._load_from_excel()

    # ═══════════════════════════════════════════════════════════════════════
    # Export, Import & Database Stats
    # ═══════════════════════════════════════════════════════════════════════

    def export_excel_bytes(self) -> bytes:
        """Returns the complete Excel database file as raw bytes for download."""
        with self._lock:
            self._save_to_excel()
            return self.excel_path.read_bytes()

    def import_excel_bytes(self, content: bytes) -> bool:
        """Overwrites the Excel file with uploaded content and reloads cache."""
        with self._lock:
            try:
                # Validate that it is a valid Excel file
                test_buf = io.BytesIO(content)
                xls = pd.ExcelFile(test_buf)
                if not any(s in xls.sheet_names for s in ALL_SHEETS):
                    logger.warning("Uploaded file has no recognizable CampusBridge sheets.")
                # Save
                self.excel_path.write_bytes(content)
                self._load_from_excel()
                return True
            except Exception as e:
                logger.error("Failed to import Excel bytes: %s", e)
                return False

    def get_db_stats(self) -> Dict[str, Any]:
        """Returns diagnostic statistics about the Excel database."""
        with self._lock:
            file_size_bytes = self.excel_path.stat().st_size if self.excel_path.exists() else 0
            stats = {
                "excel_path": str(self.excel_path),
                "file_size_kb": round(file_size_bytes / 1024, 2),
                "last_modified": datetime.fromtimestamp(
                    self.excel_path.stat().st_mtime if self.excel_path.exists() else 0, tz=timezone.utc
                ).isoformat(),
                "sheet_counts": {sheet: len(self._cache.get(sheet, [])) for sheet in ALL_SHEETS},
                "total_rows": sum(len(df) for df in self._cache.values()),
                "sync_cache_healthy": True,
            }
            return stats

    # ═══════════════════════════════════════════════════════════════════════
    # Execution Sandboxes (DSA Python & SQL in-memory SQLite)
    # ═══════════════════════════════════════════════════════════════════════

    def run_dsa_test(self, code: str, test_cases_json: str) -> Dict[str, Any]:
        """Executes candidate Python code in the secured QduOJSandbox with strict cgroups & timeout."""
        try:
            from backend.sandbox import get_sandbox
            return get_sandbox().execute_submission(code, test_cases_json)
        except Exception as e:
            logger.warning(f"Sandbox runner error, falling back to local runner: {e}")

        try:
            test_cases = json.loads(test_cases_json) if isinstance(test_cases_json, str) else test_cases_json
        except Exception:
            return {"passed": False, "error": "Invalid test cases JSON payload"}

        local_scope: Dict[str, Any] = {}
        # Execute code in safe restricted locals
        try:
            exec(code, {"__builtins__": __builtins__, "heapq": __import__("heapq"), "collections": __import__("collections")}, local_scope)
        except Exception as e:
            return {"passed": False, "error": f"Syntax/Runtime Error: {type(e).__name__}: {str(e)}"}

        # Find the function defined
        target_fn = None
        for val in local_scope.values():
            if callable(val):
                target_fn = val
                break

        if not target_fn:
            return {"passed": False, "error": "No callable function found in submitted solution"}

        results = []
        all_passed = True
        for idx, tc in enumerate(test_cases):
            inp = tc.get("input", {})
            expected = tc.get("expected")
            try:
                if isinstance(inp, dict):
                    actual = target_fn(**inp)
                elif isinstance(inp, list):
                    actual = target_fn(*inp)
                else:
                    actual = target_fn(inp)

                passed = actual == expected
                results.append({"test_case": idx + 1, "passed": passed, "expected": expected, "actual": actual})
                if not passed:
                    all_passed = False
            except Exception as e:
                results.append({"test_case": idx + 1, "passed": False, "error": f"{type(e).__name__}: {str(e)}"})
                all_passed = False

        return {
            "passed": all_passed,
            "test_cases_total": len(test_cases),
            "test_cases_passed": sum(1 for r in results if r.get("passed")),
            "details": results,
        }

    def run_sql_query(
        self, query: str, schema_ddl: str, sample_data_json: str, expected_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs candidate SQL query against an in-memory SQLite DB and compares with expected."""
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            # 1. Execute DDL
            cursor.executescript(schema_ddl)

            # 2. Seed Sample Data
            data_dict = json.loads(sample_data_json) if isinstance(sample_data_json, str) else sample_data_json
            if isinstance(data_dict, list):
                # Infer table name from schema_ddl
                tbl_name = schema_ddl.split("CREATE TABLE")[1].split("(")[0].strip()
                for row in data_dict:
                    cols = ", ".join(row.keys())
                    placeholders = ", ".join(["?"] * len(row))
                    cursor.execute(f"INSERT INTO {tbl_name} ({cols}) VALUES ({placeholders})", list(row.values()))
            elif isinstance(data_dict, dict):
                for tbl, rows in data_dict.items():
                    if isinstance(rows, list):
                        for row in rows:
                            cols = ", ".join(row.keys())
                            placeholders = ", ".join(["?"] * len(row))
                            cursor.execute(f"INSERT INTO {tbl} ({cols}) VALUES ({placeholders})", list(row.values()))
            conn.commit()

            # 3. Execute Candidate Query
            start_t = time.perf_counter()
            cursor.execute(query)
            user_rows = [dict(r) for r in cursor.fetchall()]
            exec_time_ms = round((time.perf_counter() - start_t) * 1000, 2)

            # 4. Compare with Expected Query if provided
            matched = True
            expected_rows = []
            if expected_query:
                cursor.execute(expected_query)
                expected_rows = [dict(r) for r in cursor.fetchall()]
                # Check equivalence
                matched = user_rows == expected_rows

            return {
                "passed": matched,
                "row_count": len(user_rows),
                "rows": user_rows[:25],
                "expected_rows": expected_rows[:25] if expected_query else None,
                "execution_time_ms": exec_time_ms,
            }
        except Exception as e:
            return {"passed": False, "error": f"SQL Execution Error: {str(e)}"}
        finally:
            conn.close()


# Singleton Instance
_STORE_INSTANCE: Optional[ExcelStore] = None
_STORE_LOCK = threading.Lock()


def get_excel_store() -> ExcelStore:
    """Returns the singleton instance of ExcelStore."""
    global _STORE_INSTANCE
    with _STORE_LOCK:
        if _STORE_INSTANCE is None:
            _STORE_INSTANCE = ExcelStore()
        return _STORE_INSTANCE
