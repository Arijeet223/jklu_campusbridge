"""Tests for CampusBridge AI Excel Two-Way Store & Practice Arena."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from backend.db.excel_store import (
    SHEET_DSA,
    SHEET_EVIDENCE,
    SHEET_SQL,
    SHEET_STUDENTS,
    get_excel_store,
)
from services.api.main import app

client = TestClient(app)


def test_excel_store_initialization():
    store = get_excel_store()
    stats = store.get_db_stats()
    assert stats["sync_cache_healthy"] is True
    assert stats["total_rows"] >= 50
    assert "Accounts_Students" in stats["sheet_counts"]
    assert "DSA_Practice_Bank" in stats["sheet_counts"]
    assert "SQL_Practice_Bank" in stats["sheet_counts"]


def test_export_and_stats_endpoint():
    res = client.get("/v1/admin/export-excel")
    assert res.status_code == 200
    assert len(res.content) > 1000

    res_stats = client.get("/v1/admin/db-stats")
    assert res_stats.status_code == 200
    data = res_stats.json()
    assert data["total_rows"] >= 50


def test_dsa_runner_and_skill_upgrade():
    # Fetch problem DSA-01
    res = client.get("/v1/practice/dsa")
    assert res.status_code == 200
    problems = res.json()
    assert len(problems) >= 12

    # Run solution
    code = """def max_allowed_webhooks(timestamps: list[int], W: int, K: int) -> int:
    accepted = []
    total_processed = 0
    for t in timestamps:
        accepted = [x for x in accepted if t - x < W]
        if len(accepted) < K:
            accepted.append(t)
            total_processed += 1
    return total_processed
"""
    run_res = client.post(
        "/v1/practice/dsa/run",
        json={"student_id": "STU-101", "problem_id": "DSA-01", "code": code},
    )
    assert run_res.status_code == 200
    res_data = run_res.json()
    assert res_data["passed"] is True
    assert res_data["skill_upgraded"] is True


def test_sql_runner_and_skill_upgrade():
    res = client.get("/v1/practice/sql")
    assert res.status_code == 200
    challenges = res.json()
    assert len(challenges) >= 5

    # Run query for SQL-01
    sql = "WITH Ranked AS (SELECT department, student_id, company, ctc_lpa, DENSE_RANK() OVER (PARTITION BY department ORDER BY ctc_lpa DESC) as rnk FROM placement_offers) SELECT department, student_id, company, ctc_lpa, rnk FROM Ranked WHERE rnk <= 2 ORDER BY department, rnk;"
    run_res = client.post(
        "/v1/practice/sql/run",
        json={"student_id": "STU-101", "sql_id": "SQL-01", "query": sql},
    )
    assert run_res.status_code == 200
    res_data = run_res.json()
    assert res_data["passed"] is True
    assert res_data["skill_upgraded"] is True


def test_account_registration_and_disputes():
    # Register student
    reg_res = client.post(
        "/v1/auth/register-student",
        json={
            "full_name": "Karan Mehra",
            "email": "karan.m@university.edu.in",
            "roll_no": "22BCON311",
            "program": "B.Tech CSE",
            "cgpa": 8.1,
            "target_roles": ["Backend Engineer"],
        },
    )
    assert reg_res.status_code == 200
    assert reg_res.json()["status"] == "SUCCESS"

    # Disputes
    disp_res = client.get("/v1/disputes")
    assert disp_res.status_code == 200
    assert len(disp_res.json()) >= 1


def test_diagnostics_panel_endpoint():
    res = client.get("/v1/diagnostics/system-health")
    assert res.status_code == 200
    health = res.json()
    assert health["status"] == "HEALTHY"
    assert "excel_db" in health
    assert "llm" in health
    assert "mcp_gateway" in health


if __name__ == "__main__":
    test_excel_store_initialization()
    print("[PASS] Excel Store Initialization & Seeding")
    test_export_and_stats_endpoint()
    print("[PASS] Export & Stats API Endpoints")
    test_dsa_runner_and_skill_upgrade()
    print("[PASS] DSA Practice Runner & Skill Upgrade")
    test_sql_runner_and_skill_upgrade()
    print("[PASS] SQL Practice Runner & Skill Upgrade")
    test_account_registration_and_disputes()
    print("[PASS] Account Registration & Disputes")
    test_diagnostics_panel_endpoint()
    print("[PASS] System Health & Diagnostics API")
    print("ALL EXCEL & PRACTICE ARENA TESTS PASSED!")
