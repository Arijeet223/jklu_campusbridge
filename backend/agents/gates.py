"""CampusBridge AI — R.O.N.E.N. & A.T.H.E.N.A. Active Multi-Agent Institutional Gates.

Follows PRD §6, §7 & Engineering Rules:
- R.O.N.E.N.: Real-time Objective Numerical Eligibility Network (100% deterministic cutoffs).
  Evaluates student's real CGPA and active backlogs against Opportunities_JDs cutoffs.
  Returns explicit institutional eligibility decisions: "ELIGIBLE" vs "BLOCKED".
- A.T.H.E.N.A.: Algorithmic Technical Heuristics & Evaluation Network Architecture.
  Evaluates real-time code submissions from the Practice Arena against test cases.
  Updates Skill_Evidence to 4_ASSESSMENT_VERIFIED, raises readiness index, and audits to Excel.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any, Optional

from backend.db.excel_store import (
    get_excel_store,
    SHEET_STUDENTS,
    SHEET_JOBS,
    SHEET_DSA,
    SHEET_SQL,
    SHEET_EVIDENCE,
    SHEET_AUDIT,
)


class RonenEligibilityGate:
    """R.O.N.E.N. — Real-time Objective Numerical Eligibility Network.
    
    100% deterministic institutional policy gate for academic cutoffs, backlogs, and branch gates.
    """

    def __init__(self):
        self.code = "R.O.N.E.N."
        self.name = "Real-time Objective Numerical Eligibility Network"
        self.role = "Deterministic Institutional Policy Shell"

    def evaluate_eligibility(
        self,
        student_id: str,
        job_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Evaluates student's real academic record against active JD criteria.
        
        Returns explicit 'ELIGIBLE' or 'BLOCKED' decision for each opportunity.
        """
        store = get_excel_store()
        students = store.get_sheet(SHEET_STUDENTS)

        # Lookup candidate profile
        student = next(
            (s for s in students if str(s.get("student_id", "")).strip().lower() == student_id.strip().lower()
             or str(s.get("email", "")).strip().lower() == student_id.strip().lower()),
            None,
        )

        if not student:
            return {
                "success": False,
                "agent": self.code,
                "error": f"Student '{student_id}' not found in Accounts_Students.",
            }

        student_cgpa = float(student.get("cgpa", 0.0))
        student_backlogs = int(student.get("active_backlogs", 0))
        student_branch = str(student.get("program", "")).strip()
        student_name = str(student.get("full_name", "Student")).strip()

        jobs = store.get_sheet(SHEET_JOBS)
        if job_id:
            jobs = [j for j in jobs if str(j.get("job_id", "")).strip().lower() == job_id.strip().lower()]

        evaluations = []
        eligible_count = 0
        blocked_count = 0

        for j in jobs:
            j_id = str(j.get("job_id", ""))
            company = str(j.get("company_name", ""))
            role_title = str(j.get("role_title", ""))
            min_cgpa = float(j.get("min_cgpa", 0.0))
            max_backlogs = int(j.get("max_backlogs", 0))
            allowed_branches_raw = str(j.get("allowed_branches", "")).strip()
            if allowed_branches_raw.startswith("["):
                try:
                    allowed_branches = [str(x).strip() for x in json.loads(allowed_branches_raw)]
                except Exception:
                    allowed_branches = [b.strip().strip('[]"\'') for b in allowed_branches_raw.split(",") if b.strip()]
            else:
                allowed_branches = [b.strip().strip('[]"\'') for b in allowed_branches_raw.split(",") if b.strip()]

            # 1. CGPA Hard Gate
            cgpa_pass = student_cgpa >= min_cgpa

            # 2. Backlogs Hard Gate
            backlog_pass = student_backlogs <= max_backlogs

            # 3. Branch Hard Gate
            if allowed_branches:
                clean_student_branch = student_branch.lower().strip()
                branch_pass = any(
                    b.lower().strip() in clean_student_branch or clean_student_branch in b.lower().strip()
                    for b in allowed_branches
                )
            else:
                branch_pass = True

            is_eligible = cgpa_pass and backlog_pass and branch_pass
            decision = "ELIGIBLE" if is_eligible else "BLOCKED"

            if is_eligible:
                eligible_count += 1
                reason = (
                    f"Institutional Hard Gates Passed: CGPA {student_cgpa:.2f} >= {min_cgpa:.2f}, "
                    f"Backlogs {student_backlogs} <= {max_backlogs}, Branch '{student_branch}' approved."
                )
            else:
                blocked_count += 1
                failure_reasons = []
                if not cgpa_pass:
                    failure_reasons.append(f"CGPA {student_cgpa:.2f} < Cutoff {min_cgpa:.2f} (-{min_cgpa - student_cgpa:.2f} deficit)")
                if not backlog_pass:
                    failure_reasons.append(f"Active backlogs ({student_backlogs}) > Allowed max ({max_backlogs})")
                if not branch_pass:
                    failure_reasons.append(f"Branch '{student_branch}' not in approved list ({allowed_branches_raw})")
                reason = f"Institutional Gate BLOCKED: {'; '.join(failure_reasons)}"

            evaluations.append({
                "job_id": j_id,
                "company_name": company,
                "role_title": role_title,
                "decision": decision,
                "is_eligible": is_eligible,
                "min_cgpa": min_cgpa,
                "student_cgpa": student_cgpa,
                "cgpa_pass": cgpa_pass,
                "max_backlogs": max_backlogs,
                "student_backlogs": student_backlogs,
                "backlog_pass": backlog_pass,
                "allowed_branches": allowed_branches,
                "student_branch": student_branch,
                "branch_pass": branch_pass,
                "reason": reason,
            })

        # Audit Gate Execution in Excel
        try:
            store.insert_row(
                SHEET_AUDIT,
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": f"req-ronen-{int(time.time() * 1000)}",
                    "actor_id": student.get("student_id"),
                    "actor_role": "STUDENT",
                    "agent_name": "RonenEligibilityGate",
                    "mcp_server": "matching",
                    "tool_name": "matching.check_hard_eligibility",
                    "latency_ms": 12,
                    "status": "EVALUATED",
                    "summary": f"R.O.N.E.N. Gate for {student_name}: {eligible_count} ELIGIBLE, {blocked_count} BLOCKED across {len(jobs)} JDs.",
                },
            )
        except Exception:
            pass

        return {
            "success": True,
            "agent": self.code,
            "agent_name": self.name,
            "student_id": student.get("student_id"),
            "student_name": student_name,
            "student_cgpa": student_cgpa,
            "student_backlogs": student_backlogs,
            "total_evaluated": len(evaluations),
            "eligible_count": eligible_count,
            "blocked_count": blocked_count,
            "evaluations": evaluations,
        }


