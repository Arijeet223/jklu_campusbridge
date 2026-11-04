"""CampusBridge AI — Placement Operations MCP Server.

Provides tools:
1. list_my_applications: List active student applications and stage transitions.
2. create_study_task: Add action item to 72h Sprint or Marathon preparation plan.
3. record_human_review: Record placement officer approval or exception override with reason code.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from mcp.servers.base import (
    BaseMCPServer,
    MCPAuthorizationError,
    MCPValidationError,
    SecurityContext,
    ToolDefinition,
)
from domain.mock_db import _PRIYA_ID

# In-memory storage for student applications, tasks, and audit review decisions
_APPLICATIONS_STORE = [
    {
        "application_id": "app-001",
        "student_id": _PRIYA_ID,
        "job_id": "job-backend-techcorp-001",
        "job_title": "Backend Engineer Intern",
        "company": "FinStack Technologies",
        "stage": "APPLIED_ELIGIBLE",
        "applied_at": "2026-10-29T14:00:00Z",
    },
    {
        "application_id": "app-002",
        "student_id": _PRIYA_ID,
        "job_id": "job-fullstack-innovateco-002",
        "job_title": "Full-Stack Developer",
        "company": "NovaPay Solutions",
        "stage": "SHORTLISTED_FOR_ROUND_1",
        "applied_at": "2026-10-27T09:30:00Z",
    },
]

_STUDY_TASKS_STORE: list[dict[str, Any]] = [
    {
        "task_id": "task-01",
        "student_id": _PRIYA_ID,
        "title": "Pass 120s Proof-of-Work Micro-Defense on order-service.py",
        "mode": "SPRINT_72H",
        "priority": "HIGH",
        "completed": False,
    }
]

_OFFICER_REVIEWS_STORE: list[dict[str, Any]] = []


class PlacementOpsServer(BaseMCPServer):
    """MCP server for student workflow operations and placement officer review records."""

    def __init__(self):
        super().__init__(
            name="placement-ops",
            description="Manages student application workflows, sprint study tasks, and placement officer reviews.",
        )
        self._register_all_tools()

    def _register_all_tools(self) -> None:
        self.register_tool(
            ToolDefinition(
                name="list_my_applications",
                description="List the active applications and placement pipeline milestones for the authenticated student.",
                input_schema={"type": "object", "properties": {}},
                output_schema={
                    "type": "object",
                    "properties": {
                        "student_id": {"type": "string"},
                        "total_applications": {"type": "integer"},
                        "applications": {"type": "array"},
                    },
                },
                required_roles=["STUDENT", "PLACEMENT_OFFICER", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_list_my_applications,
            )
        )

        self.register_tool(
            ToolDefinition(
                name="create_study_task",
                description="Add an actionable prep task into the student's 72-Hour Drive Sprint or Semester Marathon checklist.",
                input_schema={
                    "type": "object",
                    "required": ["title", "mode"],
                    "properties": {
                        "title": {"type": "string", "description": "Action title e.g. 'Complete SQL Indexing Rubric'."},
                        "mode": {"type": "string", "enum": ["SPRINT_72H", "MARATHON_SEMESTER"], "default": "SPRINT_72H"},
                        "priority": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"], "default": "HIGH"},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string"},
                        "title": {"type": "string"},
                        "status": {"type": "string"},
                    },
                },
                required_roles=["STUDENT", "FACULTY_MENTOR", "ADMIN"],
                read_only=False,
                rate_limit_per_minute=20,
                timeout_seconds=5.0,
                handler=self._handle_create_study_task,
            )
        )

        self.register_tool(
            ToolDefinition(
                name="record_human_review",
                description="Record an official placement officer adjudication or eligibility exception override with mandatory reason code.",
                input_schema={
                    "type": "object",
                    "required": ["decision", "reason_code", "target_entity_id"],
                    "properties": {
                        "target_entity_id": {"type": "string", "description": "Application, dispute, or job ID."},
                        "decision": {"type": "string", "enum": ["APPROVED", "REJECTED", "OVERRIDE_GRANTED"]},
                        "reason_code": {
                            "type": "string",
                            "enum": [
                                "EQUIVALENCE_APPROVED",
                                "TRANSCRIPT_VERIFIED",
                                "RECRUITER_POLICY_WAIVER",
                                "INSUFFICIENT_DOCUMENTATION",
                            ],
                        },
                        "notes": {"type": "string", "default": ""},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "review_id": {"type": "string"},
                        "recorded_at": {"type": "string"},
                        "status": {"type": "string"},
                    },
                },
                required_roles=["PLACEMENT_OFFICER", "ADMIN"],
                read_only=False,
                rate_limit_per_minute=10,
                timeout_seconds=10.0,
                handler=self._handle_record_human_review,
            )
        )

    def _handle_list_my_applications(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        student_id = context.actor_id if context.actor_role == "STUDENT" else _PRIYA_ID
        user_apps = [a for a in _APPLICATIONS_STORE if a["student_id"] == student_id]
        return {
            "student_id": student_id,
            "total_applications": len(user_apps),
            "applications": user_apps,
        }

    def _handle_create_study_task(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        student_id = context.actor_id if context.actor_role == "STUDENT" else _PRIYA_ID
        title = args.get("title")
        if not title:
            raise MCPValidationError("Task title cannot be empty.")

        task = {
            "task_id": str(uuid.uuid4()),
            "student_id": student_id,
            "title": title,
            "mode": args.get("mode", "SPRINT_72H"),
            "priority": args.get("priority", "HIGH"),
            "completed": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _STUDY_TASKS_STORE.append(task)

        return {
            "task_id": task["task_id"],
            "title": task["title"],
            "status": "CREATED_IN_STUDY_PLAN",
        }

    def _handle_record_human_review(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        review = {
            "review_id": str(uuid.uuid4()),
            "officer_id": context.actor_id,
            "institution_id": context.institution_id,
            "target_entity_id": args.get("target_entity_id"),
            "decision": args.get("decision"),
            "reason_code": args.get("reason_code"),
            "notes": args.get("notes", ""),
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
        _OFFICER_REVIEWS_STORE.append(review)

        return {
            "review_id": review["review_id"],
            "recorded_at": review["recorded_at"],
            "status": "AUDITED_REVIEW_COMMITTED",
        }

