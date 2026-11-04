"""CampusBridge AI — Student Profile MCP Server.

Provides tools:
1. get_my_profile: Read authenticated student's profile & Privacy Shield settings.
2. list_my_evidence: Read evidence records, tiers, and source spans.
3. propose_profile_update: Write provisional Ghost Card extraction (EXTRACTED tier).
"""

from __future__ import annotations

import uuid
from typing import Any

from domain.models import EvidenceStatus, SkillEvidence, SourceSpan
from mcp.servers.base import (
    BaseMCPServer,
    MCPAuthorizationError,
    MCPValidationError,
    SecurityContext,
    ToolDefinition,
)
from domain.mock_db import _STUDENTS_BY_ID, _PRIYA_ID


class StudentProfileServer(BaseMCPServer):
    """MCP server for student profile and evidence inspection."""

    def __init__(self):
        super().__init__(
            name="student-profile",
            description="Manages student profiles, privacy settings, and provisional skill evidence.",
        )
        self._register_all_tools()

    def _register_all_tools(self) -> None:
        # Tool 1: get_my_profile
        self.register_tool(
            ToolDefinition(
                name="get_my_profile",
                description="Read authenticated student's structured profile, degree standing, and Privacy Shield settings.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "include_preferences": {
                            "type": "boolean",
                            "description": "Whether to include career preference details.",
                            "default": True,
                        }
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "student_id": {"type": "string"},
                        "name": {"type": "string"},
                        "degree": {"type": "string"},
                        "cgpa": {"type": "number"},
                        "privacy_shield": {"type": "object"},
                    },
                },
                required_roles=["STUDENT", "PLACEMENT_OFFICER", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_get_my_profile,
            )
        )

        # Tool 2: list_my_evidence
        self.register_tool(
            ToolDefinition(
                name="list_my_evidence",
                description="List all skill evidence items, 6-tier status, confidence scores, and source document spans for the authenticated student.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "status_filter": {
                            "type": "string",
                            "enum": [
                                "ALL",
                                "EXTRACTED",
                                "STUDENT_CONFIRMED",
                                "ARTIFACT_LINKED",
                                "ASSESSMENT_VERIFIED",
                                "INSTITUTION_VERIFIED",
                                "EXPIRED",
                            ],
                            "default": "ALL",
                        }
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "student_id": {"type": "string"},
                        "evidence_count": {"type": "integer"},
                        "evidence": {"type": "array"},
                    },
                },
                required_roles=["STUDENT", "PLACEMENT_OFFICER", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_list_my_evidence,
            )
        )

        # Tool 3: propose_profile_update
        self.register_tool(
            ToolDefinition(
                name="propose_profile_update",
                description="Propose a new AI-extracted skill claim. Creates a provisional Ghost Card (EXTRACTED status) that requires student confirmation.",
                input_schema={
                    "type": "object",
                    "required": ["skill_name", "source_document_id", "source_span"],
                    "properties": {
                        "skill_name": {"type": "string", "description": "Canonical name of the skill."},
                        "proficiency_level": {"type": "number", "description": "Proficiency 0.0 to 1.0.", "default": 0.8},
                        "source_document_id": {"type": "string", "description": "Document ID where skill was found."},
                        "source_span": {
                            "type": "object",
                            "required": ["start_char", "end_char"],
                            "properties": {
                                "start_char": {"type": "integer"},
                                "end_char": {"type": "integer"},
                                "section_path": {"type": "string", "default": "Skills"},
                            },
                        },
                        "extraction_confidence": {"type": "number", "default": 0.90},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "evidence_id": {"type": "string"},
                        "status": {"type": "string"},
                        "message": {"type": "string"},
                    },
                },
                required_roles=["STUDENT", "ADMIN"],
                read_only=False,
                rate_limit_per_minute=10,
                timeout_seconds=10.0,
                handler=self._handle_propose_profile_update,
            )
        )

    def _handle_get_my_profile(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        student_id = context.actor_id if context.actor_role == "STUDENT" else _PRIYA_ID
        entry = _STUDENTS_BY_ID.get(student_id)
        if not entry:
            raise MCPValidationError(
                f"Student profile '{student_id}' does not exist.",
                "Ensure actor_id matches an enrolled student identifier.",
            )

        profile, _ = entry
        return {
            "student_id": student_id,
            "name": profile.get("name", "Student"),
            "degree": profile.get("degree", "B.Tech"),
            "branch": profile.get("branch", "Computer Science"),
            "grad_year": profile.get("grad_year", 2027),
            "cgpa": profile.get("cgpa", 8.0),
            "institution_id": context.institution_id,
            "privacy_shield": {
                "posture": "PRIVATE_BY_DEFAULT",
                "opted_in_recruiters_count": 2,
                "allow_aggregate_analytics": True,
            },
        }

    def _handle_list_my_evidence(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        student_id = context.actor_id if context.actor_role == "STUDENT" else _PRIYA_ID
        entry = _STUDENTS_BY_ID.get(student_id)
        if not entry:
            return {"student_id": student_id, "evidence_count": 0, "evidence": []}

        _, evidences = entry
        status_filter = args.get("status_filter", "ALL")

        results = []
        for ev in evidences:
            if status_filter != "ALL" and ev.evidence_status.value != status_filter:
                continue
            results.append({
                "id": str(ev.id),
                "skill_id": ev.skill_id,
                "skill_name": ev.skill_name,
                "proficiency_level": ev.proficiency_level,
                "evidence_status": ev.evidence_status.value,
                "source_document_id": ev.source_document_id,
                "source_span": {
                    "start_char": ev.source_span.start_char,
                    "end_char": ev.source_span.end_char,
                    "section_path": ev.source_span.section_path,
                },
                "extraction_confidence": float(ev.extraction_confidence or 0.9),
                "verified_by": ev.verified_by,
            })

        return {
            "student_id": student_id,
            "evidence_count": len(results),
            "evidence": results,
        }

    def _handle_propose_profile_update(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        student_id = context.actor_id if context.actor_role == "STUDENT" else _PRIYA_ID
        entry = _STUDENTS_BY_ID.get(student_id)
        if not entry:
            raise MCPValidationError(f"Student profile '{student_id}' not found.")

        skill_name = args.get("skill_name")
        if not skill_name:
            raise MCPValidationError("Missing required parameter 'skill_name'.")

        span_data = args.get("source_span", {})
        span = SourceSpan(
            start_char=int(span_data.get("start_char", 0)),
            end_char=int(span_data.get("end_char", 0)),
            section_path=span_data.get("section_path", "Skills"),
        )

        new_ev = SkillEvidence(
            id=uuid.uuid4(),
            student_user_id=student_id,
            skill_id=f"skill-{skill_name.lower().replace(' ', '-')}",
            skill_name=skill_name,
            proficiency_level=float(args.get("proficiency_level", 0.8)),
            source_document_id=args.get("source_document_id", "manual-proposal"),
            source_span=span,
            evidence_status=EvidenceStatus.EXTRACTED,  # Ghost Card
            extraction_confidence=float(args.get("extraction_confidence", 0.90)),
        )

        entry[1].append(new_ev)

        return {
            "evidence_id": str(new_ev.id),
            "skill_name": new_ev.skill_name,
            "status": "EXTRACTED",
            "message": "Provisional Ghost Card created. Student confirmation required before score inclusion.",
        }

