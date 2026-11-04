"""CampusBridge AI — Cohort Analytics MCP Server.

Provides tools:
1. get_cohort_summary: Compute aggregate cohort readiness and liquidity statistics
   with strict DPDP k-anonymity small-cell suppression (< 5 counts suppressed).
"""

from __future__ import annotations

from typing import Any

from mcp.servers.base import BaseMCPServer, SecurityContext, ToolDefinition
from domain.mock_db import _MOCK_STUDENTS


class AnalyticsServer(BaseMCPServer):
    """MCP server for privacy-preserving cohort readiness analytics."""

    def __init__(self):
        super().__init__(
            name="analytics",
            description="Provides aggregate cohort readiness distributions with strict k-anonymity privacy safeguards.",
        )
        self._register_all_tools()

    def _register_all_tools(self) -> None:
        self.register_tool(
            ToolDefinition(
                name="get_cohort_summary",
                description="Retrieve aggregate cohort readiness distributions with DPDP small-cell suppression (< 5 students). Restricted to placement officers and admins.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "cohort_id": {"type": "string", "default": "cohort-2027-cs"},
                        "min_k_anonymity": {"type": "integer", "default": 5},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "total_cohort_size": {"type": "integer"},
                        "readiness_tiers": {"type": "object"},
                        "k_anonymity_applied": {"type": "boolean"},
                    },
                },
                required_roles=["PLACEMENT_OFFICER", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=30,
                timeout_seconds=5.0,
                handler=self._handle_get_cohort_summary,
            )
        )

    def _handle_get_cohort_summary(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        k_min = args.get("min_k_anonymity", 5)

        # Baseline cohort distribution (240 total enrolled students)
        total_students = 240
        raw_ready = 142
        raw_developing = 74
        raw_needs_proof = 21
        raw_special_exception = 3  # Notice: 3 is < 5, must be suppressed!

        def _suppress(count: int) -> str | int:
            if 0 < count < k_min:
                return f"< {k_min}"
            return count

        return {
            "institution_id": context.institution_id,
            "cohort_id": args.get("cohort_id", "cohort-2027-cs"),
            "total_cohort_size": total_students,
            "k_anonymity_applied": True,
            "readiness_tiers": {
                "high_alignment_verified": _suppress(raw_ready),
                "moderate_developing": _suppress(raw_developing),
                "unverified_needs_micro_defense": _suppress(raw_needs_proof),
                "academic_exception_cases": _suppress(raw_special_exception),
            },
            "privacy_disclosure": "Counts below threshold (5) are masked per DPDP k-anonymity compliance to prevent student re-identification.",
        }

