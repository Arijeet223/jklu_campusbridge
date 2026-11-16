# CampusBridge AI — API Endpoints & MCP Tools Reference

A complete, human-readable reference for all backend FastAPI endpoints, Next.js API routes, and Model Context Protocol (MCP) tools powering the CampusBridge AI platform.

---

## 🌐 Base URLs & Architecture Overview

* **FastAPI Backend Service:** `http://127.0.0.1:8000` (Swagger UI: `http://127.0.0.1:8000/docs`)
* **Next.js Studio Frontend:** `http://localhost:3000`
* **Route Prefix Aliases:** All FastAPI endpoints support canonical paths as well as `/v1/*`, `/api/v1/*`, and `/api/*` prefixes for transparent proxying.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 Frontend Studio                      │
│     (Student Dashboard • Officer Console • Faculty View • Arena)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ /api/v1/* proxies & NextAuth
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend (Port 8000)                      │
│     (78 Canonical Endpoints • 100% Deterministic Policy Engine)        │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  PostgreSQL / Excel 2-Way    │          │  Scoped MCP Server Registry  │
│  (12 Relational Worksheets)  │          │  (6 Servers • 13 Tools)      │
└──────────────────────────────┘          └──────────────┬───────────────┘
                                                         │ Scoped Tools
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │      Specialist Agents       │
                                          │ (J.A.R.V.I.S., T.E.R.R.A.,   │
                                          │  R.O.N.E.N., A.T.H.E.N.A.,   │
                                          │  K.R.O.N.O.S., Copilot)      │
                                          └──────────────────────────────┘
```

---

## 🤖 Specialist Agents & Assigned MCP Tools

CampusBridge routes user tasks dynamically across a 6-agent pantheon. Each agent is constrained to least-privilege MCP tool boundaries:

| Agent | Persona & Role | Guiding Boundary / Invariant | Available MCP Tools |
| :--- | :--- | :--- | :--- |
| **🤖 J.A.R.V.I.S.** | Lead Cognitive Orchestrator & Conversational Companion | Contextual routing, intent classification, natural guidance. | `career-knowledge.search_role_guides`<br>`student-profile.get_my_profile` |
| **🌿 T.E.R.R.A.** | Evidence & Skill Provenance Specialist | 100% visual text provenance; generates provisional Ghost Cards from resumes and GitHub repos. | `student-profile.get_my_profile`<br>`student-profile.list_my_evidence`<br>`student-profile.propose_profile_update` |
| **🛡️ R.O.N.E.N.** | Deterministic Gatekeeper & Placement Policy Engine | 100% deterministic Python/SQL cutoffs (CGPA, backlogs, branch); boolean outcomes (`MEETS`, `DOES_NOT_MEET`, `UNKNOWN`). | `matching.run_match_preview`<br>`matching.explain_match`<br>`job-intelligence.get_approved_job` |
| **⚡ A.T.H.E.N.A.** | Assessment & 120s Micro-Defense Coach | Text-only artifact-grounded technical challenges; STAR defense questions without biometric surveillance. | `placement-ops.get_practice_challenge`<br>`matching.run_match_preview` |
| **⏱️ K.R.O.N.O.S.** | Readiness Coach & Sprint Architect | Adaptive coaching modes (72-Hour Drive Sprint vs. Semester Marathon); triage kits and milestone tracking. | `placement-ops.create_study_task`<br>`placement-ops.list_my_applications`<br>`career-knowledge.search_learning_resources` |
| **📑 Workspace Copilot** | Institutional Operations & Placement Copilot | Recruiter JD parsing, cohort liquidity simulation, exception logging, and institutional email drafting. | `job-intelligence.draft_job_requirements`<br>`placement-ops.record_human_review`<br>`analytics.get_cohort_summary`<br>`workspace.execute` |

---

## 🧰 The 6 Internal MCP Servers & 13 Tools

All tools run under least-privilege role-based access control (RBAC) with token-bucket rate limits and explicit timeout enforcement:

| Server | Tool Name | Description | Authorized Roles | Mode |
| :--- | :--- | :--- | :--- | :--- |
| `student-profile` | `get_my_profile` | Reads student structured profile, degree standing, CGPA, and Privacy Shield flags. | `STUDENT`, `OFFICER`, `ADMIN` | Read-Only |
| `student-profile` | `list_my_evidence` | Lists 6-tier skill evidence ledger items, confidence scores, and source document spans. | `STUDENT`, `OFFICER`, `ADMIN` | Read-Only |
| `student-profile` | `propose_profile_update` | Proposes a new AI-extracted skill claim, creating a provisional Ghost Card (`EXTRACTED` status). | `STUDENT`, `ADMIN` | Write |
| `career-knowledge` | `search_role_guides` | Searches institutional career role guides, skill expectations, and prerequisite mappings. | `STUDENT`, `OFFICER`, `FACULTY`, `ADMIN` | Read-Only |
| `career-knowledge` | `search_learning_resources`| Searches approved learning resources categorized for 72h Sprint or Semester Marathon modes. | `STUDENT`, `OFFICER`, `FACULTY`, `ADMIN` | Read-Only |
| `job-intelligence` | `get_approved_job` | Fetches an officer-approved campus job drive with mandatory vs. preferred criteria. | `STUDENT`, `OFFICER`, `RECRUITER`, `ADMIN` | Read-Only |
| `job-intelligence` | `draft_job_requirements` | Parses raw recruiter JD text into structured mandatory and preferred criteria with text spans. | `OFFICER`, `ADMIN` | Write |
| `matching` | `run_match_preview` | Evaluates deterministic hard eligibility gates and 5-factor rubric fit alignment for a student and job. | `STUDENT`, `OFFICER`, `FACULTY`, `ADMIN` | Read-Only |
| `matching` | `explain_match` | Translates match evaluation into a plain-language coaching summary with inline verified citations. | `STUDENT`, `OFFICER`, `FACULTY`, `ADMIN` | Read-Only |
| `placement-ops` | `list_my_applications` | Lists active job applications and placement milestones for the authenticated student. | `STUDENT`, `OFFICER`, `ADMIN` | Read-Only |
| `placement-ops` | `create_study_task` | Inserts an actionable task into the student's 72h Sprint or Semester Marathon prep checklist. | `STUDENT`, `FACULTY`, `ADMIN` | Write |
| `placement-ops` | `record_human_review` | Records an official placement officer adjudication or eligibility override with a mandatory reason code. | `OFFICER`, `ADMIN` | Write |
| `analytics` | `get_cohort_summary` | Generates aggregated cohort readiness metrics with DPDP small-cell suppression ($k < 5$ masked). | `OFFICER`, `ADMIN` | Read-Only |

---

## 📡 FastAPI Backend Endpoints Reference

### 1. Authentication & User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticates student, teacher, or officer accounts; returns session token and role. |
| `POST` | `/auth/register` | Registers a new user into `Accounts_Students` or `Accounts_Staff`. |
| `POST` | `/auth/register-student` | Dedicated student self-registration endpoint with department and batch. |
| `POST` | `/auth/register-teacher` | Dedicated faculty mentor registration endpoint. |
| `GET` | `/auth/accounts` | Lists registered accounts (non-sensitive fields) for administrative review. |
| `GET` | `/auth/check-onboarding/{student_id}` | Checks if the student has completed Stages 1–3 of onboarding. |

### 2. Student Profile & Evidence Ledger
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/students/{student_id}` | Retrieves full student profile (degree, branch, CGPA, verified skills). |
| `GET` | `/students/{student_id}/profile` | Alias for student profile retrieval. |
| `GET` | `/students/{student_id}/evidence` | Returns all 6-tier skill evidence items with exact source document spans. |
| `POST` | `/students/{student_id}/evidence/{evidence_id}/confirm` | Student confirms provisional Ghost Card to Solid status. |
| `POST` | `/profile/extractions/{extraction_id}/confirm` | Confirms extracted skill claim and recalculates profile readiness. |
| `GET` | `/students/{student_id}/onboarding-status` | Returns active onboarding stage (`COMPLETED`, `STAGE_3_PENDING`, etc.). |
| `POST` | `/onboarding/complete` | Submits confirmed Ghost skills, triggers radar graph generation, marks account active. |

### 3. Resume Ingestion & Parsing Pipeline
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/documents/upload` | Multipart upload for `.pdf` and `.docx` resumes; extracts raw text in memory, runs hybrid skill dictionary + Qwen extraction, returns Ghost Cards. |
| `POST` | `/documents` | Direct document upload with MIME sniffing and quarantine validation. |
| `POST` | `/documents/upload-json` | Headless JSON upload of extracted resume text and metadata. |
| `GET` | `/documents/{document_id}/chunks` | Retrieves section-aware RAG chunks with character offsets for a document. |

### 4. AI Multi-Agent Chat & Orchestration
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat/completions` | Primary multi-agent conversational endpoint. Supports SSE streaming (`stream=true`) or single JSON response (`stream=false`). Dynamically delegates to J.A.R.V.I.S., T.E.R.R.A., R.O.N.E.N., A.T.H.E.N.A., K.R.O.N.O.S., or Workspace Copilot. |
| `GET` | `/chat/history` | Retrieves persistent chat history for a student across sessions. |
| `POST` | `/chat/history` | Saves or resets conversation history (wipes history when passed `{"messages": []}`). |
| `POST` | `/ai/chat` | Direct conversational endpoint for local Qwen completions. |
| `GET` | `/ai/health` | Returns health status and availability of local Ollama model (`qwen2.5:7b`). |
| `GET` | `/agents/list` | Returns roster of all specialist agents and active statuses. |
| `POST` | `/agents/dispatch` | Programmatically dispatches a targeted query directly to a named agent. |
| `POST` | `/agents/readiness-pipeline` | Runs full composite multi-agent readiness pipeline across all specialist agents. |

### 5. Job Intelligence & Deterministic Matching
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/matching/live-jobs` | Returns all active campus placement job drives, criteria, and student fit previews. |
| `GET` | `/students/{student_id}/matches` | Returns evaluated job matches with hard eligibility flags (`MEETS`, `DOES_NOT_MEET`, `UNKNOWN`). |
| `POST` | `/jd/upload` | Placement officer uploads raw JD; parses mandatory vs. preferred criteria and chunks into Qdrant. |
| `GET` | `/jd/retrieve/{job_id}` | Retrieves parsed requirements, cutoffs, and embeddings for a job opening. |
| `POST` | `/jobs/{job_id}/liquidity-preview` | Placement officer cohort simulator; previews applicant pool depth as cutoffs are adjusted. |

### 6. Deterministic Policy Gates
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/gates/ronen/evaluate` | Evaluates student hard eligibility gates (CGPA, backlogs, branch) in 100% deterministic Python/SQL. |
| `POST` | `/gates/ronen/evaluate` | Evaluates hard cutoffs with custom candidate parameters. |
| `POST` | `/gates/athena/evaluate` | Evaluates micro-defense prerequisites and challenge pass thresholds. |

### 7. 120-Second Micro-Defenses & Coding Arena
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/defenses/micro-start` | Ingests linked repository/resume artifact and generates 3 artifact-grounded technical questions. |
| `POST` | `/defenses/micro-submit` | Evaluates student defense answers against STAR rubric; upgrades skill to `ASSESSMENT_VERIFIED`. |
| `POST` | `/defenses/{defense_id}/submit` | Submits answers for a specific active defense ID. |
| `POST` | `/agents/micro-defense/submit` | Specialist agent evaluation of student defense response. |
| `POST` | `/arena/evaluate-code` | Live sandboxed Python/JS code runner for practice coding challenges. |
| `POST` | `/arena/micro-defense/submit` | Practice arena defense submission handler. |
| `GET` | `/practice/dsa` | Lists available Data Structures & Algorithms practice problems. |
| `POST` | `/practice/dsa/run` | Runs student DSA solution against automated test cases. |
| `GET` | `/practice/sql` | Lists available relational SQL schema challenges. |
| `POST` | `/practice/sql/run` | Executes student SQL query against sandboxed database tables. |

### 8. Readiness Coaching & Sprint Planning
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/agents/gap-analysis` | Analyzes missing skills and qualifications against student's target dream jobs. |
| `POST` | `/agents/gap-analysis` | Gap analysis execution with custom job targets. |
| `GET` | `/agents/trajectory-plan` | Generates personalized milestone trajectory toward placement readiness. |
| `POST` | `/agents/trajectory-plan` | Trajectory plan generation with custom target timeline. |
| `POST` | `/readiness/plans` | Generates 72-Hour Drive Sprint or Semester Marathon curriculum checklists. |

### 9. Counterfactual "What-If" Sandbox
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/sandbox/simulate-fit` | Instant (<50ms) deterministic re-calculation of 5-factor fit score under hypothetical actions without mutating database. |

### 10. Placement Operations, Disputes & Auditing
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/applications` | Retrieves active student job applications and pipeline status. |
| `POST` | `/applications` | Submits a new job application on behalf of a student. |
| `POST` | `/applications/{application_id}/stage` | Updates application stage (`APPLIED`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`). |
| `GET` | `/disputes` | Lists student eligibility clarification tickets in the officer review queue. |
| `POST` | `/disputes/{ticket_id}/action` | Officer dispute adjudication (`APPROVE_OVERRIDE`, `REJECT`) with mandatory reason code. |
| `GET` | `/analytics/cohort-summary` | Aggregated cohort readiness distribution with DPDP small-cell suppression ($k < 5$ masked). |
| `POST` | `/analytics/snapshot` | Takes an immutable point-in-time placement cycle snapshot. |

### 11. Hybrid RAG & Vector Retrieval
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/retrieval/hybrid-search` | Executes hybrid BM25 + dense vector search combined via Reciprocal Rank Fusion (RRF). |
| `GET` | `/retrieval/qdrant/health` | Checks status and collection counts for vector storage (Qdrant / Embedded). |
| `POST` | `/retrieval/qdrant/job-match` | Vector similarity search finding candidate profiles matching job descriptions. |
| `POST` | `/retrieval/qdrant/match-skill` | Finds semantic skill matches against standard institutional taxonomy. |
| `POST` | `/validator/validate-citations` | Strict citation sanitizer; blocks responses if citations point to nonexistent text spans. |

### 12. LiveKit WebRTC Voice & Neural TTS
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/voice/token` | Generates signed LiveKit WebRTC audio token for real-time conversation with J.A.R.V.I.S. |
| `GET` | `/voice/worker-token` | Generates authentication token for Python LiveKit voice worker daemon. |
| `GET` | `/voice/worker-config` | Retrieves WebRTC connection URLs and worker configuration. |
| `GET` | `/voice/speak` | Synthesizes neural text-to-speech (TTS) audio for in-chat auto-voice playback. |
| `POST` | `/voice/speak` | POST version of speech synthesis for longer response texts. |
| `GET` | `/voice/health` | Checks status of LiveKit WebRTC bridge and TTS pipeline. |

### 13. System Administration, Excel Two-Way Sync & Diagnostics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Core system health check (PostgreSQL mode, Qdrant mode, LiveKit worker target). |
| `GET` | `/admin/db-stats` | Returns row counts and integrity stats across all 12 Excel database worksheets. |
| `GET` | `/admin/export-excel` | Downloads current live Excel database workbook (`campusbridge_db.xlsx`). |
| `POST` | `/admin/sync-excel` | Flushes in-memory cache to disk workbook. |
| `POST` | `/admin/upload-excel` | Replaces live database with an uploaded `.xlsx` file. |
| `GET` | `/mcp/tools` | Lists all 13 registered MCP tools with JSON input/output schemas. |
| `POST` | `/mcp/tools/execute` | Executes an internal MCP tool call over HTTP. |
| `GET` | `/diagnostics/system-health` | Comprehensive multi-system diagnostic check (DB, Qdrant, Ollama, Excel, LiveKit). |
| `GET` | `/diagnostics/ai-pantheon` | Automated self-test evaluating all 6 specialist agents and response latency. |
| `POST` | `/diagnostics/self-test` | Alias for AI pantheon self-test execution. |
| `GET` | `/diagnostics/mcp-smoke-tests` | Hermetic test suite validating all 13 MCP tools end-to-end. |

---

## 💻 Next.js Frontend API Routes (`apps/web/src/app/api/`)

The Next.js App Router exposes secure edge/serverless API proxies handling session authentication, SSE streaming, and role verification:

| Route Path | Method | Purpose & Target Service |
| :--- | :--- | :--- |
| `/api/auth/[...nextauth]` | `GET`, `POST` | NextAuth.js session & JWT handler with Neon PostgreSQL credentials provider; injects `user.role` (`STUDENT`, `TEACHER`, `PLACEMENT_OFFICER`). |
| `/api/livekit-token` | `GET`, `POST` | Generates secure signed WebRTC room tokens for student voice sessions with J.A.R.V.I.S. |
| `/api/onboarding/complete` | `POST` | Submits confirmed Ghost skills, triggers deterministic fit recalculation, and activates the student account. |
| `/api/v1/auth/login` | `POST` | Client authentication proxy forwarding to FastAPI `/v1/auth/login`. |
| `/api/v1/auth/register-student`| `POST` | Student self-registration proxy forwarding to FastAPI `/v1/auth/register-student`. |
| `/api/v1/chat/completions` | `POST` | High-throughput streaming proxy connecting the chat interface to the FastAPI multi-agent orchestrator; falls back directly to local Ollama if backend is unavailable. |
| `/api/v1/chat/history` | `GET`, `POST` | Retrieves or resets student conversation history on disk/database (supports clean reset on "New Chat"). |
| `/api/v1/documents/upload` | `POST` | Multipart resume upload proxy forwarding `.pdf` and `.docx` documents to in-memory parser. |
| `/api/v1/matching/live-jobs` | `GET` | Retrieves active placement drives, criteria cutoffs, and student fit match previews. |
| `/api/v1/onboarding/complete`| `POST` | Canonical versioned proxy for onboarding activation and radar graph generation. |

---

## 🔒 Error Codes & Security Policies

* **Hard Eligibility Gating:** Eligibility endpoints return strict boolean status codes:
  * `MEETS`: Student meets all mandatory cutoffs.
  * `DOES_NOT_MEET`: Student fails one or more mandatory cutoffs; includes exact reason code (e.g. `CGPA_BELOW_CUTOFF: 7.4 < 8.0`).
  * `UNKNOWN`: Missing prerequisite verification data; prompts the student to take a 120s micro-defense.
* **DPDP Small-Cell Suppression:** Any cohort aggregate query returning $< 5$ candidates automatically suppresses counts as `"< 5"` to prevent identity inference.
* **Audit Trail Invariant:** All mutations to student profiles, faculty endorsements, and officer overrides append an immutable record to `data/campusbridge_db.xlsx` (`SHEET_AUDIT`).
