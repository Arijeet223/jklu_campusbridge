/* ------------------------------------------------------------------ */
/*  CampusBridge AI — Core domain types                               */
/*  Keep in sync with the backend Python/SQL schemas.                  */
/* ------------------------------------------------------------------ */

/** Evidence tiers — ordered from weakest to strongest provenance. */
export type EvidenceStatus =
  | 'EXTRACTED'
  | 'STUDENT_CONFIRMED'
  | 'ARTIFACT_LINKED'
  | 'ASSESSMENT_VERIFIED'
  | 'INSTITUTION_VERIFIED'
  | 'EXPIRED'
  | 'DOUBT_GHOST'

/** Hard-gate eligibility outcomes — deterministic, no ML. */
export type EligibilityStatus =
  | 'MEETS'
  | 'DOES_NOT_MEET'
  | 'UNKNOWN'

/** Proficiency level self-reported or assessed. */
export type ProficiencyLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'

/** A single student skill with its provenance chain. */
export interface Skill {
  id: string
  name: string
  proficiency: ProficiencyLevel
  evidenceStatus: EvidenceStatus
  sourceDocumentId: string
  sourceSpan: string
  confidence: number
  confirmedAt?: string
  artifactUrl?: string
  assessmentId?: string
  sourcePage?: number | string
  category?: string
}

/** One hard eligibility rule for a job opportunity. */
export interface EligibilityRule {
  id: string
  label: string
  status: EligibilityStatus
  ruleExpression: string
  clarificationHint?: string
}

/** One rubric dimension for the alignment score. */
export interface AlignmentFactor {
  id: string
  label: string
  weight: number
  score: number       // 0–100 within this dimension
  color: string       // Tailwind color class for the bar segment
}

/** A sandbox toggle representing an action the student could take. */
export interface SandboxToggle {
  id: string
  label: string
  potentialGain: number  // points if completed
  checked: boolean
  relatedSkillId?: string
}

/** Full job-match card model. */
export type JobEligibilityStatus = 'ELIGIBLE' | 'ACTION_REQUIRED' | 'FILTERED_OUT'

export interface JobMatch {
  id: string
  jobTitle: string
  company: string
  deadline: string
  eligibilityRules: EligibilityRule[]
  alignmentScore: number
  factorBreakdown: AlignmentFactor[]
  sandboxToggles: SandboxToggle[]
  compensationTarget?: string
  category?: string
  eligibilityStatus?: JobEligibilityStatus
  failedPreference?: string | null
  missingSkills?: string[]
}

/** Cohort funnel step for the Placement Officer view. */
export interface CohortFunnelStep {
  id: string
  ruleLabel: string
  remainingCount: number
  isMandatory: boolean
}

/** Draft JD for placement officer approval. */
export interface DraftJD {
  id: string
  jobTitle: string
  company: string
  status: 'Draft' | 'Under Review' | 'Approved' | 'Published'
  eligibleCount: number
  createdAt: string
}

/** Structured parsed criterion in the JD Ingestion Studio (FR-030 & FR-031). */
export interface JDCriterion {
  id: string
  label: string
  ruleExpression: string
  gateType: 'MANDATORY' | 'PREFERRED'
  sourceSpan: string
  weight?: number
  isAmbiguous?: boolean
  ambiguityReason?: string
}

/** Rich Parsed JD Model for officer review and publishing. */
export interface ParsedJD {
  id: string
  jobTitle: string
  company: string
  department: string
  targetBatch: string
  minCgpa: number
  deadline: string
  rawText: string
  status: 'Draft' | 'Under Review' | 'Approved' | 'Published'
  criteria: JDCriterion[]
  approvedBy?: string
  approvedAt?: string
}

/** Source document reference for the drawer. */
export interface SourceDocument {
  id: string
  fileName: string
  pageNumber: number
  highlightedText: string
  fullText?: string
}

