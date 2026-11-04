# PRODUCT REQUIREMENTS DOCUMENT
**PS-06 | CAMPUSBRIDGE AI — INTELLIGENT PLACEMENT READINESS & CAREER MATCHING AGENT**

*A university-grade, local-first AI agent infrastructure for evidence-based career readiness, counterfactual opportunity simulation, explainable career matching, and accountable placement operations.*

| DOCUMENT FIELD | VALUE |
| :--- | :--- |
| **Problem Statement** | PS-06 — Intelligent Placement Readiness and Career Matching Agent |
| **Working Product Name** | CampusBridge AI |
| **Document Version** | 1.1 — Upgraded Product, UX Ergonomics, & Architecture Baseline |
| **Date** | 1 November 2026 |
| **Deployment Posture** | University-controlled, local-first / on-premises by default |
| **Intended Audience** | Product team, university placement cell, IT/security, academic stakeholders, reviewers |
| **Document Status** | Upgraded v1.1 Specification for Institutional Review & Pilot Execution |

> **DESIGN THESIS**
> Use AI to make student capabilities visible, turn gaps into low-anxiety, time-aware preparation, and help students and placement teams discover better-fit opportunities through interactive simulation—without turning an LLM into an opaque hiring authority.

---

## Document Map
1. Executive Summary and Product Charter
2. Problem, Users, Outcomes, and Principles
3. Scope, Exclusions, and Assumptions
4. Key Journeys, Operating Model, and v1.1 Signature Innovations
5. Functional Requirements and Acceptance Criteria
6. Readiness and Career Matching Methodology
7. Agent System and Orchestration Design
8. RAG, Evidence, and Knowledge Architecture
9. MCP Tool Ecosystem and Integration Contracts
10. Guardrails, Trust Boundaries, and Resource Restrictions
11. Data Architecture and Domain Model
12. Local-First Production Architecture and Technology Choices
13. Security, Privacy, and Governance
14. Caching, Performance, and Resilience
15. Evaluation, Observability, and Release Gates
16. UX, Accessibility, and Visual Ergonomics ("Warm Institutional Studio")
17. API Surface and Integration Plan
18. Delivery Roadmap and Work Breakdown
19. Risks, Dependencies, and Open Decisions
20. Acceptance Checklist and Definition of Done
* Appendix A. Suggested Repository Structure
* Appendix B. Glossary and Standards References

---

## 1. Executive Summary and Product Charter

CampusBridge AI is a university-operated placement intelligence platform that helps students become placement-ready and helps placement teams and recruiters identify relevant opportunities using transparent, evidence-backed signals. It combines student profiles, verified skill evidence, structured job requirements, counterfactual fit simulations, adaptive career guidance, formative micro-assessments, and a controlled agent infrastructure.

The platform is **never** an automated hiring or rejection engine. It is a decision-support, coaching, and preparation system. It explains why an opportunity appears relevant, shows students exactly how verifying a project or completing a micro-assessment shifts their opportunity fit, empowers placement officers to calibrate job criteria against live cohort readiness, and leaves consequential actions—shortlisting, eligibility exceptions, interview selection, offer decisions, and application submission—entirely with authorised humans or the student.

### Core Product Promise
For every recommendation, score, or gate, the system must immediately answer in plain language and interactive UI:
1. **What evidence was used and where did it come from?** (Inline provenance pills with one-click source highlighting)
2. **What deterministic policy was applied?** (Strict separation of hard eligibility gates from weighted alignment)
3. **What is uncertain or missing?** (Explicit `Unknown` and `Insufficient Evidence` states—never penalized as zero capability)
4. **Who can see it?** (Persistent Privacy Shield bar and granular purpose-bound opt-in)
5. **How can a student or human officer improve or correct it right now?** (Counterfactual Sandbox & 1-Click Explain-or-Dispute flows)

### 1.1 Product Vision
Create a trusted, campus-controlled career intelligence layer that turns fragmented student information into a living, auditable profile of skills, proof-of-work, readiness, interests, and opportunity fit. The system elevates student agency, eliminates verification bottlenecks, and multiplies placement-team efficiency while preserving privacy, fairness, and institutional sovereignty.

### 1.2 Product Objectives
* Give each student a clear, low-anxiety, updateable view of skills, projects, evidence provenance, readiness gaps, and role interests.
* Let students simulate how adding evidence or passing micro-assessments unlocks new campus opportunities via a deterministic **Counterfactual "What-If" Sandbox**.
* Eliminate faculty verification bottlenecks via **120-Second "Proof-of-Work" Micro-Defenses** and automated artifact checks.
* Help students convert identified gaps into time-horizon-aware preparation plans (**72-Hour Drive Sprint** vs. **Semester Marathon** modes).
* Convert recruiter job descriptions into structured, reviewable requirements alongside a **Placement Officer Liquidity Simulator** that previews cohort eligibility impact before publishing.
* Run the AI stack locally or inside university-controlled infrastructure by default, with external model/API egress disabled unless explicitly approved.
* Provide production-grade controls for identity, tenant/course boundaries, data minimisation, MCP tool permissions, rate limits, caching, evaluation, tracing, and incident response.

### 1.3 Product North Star
**Primary Outcome:** Increase the proportion of students who can demonstrate verified, role-relevant capability and confidently navigate placement opportunities. Measure this through readiness progression, verified evidence coverage, counterfactual sandbox conversion (simulated gaps turned into verified proofs), relevant opportunity discovery, and placement-team time saved—never by optimising a single opaque employability score.

### 1.4 Product Boundaries

| IN SCOPE | OUT OF SCOPE |
| :--- | :--- |
| Career readiness, skill evidence, Proof-of-Work micro-defenses, Counterfactual Fit Sandbox, Sprint/Marathon learning plans, JD intelligence, Cohort Liquidity Simulator, explainable matching, application tracking, text-based interview practice, placement analytics. | Automated final hiring decisions, auto-rejection decisions, guaranteed placement predictions, salary predictions, personality inference, emotion recognition, voice accent scoring, or covert student surveillance. |
| Local-first LLM/RAG/agent infrastructure, scoped MCP tools, security controls, evaluation, and observability. | Training foundation models on student records by default, or sending student records to public APIs without explicit governance approval. |
| Optional integrations with SIS/LMS/ERP, GitHub/GitLab commit verification, and recruiter systems through approved interfaces. | Scraping or bypassing access controls on job portals, recruiter systems, or private websites. |

---

## 2. Problem, Users, Outcomes, and Principles

