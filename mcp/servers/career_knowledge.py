"""CampusBridge AI — Career Knowledge MCP Server.

Provides tools:
1. search_role_guides: Search curated institutional role family guides & rubrics.
2. search_learning_resources: Search approved learning catalog for sprint & marathon plans.
"""

from __future__ import annotations

import re
from typing import Any

from mcp.servers.base import BaseMCPServer, SecurityContext, ToolDefinition

# Curated institutional role guides catalogue
_ROLE_GUIDES = [
    {
        "role_id": "role-backend-eng",
        "title": "Backend Systems Engineer",
        "role_family": "Software Engineering",
        "core_skills": ["Python", "FastAPI", "SQL & Database Design", "Docker", "Distributed Systems"],
        "rubric_expectations": "Demonstrates async API construction, transactional SQL integrity, and containerization.",
        "prerequisites": "Data Structures & Algorithms, Operating Systems, Database Management.",
    },
    {
        "role_id": "role-fullstack-dev",
        "title": "Full-Stack Web Developer",
        "role_family": "Software Engineering",
        "core_skills": ["React", "TypeScript", "Node.js", "SQL & Database Design", "REST APIs"],
        "rubric_expectations": "Client-state management, responsive layouts, end-to-end integration.",
        "prerequisites": "Web Architecture, Object-Oriented Design.",
    },
    {
        "role_id": "role-ml-engineer",
        "title": "Applied Machine Learning Engineer",
        "role_family": "Data Science & AI",
        "core_skills": ["Python", "PyTorch", "Data Pipelines", "SQL", "Model Evaluation"],
        "rubric_expectations": "Reproducible model pipelines, metrics evaluation, latency optimization.",
        "prerequisites": "Linear Algebra, Probability & Statistics, Machine Learning.",
    },
]

# Approved university learning resources
_LEARNING_RESOURCES = [
    {
        "resource_id": "res-fastapi-sprint",
        "title": "3-Hour High-Throughput FastAPI Triage Kit",
        "mode": "SPRINT_72H",
        "estimated_hours": 3,
        "skills_targeted": ["FastAPI", "Python", "REST APIs"],
        "format": "Interactive Code Lab +STAR Defense Prep",
        "url": "https://campusbridge.local/learn/fastapi-sprint",
    },
    {
        "resource_id": "res-sql-indexing-marathon",
        "title": "Advanced PostgreSQL Indexing & Query Tuning",
        "mode": "MARATHON_SEMESTER",
        "estimated_hours": 15,
        "skills_targeted": ["SQL & Database Design", "PostgreSQL"],
        "format": "Capstone Project + Mentored Code Review",
        "url": "https://campusbridge.local/learn/postgres-deepdive",
    },
    {
        "resource_id": "res-docker-k8s-crash",
        "title": "Containerization & Cloud Infrastructure Sprint",
        "mode": "SPRINT_72H",
        "estimated_hours": 4,
        "skills_targeted": ["Docker", "Kubernetes", "AWS Cloud"],
        "format": "Hands-on Lab with Docker Compose & Cluster Testing",
        "url": "https://campusbridge.local/learn/docker-crash",
    },
]


class CareerKnowledgeServer(BaseMCPServer):
    """MCP server for searching role taxonomies and approved learning curricula."""

    def __init__(self):
        super().__init__(
            name="career-knowledge",
            description="Institutional career pathways, role requirements, and approved learning catalog.",
        )
        self._register_all_tools()

    def _register_all_tools(self) -> None:
        self.register_tool(
            ToolDefinition(
                name="search_role_guides",
                description="Search institutional career role guides, skill expectations, and prerequisites.",
                input_schema={
                    "type": "object",
                    "required": ["query"],
                    "properties": {
                        "query": {"type": "string", "description": "Search keywords e.g. 'Backend Engineer', 'Machine Learning'."},
                        "role_family": {"type": "string", "description": "Optional filter by role family."},
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "total_matches": {"type": "integer"},
                        "guides": {"type": "array"},
                    },
                },
                required_roles=["STUDENT", "PLACEMENT_OFFICER", "FACULTY_MENTOR", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_search_role_guides,
            )
        )

        self.register_tool(
            ToolDefinition(
                name="search_learning_resources",
                description="Search approved learning resources categorized for 72-Hour Drive Sprint or Semester Marathon modes.",
                input_schema={
                    "type": "object",
                    "required": ["skills"],
                    "properties": {
                        "skills": {"type": "array", "items": {"type": "string"}, "description": "Target skill gaps."},
                        "prep_mode": {
                            "type": "string",
                            "enum": ["ALL", "SPRINT_72H", "MARATHON_SEMESTER"],
                            "default": "ALL",
                        },
                    },
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "total_resources": {"type": "integer"},
                        "resources": {"type": "array"},
                    },
                },
                required_roles=["STUDENT", "PLACEMENT_OFFICER", "FACULTY_MENTOR", "ADMIN"],
                read_only=True,
                rate_limit_per_minute=60,
                timeout_seconds=5.0,
                handler=self._handle_search_learning_resources,
            )
        )

    def _handle_search_role_guides(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        query = args.get("query", "").lower()
        role_family_filter = args.get("role_family")

        matches = []
        for guide in _ROLE_GUIDES:
            if role_family_filter and guide["role_family"].lower() != role_family_filter.lower():
                continue
            text = f"{guide['title']} {guide['role_family']} {' '.join(guide['core_skills'])} {guide['rubric_expectations']}".lower()
            if query in text or any(term in text for term in query.split()):
                matches.append(guide)

        return {"total_matches": len(matches), "guides": matches}

    def _handle_search_learning_resources(self, args: dict[str, Any], context: SecurityContext) -> dict[str, Any]:
        skills = [s.lower() for s in args.get("skills", [])]
        prep_mode = args.get("prep_mode", "ALL")

        matched = []
        for res in _LEARNING_RESOURCES:
            if prep_mode != "ALL" and res["mode"] != prep_mode:
                continue
            res_skills = [s.lower() for s in res["skills_targeted"]]
            if any(s in res_skills for s in skills) or not skills:
                matched.append(res)

        return {"total_resources": len(matched), "resources": matched}

