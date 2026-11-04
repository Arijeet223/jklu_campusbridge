"""CampusBridge AI — Agent State & Hard Budget Trackers.

Implements PRD §10:
- Max 3 specialist agent transitions per workflow.
- Max 6 read MCP tool calls / 2 proposal write tool calls.
- Immutable SecurityContext propagation.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Literal

from mcp.servers.base import SecurityContext

MAX_AGENT_TRANSITIONS = 3
MAX_READ_TOOL_CALLS = 6
MAX_WRITE_TOOL_CALLS = 2
MAX_WORKFLOW_STEPS = 10
WORKFLOW_TIMEOUT_SECONDS = 30.0


class AgentBudgetExceeded(Exception):
    """Raised when an agent workflow exceeds transitions or tool budgets."""
    pass


@dataclass
class AgentMessage:
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    tool_call_id: str | None = None
    tool_name: str | None = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class WorkflowState:
    session_id: str
    security_context: SecurityContext
    messages: list[AgentMessage] = field(default_factory=list)
    active_agent: str = "orchestrator"
    agent_transitions: int = 0
    read_tool_calls: int = 0
    write_tool_calls: int = 0
    total_steps: int = 0
    start_time: float = field(default_factory=time.time)
    artifacts: dict[str, Any] = field(default_factory=dict)
    is_completed: bool = False
    error: str | None = None

    def record_transition(self, next_agent: str) -> None:
        """Record an agent handoff, enforcing the 3-transition budget."""
        if next_agent != self.active_agent:
            if self.agent_transitions >= MAX_AGENT_TRANSITIONS:
                raise AgentBudgetExceeded(
                    f"Agent transition budget exhausted: maximum {MAX_AGENT_TRANSITIONS} handoffs allowed."
                )
            self.agent_transitions += 1
            self.active_agent = next_agent

    def record_tool_call(self, is_read: bool = True) -> None:
        """Record an MCP tool call against the read/write quota."""
        self._check_timeout()
        if is_read:
            if self.read_tool_calls >= MAX_READ_TOOL_CALLS:
                raise AgentBudgetExceeded(
                    f"MCP read tool quota exhausted: maximum {MAX_READ_TOOL_CALLS} read calls per workflow."
                )
            self.read_tool_calls += 1
        else:
            if self.write_tool_calls >= MAX_WRITE_TOOL_CALLS:
                raise AgentBudgetExceeded(
                    f"MCP write tool quota exhausted: maximum {MAX_WRITE_TOOL_CALLS} write calls per workflow."
                )
            self.write_tool_calls += 1

    def increment_step(self) -> None:
        """Advance workflow step counter and enforce timeouts."""
        self._check_timeout()
        if self.total_steps >= MAX_WORKFLOW_STEPS:
            raise AgentBudgetExceeded(
                f"Workflow step budget exhausted: maximum {MAX_WORKFLOW_STEPS} steps allowed."
            )
        self.total_steps += 1

    def _check_timeout(self) -> None:
        if (time.time() - self.start_time) > WORKFLOW_TIMEOUT_SECONDS:
            raise AgentBudgetExceeded(
                f"Workflow exceeded hard timeout of {WORKFLOW_TIMEOUT_SECONDS} seconds."
            )