### 2.1 Problem Statement
University placement preparation is fragmented across resumes, course records, GitHub repositories, certificates, assessments, placement notices, spreadsheets, job descriptions, and informal mentor feedback. Students experience high anxiety because they do not know which skills they can prove, how close they are to qualifying for upcoming drives, or whether a 48-hour prep effort will meaningfully improve their standing. Placement teams must manually reconcile inconsistent records, negotiate unrealistic recruiter criteria without live cohort data, and repeatedly interpret ambiguous job requirements. Faculty mentors face unsustainable queues if asked to manually verify every student claim.

A generic chatbot fails here: it hallucinates skills, misreads hard eligibility rules, exposes private records, and provides un-auditable advice. PS-06 requires a domain-specific intelligence system with a **deterministic policy shell around a bounded probabilistic core**, paired with an empowering, tactile user experience.

### 2.2 Target Users and Permissions

| PERSONA | NEEDS | DEFAULT ACCESS BOUNDARY |
| :--- | :--- | :--- |
| **Student** | Build profile; upload resume/artifacts; confirm extracted skills; simulate fit in Counterfactual Sandbox; pass 120s Proof-of-Work micro-defenses; switch between Sprint/Marathon prep; resolve `Unknown` eligibility flags; track applications. | Own profile, evidence, assessments, preferences, sandbox states, and applications; explicit per-opportunity or per-purpose toggle for recruiter visibility. |
| **Placement Officer** | Publish opportunities; verify policy criteria; use Cohort Liquidity Simulator to tune JD gates; review match explanations; adjudicate 1-click student eligibility clarifications; manage cohorts. | Institution/program/cohort scope assigned by university; no unrestricted cross-campus access by default; privileged exports require reason codes. |
| **Department Coordinator / Faculty Mentor** | Guide assigned students; view readiness progress and mentor notes; batch-verify academic/capstone evidence; recommend preparation. | Only assigned advisees and approved academic evidence; no recruiter-only data or private student sandbox simulations. |
| **Recruiter Partner** | Submit job descriptions; collaborate on structured requirements; view opted-in eligible profiles with verified provenance badges; request interview pipeline. | Only published opportunity and consented/visible student data snapshots; cannot query raw institutional database or unshared fields. |
| **Platform Administrator** | Operate services, users, policy configuration, model versions, MCP registries, integrations, backups. | Operational access separated from academic content; privileged break-glass access is time-bound and audited. |
| **Auditor / Governance Reviewer** | Inspect access logs, scoring rubrics, model versions, evaluation outcomes, human overrides, fairness cohorts, and incidents. | Read-only, purpose-limited audit access; PII masked unless formally authorised. |

### 2.3 Product Principles
1. **Human Authority & Tactile Agency:** AI suggests, explains, and prepares; students and authorised officers retain control over profile facts, visibility, and consequential decisions.
2. **Evidence Before Inference:** Every skill claim links to a source document, page/section span, timestamp, extraction confidence, and verification tier.
3. **Explainability & Counterfactual Clarity:** Every readiness dimension and match factor is visible, versioned, challengeable, and interactive—showing students not just *where they stand*, but *how specific actions move the needle*.
4. **Low-Anxiety Coaching Framing:** Missing data or unverified skills are framed as constructive invitations to add proof (`Warm Amber` coaching states), never as punitive failures.
5. **Privacy by Default:** Private student records are invisible to recruiters or peers unless the student and institutional policy explicitly permit sharing.
6. **Local-First Sovereignty:** Campus-controlled inference, storage, embeddings, and logs are the default; external connectivity is explicit and allow-listed.
7. **Deterministic Policy Shell:** Hard eligibility, access control, scoring arithmetic, and workflow transitions are deterministic code/policy decisions, never LLM opinions.
8. **Inclusive, Low-Bandwidth Access:** WCAG 2.2 AA compliant, mobile-responsive, low-bandwidth friendly, English-first with architectural readiness for Hindi and Indian languages.

### 2.4 Success Outcomes

| OUTCOME | MEASURE | INITIAL PILOT TARGET (PROPOSED) |
| :--- | :--- | :--- |
| **Student Profile & Evidence Quality** | Share of active student profiles with validated core fields and $\ge 2$ verified/artifact-backed skills. | $\ge 75\%$ of pilot cohort by end of pilot; adjust after baseline. |
| **Verification Velocity** | Median time for a student to upgrade an `Artifact-linked` skill to `Assessment-verified` via Proof-of-Work Micro-Defense. | $< 5$ minutes end-to-end without blocking on faculty queues. |
| **Readiness Progression** | Change in rubric-based readiness dimensions between baseline and follow-up. | Statistically positive cohort-level movement; report full distributions. |
| **Match Relevance** | Human-reviewed precision of top-5 suggested opportunities. | $\ge 80\%$ of top-5 suggestions judged relevant in pilot sample. |
| **Evidence Integrity** | Percentage of displayed skill claims linked to provenance and verification state. | $100\%$ of AI-extracted claims show source span and verification state. |
| **Zero-Trust Safety** | Unauthorised cross-student/cross-role disclosure or forbidden tool action. | $0$ tolerated in release and adversarial red-team test suite. |
| **Placement Team Efficiency** | Median officer time to convert a raw JD into calibrated, liquidity-checked criteria and a candidate pool. | $\ge 40\%$ faster than baseline, with fewer post-publish eligibility disputes. |

---

## 3. Scope, Exclusions, and Assumptions

### 3.1 MVP Scope (Pilot Launch)
* Campus identity and RBAC/ABAC enforcement (OIDC/SAML integration + local Keycloak dev identity).
* Student profile, persistent **Privacy Shield** visibility controls, resume/portfolio upload, **Ghost-to-Solid** confirmation UI, and immutable change history.
* Asynchronous document quarantine, malware scanning, layout-aware parsing, skills extraction with bounding-box/section spans, and human confirmation.
* Versioned role taxonomy and skill ontology with synonyms, proficiency descriptors, and 6-tier evidence states.
* Multidimensional readiness dashboard, role-specific gap analysis, **Counterfactual "What-If" Fit Sandbox**, and adaptive **Sprint vs. Marathon** preparation plans.
* **120-Second Proof-of-Work Micro-Defense** workflow for text-based artifact verification.
* Placement Officer job-posting workspace, JD parsing, **Cohort Liquidity Simulator**, explicit criteria approval, and match-run review.
* Explainable opportunity recommendations with **Two-Stage Match Cards** (deterministic eligibility gates separated from alignment meters) and **Bidirectional Explain-or-Dispute Pills**.
* Controlled LangGraph-style orchestrator, bounded specialist agents, internal scoped MCP server, and local model gateway (vLLM / llama.cpp).
* Hybrid RAG over approved career guides, student documents, and placement policies with strict pre-retrieval ACL filtering and inline citation pills.

