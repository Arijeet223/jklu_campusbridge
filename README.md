# CampusBridge AI (PS-06)
### High-Trust University Career Intelligence & Placement Automation Platform
*Deterministic Shell, Probabilistic Core — Engineered for Institutional Campus Recruitment*

---

## 🏛️ Executive Summary & PS-06 Problem Statement

University campus recruitment across premier engineering institutions (IITs, NITs, and state universities) is plagued by high-stakes operational friction:
* **The Manual Verification Bottleneck:** Placement offices and faculty mentors cannot manually audit hundreds of student resumes, leaving skill claims stuck at unverified self-reports.
* **The Black-Box Hallucination Problem:** Most generic AI career tools compute arbitrary, probabilistic "employability scores" that hallucinate credentials, misinterpret prerequisites, and expose institutions to compliance liability.
* **Recruiter Over-Filtering & Liquidity Choke:** Recruiters specify overly restrictive mandatory cutoffs (e.g. *"8.5+ CGPA AND production Kubernetes"*), filtering out 95% of qualified students and creating placement deadlocks.
* **Privacy & DPDP Vulnerabilities:** Student personal data, unconfirmed drafts, and academic transcripts are frequently exposed across unsecured spreadsheets and uncontrolled scrapers.

**CampusBridge AI solves PS-06 through a foundational architectural thesis:**
> **"Deterministic Shell, Probabilistic Core"**  
> All eligibility gates, rubric calculations, small-cell anonymization thresholds, and audit transitions run in **100% deterministic pure Python/SQL with zero black-box ML**. LLMs and specialist agents operate solely as bounded advisory assistants behind scoped Model Context Protocol (MCP) tool gateways.

---

## ⚡ Key System Architecture: "Deterministic Shell, Probabilistic Core"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAMPUSBRIDGE AI STUDIO                           │
│     Student Companion  •  Placement Officer  •  Recruiter  •  Faculty       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      REST API / JWT Session / Zero-Trust
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DETERMINISTIC SHELL (FastAPI / SQL)                   │
│  • Hard Eligibility Engine (MEETS / DOES_NOT_MEET / UNKNOWN)                │
│  • Weighted Fit Rubric Calculator (<50ms performance)                       │
│  • Counterfactual Sandbox State Machine                                     │
│  • DPDP Privacy Shield & Small-Cell Suppression (< 5 masked)                │
│  • 6-Tier Immutable Evidence Ledger & Visual Provenance                     │
└──────────────────────────────┬───────────────────────────────┬──────────────┘
                               │                               │
                      Read/Write Queries              Tool Invocations (RBAC)
                               ▼                               ▼
                 ┌──────────────────────────┐   ┌─────────────────────────────┐
                 │  Postgres 16 + pgvector  │   │  Scoped Internal MCP Server │
                 │  Redis 7 Cache           │   │  (6 servers, 13 tools,      │
                 │  MinIO S3 Quarantine     │   │   sliding-window quotas)    │
                 └──────────────────────────┘   └──────────────┬──────────────┘
                                                               │ Scoped Tools
                                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROBABILISTIC CORE (Specialist Agents)                │
│  • Profile Intelligence Agent   • Job Intelligence Agent                    │
│  • Readiness Coach (72h/Marathon) • Career Match Explanation Agent           │
│  • Interview Coach (120s Defense) • Placement Operations Copilot            │
│  • Guardrailed Model Gateway (Token Budgeting, 0 Prompt Injection Tolerance)│
└─────────────────────────────────────────────────────────────────────────────┘
```

### The 4 Non-Negotiable Engineering Invariants
1. **Zero Hallucinated Eligibility:** Eligibility checks return strict boolean outcomes (`MEETS`, `DOES_NOT_MEET`, `UNKNOWN`). An LLM can never override an explicit cutoff.
2. **100% Visual Provenance:** Every displayed skill claim carries an immutable tuple `(source_document_id, source_span, evidence_status)`. Clicking opens the original PDF source.
3. **Zero Biometric Surveillance:** Micro-defenses are 100% asynchronous and text-based. No invasive webcams, facial emotion AI, or voice accent scoring.
4. **Least-Privilege Tenancy:** Multi-tenant isolation enforced at the database layer (`institution_id`, `department_id`, `student_id`). Cross-tenant leaks are evaluated in automated CI red-team suites.

---

## 🌟 The 5 Signature v1.1 Innovations

### 1. "Ghost-to-Solid" Profile Provenance Engine (`FR-012`, `FR-039`)
When students upload resumes or project artifacts, extracted skills are presented as provisional **Ghost Cards** (dashed violet border `#C4B5FD`, soft lavender surface `#F5F3FF`) paired with exact text citation pills (`[Resume_v3.pdf • p.1, §Experience]`). Clicking the pill slides open the side-by-side **SourceDrawer**, highlighting the raw text. Only student confirmation or faculty endorsement transforms them into **Solid Cards** in the canonical profile.

