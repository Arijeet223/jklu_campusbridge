"""CampusBridge AI — Scoped Internal MCP Servers."""

from mcp.servers.base import (
    BaseMCPServer,
    MCPAuthorizationError,
    MCPError,
    MCPRateLimitError,
    MCPToolResponse,
    MCPValidationError,
    SecurityContext,
    ToolDefinition,
)
from mcp.servers.student_profile import StudentProfileServer
from mcp.servers.career_knowledge import CareerKnowledgeServer
from mcp.servers.job_intelligence import JobIntelligenceServer
from mcp.servers.matching import MatchingServer
from mcp.servers.placement_ops import PlacementOpsServer
from mcp.servers.analytics import AnalyticsServer

__all__ = [
    "BaseMCPServer",
    "SecurityContext",
    "ToolDefinition",
    "MCPToolResponse",
    "MCPError",
    "MCPAuthorizationError",
    "MCPValidationError",
    "MCPRateLimitError",
    "StudentProfileServer",
    "CareerKnowledgeServer",
    "JobIntelligenceServer",
    "MatchingServer",
    "PlacementOpsServer",
    "AnalyticsServer",
]