### 3.2 Later Phases (P2+)
* Direct SIS/LMS/ERP integrations and automated registrar academic-record sync.
* Cryptographic GitHub/GitLab webhook verification and external coding platform integrations.
* Approved recruiter ATS webhooks, automated interview slot scheduling, and offer lifecycle tracking.
* Multilingual student UI and multilingual embedding/reranking (Hindi + regional languages).
* Multi-campus federation and privacy-preserving aggregate inter-university benchmarking.

### 3.3 Explicit Exclusions
* **No automated accept/reject, auto-shortlisting, or automated offer allocation.**
* **No protected or sensitive traits as matching features:** gender, caste, religion, ethnicity, disability, age, marital status, photographs, name-derived proxies, institution prestige proxies, or inferred personality/health characteristics.
* **No biometric or affective surveillance:** no emotion recognition, facial analysis, voice accent scoring, or webcam proctoring in readiness or interview practice.
* **No hiring probability claims:** alignment indices are explicitly labelled as rubric fit, never as a probability of getting hired or commanding a specific salary.
* **No unrestricted agent autonomy:** no shell execution, arbitrary SQL, open web scraping, or self-approving policy changes.

---

## 4. Key Journeys, Operating Model, and v1.1 Signature Innovations

### 4.1 Student Onboarding & "Ghost-to-Solid" Profile Creation
1. Student signs in via university SSO and sets baseline sharing rules in the **Privacy Shield** onboarding card (Private by default).
2. Student uploads resume, certificates, project summaries, and code/portfolio artifacts.
3. Files pass through quarantine, MIME/archive validation, malware scanning, and layout-aware parsing.
4. **Profile Intelligence Agent** proposes extracted skills and project facts inside **Ghost Cards** (dashed border, soft lavender surface) paired with inline **Provenance Pills** (`[Resume p.1, §Experience • 92% conf]`).
5. Clicking a Provenance Pill opens the side-by-side **Source Drawer** highlighting the exact PDF text span.
6. Student clicks **Confirm (`✓`)**, edits, or rejects each Ghost Card. Confirmed cards animate into **Solid Cards** (`1px` crisp border, verified timestamp) and enter the canonical profile.

### 4.2 Signature Innovation 1: Interactive "What-If" Opportunity Simulator (Counterfactual Sandbox)
* **User Problem:** Static match scores (e.g., `68% Alignment`) feel judgmental and opaque. Students don't know which specific effort yields the highest return across multiple target roles.
* **How It Works:** On any Role Explorer or Opportunity Card, the student activates **Simulate My Fit**. Because the scoring service is 100% deterministic (Section 6.4), toggling hypothetical actions—such as *"Verify FastAPI Project via 120s Micro-Defense"* or *"Complete SQL Query Optimization Assessment"*—recalculates the alignment bar and cohort eligibility standing in **$< 100\text{ ms}$** without calling an LLM or mutating their real profile.
* **Outcome:** The student sees: *"Completing these 2 actions boosts your Backend Engineer alignment from $68\%$ to $89\%$ and satisfies the mandatory proof gate for 3 active campus drives."* One click converts the simulated toggles into committed tasks in their Study Plan.

### 4.3 Signature Innovation 2: "Proof-of-Work" 120-Second Micro-Defense
* **User Problem:** Faculty mentors do not have time to manually verify hundreds of student projects, leaving student skills stuck at `Student-confirmed` or `Artifact-linked` status.
* **How It Works:** When a student links a project report, architecture doc, or code repository extract, they can launch a **120-Second Proof-of-Work Micro-Defense**. The **Interview Coach Agent** ingests the student's specific artifact chunks and asks **3 targeted, asynchronous text questions** about design trade-offs, edge cases, or implementation details in their own work (e.g., *"In your uploaded `order_service.py`, how did you handle idempotency when payment webhooks retry?"*).
* **Outcome:** Responses are scored against a transparent rubric for technical coherence and artifact grounding. Passing upgrades the skill's evidence tier to `Assessment-verified (Artifact Defense)` with an immutable link to the Q&A transcript—giving recruiters high-signal proof without burdening faculty.

### 4.4 Signature Innovation 3: "72-Hour Drive Sprint" vs. "Semester Marathon" Coaching
* **User Problem:** A standard 4-week learning plan is useless when a dream company posts a campus drive closing in 48 hours.
* **How It Works:** The **Readiness Coach Agent** adapts its output schema based on the student's selected time horizon:
  * **Semester Marathon Mode (Default / $> 14$ days):** Recommends deep foundational courses, capstone project ideas, and progressive competency assessments.
  * **72-Hour Drive Sprint Mode ($< 72$ hours to deadline):** Suppresses multi-week courses and generates a high-yield **3-Hour Triage Kit**: (1) Top 2 existing projects to verify via 120s Micro-Defense, (2) Resume bullet point re-anchoring suggestions mapped to the JD's exact keywords, and (3) A 5-question rapid-fire STAR mock interview tailored to the role rubric.

### 4.5 Signature Innovation 4: Placement Officer "Cohort Liquidity Simulator"
* **User Problem:** Recruiters frequently submit overly restrictive criteria (e.g., *"8.5+ CGPA AND production Kubernetes experience"*), inadvertently filtering out $95\%$ of the graduating class and causing placement bottlenecks.
* **How It Works:** Inside the Placement Officer’s Opportunity Approval Workspace, alongside the extracted JD criteria, a live **Cohort Liquidity Histogram** updates in real time as the officer adjusts mandatory vs. preferred rules:
  * Shows total eligible students (`Meets`), students with `Unknown` data who need a quick nudge, and alignment score distribution across the permitted cohort (enforcing k-anonymity / small-cell suppression for $< 5$ students).
* **Outcome:** The Placement Officer can immediately show a recruiter: *"Making Kubernetes 'Preferred' instead of 'Mandatory' expands your qualified candidate pool from 4 students to 58 students who already have verified Docker and Linux evidence."*

