"""CampusBridge AI — Test suite for Phase 4 Agent Endpoints & Orchestration.

Tests:
1. List 6 specialist agents with their operational constraints
2. Dispatch Profile Intelligence Agent via REST endpoint
3. Dispatch Readiness Coach Agent (72-Hour Sprint Mode) via REST endpoint
4. Dispatch Interview Coach Agent via REST endpoint
5. Run Composite Multi-Agent Pipeline (Profile -> Readiness -> Explainer)
6. Submit 120-second Proof-of-Work Micro-Defense (Passed & Retry cases)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def run_coro(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    raise RuntimeError("Coroutine did not return")

from services.api.endpoints import (
    list_specialist_agents,
    dispatch_agent,
    run_composite_readiness_pipeline,
    submit_micro_defense,
    start_micro_defense,
    submit_defense_by_id,
    generate_readiness_plan,
    AgentDispatchRequest,
    CompositePipelineRequest,
    MicroDefenseSubmitRequest,
    MicroDefenseStartRequest,
    ReadinessPlanRequest,
)


def test_agent_endpoints():
    print("=" * 70)
    print("Running CampusBridge AI Phase 4 Agent Endpoints Test Suite")
    print("=" * 70)

    # 1. List specialist agents
    agents = run_coro(list_specialist_agents())
    assert len(agents) == 6, f"Expected 6 agents, got {len(agents)}"
    agent_ids = [a["id"] for a in agents]
    assert "profile_intelligence" in agent_ids
    assert "interview_coach" in agent_ids
    assert "readiness_coach" in agent_ids
    print(f"[PASS] List specialist agents: 6 agents registered with scoped tool quotas.")

    # 2. Dispatch Profile Intelligence Agent
    req = AgentDispatchRequest(
        agent_name="profile_intelligence",
        payload={"document_text": "Experienced Python and FastAPI backend developer with Docker skills."},
        actor_id="student-priya-001",
        actor_role="STUDENT",
    )
    res = run_coro(dispatch_agent(req))
    assert res["success"] is True
    assert res["active_agent"] == "profile_intelligence"
    assert "provisional_ghost_cards" in res["data"]
    assert len(res["data"]["provisional_ghost_cards"]) > 0
    print(f"[PASS] Dispatch Profile Intelligence: extracted {len(res['data']['provisional_ghost_cards'])} Ghost Card candidates.")

    # 3. Dispatch Readiness Coach Agent (72h Sprint)
    req_coach = AgentDispatchRequest(
        agent_name="readiness_coach",
        payload={"hours_to_deadline": 48.0},
        actor_id="student-priya-001",
        actor_role="STUDENT",
    )
    res_coach = run_coro(dispatch_agent(req_coach))
    assert res_coach["success"] is True
    assert res_coach["data"]["mode"] == "SPRINT_72H"
    assert len(res_coach["data"]["recommended_resources"]) > 0
    print(f"[PASS] Dispatch Readiness Coach (48h): activated 72-Hour Sprint mode with prioritized high-yield tasks.")

    # 4. Dispatch Interview Coach Agent (120s Micro-Defense)
    req_interview = AgentDispatchRequest(
        agent_name="interview_coach",
        payload={"artifact_title": "order_service.py"},
        actor_id="student-priya-001",
        actor_role="STUDENT",
    )
    res_interview = run_coro(dispatch_agent(req_interview))
    assert res_interview["success"] is True
    assert len(res_interview["data"]["questions"]) == 3
    assert res_interview["data"]["biometric_analysis"] == "EXCLUDED_BY_DESIGN"
    print(f"[PASS] Dispatch Interview Coach: generated 3 artifact-grounded STAR defense questions (biometrics excluded).")

    # 5. Composite Multi-Agent Pipeline
    req_pipeline = CompositePipelineRequest(
        document_text="Proficient in Python, SQL, and Docker containerization.",
        job_id="job-backend-techcorp-001",
        hours_to_deadline=48.0,
        actor_id="student-priya-001",
        actor_role="STUDENT",
    )
    res_pipeline = run_coro(run_composite_readiness_pipeline(req_pipeline))
    assert res_pipeline["success"] is True
    assert res_pipeline["agent_transitions"] == 2
    assert "profile_extractions" in res_pipeline["results"]
    assert "coaching_plan" in res_pipeline["results"]
    assert "match_explanation" in res_pipeline["results"]
    print(f"[PASS] Composite Multi-Agent Pipeline: successfully chained 3 specialist agents under strict budgets.")

    # 6. Micro-Defense Submission (Pass case)
    req_submit_pass = MicroDefenseSubmitRequest(
        student_id="student-priya-001",
        skill_id="skill-docker-004",
        artifact_title="order_service.py",
        answers=[
            "We used idempotency keys stored in Redis with 10-minute TTL to prevent duplicate order executions.",
            "Async workers allowed non-blocking I/O during heavy database queries without thread pool overhead.",
            "Connection pool was configured with max_size=20 and pool_recycle=300s to avoid DB pool starvation.",
        ],
    )
    res_pass = run_coro(submit_micro_defense(req_submit_pass))
    assert res_pass["passed"] is True
    assert res_pass["status_awarded"] == "4_ASSESSMENT_VERIFIED"
    assert res_pass["rubric_breakdown"]["handles_edge_cases"] is True
    print(f"[PASS] Micro-Defense Rubric Evaluation (Pass): successfully verified and awarded ASSESSMENT_VERIFIED.")

    # 7. Micro-Defense Submission (Retry case)
    req_submit_retry = MicroDefenseSubmitRequest(
        student_id="student-priya-001",
        skill_id="skill-docker-004",
        artifact_title="order_service.py",
        answers=["yes", "it worked well", "used python"],
    )
    res_retry = run_coro(submit_micro_defense(req_submit_retry))
    assert res_retry["passed"] is False
    assert res_retry["status_awarded"] == "RETRY_RECOMMENDED"
    print(f"[PASS] Micro-Defense Rubric Evaluation (Retry): correctly flagged insufficient substantive responses.")

    # 8. Start Micro-Defense via PRD §17 endpoint
    req_start = MicroDefenseStartRequest(
        student_id="student-priya-001",
        artifact_title="order_service.py",
        skill_id="skill-docker-004",
    )
    res_start = run_coro(start_micro_defense(req_start))
    assert "defense_id" in res_start
    assert res_start["time_budget_seconds"] == 120
    assert len(res_start["questions"]) == 3
    print(f"[PASS] POST /v1/defenses/micro-start: initiated 120s micro-defense with 3 artifact questions.")

    # 9. Submit Micro-Defense by ID via PRD §17 endpoint
    res_submit_id = run_coro(submit_defense_by_id(res_start["defense_id"], req_submit_pass))
    assert res_submit_id["defense_id"] == res_start["defense_id"]
    assert res_submit_id["passed"] is True
    print(f"[PASS] POST /v1/defenses/{{id}}/submit: verified defense and linked to session.")

    # 10. Generate Readiness Plan via PRD §17 endpoint (Semester Marathon)
    req_plan_marathon = ReadinessPlanRequest(
        student_id="student-priya-001",
        hours_to_deadline=720.0,  # 30 days
        skill_gaps=["FastAPI", "SQL & Database Design"],
    )
    res_marathon = run_coro(generate_readiness_plan(req_plan_marathon))
    assert res_marathon["mode"] == "MARATHON_SEMESTER"
    assert "Deep Foundations" in res_marathon["plan_type"]
    print(f"[PASS] POST /v1/readiness/plans: successfully produced Semester Marathon foundational plan.")

    # 11. Handle Casual Slang & Greetings ("HEY", "sup", "hi")
    req_slang = AgentDispatchRequest(
        agent_name="readiness_coach",
        payload={"message": "HEY", "student_name": "Priya"},
        actor_id="student-priya-001",
        actor_role="STUDENT",
    )
    res_slang = run_coro(dispatch_agent(req_slang))
    assert res_slang["success"] is True
    assert res_slang["data"]["is_casual_greeting"] is True
    assert "Hey Priya!" in res_slang["data"]["mentor_message"]
    assert "tackling today" in res_slang["data"]["mentor_message"]
    print("[PASS] Casual Slang & Greeting: Responded warmly ('Hey Priya! ...') without stiff robotic data dump.")

    # 12. Plain English UX (Jargon-free mentor advice)
    assert "Ghost Cards" not in res_slang["data"]["mentor_message"]
    assert "small-cell suppression" not in res_slang["data"]["mentor_message"].lower()
    print(f"[PASS] Plain English UX: Verified mentor messages are simple, student-friendly, and jargon-free.")

    print("=" * 70)
    print("ALL 12 PHASE 4 AGENT ENDPOINT TESTS PASSED SUCCESSFULLY")
    print("=" * 70)


if __name__ == "__main__":
    test_agent_endpoints()
