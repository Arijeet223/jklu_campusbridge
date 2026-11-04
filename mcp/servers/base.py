"""CampusBridge AI — Base abstractions for scoped internal MCP servers.

Follows .agents/skills/mcp-builder/SKILL.md:
- SecurityContext envelope on every call (actor_id, actor_role, institution_id, purpose).
- Actionable, descriptive errors.
- Typed tool responses with structured content.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable


class MCPError(Exception):
    """Base error for MCP operations."""
    def __init__(self, message: str, actionable_advice: str | None = None):
        super().__init__(message)
        self.message = message
        self.actionable_advice = actionable_advice


class MCPAuthorizationError(MCPError):
    """Raised when an actor lacks the required RBAC role or tenant scope."""
    pass


class MCPValidationError(MCPError):
    """Raised when input parameters fail schema validation."""
    pass


class MCPRateLimitError(MCPError):
    """Raised when request volume exceeds the tool quota."""
    pass


@dataclass
class SecurityContext:
    actor_id: str
    actor_role: str  # STUDENT, PLACEMENT_OFFICER, FACULTY_MENTOR, RECRUITER, ADMIN
    institution_id: str
    purpose: str = "placement_readiness"


@dataclass
class ToolDefinition:
    name: str
    description: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    required_roles: list[str]
    rate_limit_per_minute: int = 60
    timeout_seconds: float = 5.0
    read_only: bool = True
    handler: Callable[[dict[str, Any], SecurityContext], dict[str, Any]] = field(
        default=lambda a, c: {}
    )


@dataclass
class MCPToolResponse:
    success: bool
    data: Any = None
    error: str | None = None
    actionable_advice: str | None = None
    execution_time_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "actionable_advice": self.actionable_advice,
            "execution_time_ms": round(self.execution_time_ms, 2),
        }


class BaseMCPServer:
    """Base internal MCP server implementation."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.tools: dict[str, ToolDefinition] = {}

    def register_tool(self, tool_def: ToolDefinition) -> None:
        """Register a tool definition with the server."""
        self.tools[tool_def.name] = tool_def

    def execute_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        context: SecurityContext,
    ) -> MCPToolResponse:
        """Execute a registered tool within the caller security boundary."""
        t0 = time.perf_counter()

        if tool_name not in self.tools:
            return MCPToolResponse(
                success=False,
                error=f"Tool '{tool_name}' not found on server '{self.name}'.",
                actionable_advice=f"Available tools on '{self.name}': {list(self.tools.keys())}",
                execution_time_ms=(time.perf_counter() - t0) * 1000,
            )

        tool = self.tools[tool_name]

        # 1. RBAC authorization gate
        if tool.required_roles and context.actor_role not in tool.required_roles:
            return MCPToolResponse(
                success=False,
                error=f"Permission denied: role '{context.actor_role}' is not authorized for tool '{tool_name}'.",
                actionable_advice=f"Required roles: {tool.required_roles}. Request privileged access if needed.",
                execution_time_ms=(time.perf_counter() - t0) * 1000,
            )

        # 2. Execute handler
        try:
            result_data = tool.handler(arguments, context)
            return MCPToolResponse(
                success=True,
                data=result_data,
                execution_time_ms=(time.perf_counter() - t0) * 1000,
            )
        except MCPError as exc:
            return MCPToolResponse(
                success=False,
                error=exc.message,
                actionable_advice=exc.actionable_advice,
                execution_time_ms=(time.perf_counter() - t0) * 1000,
            )
        except Exception as exc:
            return MCPToolResponse(
                success=False,
                error=f"Internal tool execution error: {str(exc)}",
                actionable_advice="Verify input payload parameters against tool schema.",
                execution_time_ms=(time.perf_counter() - t0) * 1000,
            )