### 4.6 Signature Innovation 5: Bidirectional "Explain-or-Dispute" Eligibility Pills
* **User Problem:** When a student is flagged as `Unknown` or `Does Not Meet` due to an unparsed transcript field or an approved academic equivalence, resolving it via email takes days.
* **How It Works:** Every deterministic rule badge on a student's Match Card is interactive. Clicking an `Unknown` or `Does Not Meet` pill opens a pre-scoped drawer showing the exact policy clause and allowing the student to attach a specific document span or equivalence note. This creates a structured ticket directly in the Placement Officer's **Exception Queue** for 1-click adjudication and automatic cache invalidation.

---

## 5. Functional Requirements and Acceptance Criteria

*Priority codes: **P0** = required for pilot; **P1** = required for production rollout; **P2** = later enhancement.*

### 5.1 Identity, Tenancy, and Access

| ID / PRIORITY | REQUIREMENT | ACCEPTANCE CRITERIA |
| :--- | :--- | :--- |
| **FR-001 / P0** | Support university identity integration through OIDC or SAML, with local dev identity provider for standalone development. | User role, institution, program, and active status are obtained from trusted claims; invalid/expired sessions are denied. |
| **FR-002 / P0** | Enforce RBAC plus resource-level ABAC for student, placement officer, coordinator, recruiter, admin, and auditor. | Automated tests prove a student cannot read another student's private records; recruiter sees only opted-in, permitted fields; officer sees only assigned scope. |
| **FR-003 / P0** | Support logical `institution_id`, `campus_id`, `department_id`, `program_id`, `cohort_id`, and `opportunity_id` scope. | Every database query and vector retrieval derives tenant identifiers from authenticated context, never from untrusted client payloads. |
| **FR-004 / P0** | Maintain consent and visibility preferences via the persistent **Privacy Shield** control with versioned notices. | Student can toggle recruiter visibility per opportunity/purpose; withdrawal immediately halts access and invalidates derived caches/views. |
| **FR-005 / P1** | Provide privileged access management and break-glass workflow. | Admin access to unmasked content is time-bound, reason-coded, approved where required, logged, and reviewed. |

### 5.2 Student Profile, Evidence, and Documents

| ID / PRIORITY | REQUIREMENT | ACCEPTANCE CRITERIA |
| :--- | :--- | :--- |
| **FR-010 / P0** | Maintain a structured student profile and career preferences. | Fields store source, `updated_at`, ownership, visibility state, and validation rules. |
| **FR-011 / P0** | Upload resume, certificates, project descriptions, and approved code/portfolio extracts. | Content-based MIME sniffing, archive expansion bounds, and ClamAV/malware scanning execute in quarantine before parsing. |
| **FR-012 / P0** | Extract resume fields and skills as provisional **Ghost Cards**, never overwriting confirmed profile facts. | Every extracted field displays source page/section span and confidence; student confirms (`Ghost-to-Solid`), edits, or rejects. |
| **FR-013 / P0** | Track 6-tier skill evidence and verification state. | System distinguishes `Extracted`, `Student-confirmed`, `Artifact-linked`, `Assessment-verified`, `Institution-verified`, and `Expired/Stale`. |
| **FR-014 / P1** | Maintain immutable version history for resumes and evidence. | Prior versions remain inspectable by authorised roles; re-uploads do not erase audit trails. |
| **FR-015 / P1** | Support DPDP-ready correction, export, deletion request, and retention workflows. | Deletion purges raw files, parsed text, chunks, embeddings, and caches across all stores subject to legal hold rules. |

### 5.3 Readiness, Simulation, and Career Guidance

| ID / PRIORITY | REQUIREMENT | ACCEPTANCE CRITERIA |
| :--- | :--- | :--- |
| **FR-020 / P0** | Show a multidimensional readiness profile. | Dashboard displays dimension statuses, supporting evidence pills, missing data callouts, calculation timestamp, and rubric version. |
| **FR-021 / P0** | Generate a role-specific gap analysis. | Gaps map to explicit role skills and evidence expectations; each gap is tagged as `Missing Skill`, `Missing Proof`, or `Unknown`. |
| **FR-022 / P0** | Create an adaptive preparation plan supporting **Semester Marathon** and **72-Hour Drive Sprint** modes. | Selecting an opportunity closing in $< 72\text{h}$ switches plan output to a condensed triage checklist (verification + resume anchoring + rapid STAR drill). |
| **FR-023 / P1** | Provide practice assessments and text-based interview simulations. | Assessment rubric and scoring dimensions are visible before the attempt; no biometric, voice accent, or facial emotion analysis is used. |
| **FR-024 / P1** | Recommend role families and career pathways. | Each recommendation includes rationale, prerequisites, and confidence caveats. |
| **FR-025 / P0** | Provide a real-time **Counterfactual Fit Sandbox** on role and opportunity views. | Toggling unverified skills or planned assessments recomputes deterministic alignment in $< 200\text{ ms}$ without mutating the canonical profile or invoking an LLM. |
| **FR-026 / P1** | Support **120-Second Proof-of-Work Micro-Defenses** for artifact verification. | Interview Coach generates 3 artifact-grounded technical questions from uploaded project files; passing upgrades skill status to `Assessment-verified` with an immutable Q&A audit link. |

### 5.4 Job Intelligence, Liquidity Simulation, and Matching

| ID / PRIORITY | REQUIREMENT | ACCEPTANCE CRITERIA |
| :--- | :--- | :--- |
| **FR-030 / P0** | Ingest job descriptions and produce source-highlighted structured drafts. | Output conforms to strict JSON schema; source span is attached to each criterion; ambiguous criteria are flagged for officer review. |
| **FR-031 / P0** | Require authorised human approval of job criteria before publishing a match run. | Unapproved or expired JDs cannot generate a published candidate pool or recruiter view. |
| **FR-032 / P0** | Separate hard eligibility gates from weighted alignment scoring. | Eligibility returns `Meets`, `Does Not Meet`, or `Unknown` with exact rule trace; high alignment score can never override a failed explicit eligibility gate. |
| **FR-033 / P0** | Produce explainable top-N opportunity recommendations via **Two-Stage Match Cards**. | Each card displays positive evidence pills, gaps, preference fit, data freshness, rubric version, and an explicit `"Not a hiring probability"` badge. |
| **FR-034 / P0** | Prevent automated final selection or rejection. | No API or agent tool can reject, shortlist, or extend an offer as a final decision; authorised human action is mandatory. |
| **FR-035 / P0** | Respect student profile visibility and opt-in state. | Only opted-in students and approved fields appear in recruiter views; consent withdrawal invalidates caches immediately. |
| **FR-036 / P1** | Support human overrides and structured **Bidirectional Explain-or-Dispute** requests. | Students can click any `Unknown`/`Does Not Meet` pill to submit source-backed clarification to the Placement Officer Exception Queue; officer overrides capture actor, timestamp, and reason code. |
| **FR-037 / P1** | Track applications and placement workflow stages. | State transitions are permissioned, timestamped, auditable, and visible only to authorised participants. |
| **FR-038 / P1** | Provide Placement Officers with a pre-publish **Cohort Liquidity Simulator**. | Adjusting mandatory/preferred JD gates displays live aggregate eligible student counts and alignment distributions (with $< 5$ small-cell suppression) prior to publishing. |
| **FR-039 / P0** | Enforce **Visual Provenance Distinction** across all UI surfaces. | Provisional AI extractions use distinct border/surface tokens (`Ghost Cards`) from verified data; $100\%$ of match claims open source spans on click. |