/** Conversational Chatbot-First Message Model */
export type ChatWidgetType =
  | 'none'
  | 'ghost_cards'
  | 'match_card'
  | 'micro_defense'
  | 'sprint_plan'
  | 'provenance_gallery'
  | 'applications_tracker'
  | 'resume_preview'

export interface AITrace {
  engine: {
    name: string
    model: string
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    latency_ms: number
    degraded_mode?: boolean
    fallback_reason?: string
  }
  intent?: string
  mcp_tools: Array<{
    server: string
    tool: string
    status: string
    execution_time_ms: number
    summary?: string
  }>
  rag_chunks: Array<{
    chunk_id?: string
    document_id?: string
    document_name?: string
    section?: string
    char_span?: [number, number]
    similarity_score: number
    content_preview?: string
  }>
  guardrail: {
    status: string
    valid_citations?: string[]
    hallucinations_detected?: number
  }
  total_latency_ms?: number
}

export interface ChatMessage {
  id: string
  sender: 'assistant' | 'user'
  agentName?: string
  text: string
  timestamp: string
  widgetType?: ChatWidgetType
  widgetData?: any
  trace?: AITrace
  isStreaming?: boolean
  citations?: Array<{ label: string; doc_id: string; page?: number; section?: string }>
}

/** PRD §4.6 & §11: Bidirectional Explain-or-Dispute Clarification Ticket */
export interface EligibilityDispute {
  id: string
  matchResultId: string
  jobTitle: string
  company: string
  ruleId: string
  ruleLabel: string
  attachedDocumentId?: string
  attachedSpan?: string
  studentNote: string
  status: 'PENDING_REVIEW' | 'APPROVED_OVERRIDE' | 'REJECTED'
  reviewedBy?: string
  reviewReasonCode?: string
  submittedAt: string
  resolvedAt?: string
}

/** PRD §5.1 & FR-037: Applications & Placement Pipeline Stage */
export type ApplicationStage =
  | 'APPLIED'
  | 'ELIGIBILITY_VERIFIED'
  | 'MICRO_DEFENSE_COMPLETE'
  | 'SHORTLISTED'

export interface ApplicationItem {
  id: string
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string
  currentStage: ApplicationStage
  eligibilityStatus: EligibilityStatus
  matchScore: number
  nextMilestone: string
  dispute?: EligibilityDispute
}

/** Strict 2-way RBAC: Student and Faculty */
export type UserRole = 'STUDENT' | 'FACULTY'

/** 6-Dimension Student Readiness Radar */
export interface ReadinessDimension {
  id: string
  label: string
  score: number        // 0-100
  benchmark: number    // cohort median
  status: 'OPTIMAL' | 'ON_TRACK' | 'ATTENTION'
  description: string
}

/** PRD §5.2 & FR-014: Immutable Resume / Artifact Version */
export interface ResumeVersion {
  id: string
  versionNumber: number
  fileName: string
  uploadedAt: string
  fileSize: string
  extractedSkillsCount: number
  sourceDocumentId: string
  isCurrent: boolean
}

/** PRD §5.1 & FR-004: Per-Company Recruiter Visibility Consent */
export interface RecruiterConsent {
  companyId: string
  companyName: string
  category: string
  optedIn: boolean
  lastChangedAt: string
  verifiedSkillsVisibleCount: number
}

/** PRD §2.2: Faculty Advisee model */
export interface FacultyAdvisee {
  id: string
  name: string
  rollNumber: string
  department: string
  cgpa: number
  overallReadiness: number
  skillsCount: number
  verifiedCount: number
  featuredProject: string
  featuredSkillId: string
  institutionVerified: boolean
}

/** PRD §2.2: Recruiter Candidate View model */
export interface RecruiterCandidate {
  id: string
  anonymousAlias: string
  department: string
  gradYear: number
  matchScore: number
  eligibility: EligibilityStatus
  verifiedSkills: string[]
  defenseProofTitle?: string
  defensePassed: boolean
  consentGranted: boolean
}


