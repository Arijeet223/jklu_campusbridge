"""CampusBridge AI — Job Intelligence MCP Server.

Provides tools:
1. get_approved_job: Read officer-approved JD criteria and metadata.
2. draft_job_requirements: Parse raw JD into structured criteria drafts with source spans.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

from mcp.servers.base import (
    BaseMCPServer,
    MCPAuthorizationError,
    MCPValidationError,
    SecurityContext,
    ToolDefinition,
)
from domain.mock_db import _JOBS, _JOB_BACKEND, _JOB_FULLSTACK


class JobIntelligenceServer(BaseMCPServer):
    """MCP server for structured job descriptions and recruiter criteria parsing."""

    def __init__(self):
        super().__init__(
            name="job-intelligence",
            description="Accesses approved job opportunities and drafts structured JD requirements.",
        )
        self._register_all_tools()

    def _register_all_tools(self) -> None:
        self.register_tool(
            ToolDefinition(
                name="get_approved_job",
                description="Fetch an officer-approved job opportunity with its mandatory and preferred criteria.",
                input_schema={
                    "type": "object",
                    "required": ["job_id"],
                    "properties": {
                        "job_id": {"type": "string", "description": "Job identifier e.g. 'job-backend-techcorp-001'."},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "job_id": {"type": "string"},
                        "title": {"type": "string"},
                        "mandatory_requirements": {"type": "array"},
                        "preferred_requirements": {"type": "array"},
                    },
                },
                required_roles=["STUDENT", "PLACEMENT_OFFICER", "RECRUITER", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_get_approved_job,
            )
        )

        self.register_tool(
            ToolDefinition(
                name="draft_job_requirements",
                description="Parse raw JD text into structured draft criteria with source spans. Restricted to placement officers and admins.",
                input_schema={
                    "type": "object",
                    "required": ["raw_description", "company_name", "job_title"],
                    "properties": {
                        "company_name": {"type": "string"},
                        "job_title": {"type": "string"},
                        "raw_description": {"type": "string", "description": "Raw text of the recruiter JD."},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "draft_id": {"type": "string"},
                        "status": {"type": "string"},
                        "extracted_mandatory": {"type": "array"},
                        "extracted_preferred": {"type": "array"},
                    },
                },
                required_roles=["PLACEMENT_OFFICER", "ADMIN"],
                read_only=False,
                rate_limit_per_minute=20,
                timeout_seconds=10.0,
                handler=self._handle_draft_job_requirements,
            )
        )

    def _handle_get_approved_job(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        job_id = args.get("job_id")
        reqs = _JOBS.get(job_id)
        if not reqs:
            raise MCPValidationError(
                f"Job posting '{job_id}' not found.",
                f"Valid job IDs: {list(_JOBS.keys())}",
            )

        mandatory = []
        preferred = []
        for r in reqs:
            item = {
                "id": str(r.id),
                "category": r.category.value,
                "description": r.description,
                "weight": r.weight,
                "rule_expression": r.rule_expression,
            }
            if r.requirement_type.value == "MANDATORY":
                mandatory.append(item)
            else:
                preferred.append(item)

        title = "Backend Engineer Intern" if job_id == _JOB_BACKEND else "Full-Stack Developer"
        return {
            "job_id": job_id,
            "title": title,
            "status": "APPROVED",
            "mandatory_requirements": mandatory,
            "preferred_requirements": preferred,
        }

    def _handle_draft_job_requirements(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        raw_text = args.get("raw_description", "")
        if len(raw_text.strip()) < 20:
            raise MCPValidationError("Raw job description must contain at least 20 characters.")

        mandatory = []
        preferred = []

        # Split into sentences or lines to extract clauses
        import re
        clauses = [c.strip() for c in re.split(r"[\r\n]+|\.\s+", raw_text) if c.strip()]
        for clause in clauses:
            l_lower = clause.lower()
            start = raw_text.find(clause)
            end = start + len(clause) if start != -1 else len(clause)

            # Detect mandatory patterns
            if any(k in l_lower for k in ["must have", "required", "mandatory", "cgpa >="]):
                mandatory.append({
                    "id": str(uuid.uuid4()),
                    "description": clause,
                    "requirement_type": "MANDATORY",
                    "source_span": {"start_char": max(0, start), "end_char": end},
                })
            elif any(k in l_lower for k in ["plus", "preferred", "nice to have", "good to have", "bonus"]):
                preferred.append({
                    "id": str(uuid.uuid4()),
                    "description": clause,
                    "requirement_type": "PREFERRED",
                    "weight": 0.7,
                    "source_span": {"start_char": max(0, start), "end_char": end},
                })

        return {
            "draft_id": str(uuid.uuid4()),
            "status": "DRAFT_PENDING_OFFICER_APPROVAL",
            "company_name": args.get("company_name"),
            "job_title": args.get("job_title"),
            "extracted_mandatory": mandatory,
            "extracted_preferred": preferred,
            "officer_note": "Draft generated with source spans. Awaiting human officer gate approval.",
        }