### 5.5 AI Infrastructure, Governance, and Operations

| ID / PRIORITY | REQUIREMENT | ACCEPTANCE CRITERIA |
| :--- | :--- | :--- |
| **FR-040 / P0** | Use an explicit orchestrated workflow with specialist agents and bounded transitions. | Every workflow has a defined state graph, maximum step count, tool-call budget, timeout, and deterministic fallback path. |
| **FR-041 / P0** | Expose external capabilities only through registered, scoped MCP tools or approved service APIs. | Every tool has a JSON schema, purpose, permission scope, rate limit, timeout, audit event, and service owner. |
| **FR-042 / P0** | Apply input, retrieval, tool, and output guardrails. | Prompt injection inside resumes or JDs cannot alter RBAC/ABAC policy; malformed outputs fail closed. |
| **FR-043 / P0** | Implement cache isolation and event-driven invalidation. | Cache keys embed permission scope and entity versions; access checks execute *before* cache read. |
| **FR-044 / P0** | Enforce model and workflow budgets. | Per-user, per-role, per-agent, and per-tool quotas apply; budget exhaustion degrades gracefully to deterministic views. |
| **FR-045 / P0** | Maintain automated evaluation suite for retrieval, match quality, safety, and tool behaviour. | CI/CD release pipeline blocks on critical security regressions or sub-threshold quality gates. |
| **FR-046 / P1** | Provide model/prompt/policy registry and 1-click rollback. | Every response trace references immutable model, prompt, tool schema, policy, and retrieval index versions. |
| **FR-047 / P1** | Provide OpenTelemetry end-to-end traces, metrics, and tamper-evident audit exports. | Traces link request, workflow node, model call, retrieval, MCP tool call, policy check, and cache outcome without leaking PII/secrets. |

---

## 6. Readiness and Career Matching Methodology

### 6.1 Six-Tier Evidence Model
Every claim about a student is stored as a structured, provenance-backed object (`skill_evidence`), never as an unverified resume string.

| EVIDENCE STATUS | UI BADGE / TOKEN | MEANING | USE IN DETERMINISTIC SCORING |
| :--- | :--- | :--- | :--- |
| **1. Extracted** | `Ghost Dashed Pill` (Lavender) | Model identified a candidate fact in an uploaded document. | **0% weight.** Provisional only; prompts student confirmation. |
| **2. Student-Confirmed** | `Solid Neutral Pill` (Slate) | Student reviewed the source span and confirmed accuracy. | Base weight ($0.5\times$ multiplier); visibly labelled as self-reported. |
| **3. Artifact-Linked** | `Solid Teal-Tint Pill` | Linked to a specific project document, certificate, or repository extract. | Moderate weight ($0.75\times$ multiplier); proves context and artifact existence. |
| **4. Assessment-Verified** | `Emerald Verified Pill ✓` | Proven via rubric-scored assessment or **120s Proof-of-Work Micro-Defense**. | Full weight ($1.0\times$ multiplier); proves demonstrated capability. |
| **5. Institution-Verified** | `Oxford Indigo Seal ★` | Confirmed by faculty mentor, registrar SIS sync, or placement officer. | Highest trust ($1.0\times$ multiplier + verified institutional badge). |
| **6. Expired / Stale** | `Muted Amber Outline` | Evidence exceeds freshness window or certificate expired. | Reduced weight with explicit `"Refresh Needed"` prompt. |

### 6.2 Skill Ontology
Maintain a governed, versioned skill graph with canonical identifiers (`skill_id`), aliases, parent/child hierarchies, domain tags, proficiency rubrics, and role mappings. LLMs may propose alias mappings during parsing, but only deterministic lookups against the approved ontology enter scoring. Hard technical/domain skills and structured communication competencies are kept strictly separate; subjective personality labels are excluded.

### 6.3 Multidimensional Readiness Model
Readiness is presented as a constructive coaching radar/bar breakdown across six transparent dimensions—never collapsed into a single mysterious number:
1. **Profile Hygiene & Completeness** (labelled clearly as hygiene, not competence)
2. **Core Role Skill Coverage** (broken down by self-reported vs. verified tiers)
3. **Project & Artifact Depth** (problem statement, architecture, measurable outcomes)
4. **Formative Assessment & Micro-Defense Proof** (rubric performance across attempts)
5. **Structured Interview Readiness** (STAR story completeness, role alignment)
6. **Application & Deadline Readiness** (tailored resume readiness, sprint checklist status)

### 6.4 Deterministic Eligibility vs. Weighted Alignment Fit
* **Stage 1 — Deterministic Eligibility Gate:** Evaluates only explicit, published, officer-approved criteria (e.g., graduation cohort, work authorization, program stream, or approved academic cutoff). Outputs `MEETS`, `DOES_NOT_MEET`, or `UNKNOWN`. An `UNKNOWN` state triggers a **Bidirectional Clarification Pill** so the student can supply the missing field—it is never silently treated as a rejection.
* **Stage 2 — Transparent Alignment Index (0–100):** Computed deterministically for eligible and `UNKNOWN` candidates using versioned rubric weights:

| ALIGNMENT FACTOR | STARTING WEIGHT | EVIDENCE MULTIPLIER RULE |
| :--- | :--- | :--- |
| **Required Skill Evidence Alignment** | $35\%$ | Weighted by Evidence Tier ($0.5\times$ self-confirmed up to $1.0\times$ verified). |
| **Project & Experience Relevance** | $20\%$ | Mapped to role responsibilities and artifact outcomes. |
| **Preferred Skill Alignment** | $15\%$ | Supported by current evidence tiers. |
| **Formative Assessment / Micro-Defense** | $15\%$ | Performance on role-mapped competency rubrics. |
| **Student Preference Alignment** | $15\%$ | Role family, location, work mode, compensation band, and availability. |

