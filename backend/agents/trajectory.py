"""CampusBridge AI — Agent 5: Trajectory & Curated Curriculum Recommender.

Follows PRD §7.2, §8.3 & Engineering Rules:
- Constructs high-yield, personalized milestone trajectories (Adaptive 72h Sprint vs Semester Marathon).
- Maps identified skill gaps to concrete DSA problems, SQL challenges, and 120s Micro-Defense topics.
- Projects dynamic readiness index elevation upon quest completions.
- Logs telemetry and execution audit directly to data/campusbridge_db.xlsx (MCP_Audit_Logs).
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Optional

from backend.db.excel_store import (
    get_excel_store,
    SHEET_STUDENTS,
    SHEET_JOBS,
    SHEET_DSA,
    SHEET_SQL,
    SHEET_AUDIT,
)
from backend.agents.gap_analyzer import gap_analyzer


class TrajectoryCurator:
    """Agent 5 — Trajectory & Curated Curriculum Recommender."""

    def __init__(self):
        self.code = "AGENT-5"
        self.name = "Trajectory & Curated Curriculum Recommender"
        self.role = "Dynamic Milestone & Curriculum Roadmapping Engine"

    def generate_trajectory(
        self,
        student_id: str,
        job_id: Optional[str] = None,
        timeline_mode: str = "72h_sprint",
    ) -> dict[str, Any]:
        """Synthesizes a sequenced, high-impact curriculum based on active gaps."""
        t0 = time.perf_counter()
        store = get_excel_store()

        # Step 1: Run diagnostic gap analysis
        gap_report = gap_analyzer.analyze_gaps(student_id=student_id, job_id=job_id)
        if not gap_report.get("success"):
            return {
                "success": False,
                "agent": self.code,
                "error": gap_report.get("error", "Gap analysis failed."),
            }

        primary = gap_report.get("primary_analysis") or {}
        student_name = gap_report.get("student_name", "Student")
        company_name = primary.get("company_name", "Target Opportunity")
        role_title = primary.get("role_title", "Software Engineer")
        skills_breakdown = primary.get("skills_breakdown", {})

        missing_mand = skills_breakdown.get("missing_mandatory", [])
        unconfirmed_mand = skills_breakdown.get("unconfirmed_mandatory", [])
        missing_pref = skills_breakdown.get("missing_preferred", [])

        # Fetch live practice banks
        dsa_bank = store.get_sheet(SHEET_DSA)
        sql_bank = store.get_sheet(SHEET_SQL)

        # Match missing skills to practice bank
        recommended_dsa_quests = []
        recommended_sql_quests = []
        micro_defense_topics = []

        all_gaps = missing_mand + [item["skill"] for item in unconfirmed_mand] + missing_pref

        # DSA matching
        for prob in dsa_bank:
            prob_title = str(prob.get("title", ""))
            prob_id = str(prob.get("problem_id", ""))
            prob_diff = str(prob.get("difficulty", "Medium"))
            topics = str(prob.get("topic_tags", "")).lower()

            matches = any(g.lower() in topics or any(w in topics for w in g.lower().split() if len(w) > 3) for g in all_gaps)
            if matches or len(recommended_dsa_quests) < 2:
                recommended_dsa_quests.append({
                    "problem_id": prob_id,
                    "title": prob_title,
                    "difficulty": prob_diff,
                    "target_skill": "Data Structures & Algorithms",
                    "action_url": f"/student/arena?problem={prob_id}",
                    "potential_readiness_gain": 8,
                })
                if len(recommended_dsa_quests) >= 3:
                    break

        # SQL matching
        for chal in sql_bank:
            chal_title = str(chal.get("title", ""))
            chal_id = str(chal.get("sql_id", ""))
            chal_diff = str(chal.get("difficulty", "Medium"))
            recommended_sql_quests.append({
                "sql_id": chal_id,
                "title": chal_title,
                "difficulty": chal_diff,
                "target_skill": "SQL & Query Optimization",
                "action_url": f"/student/arena?challenge={chal_id}",
                "potential_readiness_gain": 6,
            })
            if len(recommended_sql_quests) >= 2:
                break

        # Micro-Defense Prompts
        for item in unconfirmed_mand:
            sk = item["skill"]
            micro_defense_topics.append({
                "skill": sk,
                "duration_seconds": 120,
                "prompt": f"Explain your production implementation of {sk}, detailing performance bottlenecks and architectural choices.",
                "potential_readiness_gain": 5,
            })

        # Milestone Plan Structure
        if timeline_mode == "72h_sprint":
            milestones = [
                {
                    "day": 1,
                    "title": "Day 1: Instant Verification & Core Foundations",
                    "objectives": [
                        "Confirm all extracted Ghost Cards in Profile Hub",
                        f"Solve foundational DSA quest: {recommended_dsa_quests[0]['title'] if recommended_dsa_quests else 'DSA Challenge'}",
                    ],
                    "target_hours": 3.0,
                    "estimated_gain_pct": 10,
                },
                {
                    "day": 2,
                    "title": "Day 2: Technical Mastery & Query Optimization",
                    "objectives": [
                        f"Pass Athena assessment for {recommended_sql_quests[0]['title'] if recommended_sql_quests else 'SQL Sandbox'}",
                        "Upload and link project code repo artifact to elevate tier to ARTIFACT_LINKED",
                    ],
                    "target_hours": 3.5,
                    "estimated_gain_pct": 12,
                },
                {
                    "day": 3,
                    "title": "Day 3: 120s Viva Defenses & Final Readiness Check",
                    "objectives": [
                        "Complete 120s Micro-Defense Viva with J.A.R.V.I.S.",
                        f"Run What-If Sandbox simulation to verify 90%+ alignment for {company_name}",
                    ],
                    "target_hours": 2.5,
                    "estimated_gain_pct": 8,
                },
            ]
        else:
            milestones = [
                {
                    "week": 1,
                    "title": "Week 1: Algorithmic Rigor & Data Structures",
                    "objectives": ["Complete top 5 DSA problems", "Verify 4 core CS competencies"],
                    "target_hours": 10.0,
                    "estimated_gain_pct": 15,
                },
                {
                    "week": 2,
                    "title": "Week 2: Database Design & Distributed Systems",
                    "objectives": ["Master SQL joins, indexes, and schema design", "Pass database test harness"],
                    "target_hours": 10.0,
                    "estimated_gain_pct": 15,
                },
            ]

        total_projected_gain = sum(m.get("estimated_gain_pct", 0) for m in milestones)
        current_readiness = primary.get("overall_readiness_pct", 70)
        projected_readiness = min(98, current_readiness + total_projected_gain)

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Audit Trajectory Creation in Excel
        try:
            store.insert_row(
                SHEET_AUDIT,
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": f"req-traj-{int(time.time() * 1000)}",
                    "actor_id": student_id,
                    "actor_role": "STUDENT",
                    "agent_name": "TrajectoryCurator",
                    "mcp_server": "placement-ops",
                    "tool_name": "placement-ops.create_study_task",
                    "latency_ms": elapsed_ms,
                    "status": "GENERATED",
                    "summary": f"Curated {timeline_mode} for {student_name} ({company_name} - {role_title}): +{total_projected_gain}% projected gain in {elapsed_ms}ms.",
                },
            )
        except Exception:
            pass

        return {
            "success": True,
            "agent": self.code,
            "agent_name": self.name,
            "student_id": student_id,
            "student_name": student_name,
            "target_role": f"{role_title} at {company_name}",
            "timeline_mode": timeline_mode,
            "current_readiness_pct": current_readiness,
            "projected_readiness_pct": projected_readiness,
            "potential_gain_pct": total_projected_gain,
            "milestones": milestones,
            "recommended_dsa_quests": recommended_dsa_quests,
            "recommended_sql_quests": recommended_sql_quests,
            "micro_defense_topics": micro_defense_topics,
            "execution_time_ms": elapsed_ms,
        }


# Global singleton instance
trajectory_curator = TrajectoryCurator()

