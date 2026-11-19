import sys
import os
sys.path.insert(0, ".")

from backend.agents.orchestrator import AgentOrchestrator, SecurityContext

orch = AgentOrchestrator()
ctx = SecurityContext(actor_id="STU-101", actor_role="STUDENT", institution_id="inst-nitk-001", purpose="career_companion_chat")
try:
    res = orch.run_live_grounded_pipeline(
        prompt="How do I look for the TechCorp drive?",
        context=ctx,
        stored_chunks=[],
        messages=[]
    )
    print("Response:", res.get("response"))
    print("MCP tools:", res.get("trace", {}).get("mcp_tools"))
except Exception as e:
    import traceback
    traceback.print_exc()