$$\text{Alignment Index} = \sum_{i=1}^{5} w_i \cdot \left( \frac{\sum_{k \in K_i} s_k \cdot m(\text{tier}_k)}{|K_i|} \right) \times 100$$

Where $w_i$ is the factor weight, $s_k \in [0,1]$ is the normalized rubric match for requirement $k$, and $m(\text{tier}_k) \in \{0, 0.5, 0.75, 1.0\}$ is the evidence tier multiplier. This exact formula powers the real-time **Counterfactual Fit Sandbox** on the client/API in $< 50\text{ ms}$.

---

## 7. Agent System and Orchestration Design

### 7.1 Deterministic Shell, Probabilistic Core
An explicit state-machine orchestrator (LangGraph) controls authentication context, permissions, step budgets, retries, and transitions. Specialist LLM agents perform bounded tasks (extraction, question generation, synthesis, and coaching). Deterministic domain services perform all access checks, eligibility evaluations, alignment math, sandbox simulations, and database mutations.

### 7.2 Specialist Agents

| AGENT | RESPONSIBILITY | ALLOWED TOOLS / DATA | PROHIBITED ACTIONS |
| :--- | :--- | :--- | :--- |
| **Profile Intelligence Agent** | Extract resume/project facts, skills, dates, and source spans into provisional Ghost Cards. | Read single student's permitted uploads; skill ontology lookup. | Overwrite confirmed profile facts; access other students; infer protected traits. |
| **Job Intelligence Agent** | Parse raw JDs into structured draft criteria with source spans; flag ambiguity. | Read submitted JD; canonical skill taxonomy; role templates. | Publish criteria or trigger a match run without Placement Officer approval. |
| **Readiness Coach Agent** | Generate **Semester Marathon** or **72-Hour Drive Sprint** preparation plans from gap analysis. | Student-authorised profile/gaps; approved learning catalogue; opportunity deadline metadata. | Guarantee placement; invent external URLs outside approved catalogue. |
| **Artifact Micro-Defense & Interview Coach Agent** | Generate 3 artifact-grounded technical defense questions or role-specific STAR practice prompts; score against rubrics. | Student's uploaded project chunks; approved role rubrics; student text response. | Score facial expressions, vocal accent, emotion, or personality; make hiring decisions. |
| **Career Match Explanation Agent** | Translate deterministic match factors and counterfactual deltas into plain-language coaching summaries with citations. | Persisted match result JSON; source evidence snippets; student preference profile. | Alter deterministic scores/eligibility; reveal unshared fields. |
| **Placement Operations Copilot** | Summarise cohort readiness trends and explain Liquidity Simulator trade-offs. | Aggregated, k-anonymous cohort analytics; placement policies. | Expose individual PII unnecessarily; execute bulk status changes. |

---

## 8. RAG, Evidence, and Knowledge Architecture

### 8.1 Knowledge Domains & Pre-Retrieval Isolation
Five strictly isolated logical corpora:
1. **Student-Private Corpus:** Resumes, project reports, code extracts, certificates (Owner-only by default; scoped sharing grants for opted-in opportunities).
2. **Institutional Corpus:** Versioned placement rules, academic policies, role guides, approved learning resources.
3. **Opportunity Corpus:** Approved JDs, verified criteria, company briefs.
4. **Assessment & Defense Corpus:** Rubrics, question banks, 120s Micro-Defense transcripts, formative feedback.
5. **Public/Research Corpus:** Allow-listed, licensed career taxonomy benchmarks.

### 8.2 Ingestion & Section-Aware Chunking Pipeline
`UPLOAD -> QUARANTINE -> MIME/ARCHIVE CHECK -> CLAMAV SCAN -> LAYOUT-AWARE PARSER -> PII/SECRET TAGGER -> SECTION-AWARE CHUNKING -> LOCAL EMBEDDING -> ACL METADATA BINDING -> PGVECTOR INDEX`
* Resumes, JDs, and policy documents are chunked along semantic and layout boundaries (preserving tables, headings, page numbers, and character offsets) so inline **Provenance Pills** highlight exact source spans in the UI Source Drawer.

### 8.3 Hybrid Retrieval with Mandatory Pre-Filtering
`QUERY -> RBAC/ABAC & CONSENT PRE-FILTER -> LEXICAL (BM25/TSVECTOR) + VECTOR (PGVECTOR HNSW) -> RRF MERGE -> CROSS-ENCODER RERANK -> SUFFICIENCY CHECK -> CITED SYNTHESIS -> CITATION VALIDATOR`
* Every citation badge generated by an agent (`[ev_44]`, `[pol_12]`) is deterministically validated against the retrieved evidence pack before rendering. Unverified citations are stripped or abstained.

---

## 9. MCP Tool Ecosystem and Integration Contracts

Internal Model Context Protocol (MCP) servers operate behind the campus service mesh. Every tool invocation carries an audience-bound JWT, `request_id`, `institution_id`, `actor_id`, and `purpose`.

| MCP SERVER | TOOL NAME | PURPOSE & PERMISSION SCOPE |
| :--- | :--- | :--- |
| `student-profile` | `get_my_profile` | Read authenticated student's structured profile and visibility settings. |
| `student-profile` | `list_my_evidence` | Read evidence records, tiers, and source spans for authenticated student. |
| `student-profile` | `propose_profile_update` | Write provisional Ghost Card extraction; requires student confirmation to become canonical. |
| `artifact-defense` | `start_micro_defense` | Generate 3 artifact-grounded technical questions from an `Artifact-linked` document. |
| `artifact-defense` | `evaluate_defense_attempt` | Score student defense responses against rubric; emit proposal to upgrade skill to `Assessment-verified`. |
| `job-intelligence` | `draft_job_requirements` | Parse raw JD into structured criteria draft with source spans. |
| `job-intelligence` | `simulate_cohort_liquidity` | Compute aggregate k-anonymous eligible counts for proposed JD criteria (Placement Officer scope). |
| `matching` | `run_counterfactual_sandbox` | Compute real-time alignment delta for hypothetical skill/evidence toggles (Stateless, deterministic). |
| `matching` | `explain_match` | Read persisted match result and evidence snippets for plain-language explanation. |
| `placement-ops` | `submit_eligibility_dispute` | Create structured clarification ticket in Officer Exception Queue with attached student evidence span. |
| `placement-ops` | `record_human_review` | Record authorised Placement Officer approval or exception override with mandatory reason code. |

---

