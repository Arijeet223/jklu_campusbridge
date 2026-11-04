# DESIGN.md — CampusBridge AI Frontend Design System & Antigravity Skill Spec
**Aesthetic Direction:** "Warm Institutional Studio"  
**Target Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Radix UI Primitives  
**Accessibility Standard:** WCAG 2.2 AA Compliant | Mobile & Low-Bandwidth Resilient

---

## 1. Aesthetic Thesis & Core Philosophy

CampusBridge AI is a high-trust university career intelligence platform. Most placement portals fail visually in one of two ways: they either look like **archaic, punitive government spreadsheets** (inducing student anxiety) or **gimmicky neon AI wrapper apps** (undermining institutional credibility and auditability).

Our design direction—**Warm Institutional Studio**—merges the **editorial warmth and tactile calm of Notion/Stripe Press** with the **high-density, keyboard-first precision of Linear**.

### Three Non-Negotiable Visual Laws
1. **Zero Anxiety by Design:** Never use alarmist red gauges or giant "Employability Scores." Frame missing skills or unverified claims in **Warm Amber** as *constructive invitations to add proof*.
2. **Instant Visual Provenance:** A user must know within $100\text{ ms}$ whether a piece of data on screen is **Institution-Verified**, **Student-Confirmed**, or an **Unconfirmed AI Suggestion**—using border style, surface tint, and monospace citation badges, never color alone.
3. **1px Tactile Precision over Blurry Glassmorphism:** Avoid heavy drop shadows, neon gradients, and decorative glass blur. Use crisp `1px` structural borders, warm paper-like background canvases, and generous typographic breathing room.

---

## 2. Color Token System

Configure these semantic tokens in `tailwind.config.ts` and `globals.css`. Maintain a **90% neutral warm canvas** so semantic status pills carry immediate meaning.

### 2.1 Surface & Structural Tokens
| Token Name | Light Mode (Default) | Dark Mode (Opt-In) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#FAF8F5` (Warm Alabaster) | `#0C1017` (Deep Obsidian) | Primary page background; eliminates harsh white eye strain during prep. |
| `--bg-surface` | `#FFFFFF` (Crisp Paper) | `#151B26` (Elevated Slate) | Primary cards, match panels, and workspace containers. |
| `--bg-subtle` | `#F3F1EC` (Stone Wash) | `#1E2636` (Muted Navy) | Secondary table headers, sidebar rails, and filter wells. |
| `--bg-ai-ghost` | `#F5F3FF` (Soft Lavender) | `#1E1B38` (Deep Violet Tint) | **Exclusive to unconfirmed AI extractions** and provisional coaching drafts. |
| `--border-hairline` | `#E6E3DC` (Warm Gray 1px) | `#283246` (Slate Hairline) | Standard structural card and table borders. |
| `--border-ai-dashed`| `#C4B5FD` (Violet Dashed) | `#5B21B6` (Violet Dashed) | `1.5px dashed` border for unconfirmed AI "Ghost Cards". |

### 2.2 Typography & Ink Tokens
| Token Name | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--ink-primary` | `#111827` (Charcoal Ink) | `#F8FAFC` (Alabaster White)| Headings, primary profile facts, core body copy. |
| `--ink-secondary` | `#4B5563` (Graphite) | `#94A3B8` (Cool Slate) | Supporting explanations, rubric descriptions, subheaders. |
| `--ink-muted` | `#6B7280` (Warm Pewter) | `#64748B` (Muted Slate) | Timestamps, version IDs, disabled states. |

### 2.3 Semantic & Trust Accents
| Semantic Role | Primary Hex | Surface Tint Hex | Border Hex | Icon / Badge pairing |
| :--- | :--- | :--- | :--- | :--- |
| **Institutional Authority / Primary Action** | `#1E3A8A` (Oxford Indigo) | `#EFF6FF` | `#BFDBFE` | `ShieldCheck` / `Sparkles` |
| **Verified Evidence / `MEETS` Gate** | `#0F766E` (Emerald Sage) | `#F0FDFA` | `#99F6E4` | `CheckCircle2` (`✓ Verified`) |
| **Actionable Gap / `UNKNOWN` Gate / Sandbox** | `#B45309` (Warm Amber) | `#FFFBEB` | `#FDE68A` | `HelpCircle` / `ArrowUpRight` |
| **Hard Eligibility Block (`DOES_NOT_MEET`)** | `#BE123C` (Muted Crimson)| `#FFF1F2` | `#FECDD3` | `AlertOctagon` (Strict rule mismatch) |
| **AI Provisional / Extraction State** | `#6D28D9` (Iris Violet) | `#F5F3FF` | `#DDD6FE` | `Wand2` (`Provisional — Confirm?`) |

---

## 3. Typography & Scannable Hierarchy

