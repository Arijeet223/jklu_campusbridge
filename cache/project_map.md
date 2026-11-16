# CampusBridge AI (PS-06) — Multi-Agent System Architecture & Project Map
*Generated for persistent token-efficient reference and multi-agent coordination.*

## 1. Multi-Agent Pantheon: Personas, Scopes & Tool Contracts

| Agent | Formal Title | UI Badge & Accent | Primary Responsibility | MCP Tools & APIs Bound |
|---|---|---|---|---|
| **J.A.R.V.I.S.** | Lead Cognitive Orchestrator | `🤖 J.A.R.V.I.S.`<br>`#F0B6D5` (Rose) | Top-level peer mentor; conversational reasoning; cognitive intent classification; multi-agent dispatching & handoffs. | `career-knowledge.answer_conversational`<br>`orchestrator.classify_intent` |
| **T.E.R.R.A.** | Evidence Retrieval & Parser | `🌿 T.E.R.R.A.`<br>`#B6D9EC` (Cyan/Sky) | Resume parsing, Ghost Card proposals, character offset spans, and citation extraction. | `student-profile.get_profile`<br>`student-profile.list_evidence`<br>`student-profile.propose_profile_update`<br>`rag.hybrid_retrieval` |
| **R.O.N.E.N.** | Institutional Policy Gatekeeper | `🛡️ R.O.N.E.N.`<br>`#B6DEC9` (Emerald/Sage) | 100% deterministic academic criteria (CGPA cutoff, backlogs, branch). Never hallucinates or changes scores. | `matching.evaluate_eligibility`<br>`matching.calculate_alignment`<br>`ronen_gate.evaluate_eligibility` |
| **A.T.H.E.N.A.** | Assessment Proctor & Viva Proctor | `⚡ A.T.H.E.N.A.`<br>`#FDE68A` (Amber) | 120-second Proof-of-Work micro-defenses, coding challenges, DSA test harnesses, SQL sandboxes. Text-only (no webcam/biometrics). | `placement-ops.get_practice_challenge`<br>`placement-ops.evaluate_code_submission`<br>`athena_gate.verify_defense` |
| **K.R.O.N.O.S.** | Trajectory & 72-Hour Rapid Sprint Engine | `⏱️ K.R.O.N.O.S.`<br>`#DDD6FE` (Violet) | Curates high-impact 72-hour drive sprints and semester marathon plans; calculates counterfactual readiness lifts. | `gap_analyzer.analyze_gaps`<br>`trajectory_curator.generate_trajectory`<br>`career-knowledge.search_learning_resources`<br>`placement-ops.create_study_task` |
| **Workspace Copilot** | Productivity & Automation Specialist | `📑 Workspace Copilot`<br>`#CBD5E1` (Slate) | Drafts emails to professors and recruiters, creates Google Calendar events, and saves markdown study notes. | `gmail.draft_email`<br>`calendar.create_event`<br>`notes.create_note` |

---

## 2. Intent Classification Matrix (Cognitive Router)

```
User Query Input
      │
      ├──> Intent 1: CONVERSATIONAL_OR_REASONING (J.A.R.V.I.S.)
      │       ├── Direct conversational peer reply via Qwen 2.5
      │       └── Zero canned menus; authentic student peer tone
      │
      ├──> Intent 2: SPECIALIST_AGENT_DELEGATION
      │       ├── "sprint", "72h", "prep", "roadmap" ──> K.R.O.N.O.S. (Widget: sprint_plan)
      │       ├── "resume", "cv", "word resume" ──────> T.E.R.R.A. (Widget: resume_preview)
      │       ├── "skills", "ghost cards", "audit" ───> T.E.R.R.A. (Widget: ghost_cards)
      │       ├── "eligible", "cutoff", "qualify" ────> R.O.N.E.N. (Widget: match_card)
      │       └── "code", "dsa", "sql", "defense" ────> A.T.H.E.N.A. (Widget: micro_defense)
      │
      ├──> Intent 3: CONTEXTUAL_RAG_RETRIEVAL (T.E.R.R.A. + Citation Guardrail)
      │       ├── Scoped MCP: student-profile.get_profile, matching.evaluate_eligibility
      │       ├── Pre-filtered BM25 + Vector Cosine retrieval with strict tenant filtering
      │       └── Citation verification: [📄 Resume p.1] / [chunk-id] anchors
      │
      ├──> Intent 4: ACTION_DISPATCH (J.A.R.V.I.S. State Mutation)
      │       ├── Update CGPA, add verified skills, update GitHub handle, target role
      │       └── Write-through to Excel (Accounts_Students, Evidence_Store)
      │
      └──> Intent 5: WORKSPACE_AUTOMATION (Workspace Copilot)
              ├── Gmail draft outreach to professors / placement officers
              ├── Google Calendar invite for mock interviews & micro-defenses
              └── Markdown notes persisted to student repository
```

---

## 3. Communication & Data Flow

1. **Next.js Client (`/student/chat`, `ChatWorkspace.tsx`)**:
   - Manages message history with per-message `agentName`, `widgetType`, and `trace`.
   - Passes streaming SSE requests to `/api/v1/chat/completions`.
   - "New Chat" clears local state, generates fresh `session_id`, clears `localStorage`, and posts `{ messages: [] }` to `/api/v1/chat/history`.

2. **Next.js API Handler (`apps/web/src/app/api/v1/chat/completions/route.ts`)**:
   - Primary: Proxies to FastAPI backend `http://127.0.0.1:8000/v1/chat/completions`.
   - Secondary: Direct Ollama Qwen 2.5 fallback if backend is offline.
   - Tertiary: Local grounded deterministic fallback with full transparency in `trace`.

3. **FastAPI Backend (`services/api/endpoints.py`, `backend/agents/orchestrator.py`)**:
   - Authenticated student context (`STU-101`, `Aarav Sharma`, CGPA `8.42`).
   - Dynamic routing through `_orchestrator.run_live_grounded_pipeline()`.
   - Emits real telemetry `trace` (actual ms latency, executed MCP tools, retrieved RAG chunks, guardrail status).
   - Non-blocking audit logs (`sync=False`) to avoid openpyxl write stalls.

4. **Storage (`data/campusbridge_db.xlsx`)**:
   - `Accounts_Students`: Student identities, CGPAs, backlogs, target roles, verified GitHub URLs.
   - `Opportunities_JDs`: Corporate job descriptions, min CGPAs, mandatory skills.
   - `Evidence_Store`: Verified student skills, tiers (`1_EXTRACTED` through `4_ASSESSMENT_VERIFIED`), sources.
   - `MCP_Audit_Logs`: Audit trail for all tool and agent executions.