## 10. Guardrails, Trust Boundaries, and Resource Restrictions

* **Hard Resource Budgets (Enforced at Gateway/Orchestrator):**
  * Max upload size: `20 MB` per file (archive expansion capped, 30s parse timeout).
  * Max user prompt length: `8,000 characters`.
  * Retrieved context budget: Top `8 reranked chunks` post-ACL filter.
  * Max specialist agent handoffs: `3 transitions` per workflow.
  * Max MCP tool calls: `6 read calls` / `2 proposal write calls` per request.
  * Synchronous workflow timeout: `30 seconds` (streaming TTFT target $< 1.5\text{s}$); bulk match runs execute asynchronously via worker queues.
* **Graceful Deterministic Degradation:** If local GPU inference nodes are saturated or offline, the entire platform remains operational for profile editing, **Counterfactual Fit Sandbox** simulations, deterministic eligibility checks, **Cohort Liquidity Simulations**, and application tracking.

---

## 11. Data Architecture and Domain Model

PostgreSQL with **Row-Level Security (RLS)** and `pgvector` serves as the single relational and vector source of truth, paired with private MinIO/S3 object storage and Redis for scoped caching.

```sql
-- Core v1.1 Relational Sketch (Illustrative DDL)
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY,
    institution_id UUID NOT NULL,
    student_user_id UUID UNIQUE NOT NULL,
    program_id UUID NOT NULL,
    cohort_id UUID NOT NULL,
    profile_version INT NOT NULL DEFAULT 1,
    visibility_state JSONB NOT NULL -- Privacy Shield per-purpose/opportunity grants
);

CREATE TABLE skill_evidence (
    id UUID PRIMARY KEY,
    student_user_id UUID NOT NULL,
    skill_id UUID NOT NULL,
    source_document_id UUID NOT NULL,
    source_page INT,
    source_span JSONB NOT NULL, -- {start_char, end_char, bbox, section_path}
    evidence_status VARCHAR(32) NOT NULL, -- EXTRACTED, STUDENT_CONFIRMED, ARTIFACT_LINKED, ASSESSMENT_VERIFIED, INSTITUTION_VERIFIED, EXPIRED
    extraction_confidence NUMERIC(4,3),
    defense_attempt_id UUID, -- Links to 120s Proof-of-Work Micro-Defense transcript
    verified_by UUID,
    verified_at TIMESTAMPTZ
);

CREATE TABLE eligibility_disputes (
    id UUID PRIMARY KEY,
    match_result_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    rule_id UUID NOT NULL,
    attached_document_id UUID,
    attached_span JSONB,
    student_note TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED_OVERRIDE, REJECTED
    reviewed_by UUID,
    review_reason_code VARCHAR(64),
    resolved_at TIMESTAMPTZ
);
```

---

## 12. Local-First Production Architecture & Technology Stack

| CAPABILITY | RECOMMENDED BASELINE | RATIONALE |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) + TypeScript + Tailwind CSS | Accessible, responsive UI implementing the **"Warm Institutional Studio"** design system (`DESIGN.md`). |
| **Backend & Domain API** | Python FastAPI | High-performance async REST endpoints, Pydantic v2 schema validation, deterministic scoring & sandbox math. |
| **Identity & Access** | Campus OIDC/SAML + Keycloak + OPA | Zero-trust RBAC/ABAC policy evaluation outside LLM prompts. |
| **Agent Orchestration** | LangGraph | Explicit, inspectable state graphs with strict step/tool budgets and resumable checkpoints. |
| **Local Inference & Gateway** | LiteLLM Proxy + vLLM (GPU) / llama.cpp (Dev) | Task-tiered local open-weight models (e.g., 8B for extraction/routing, 32B/70B for coaching & micro-defense evaluation). |
| **Database & Vector Store** | PostgreSQL 16 + `pgvector` + RLS | Unified relational integrity, hybrid BM25 + HNSW vector search, database-enforced tenant isolation. |
| **Object Storage & Queue** | MinIO (Private S3) + Redis + NATS JetStream | Quarantine file pipeline, scoped caches, and async bulk match/ingestion workers. |
| **Observability** | OpenTelemetry + Prometheus + Grafana | End-to-end trace correlation across API, LangGraph nodes, MCP calls, and vLLM KV-cache metrics. |

---

## 13. Security, Privacy, and Indian Regulatory Governance (DPDP Act)

* **DPDP Act 2023 & 2025 Rules Alignment:** Built around explicit, itemised privacy notices, granular purpose-bound consent via the **Privacy Shield Bar**, one-click consent withdrawal with immediate cache/index invalidation, and tracked data erasure workflows across relational, vector, and object stores.
* **Strict Fairness & Anti-Bias Controls:** Demographic attributes (gender, caste, religion, disability, age) and their proxies are excluded from all feature tables, prompts, embeddings, and scoring formulas. Fairness audits run offline against separated, governance-controlled datasets.

---

## 14. Caching, Performance, and Resilience

* **Scoped Cache Keys:** Every Redis key embeds `tenant_id + user_id + role_scope + consent_version + rubric_version + model_hash`. Authorization executes *prior* to cache lookup.
* **Performance SLOs:**
  * Core profile & Counterfactual Fit Sandbox recalculation: **p95 $< 150\text{ ms}$**.
  * Cohort Liquidity Simulator histogram update: **p95 $< 400\text{ ms}$**.
  * Interactive LLM coaching / Micro-Defense question streaming: **TTFT $< 1.5\text{ s}$**, full response **p95 $< 15\text{ s}$**.
  * Resume quarantine, scan, and layout-aware extraction: **95% reviewable within $45\text{ s}$**.

---

## 15. Evaluation, Observability, and Release Gates

No model, prompt, parser, or rubric change ships to pilot or production without passing automated CI evaluation gates:
1. **Resume & JD Extraction Gate:** Critical field exact match $\ge 95\%$; skill extraction $F_1 \ge 0.85$; $100\%$ valid source span offsets.
2. **RAG & Citation Integrity Gate:** Recall@5 $\ge 0.85$; $100\%$ of rendered Provenance Pills resolve to valid, permissioned document spans; $\ge 92\%$ factual claim support.
3. **Deterministic Eligibility & Sandbox Math Gate:** $100\%$ unit test accuracy on `Meets` / `Does Not Meet` / `Unknown` rules and counterfactual weight calculations.
4. **Adversarial Red-Team Gate:** $0$ cross-student data leaks, $0$ prompt-injection policy bypasses across 100+ poisoned PDF resumes and JDs.

---