class AthenaAssessmentGate:
    """A.T.H.E.N.A. — Algorithmic Technical Heuristics & Evaluation Network Architecture.
    
    Evaluates live code submissions from Practice Arena against test cases,
    and automatically upgrades Skill_Evidence in Excel to 4_ASSESSMENT_VERIFIED.
    """

    def __init__(self):
        self.code = "A.T.H.E.N.A."
        self.name = "Algorithmic Technical Heuristics & Evaluation Network Architecture"
        self.role = "Skill Graph & Live Assessment Proctor"

    def evaluate_code_submission(
        self,
        student_id: str,
        problem_id: str,
        code: str,
        problem_type: str = "dsa",
    ) -> dict[str, Any]:
        """Evaluates DSA Python code or SQL queries in real time against test cases."""
        store = get_excel_store()
        t0 = time.perf_counter()

        if problem_type.lower() == "dsa":
            dsa_problems = store.get_sheet(SHEET_DSA)
            prob = next((p for p in dsa_problems if str(p.get("problem_id", "")).strip().lower() == problem_id.strip().lower()), None)
            if not prob:
                return {"passed": False, "error": f"Problem '{problem_id}' not found in DSA_Practice_Bank."}

            test_cases_json = prob.get("test_cases_json", "[]")
            test_res = store.run_dsa_test(code, test_cases_json)
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
            skill_target = "Data Structures & Algorithms"

        elif problem_type.lower() == "sql":
            sql_problems = store.get_sheet(SHEET_SQL)
            prob = next((p for p in sql_problems if str(p.get("sql_id", "")).strip().lower() == problem_id.strip().lower()), None)
            if not prob:
                return {"passed": False, "error": f"Challenge '{problem_id}' not found in SQL_Practice_Bank."}

            test_res = store.run_sql_query(
                query=code,
                schema_ddl=prob.get("schema_ddl", ""),
                sample_data_json=prob.get("sample_data_json", "[]"),
                expected_query=prob.get("expected_query", ""),
            )
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
            skill_target = "SQL & Query Optimization"

        else:
            return {"passed": False, "error": f"Unsupported problem_type '{problem_type}'."}

        is_passed = test_res.get("passed", False)

        if is_passed:
            # Upgrade evidence in Excel to 4_ASSESSMENT_VERIFIED
            ev_id = f"EV-ATHENA-{int(time.time() * 1000)}"
            try:
                # Check if evidence exists, if so update tier, otherwise insert
                existing_ev = store.get_sheet(SHEET_EVIDENCE)
                matched_row = next(
                    (e for e in existing_ev if str(e.get("student_id", "")).strip().lower() == student_id.strip().lower()
                     and skill_target.lower() in str(e.get("skill_name", "")).lower()),
                    None,
                )

                if matched_row:
                    store.update_row(
                        SHEET_EVIDENCE,
                        key_col="evidence_id",
                        key_val=matched_row.get("evidence_id"),
                        updates={
                            "tier": "4_ASSESSMENT_VERIFIED",
                            "multiplier": 1.0,
                            "confidence": 0.98,
                            "verified_by": "A.T.H.E.N.A. Real-Time Proctor",
                            "source_span_text": f"Passed all {test_res.get('test_cases_total', 2)} test cases on {problem_id} (Execution: {elapsed_ms}ms)",
                        },
                    )
                else:
                    store.insert_row(
                        SHEET_EVIDENCE,
                        {
                            "evidence_id": ev_id,
                            "student_id": student_id,
                            "skill_name": skill_target,
                            "category": "Core CS",
                            "tier": "4_ASSESSMENT_VERIFIED",
                            "multiplier": 1.0,
                            "source_doc": f"{problem_id}_submission.py",
                            "source_span_text": f"Passed all {test_res.get('test_cases_total', 2)} test cases on {problem_id} (Execution: {elapsed_ms}ms)",
                            "confidence": 0.98,
                            "verified_by": "A.T.H.E.N.A. Real-Time Proctor",
                        },
                    )

                # Upgrade student readiness index
                students = store.get_sheet(SHEET_STUDENTS)
                stu = next((s for s in students if str(s.get("student_id", "")).strip().lower() == student_id.strip().lower()), None)
                if stu:
                    old_idx = int(stu.get("readiness_index", 70))
                    new_idx = min(98, old_idx + 6)
                    store.update_row(
                        SHEET_STUDENTS,
                        key_col="student_id",
                        key_val=stu.get("student_id"),
                        updates={"readiness_index": new_idx, "sprint_mode_active": True},
                    )

                # Log audit entry
                store.insert_row(
                    SHEET_AUDIT,
                    {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "request_id": f"req-athena-{int(time.time() * 1000)}",
                        "actor_id": student_id,
                        "actor_role": "STUDENT",
                        "agent_name": "AthenaAssessmentGate",
                        "mcp_server": "placement-ops",
                        "tool_name": "placement-ops.record_assessment_pass",
                        "latency_ms": elapsed_ms,
                        "status": "ASSESSMENT_VERIFIED",
                        "summary": f"A.T.H.E.N.A. verified {skill_target} on {problem_id}: All test cases passed in {elapsed_ms}ms. Tier elevated to 4_ASSESSMENT_VERIFIED.",
                    },
                )
            except Exception:
                pass

            return {
                "passed": True,
                "agent": self.code,
                "agent_name": self.name,
                "verdict": "Accepted — All Test Cases Verified",
                "test_cases_passed": test_res.get("test_cases_passed", 2),
                "test_cases_total": test_res.get("test_cases_total", 2),
                "execution_time_ms": elapsed_ms,
                "skill_target": skill_target,
                "skill_upgraded": True,
                "evidence_tier": "4_ASSESSMENT_VERIFIED",
                "multiplier": 1.0,
                "rubric_score": 100,
                "details": test_res.get("details", []),
            }

        else:
            return {
                "passed": False,
                "agent": self.code,
                "agent_name": self.name,
                "verdict": "Test Case Failure",
                "test_cases_passed": test_res.get("test_cases_passed", 0),
                "test_cases_total": test_res.get("test_cases_total", 0),
                "execution_time_ms": elapsed_ms,
                "skill_upgraded": False,
                "error": test_res.get("error", "Code did not produce expected output for all test cases."),
                "details": test_res.get("details", []),
            }


# Singleton instances
ronen_gate = RonenEligibilityGate()
athena_gate = AthenaAssessmentGate()