### 2. Interactive "What-If" Fit Sandbox (Counterfactual Simulation) (`FR-025`)
Instead of opaque static scores, students open the **Counterfactual Sandbox** on any job opportunity. Toggling hypothetical actions—such as *"Verify FastAPI Microservice via 120s Defense (+11 pts)"* or *"Complete SQL Quiz (+8 pts)"*—recalculates their rubric score from **74% to 93% in $< 50\text{ ms}$** without invoking an LLM or mutating their real profile.

### 3. 120-Second Proof-of-Work Micro-Defense (`FR-026`)
Eliminates faculty verification bottlenecks. When students link a code repository or project report, the **Interview Coach Agent** ingests the raw code and generates **3 fast, artifact-grounded technical questions** (e.g. *"In `order_service.py`, how did you implement idempotency when payment webhooks retry?"*). Passing scores upgrade skills to `Assessment-verified (Artifact Defense)` with an immutable audit link.

### 4. "72-Hour Drive Sprint" vs. "Semester Marathon" Adaptive Coaching (`FR-022`)
The **Readiness Coach Agent** dynamically adapts its curriculum based on time-to-deadline:
* **Semester Marathon Mode ($> 14$ days):** Deep foundational roadmaps, capstones, and competency milestones.
* **72-Hour Drive Sprint Mode ($< 72$ hours):** Suppresses multi-week courses and generates a high-yield **3-Hour Triage Kit** (top 2 projects to verify, resume keyword re-anchoring, and a 5-question STAR rapid-fire mock interview).

### 5. Placement Officer Cohort Liquidity Simulator & Explain-or-Dispute Queue (`FR-036`, `FR-038`)
Officers can ingest recruiter JDs, view AI-parsed Mandatory vs. Preferred criteria, and simulate cohort applicant pool depth in real time. Toggling an overly restrictive requirement (e.g. shifting Kubernetes from Mandatory to Preferred) expands qualified student liquidity from **6 to 64 candidates**, with automatic small-cell privacy protection for $< 5$ students. Students flagged as `UNKNOWN` can click interactive pills to submit clarification tickets directly to the officer's review queue.

---

## 👥 The 4 Unified Persona Workspaces

| Persona | Key Capabilities & Features | UI Surface |
| :--- | :--- | :--- |
| **Student** | • Home Command Center with 6-Dimension Progression Radar<br>• Conversational Profile Memory (natural language updates)<br>• Drag-and-drop resume uploader with malware quarantine<br>• What-If Counterfactual Sandbox & 120s Skill Proof Defenses<br>• DPDP Privacy Shield & 1-click JSON Data Archive export | Default Landing (`/`)<br>• Home Hub (`overview`)<br>• Companion Chat (`all`)<br>• Verification Queue (`skills`) |
| **Placement Officer** | • **Tab 1: JD Ingestion Studio:** AI layout parsing, criteria review & 1-click publish<br>• **Tab 2: Cohort Liquidity Simulator:** Dynamic gating with $<5$ masking<br>• **Tab 3: Student Exception Queue:** Reason-coded dispute adjudication | Officer Studio (`currentRole: OFFICER`) |
| **Recruiter Partner** | • Review published campus drives<br>• Inspect *only* consented, opted-in candidate profiles<br>• Anonymized aliases with verified skill badges and STAR defense transcripts | Recruiter Portal (`currentRole: RECRUITER`) |
| **Faculty Mentor** | • Advisee readiness tracking across batch of 2027<br>• Inspect capstone project reports and GitHub repositories<br>• 1-click `[★ Endorse as Institution-Verified]` credential upgrades | Faculty Advisory (`currentRole: FACULTY`) |

---

## 🛠️ Complete Technology Stack