## 16. UX, Accessibility, and Visual Ergonomics ("Warm Institutional Studio")

*(Full component tokens, typography, and layout specifications are governed by the companion `DESIGN.md` specification).*

* **Aesthetic Philosophy:** Replace anxiety-inducing enterprise dashboards with a **"Warm Institutional Studio"** aesthetic—Warm Alabaster (`#FAF8F5`) surfaces, Oxford Indigo (`#1E3A8A`) institutional trust accents, Emerald Sage (`#0D9488`) verification badges, and Warm Amber (`#D97706`) constructive coaching cues.
* **Signature Ergonomic Patterns:**
  1. **Persistent Privacy Shield Header:** Always-visible indicator showing exact recruiter sharing status with 1-click toggle access.
  2. **Ghost-to-Solid Extraction Cards:** AI-extracted claims appear in dashed Lavender (`#F5F3FF`) Ghost Cards until confirmed by the student into solid canonical cards.
  3. **Split-Screen Provenance Drawer:** Clicking any monospace citation pill (`[Resume p.2, §Projects]`) slides open the highlighted source document span alongside the claim.
  4. **Two-Stage Match Card & Counterfactual Sliders:** Visually separates the deterministic Eligibility Gate header from the 5-segment horizontal Alignment Bar and interactive "What-If" checkboxes.
* **Accessibility:** Strict WCAG 2.2 AA compliance, full keyboard navigation, screen-reader announcements for dynamic sandbox updates (`aria-live="polite"`), and zero reliance on color alone to convey status.

---

## 17. API Surface and Integration Plan

| METHOD & PATH | PURPOSE | AUTHZ SCOPE |
| :--- | :--- | :--- |
| `POST /v1/documents` | Initiate quarantined upload session for resume/project artifact. | Authenticated Student Owner |
| `POST /v1/profile/extractions/{id}/confirm` | Convert provisional Ghost Card extraction into confirmed student fact. | Student Owner |
| `POST /v1/defenses/micro-start` | Start a 120-second Proof-of-Work Micro-Defense on an uploaded artifact. | Student Owner |
| `POST /v1/defenses/{id}/submit` | Submit defense answers and upgrade skill to `Assessment-verified` on pass. | Student Owner |
| `POST /v1/sandbox/simulate-fit` | Statelessly compute counterfactual alignment delta for toggled skills/proofs. | Student Owner |
| `POST /v1/readiness/plans` | Generate **72-Hour Drive Sprint** or **Semester Marathon** study plan. | Student / Authorised Mentor |
| `POST /v1/jobs/{id}/liquidity-preview` | Compute k-anonymous cohort eligibility histogram for draft JD criteria. | Placement Officer (Scoped) |
| `POST /v1/jobs/{id}/approve` | Lock approved JD criteria version and enable match runs. | Placement Officer (Scoped) |
| `POST /v1/matches/{id}/disputes` | Submit a Bidirectional Explain-or-Dispute clarification with source span. | Student Owner |
| `POST /v1/disputes/{id}/resolve` | Adjudicate student eligibility clarification and invalidate stale match cache. | Placement Officer (Scoped) |

---

## 18. Delivery Roadmap and Work Breakdown

Build in strict trust-first order so the platform delivers immediate deterministic value even before LLM agents are enabled:
* **Phase 0 (Weeks 1–2): Discovery, Governance & Policy Catalogue** — Lock institutional eligibility rules, DPDP notices, and gold evaluation datasets.
* **Phase 1 (Weeks 3–4): Trust Foundation & Scoped Data Plane** — FastAPI, PostgreSQL + RLS + `pgvector`, Keycloak OIDC, MinIO quarantine pipeline, audit logging.
* **Phase 2 (Weeks 5–6): Evidence Pipeline & Ghost-to-Solid UI** — Layout-aware resume parser, 6-tier evidence schema, split-screen Source Drawer, Privacy Shield UI.
* **Phase 3 (Weeks 7–8): Deterministic Readiness, Matching & Sandbox** — Two-Stage Match Engine, Counterfactual Fit Sandbox, Placement Officer Cohort Liquidity Simulator, Bidirectional Dispute Pills.
* **Phase 4 (Weeks 9–10): Bounded Agents, MCP & 120s Micro-Defenses** — LangGraph orchestrator, scoped MCP servers, Proof-of-Work Micro-Defense coach, Sprint/Marathon planner.
* **Phase 5 (Weeks 11–12): Hardening, Red-Teaming & Pilot Launch** — Hybrid RAG reranking, Redis cache isolation tests, load testing on campus GPU node, pilot cohort onboarding.

---

## 19. Risks, Dependencies, and Mitigations

| RISK | IMPACT | v1.1 MITIGATION |
| :--- | :--- | :--- |
| **Faculty verification bottleneck stalls student progress** | High | **120-Second Proof-of-Work Micro-Defenses** allow students to autonomously upgrade `Artifact-linked` skills to `Assessment-verified` via rigorous artifact-grounded Q&A. |
| **Recruiters set unrealistic gates that filter out 95% of cohort** | High | **Cohort Liquidity Simulator** shows Placement Officers live eligible headcount drops before approving JD criteria. |
| **Students feel demoralized by static low match scores** | Medium | **Counterfactual Fit Sandbox** frames gaps constructively in Warm Amber and shows immediate $+\%$ gains from achievable 48-hour actions. |
| **False `Unknown` or `Does Not Meet` flags block eligible students** | High | **Bidirectional Explain-or-Dispute Pills** give students a 1-click, evidence-attached fast lane to the Officer Exception Queue. |

---

## 20. Acceptance Checklist and Definition of Done

The system is approved for campus pilot launch only when:
- [ ] Every P0 functional requirement (including `FR-025` Counterfactual Sandbox and `FR-039` Visual Provenance Distinction) passes automated E2E tests.
- [ ] All AI-extracted claims render inside provisional **Ghost Cards** with clickable **Provenance Pills** that highlight the exact document span.
- [ ] Eligibility (`Meets` / `Does Not Meet` / `Unknown`) is strictly separated from alignment scores, and clicking an `Unknown` pill opens the clarification workflow.
- [ ] Placement Officers can preview cohort liquidity histograms before approving a job description.
- [ ] Cross-student, cross-cohort, and recruiter-scope isolation tests pass with $0$ leakage across PostgreSQL RLS, `pgvector`, and Redis caches.
- [ ] WCAG 2.2 AA accessibility audit and mobile/low-bandwidth responsiveness checks pass across Student, Officer, and Recruiter workspaces.