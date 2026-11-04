"""CampusBridge AI — Central MCP Tool Registry & Security Dispatcher.

Follows Section 9 of campusbridge_ai_prd_v1_1.md and mcp-builder skill:
- Registers all 6 internal servers and 13 scoped tools.
- Maintains JSON Schemas, rate limits, timeouts, and RBAC policies.
- Enforces per-actor rate limits and security boundaries.
- Exports catalog to registry.json.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import asdict
from typing import Any

from mcp.servers.base import (
    BaseMCPServer,
    MCPRateLimitError,
    MCPToolResponse,
    SecurityContext,
)
from mcp.servers.student_profile import StudentProfileServer
from mcp.servers.career_knowledge import CareerKnowledgeServer
from mcp.servers.job_intelligence import JobIntelligenceServer
from mcp.servers.matching import MatchingServer
from mcp.servers.placement_ops import PlacementOpsServer
from mcp.servers.analytics import AnalyticsServer


class MCPRegistry:
    """Central registry and policy enforcement point for all MCP servers."""

    def __init__(self):
        self.servers: dict[str, BaseMCPServer] = {}
        self._rate_limit_buckets: dict[str, list[float]] = {}
        self._register_default_servers()

    def _register_default_servers(self) -> None:
        self.register_server(StudentProfileServer())
        self.register_server(CareerKnowledgeServer())
        self.register_server(JobIntelligenceServer())
        self.register_server(MatchingServer())
        self.register_server(PlacementOpsServer())
        self.register_server(AnalyticsServer())

    def register_server(self, server: BaseMCPServer) -> None:
        self.servers[server.name] = server

    def get_server(self, name: str) -> BaseMCPServer | None:
        return self.servers.get(name)

    def list_all_tools(self) -> list[dict[str, Any]]:
        """Return catalog of all registered tools with schemas and metadata."""
        catalog = []
        for s_name, server in self.servers.items():
            for t_name, tool in server.tools.items():
                catalog.append({
                    "server": s_name,
                    "name": t_name,
                    "description": tool.description,
                    "input_schema": tool.input_schema,
                    "output_schema": tool.output_schema,
                    "required_roles": tool.required_roles,
                    "rate_limit_per_minute": tool.rate_limit_per_minute,
                    "timeout_seconds": tool.timeout_seconds,
                    "read_only": tool.read_only,
                })
        return catalog

    def _check_rate_limit(self, key: str, max_per_minute: int) -> None:
        """Sliding-window rate limiter."""
        now = time.time()
        window_start = now - 60.0

        timestamps = self._rate_limit_buckets.get(key, [])
        valid_timestamps = [t for t in timestamps if t > window_start]

        if len(valid_timestamps) >= max_per_minute:
            raise MCPRateLimitError(
                f"Rate limit exceeded: max {max_per_minute} calls per minute.",
                "Back off and retry after the rate limit window resets.",
            )

        valid_timestamps.append(now)
        self._rate_limit_buckets[key] = valid_timestamps

    def execute_tool(
        self,
        server_name: str,
        tool_name: str,
        arguments: dict[str, Any],
        context: SecurityContext,
    ) -> MCPToolResponse:
        """Secure central entrypoint with rate-limiting and authorization."""
        server = self.get_server(server_name)
        if not server:
            return MCPToolResponse(
                success=False,
                error=f"Server '{server_name}' not found.",
                actionable_advice=f"Available servers: {list(self.servers.keys())}",
            )

        tool = server.tools.get(tool_name)
        if not tool:
            return MCPToolResponse(
                success=False,
                error=f"Tool '{tool_name}' not found on server '{server_name}'.",
                actionable_advice=f"Available tools on '{server_name}': {list(server.tools.keys())}",
            )

        # Rate-limiting check
        rate_key = f"{context.actor_id}:{server_name}:{tool_name}"
        try:
            self._check_rate_limit(rate_key, tool.rate_limit_per_minute)
        except MCPRateLimitError as rle:
            return MCPToolResponse(
                success=False,
                error=rle.message,
                actionable_advice=rle.actionable_advice,
            )

        # Delegate execution
        return server.execute_tool(tool_name, arguments, context)

    def export_to_json(self, output_path: str | None = None) -> str:
        """Export tool catalog to registry.json."""
        catalog = self.list_all_tools()
        json_data = json.dumps(
            {
                "version": "1.1",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "servers_count": len(self.servers),
                "tools_count": len(catalog),
                "tools": catalog,
            },
            indent=2,
        )

        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(json_data)

        return json_data


# Singleton registry instance
default_registry = MCPRegistry()