| Layer | Technologies & Rationale |
| :--- | :--- |
| **Frontend Studio** | • **Next.js 14** (App Router, Server & Client Components)<br>• **TypeScript 5.0+** (Strict null checks, zero `any` types in core domain)<br>• **Tailwind CSS v3.4** (*Warm Institutional Studio* tokens, `#FAF8F5` canvas)<br>• **Lucide Icons & Radix UI Primitives** (Accessible, keyboard-first, zero-jargon) |
| **Backend & MCP Services** | • **FastAPI** (High-throughput async Python 3.11+)<br>• **Pydantic v2** (Strict schema validation and data contracts)<br>• **Model Context Protocol (MCP)** (6 internal servers, 13 scoped tools)<br>• **LangGraph / State-Graph Orchestrator** (Deterministic agent transitions) |
| **Data & Storage** | • **PostgreSQL 16 with pgvector** (Relational metadata + 1536-dim embeddings)<br>• **Redis 7** (In-memory token-bucket rate limits, session caches)<br>• **MinIO** (S3-compatible document quarantine & raw artifact storage) |
| **RAG & Evidence Pipeline** | • **MIME Sniffing & Isolated Quarantine** (Magic byte validation)<br>• **Section-Aware Layout Chunker** (Character offsets & structural paths)<br>• **Reciprocal Rank Fusion (RRF)** (BM25 keyword + dense vector retrieval)<br>• **Strict Citation Sanitizer** (Zero ungrounded claims permitted) |

---

## 🚀 Quickstart & One-Click Startup

### Prerequisites
* **Python 3.11+** installed
* **Node.js 18+** & `npm` installed
* *(Optional)* Docker & Docker Compose for PostgreSQL/Redis/MinIO

### Option 1: One-Click PowerShell Launcher (Recommended)
Launch both backend and frontend, validate dependencies, and run the complete 55-test verification suite automatically:
```powershell
.\start-campusbridge.ps1
```
*To skip tests for fast reboot:*
```powershell
.\start-campusbridge.ps1 -SkipTests
```

### Option 2: Docker Compose (Full Container Stack)
```bash
docker compose up -d
```

### Option 3: Manual Step-by-Step Launch
1. **Start the FastAPI Backend Service:**
   ```bash
   python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000
   ```
2. **Start the Next.js Studio Frontend:**
   ```bash
   cd apps/web
   npm install
   npm run build
   npm start
   ```
