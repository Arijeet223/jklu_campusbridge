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

        # Tool 4: query_student_context
        self.register_tool(
            ToolDefinition(
                name="query_student_context",
                description="Query the student's personal Qdrant knowledge base for verified skills, transcripts, coursework, and GitHub telemetry.",
                input_schema={
                    "type": "object",
                    "required": ["query"],
                    "properties": {
                        "query": {"type": "string", "description": "Semantic query text to search student knowledge base."},
                        "top_k": {"type": "integer", "description": "Max results to return.", "default": 4},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "student_id": {"type": "string"},
                        "results": {"type": "array"},
                        "count": {"type": "integer"},
                    },
                },
                required_roles=["STUDENT", "FACULTY", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_query_student_context,
            )
        )

    def _handle_query_student_context(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        """Fetch verified student context from Qdrant with actor_id enforcement."""
        query = str(args.get("query", "")).strip()
        top_k = int(args.get("top_k", 4))
        target_student_id = str(context.actor_id or "STU-101").strip()

        try:
            from rag.qdrant_service import get_qdrant_service
            qs = get_qdrant_service()
            hits = qs.query_student_context(student_id=target_student_id, query=query, top_k=top_k)
            return {
                "student_id": target_student_id,
                "results": hits,
                "count": len(hits),
            }
        except Exception as e:
            return {
                "student_id": target_student_id,
                "results": [],
                "count": 0,
                "error": str(e),
            }

    def _handle_get_my_profile(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        student_id = context.actor_id if context.actor_role == "STUDENT" else _PRIYA_ID
        entry = _STUDENTS_BY_ID.get(student_id)
        if not entry:
            # Fall back to Excel store if registered student in campusbridge_db.xlsx
            try:
                from backend.db.excel_store import get_excel_store, SHEET_STUDENTS
                store = get_excel_store()
                students = store.get_sheet(SHEET_STUDENTS)
                for s in students:
                    sid = str(s.get("student_id", ""))
                    email = str(s.get("email", "")).lower()
                    name = str(s.get("full_name", "")).lower()
                    target = str(student_id).lower()
                    if sid.lower() == target or email == target or name == target:
                        full_name = s.get("full_name", "Student")
                        return {
                            "student_id": sid or student_id,
                            "name": full_name,
                            "full_name": full_name,
                            "degree": "B.Tech",
                            "branch": s.get("program", "Computer Science"),
                            "program": s.get("program", "B.Tech CSE"),
                            "grad_year": int(s.get("cohort_year", 2026)),
                            "cgpa": float(s.get("cgpa", 8.42)),
                            "institution_id": context.institution_id or "NITK-SURATHKAL",
                            "privacy_shield": {
                                "posture": s.get("privacy_shield_mode", "STRICT_ANONYMOUS"),
                                "opted_in_recruiters_count": 2,
                                "allow_aggregate_analytics": True,
                            },
                        }
            except Exception:
                pass

            raise MCPValidationError(
                f"Student profile '{student_id}' does not exist.",
                "Ensure actor_id matches an enrolled student identifier.",
            )

        profile, _ = entry
        full_name = profile.get("name") or profile.get("full_name") or "Student"
        return {
            "student_id": student_id,
            "name": full_name,
            "full_name": full_name,
            "degree": profile.get("degree", "B.Tech"),
            "branch": profile.get("branch", "Computer Science"),
            "program": profile.get("program", "B.Tech CSE"),
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
            # Query Excel store fallback
            try:
                from backend.db.excel_store import get_excel_store, SHEET_EVIDENCE
                store = get_excel_store()
                all_ev = store.get_sheet(SHEET_EVIDENCE)
                status_filter = args.get("status_filter", "ALL")
                results = []
                for ev in all_ev:
                    sid = str(ev.get("student_id", ""))
                    if sid == str(student_id) or student_id in ("STU-101", "aarav.sharma@university.edu.in"):
                        tier = str(ev.get("tier", "2_STUDENT_CONFIRMED"))
                        clean_tier = tier.split("_", 1)[1] if "_" in tier and tier[0].isdigit() else tier
                        if status_filter != "ALL" and clean_tier != status_filter and tier != status_filter:
                            continue
                        results.append({
                            "id": str(ev.get("evidence_id")),
                            "skill_id": f"skill-{str(ev.get('skill_name')).lower().replace(' ', '-')}",
                            "skill_name": str(ev.get("skill_name")),
                            "proficiency_level": float(ev.get("multiplier", 0.8)),
                            "evidence_status": clean_tier,
                            "source_document_id": str(ev.get("source_doc", "resume-001")),
                            "source_span": {
                                "start_char": 0,
                                "end_char": 50,
                                "section_path": str(ev.get("source_span_text", "Skills")),
                            },
                            "extraction_confidence": float(ev.get("confidence", 0.9)),
                            "verified_by": str(ev.get("verified_by", "system")),
                        })
                if results:
                    return {
                        "student_id": student_id,
                        "evidence_count": len(results),
                        "evidence": results,
                    }
            except Exception:
                pass
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