Never use a single font family for everything. We pair a friendly geometric display face, a hyper-legible UI sans, and a technical monospace exclusively for provenance and deterministic rules.

```css
/* Font Stack Definitions */
--font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-sans:    'Inter', system-ui, -apple-system, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

### Typographic Scale & Rules
* **Workspace Title (`h1`):** `Plus Jakarta Sans`, `26px` (`1.625rem`), `font-semibold` (`600`), tracking `-0.025em`, line-height `1.25`.
* **Section / Card Header (`h2`):** `Plus Jakarta Sans`, `18px` (`1.125rem`), `font-semibold` (`600`), tracking `-0.015em`, line-height `1.35`.
* **Body & Coaching Copy:** `Inter`, `15px` (`0.9375rem`), `font-normal` (`400`), line-height `1.6`, max line width `68ch` for effortless reading.
* **Dense Table Cells:** `Inter`, `13.5px`, `font-medium` (`500`), `tabular-nums` enabled for all scores and cohort counts.
* **Provenance Pills, Version IDs & Citations:** `JetBrains Mono`, `12px` (`0.75rem`), `font-medium` (`500`), tracking `-0.01em`. **Rule:** Whenever a user sees `JetBrains Mono`, they know they are looking at an immutable database ID, document page span, or deterministic policy rule.

---

## 4. Layout Architecture & Viewport Breakpoints

### 4.1 Three-Zone Workspace Shell (Desktop `1440px`)
Avoid cluttered top navbars with nested dropdowns. Use a calm, persistent 3-zone studio layout:
1. **Left Navigation Rail (`240px` fixed, collapsible to `64px`):**
   * Role switcher badge at top (`Student Workspace` vs. `Placement Officer Console`).
   * Primary workflow links with live badge counts (e.g., `Profile & Evidence [3 to confirm]`, `Role Explorer & Sandbox`, `Prep Plan [Sprint Active]`, `Applications`).
   * Bottom-anchored **Privacy Shield Mini-Card** showing live visibility state.
2. **Center Primary Canvas (`flex-1`, max-width `1080px` centered with `24px–32px` padding):**
   * Houses the active dashboard, Two-Stage Match Cards, or JD Approval table.
3. **Right Contextual Source & Sandbox Drawer (`420px` slide-over or docked split pane):**
   * Remains closed until triggered, keeping the main canvas calm.
   * Opens instantly when a user clicks a **Provenance Pill** (showing the highlighted PDF resume/JD page) or launches a **120-Second Proof-of-Work Micro-Defense**.

### 4.2 Responsive Breakpoints
* **Desktop Studio (`>= 1280px`):** Full 3-zone layout with side-by-side PDF Source Drawer.
* **Tablet / Small Laptop (`768px – 1279px`):** Left rail collapses to icon-only (`64px`); Source Drawer overlays as a modal sheet.
* **Mobile (`390px – 767px`):** Bottom sticky 4-item navigation bar; Two-Stage Match Cards stack vertically; Counterfactual Sandbox switches to a touch-friendly bottom drawer (`min-h-[44px]` touch targets on all pills).

---

## 5. Signature UI Components (Implementation Specs for Antigravity)

When building screens in Antigravity, implement these six signature components exactly as specified:

### 5.1 The Persistent "Privacy Shield" Bar
* **Location:** Sticky top banner inside the Student Profile & Application views.
* **Visual Spec:** `bg-[#EFF6FF]` border `1px solid #BFDBFE`, height `40px`, rounded `8px`, `px-3.5` flex row between status and action.
* **Content Pattern:**
  * Left: `🔒 Privacy Shield Active: Private by Default` in `font-semibold text-[#1E3A8A]`.
  * Center: `Only 2 opted-in recruiters can view your verified skills & portfolio.`
  * Right: `[Manage Sharing & DPDP Consent ->]` ghost button.

### 5.2 The "Ghost-to-Solid" Extraction Card (Student Confirmation Flow)
* **Unconfirmed State (`Extracted`):**
  * Container: `bg-[#F5F3FF]` with `border-[1.5px] border-dashed border-[#C4B5FD] rounded-xl p-4 transition-all duration-200`.
  * Header Badge: `[✨ AI Extracted from Resume • Unconfirmed]` in `text-[#6D28D9] text-xs font-medium`.
  * Provenance Trigger: Monospace pill `[📄 Resume_v3.pdf • p.1, §Projects • 94% conf]`—clicking opens the right-hand Source Drawer scrolled to the highlighted bounding box.
  * Action Bar: `[✓ Confirm Fact]` (Primary Emerald button), `[✎ Edit]`, `[✕ Reject]`.
* **Confirmed State (`Student-Confirmed` / `Verified`):**
  * Upon clicking **Confirm**, transition (`200ms cubic-bezier(0.16, 1, 0.3, 1)`) to `bg-white border border-solid border-[#E6E3DC] shadow-2xs`.

### 5.3 The 6-Tier Provenance Pill (Inline Citation Chip)
Every skill tag across the entire app must render as a split two-part pill (`rounded-md text-xs inline-flex items-center overflow-hidden border`):
* **Left Segment:** Skill Name + Proficiency (`Python • Intermediate`).
* **Right Segment (`font-mono`):** Verification Tier Icon + Source Ref:
  * Tier 4/5 (`Assessment/Institution Verified`): `bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]` -> `[✓ Defense Passed | ev_44]`
  * Tier 3 (`Artifact-Linked`): `bg-[#EFF6FF] text-[#1E3A8A] border-[#BFDBFE]` -> `[🔗 GitHub Repo | p.2]`
  * Tier 2 (`Student-Confirmed`): `bg-[#F3F1EC] text-[#4B5563] border-[#E6E3DC]` -> `[Self-Confirmed]`

### 5.4 The Two-Stage Match Card + Counterfactual "What-If" Sandbox
Never display a single circular progress ring for job matching. Every opportunity card uses a strict **Two-Stage Vertical Architecture**:
* **Zone A — Deterministic Eligibility Header:**
  * Crisp top bar (`px-5 py-3 border-b border-[#E6E3DC] bg-[#FAF8F5] flex justify-between items-center`).
  * Displays rule-level pills: `[✓ B.Tech CS '27]` `[✓ CGPA >= 7.0]` `[? Internship Availability: UNKNOWN — Click to Clarify]`.
  * Clicking an `UNKNOWN` or `DOES_NOT_MEET` pill opens the **Bidirectional Explain-or-Dispute Micro-Drawer**.
* **Zone B — Segmented Alignment Bar & Sandbox Toggle:**
  * Shows the 5 weighted rubric dimensions as a **segmented horizontal stacked bar** (`h-3 rounded-full overflow-hidden bg-[#F3F1EC]`) alongside the explicit badge: `74 / 100 Rubric Alignment • Not a hiring probability`.
  * **Interactive Sandbox Drawer ("Simulate My Fit ⚡"):**
    * Expanding the sandbox reveals interactive checkboxes for missing or unverified requirements:
      * `[ ] Pass 120s Proof-of-Work Defense on "FastAPI Microservice" (+11 pts)`
      * `[ ] Complete 15-min SQL Indexing Rubric (+8 pts)`
    * Checking a box animates a **striped Emerald preview bar** extending the alignment meter from `74` to `93` in real time (`< 50ms` client-side deterministic math) with a CTA: `[Add Selected to 72-Hour Sprint Plan]`.

### 5.5 The 120-Second "Proof-of-Work" Micro-Defense Modal
* **Visual Structure:** Split-screen focused workspace.
  * **Left Pane (`45%` width):** Read-only code/document viewer showing the student's uploaded project artifact (`order_service.py` or `capstone_report.pdf`).
  * **Right Pane (`55%` width):** 3 sequential technical defense cards with a calm progress indicator (`Question 2 of 3 • ~45s remaining per answer`) and a visible scoring rubric (`Grounded in artifact • Explains trade-offs • Handles edge cases`).
  * **Strict Exclusion Notice:** Footer badge reads: `🛡️ Text-Only Technical Defense — No webcam, voice, or biometric analysis is used.`

### 5.6 Placement Officer "Cohort Liquidity Simulator" Panel
* **Location:** Right-hand sticky panel inside the Placement Officer JD Approval Workspace.
* **Visual Spec:**
  * Live horizontal funnel bar showing how each extracted JD rule filters the target cohort (e.g., `Total Cohort: 240` $\rightarrow$ `Degree Gate: 180` $\rightarrow$ `CGPA >= 8.0 Gate: 64` $\rightarrow$ `Mandatory Kubernetes Gate: 6`).
  * Interactive toggle switches next to each criterion allowing the officer to test switching a rule from `Mandatory Gate` to `Preferred Alignment Weight (15%)` and watching the eligible student pool bounce from `6` to `64` before clicking **Approve & Publish JD**.

---

## 6. Micro-Interactions, States & Guardrails

* **Streaming AI Output:** Use a subtle pulsing indigo dot (`h-2 w-2 rounded-full bg-[#1E3A8A] animate-pulse`) next to streaming coaching text; immediately append validated `JetBrains Mono` citation pills once the sentence completes.
* **Empty & Missing Data States:** Never show blank white boxes or `N/A`. Render a constructive dashed placeholder: `"No project proof linked for Distributed Systems yet — [+ Link Artifact or Take 120s Micro-Defense]"`.
* **Degraded / Offline LLM Mode Banner:** If local GPU inference is busy or offline, show a calm top toast: `"⚡ Running in Fast Deterministic Mode: Profile updates, Eligibility checks, and Counterfactual Fit Sandbox are 100% active. AI Coaching chat will resume shortly."`