3. **Open the Studio in Your Browser:**
   * **Student Command Center & AI Companion:** [http://localhost:3000](http://localhost:3000)
   * **Placement Officer Console:** [http://localhost:3000](http://localhost:3000) *(Menu $\rightarrow$ Switch to Officer)*
   * **Recruiter Partner Portal:** [http://localhost:3000](http://localhost:3000) *(Menu $\rightarrow$ Switch to Recruiter)*
   * **Faculty Mentor Advisory:** [http://localhost:3000](http://localhost:3000) *(Menu $\rightarrow$ Switch to Faculty)*
   * **FastAPI Swagger API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Automated Test Suite (55/55 Passing Tests)

CampusBridge AI enforces strict continuous verification through 5 hermetic test suites. Execute all tests with:
```powershell
python -u tests/test_domain_and_api.py
python -u tests/test_rag_pipeline.py
python -u tests/test_mcp_ecosystem.py
python -u evals/eval_suite.py
python -u tests/test_agent_endpoints.py
```

### Summary of Passing Verification Gates
```text
======================================================================
[PASS] Phase 1: Deterministic Engine & Scoring (13/13 tests)
       • Hard-Gate Engine (6/6) • Fit Alignment (2/2) • Sandbox (<50ms) (1/1) • API Endpoints (4/4)
[PASS] Phase 2: RAG Pipeline & Evidence Quarantine (14/14 tests)
       • Quarantine & MIME (4/4) • Section Chunker (1/1) • Embeddings (2/2) • RRF Retrieval (2/2)
       • Strict Citation Sanitizer (2/2) • Ingestion & Search Endpoints (3/3)
[PASS] Phase 3: Scoped MCP Tool Ecosystem (9/9 tests)
       • Registry Schemas • student-profile • career-knowledge • job-intelligence
       • matching • placement-ops • analytics (k-anonymity) • RBAC • Rate Limiter
[PASS] Phase 4: Adversarial Red-Team & CI Evals (7/7 gates)
       • Gate 1: 100% Valid Ghost Card Spans
       • Gate 2: 0 Hallucinated Citations
       • Gate 3: 0 Prompt Injections across 100+ poisoned samples (0 leaks, 0 escalations)
[PASS] Phase 4: Specialist Agent Endpoints (12/12 tests)
       • 6 Specialist Agents • 72h Sprint Dispatch • 120s STAR Defense • Multi-Agent Pipeline
       • Micro-Defense Rubrics • Casual Slang & Mentor Tone • Plain-English UX
======================================================================
ALL 55 BACKEND TESTS PASSED SUCCESSFULLY (100% Pure & Deterministic)
======================================================================
```

---

## 📡 API Endpoints & MCP Tools Reference

CampusBridge AI features a decoupled architecture with **78 canonical FastAPI backend endpoints**, **10 Next.js edge API proxies**, and **6 internal Model Context Protocol (MCP) servers** housing **13 scoped tools**.

👉 **For the complete, human-readable reference of every endpoint, tool schema, and access policy, consult: [`API_AND_MCP_README.md`](API_AND_MCP_README.md)**

### Multi-Agent Pantheon & Assigned MCP Tools

| Agent | Core Persona | Invariant / Boundary | Scoped MCP Tools |
| :--- | :--- | :--- | :--- |
| **🤖 J.A.R.V.I.S.** | Lead Cognitive Orchestrator | Contextual intent routing, natural guidance across all personas. | `career-knowledge.search_role_guides`<br>`student-profile.get_my_profile` |
| **🌿 T.E.R.R.A.** | Evidence & Skill Provenance | 100% visual text provenance; provisional Ghost Cards from resumes and code. | `student-profile.get_my_profile`<br>`student-profile.list_my_evidence`<br>`student-profile.propose_profile_update` |
| **🛡️ R.O.N.E.N.** | Deterministic Gatekeeper | 100% deterministic cutoffs (CGPA, backlogs, branch); boolean outcomes (`MEETS`, `DOES_NOT_MEET`, `UNKNOWN`). | `matching.run_match_preview`<br>`matching.explain_match`<br>`job-intelligence.get_approved_job` |
| **⚡ A.T.H.E.N.A.** | 120s Micro-Defense Coach | Text-only artifact-grounded technical challenges; STAR defense questions without surveillance. | `placement-ops.get_practice_challenge`<br>`matching.run_match_preview` |
| **⏱️ K.R.O.N.O.S.** | Readiness Coach & Sprint Architect | Adaptive coaching modes (72h Drive Sprint vs. Semester Marathon); triage checklists. | `placement-ops.create_study_task`<br>`placement-ops.list_my_applications`<br>`career-knowledge.search_learning_resources` |
| **📑 Workspace Copilot** | Placement Ops & Institutional Copilot | Recruiter JD criteria parsing, cohort liquidity simulation, and institutional email drafting. | `job-intelligence.draft_job_requirements`<br>`placement-ops.record_human_review`<br>`analytics.get_cohort_summary`<br>`workspace.execute` |

---

## 📖 Live Demonstration Playbook

For a structured, 3-minute walkthrough showing exactly what to click and type across all 4 persona workspaces during an evaluation or hackathon demonstration, consult:
👉 **[`docs/DEMO_PLAYBOOK.md`](docs/DEMO_PLAYBOOK.md)**

---

## 🔒 Security, Compliance & DPDP 2023 Alignment

* **Digital Personal Data Protection (DPDP) Act 2023:** Built with privacy by default (`FR-004`). Students maintain granular, per-company visibility switches. Revoking consent immediately drops access and invalidates all cached recruiter views.
* **Small-Cell Suppression ($k < 5$):** Aggregated cohort analytics strictly mask groups smaller than 5 individuals as `"< 5"` to prevent re-identification attacks.
* **Tamper-Evident Audit Ledgers:** Every profile mutation, micro-defense Q&A transcript, officer exception approval, and faculty endorsement records an immutable timestamp, actor ID, and reason code.
* **Data Subject Rights (`FR-015`):** Students can download their complete machine-readable data package (`JSON`) or permanently purge provisional AI drafts with a single click.

---

## 📄 License & Institutional Credits

Developed for the **Campus Placement AI Innovation Challenge (PS-06)**.  
Designed according to the **Warm Institutional Studio** design specifications (`DESIGN.md`) and the **CampusBridge AI Product Requirements Document v1.1** (`campusbridge_ai_prd_v1_1.md`).

