/* ------------------------------------------------------------------ */
/*  CampusBridge AI — Rich mock data for the UI                       */
/*  Student: Priya Sharma • 6 skills at different evidence tiers      */
/*  2 job opportunities • cohort data for liquidity simulator         */
/* ------------------------------------------------------------------ */

import type {
  Skill,
  JobMatch,
  CohortFunnelStep,
  DraftJD,
  ParsedJD,
  JDCriterion,
  SourceDocument,
  EligibilityDispute,
  ApplicationItem,
  ReadinessDimension,
  ResumeVersion,
  RecruiterConsent,
  FacultyAdvisee,
  RecruiterCandidate,
} from './types'

/* ======================== Student Skills ========================== */

export const mockSkills: Skill[] = [
  {
    id: 'sk_01',
    name: 'Python',
    proficiency: 'Advanced',
    evidenceStatus: 'ASSESSMENT_VERIFIED',
    sourceDocumentId: 'doc_resume_v3',
    sourceSpan: 'p.1, §Skills',
    confidence: 1.0,
    confirmedAt: '2026-09-14T10:22:00Z',
    assessmentId: 'ev_44',
  },
  {
    id: 'sk_02',
    name: 'FastAPI',
    proficiency: 'Intermediate',
    evidenceStatus: 'ARTIFACT_LINKED',
    sourceDocumentId: 'doc_resume_v3',
    sourceSpan: 'p.2, §Projects',
    confidence: 0.91,
    confirmedAt: '2026-09-15T14:05:00Z',
    artifactUrl: 'https://github.com/priya-sharma/order-service',
  },
  {
    id: 'sk_03',
    name: 'React',
    proficiency: 'Advanced',
    evidenceStatus: 'STUDENT_CONFIRMED',
    sourceDocumentId: 'doc_resume_v3',
    sourceSpan: 'p.1, §Skills',
    confidence: 0.88,
    confirmedAt: '2026-09-12T09:30:00Z',
  },
  {
    id: 'sk_04',
    name: 'Distributed Systems',
    proficiency: 'Intermediate',
    evidenceStatus: 'EXTRACTED',
    sourceDocumentId: 'doc_resume_v3',
    sourceSpan: 'p.1, §Projects',
    confidence: 0.94,
  },
  {
    id: 'sk_05',
    name: 'SQL & Database Design',
    proficiency: 'Intermediate',
    evidenceStatus: 'EXTRACTED',
    sourceDocumentId: 'doc_resume_v3',
    sourceSpan: 'p.2, §Coursework',
    confidence: 0.87,
  },
  {
    id: 'sk_06',
    name: 'Kubernetes',
    proficiency: 'Beginner',
    evidenceStatus: 'EXPIRED',
    sourceDocumentId: 'doc_cert_k8s',
    sourceSpan: 'Certificate • Expired 2026-03',
    confidence: 0.6,
    confirmedAt: '2025-03-01T00:00:00Z',
  },
]

/* ====================== Job Opportunities ======================== */

export const mockJobMatches: JobMatch[] = [
  {
    id: 'jm_01',
    jobTitle: 'Backend Engineer Intern',
    company: 'FinStack Technologies',
    deadline: '2026-11-15',
    eligibilityRules: [
      {
        id: 'er_01',
        label: "B.Tech CS '27",
        status: 'MEETS',
        ruleExpression: 'degree == "B.Tech" AND branch == "CS" AND grad_year == 2027',
      },
      {
        id: 'er_02',
        label: 'CGPA ≥ 7.0',
        status: 'MEETS',
        ruleExpression: 'cgpa >= 7.0',
      },
      {
        id: 'er_03',
        label: 'Internship Availability',
        status: 'UNKNOWN',
        ruleExpression: 'internship_available == true',
        clarificationHint: 'Confirm your availability for a 6-month internship starting Jan 2027.',
      },
    ],
    alignmentScore: 74,
    factorBreakdown: [
      { id: 'af_01', label: 'Required Skills',     weight: 0.35, score: 82, color: 'bg-oxford' },
      { id: 'af_02', label: 'Projects & Experience', weight: 0.20, score: 70, color: 'bg-emerald' },
      { id: 'af_03', label: 'Preferred Skills',     weight: 0.15, score: 60, color: 'bg-iris' },
      { id: 'af_04', label: 'Assessments',          weight: 0.15, score: 90, color: 'bg-oxford' },
      { id: 'af_05', label: 'Preferences',          weight: 0.15, score: 55, color: 'bg-amber' },
    ],
    sandboxToggles: [
      {
        id: 'st_01',
        label: 'Pass 120s Proof-of-Work Defense on "FastAPI Microservice"',
        potentialGain: 11,
        checked: false,
        relatedSkillId: 'sk_02',
      },
      {
        id: 'st_02',
        label: 'Complete 15-min SQL Indexing Rubric',
        potentialGain: 8,
        checked: false,
        relatedSkillId: 'sk_05',
      },
      {
        id: 'st_03',
        label: 'Link GitHub portfolio for Distributed Systems project',
        potentialGain: 5,
        checked: false,
        relatedSkillId: 'sk_04',
      },
    ],
  },
  {
    id: 'jm_02',
    jobTitle: 'Full-Stack Developer',
    company: 'NovaPay Solutions',
    deadline: '2026-12-01',
    eligibilityRules: [
      {
        id: 'er_04',
        label: "B.Tech CS/IT '27",
        status: 'MEETS',
        ruleExpression: 'degree == "B.Tech" AND branch IN ("CS","IT") AND grad_year == 2027',
      },
      {
        id: 'er_05',
        label: 'CGPA ≥ 7.5',
        status: 'MEETS',
        ruleExpression: 'cgpa >= 7.5',
      },
      {
        id: 'er_06',
        label: 'No Active Backlogs',
        status: 'MEETS',
        ruleExpression: 'active_backlogs == 0',
      },
      {
        id: 'er_07',
        label: 'React Proficiency ≥ Intermediate',
        status: 'MEETS',
        ruleExpression: 'skill("React").proficiency >= "Intermediate"',
      },
    ],
    alignmentScore: 68,
    factorBreakdown: [
      { id: 'af_06', label: 'Required Skills',     weight: 0.35, score: 75, color: 'bg-oxford' },
      { id: 'af_07', label: 'Projects & Experience', weight: 0.20, score: 65, color: 'bg-emerald' },
      { id: 'af_08', label: 'Preferred Skills',     weight: 0.15, score: 50, color: 'bg-iris' },
      { id: 'af_09', label: 'Assessments',          weight: 0.15, score: 80, color: 'bg-oxford' },
      { id: 'af_10', label: 'Preferences',          weight: 0.15, score: 58, color: 'bg-amber' },
    ],
    sandboxToggles: [
      {
        id: 'st_04',
        label: 'Verify React skills via 120s Micro-Defense',
        potentialGain: 9,
        checked: false,
        relatedSkillId: 'sk_03',
      },
      {
        id: 'st_05',
        label: 'Add TypeScript certification',
        potentialGain: 7,
        checked: false,
      },
      {
        id: 'st_06',
        label: 'Complete REST API design assessment',
        potentialGain: 12,
        checked: false,
      },
    ],
  },
]

/* ================ Cohort Data for Liquidity Simulator ============ */

export const mockCohortFunnel: CohortFunnelStep[] = [
  { id: 'cf_00', ruleLabel: 'Total Cohort',            remainingCount: 240, isMandatory: true },
  { id: 'cf_01', ruleLabel: 'Degree Gate (B.Tech CS)',  remainingCount: 180, isMandatory: true },
  { id: 'cf_02', ruleLabel: 'CGPA ≥ 8.0',              remainingCount: 64,  isMandatory: true },
  { id: 'cf_03', ruleLabel: 'Kubernetes Proficiency',   remainingCount: 6,   isMandatory: true },
  { id: 'cf_04', ruleLabel: 'Cloud Deployment Exp.',    remainingCount: 4,   isMandatory: false },
]

/* ========================= Draft JDs ============================= */

export const mockDraftJDs: DraftJD[] = [
  {
    id: 'jd_01',
    jobTitle: 'Backend Engineer Intern',
    company: 'FinStack Technologies',
    status: 'Under Review',
    eligibleCount: 64,
    createdAt: '2026-10-28',
  },
  {
    id: 'jd_02',
    jobTitle: 'Full-Stack Developer',
    company: 'NovaPay Solutions',
    status: 'Draft',
    eligibleCount: 120,
    createdAt: '2026-10-30',
  },
  {
    id: 'jd_03',
    jobTitle: 'ML Research Intern',
    company: 'DeepNode Labs',
    status: 'Approved',
    eligibleCount: 18,
    createdAt: '2026-10-25',
  },
]

/* ==================== Parsed JDs for Officer Studio ================ */

export const mockParsedJDs: Record<string, ParsedJD> = {
  jd_01: {
    id: 'jd_01',
    jobTitle: 'Backend Engineer Intern',
    company: 'FinStack Technologies',
    department: 'Core Infrastructure & Payments',
    targetBatch: 'Class of 2027',
    minCgpa: 8.0,
    deadline: '2026-11-20',
    status: 'Under Review',
    rawText: `Position: Backend Engineer Intern
Company: FinStack Technologies
Location: Bangalore, India (Hybrid)
Eligibility:
- B.Tech or M.Tech in Computer Science, IT, or related technical disciplines (Graduating Batch 2027).
- Minimum CGPA of 8.0 on a 10.0 scale with no active backlogs.
- Hands-on experience with Python backend frameworks (FastAPI or Django) and relational databases (PostgreSQL).
- Production Kubernetes and container orchestration experience is strongly desired.
- Candidate must be a passionate team player with a high-velocity startup mindset and strong problem-solving intuition.
- Nice to have: Experience deploying on AWS / GCP cloud infrastructure and building distributed streaming pipelines.`,
    criteria: [
      {
        id: 'crit_degree',
        label: 'Degree Gate (B.Tech CS / IT)',
        ruleExpression: 'degree in ["B.Tech", "M.Tech"] AND branch in ["CS", "IT"] AND grad_year == 2027',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Eligibility • Line 4-5',
      },
      {
        id: 'crit_cgpa',
        label: 'Academic Standing (CGPA ≥ 8.0)',
        ruleExpression: 'cgpa >= 8.0 AND active_backlogs == 0',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Eligibility • Line 6',
      },
      {
        id: 'crit_fastapi',
        label: 'FastAPI / Python Microservices',
        ruleExpression: 'has_skill("FastAPI") OR has_skill("Django")',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 7',
      },
      {
        id: 'crit_k8s',
        label: 'Production Kubernetes Orchestration',
        ruleExpression: 'has_verified_evidence("Kubernetes", tier="Assessment-verified")',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 8',
      },
      {
        id: 'crit_cloud',
        label: 'Cloud Deployment (AWS / GCP)',
        ruleExpression: 'has_skill("AWS") OR has_skill("GCP")',
        gateType: 'PREFERRED',
        weight: 0.2,
        sourceSpan: 'JD §Nice-to-Have • Line 10',
      },
      {
        id: 'crit_ambiguous',
        label: 'Startup Mindset & Problem-Solving Intuition',
        ruleExpression: 'score_rubric("CultureFit", threshold=0.7)',
        gateType: 'PREFERRED',
        weight: 0.1,
        sourceSpan: 'JD §Traits • Line 9',
        isAmbiguous: true,
        ambiguityReason: 'Subjective non-deterministic phrasing ("high-velocity startup mindset") cannot be validated deterministically. Converted from gate to alignment rubric.',
      },
    ],
  },
  jd_02: {
    id: 'jd_02',
    jobTitle: 'Full-Stack Developer',
    company: 'NovaPay Solutions',
    department: 'Merchant Platform Engineering',
    targetBatch: 'Class of 2027',
    minCgpa: 7.5,
    deadline: '2026-12-01',
    status: 'Draft',
    rawText: `Position: Full-Stack Developer
Company: NovaPay Solutions
Location: Remote / Mumbai
Requirements:
- B.Tech Computer Science, IT, or Mathematics (2027 Batch).
- CGPA 7.5 and above.
- Proficiency in React, TypeScript, and Node.js or FastAPI backend.
- Experience with REST API design and relational databases.
- Preferred: Experience with Redis caching and Tailwind CSS.`,
    criteria: [
      {
        id: 'crit_np_degree',
        label: 'Degree Gate (B.Tech CS / IT / Math)',
        ruleExpression: 'degree == "B.Tech" AND branch in ["CS", "IT", "Math"]',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 5',
      },
      {
        id: 'crit_np_cgpa',
        label: 'CGPA ≥ 7.5',
        ruleExpression: 'cgpa >= 7.5',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 6',
      },
      {
        id: 'crit_np_frontend',
        label: 'React & TypeScript Proficiency',
        ruleExpression: 'has_skill("React") AND has_skill("TypeScript")',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 7',
      },
      {
        id: 'crit_np_redis',
        label: 'Redis Caching & Key-Value Stores',
        ruleExpression: 'has_skill("Redis")',
        gateType: 'PREFERRED',
        weight: 0.15,
        sourceSpan: 'JD §Preferred • Line 9',
      },
    ],
  },
  jd_03: {
    id: 'jd_03',
    jobTitle: 'ML Research Intern',
    company: 'DeepNode Labs',
    department: 'Applied Generative AI',
    targetBatch: 'Class of 2027',
    minCgpa: 8.5,
    deadline: '2026-11-15',
    status: 'Approved',
    approvedBy: 'Dr. K. Sharma (Placement Chair)',
    approvedAt: '2026-10-25T14:00:00Z',
    rawText: `Position: ML Research Intern
Company: DeepNode Labs
Location: Bangalore
Requirements:
- B.Tech or M.Tech CS / AI / Data Science (Class of 2027).
- CGPA ≥ 8.5 with coursework in Deep Learning.
- PyTorch or JAX proficiency, understanding of Transformer architectures.
- Preferred: Pre-print or conference workshop paper.`,
    criteria: [
      {
        id: 'crit_ml_degree',
        label: 'Degree in CS / AI / Data Science',
        ruleExpression: 'degree in ["B.Tech", "M.Tech"] AND branch in ["CS", "AI", "Data Science"]',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 5',
      },
      {
        id: 'crit_ml_cgpa',
        label: 'CGPA ≥ 8.5',
        ruleExpression: 'cgpa >= 8.5',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 6',
      },
      {
        id: 'crit_ml_pytorch',
        label: 'PyTorch / JAX Framework Experience',
        ruleExpression: 'has_skill("PyTorch") OR has_skill("JAX")',
        gateType: 'MANDATORY',
        sourceSpan: 'JD §Requirements • Line 7',
      },
    ],
  },
}

/* ===================== Source Documents =========================== */

export const mockSourceDocuments: Record<string, SourceDocument> = {
  doc_resume_v3: {
    id: 'doc_resume_v3',
    fileName: 'Resume_v3.pdf',
    pageNumber: 1,
    highlightedText:
      'Developed a high-throughput order processing microservice using FastAPI and PostgreSQL, handling 2,000+ concurrent requests with async workers. Implemented event-driven architecture with Redis Streams for real-time inventory synchronization across distributed nodes.',
    fullText:
      'Priya Sharma — B.Tech Computer Science, Class of 2027\n\nSkills: Python (Advanced), React (Advanced), SQL & Database Design, Distributed Systems, FastAPI\n\nProjects:\n• Order Processing Microservice (FastAPI + PostgreSQL): Developed a high-throughput order processing microservice using FastAPI and PostgreSQL, handling 2,000+ concurrent requests with async workers. Implemented event-driven architecture with Redis Streams for real-time inventory synchronization across distributed nodes.\n• Campus Events Portal (React + Node.js): Built a full-stack event management platform serving 3,000+ students with real-time notifications and calendar integration.',
  },
  doc_cert_k8s: {
    id: 'doc_cert_k8s',
    fileName: 'K8s_Fundamentals_Cert.pdf',
    pageNumber: 1,
    highlightedText:
      'Certificate of Completion — Kubernetes Fundamentals. Issued: March 2025. Valid through: March 2026. Status: EXPIRED.',
  },
}

/* =================== Student Profile Summary ===================== */

export const mockStudent = {
  name: 'Priya Sharma',
  degree: 'B.Tech Computer Science',
  gradYear: 2027,
  cgpa: 8.2,
  institution: 'National Institute of Technology, Surathkal',
  optedInRecruiters: 2,
  skills: mockSkills,
}

/* ==================== Eligibility Disputes ======================== */

export const mockDisputes: EligibilityDispute[] = [
  {
    id: 'disp_001',
    matchResultId: 'match_innovateco_002',
    jobTitle: 'Full-Stack Developer',
    company: 'InnovateCo',
    ruleId: 'rule_degree',
    ruleLabel: 'Branch: CS / IT / Math Equivalent',
    attachedDocumentId: 'doc_resume_v3',
    attachedSpan: 'Resume_v3.pdf • p.1, §Education',
    studentNote: 'My degree is B.Tech Computer Science & Engineering (CSE) which is the direct NITK institutional equivalent of CS.',
    status: 'PENDING_REVIEW',
    submittedAt: '2026-10-31T11:15:00Z',
  },
  {
    id: 'disp_002',
    matchResultId: 'match_techcorp_001',
    jobTitle: 'Backend Engineer',
    company: 'TechCorp India',
    ruleId: 'rule_course_equiv',
    ruleLabel: 'Prerequisite: Distributed Systems Coursework',
    attachedDocumentId: 'doc_resume_v3',
    attachedSpan: 'Resume_v3.pdf • p.2, §Projects',
    studentNote: 'Completed CS402: Cloud & Distributed Computing as a departmental elective (Grade: A), approved as the Distributed Systems equivalent.',
    status: 'APPROVED_OVERRIDE',
    reviewedBy: 'Dr. K. Sharma (Placement Chair)',
    reviewReasonCode: 'EQUIVALENCE_APPROVED',
    submittedAt: '2026-10-26T09:00:00Z',
    resolvedAt: '2026-10-27T14:30:00Z',
  },
]

/* ================== Active Campus Applications =================== */

export const mockApplications: ApplicationItem[] = [
  {
    id: 'app_techcorp_01',
    jobId: 'job_techcorp_001',
    jobTitle: 'Backend Engineer',
    company: 'TechCorp India',
    appliedAt: '2026-10-24T10:00:00Z',
    currentStage: 'SHORTLISTED',
    eligibilityStatus: 'MEETS',
    matchScore: 93,
    nextMilestone: 'Technical Interview • Friday 10:00 AM IST',
    dispute: mockDisputes[1],
  },
  {
    id: 'app_innovateco_02',
    jobId: 'job_innovateco_002',
    jobTitle: 'Full-Stack Developer',
    company: 'InnovateCo',
    appliedAt: '2026-10-29T16:30:00Z',
    currentStage: 'ELIGIBILITY_VERIFIED',
    eligibilityStatus: 'UNKNOWN',
    matchScore: 68,
    nextMilestone: 'Awaiting Placement Officer clarification review',
    dispute: mockDisputes[0],
  },
  {
    id: 'app_cloudscale_03',
    jobId: 'job_cloudscale_003',
    jobTitle: 'Cloud Platform Intern',
    company: 'CloudScale Networks',
    appliedAt: '2026-10-30T14:00:00Z',
    currentStage: 'MICRO_DEFENSE_COMPLETE',
    eligibilityStatus: 'MEETS',
    matchScore: 82,
    nextMilestone: 'Recruiter Portfolio Review • Monday',
  },
]

/* ================= 6-Dimension Readiness Dimensions =============== */

export const mockReadinessDimensions: ReadinessDimension[] = [
  {
    id: 'rd_01',
    label: 'Profile Hygiene & Provenance',
    score: 94,
    benchmark: 78,
    status: 'OPTIMAL',
    description: '100% of skills anchored to verified resume text spans and valid credentials.',
  },
  {
    id: 'rd_02',
    label: 'Core Skills Mastery',
    score: 86,
    benchmark: 72,
    status: 'OPTIMAL',
    description: 'Advanced proficiency demonstrated in Python, SQL, and FastAPI microservices.',
  },
  {
    id: 'rd_03',
    label: 'Project Implementation Depth',
    score: 80,
    benchmark: 65,
    status: 'OPTIMAL',
    description: 'Production-grade Redis Streams & high-concurrency order pipeline in portfolio.',
  },
  {
    id: 'rd_04',
    label: 'Micro-Defense Proof-of-Work',
    score: 88,
    benchmark: 60,
    status: 'OPTIMAL',
    description: 'Passed 120s technical defense with 3/3 artifact grounding rubric checks.',
  },
  {
    id: 'rd_05',
    label: 'Interview Readiness (STAR)',
    score: 75,
    benchmark: 70,
    status: 'ON_TRACK',
    description: 'Strong architectural trade-off reasoning; practice system design scenarios.',
  },
  {
    id: 'rd_06',
    label: 'Application Sprint Velocity',
    score: 90,
    benchmark: 68,
    status: 'OPTIMAL',
    description: '3 active drives submitted with 1 shortlist confirmed for upcoming week.',
  },
]

/* ================= Immutable Resume Versions ====================== */

export const mockResumeVersions: ResumeVersion[] = [
  {
    id: 'rv_03',
    versionNumber: 3,
    fileName: 'Resume_v3.pdf',
    uploadedAt: '2026-10-24T18:30:00Z',
    fileSize: '412 KB',
    extractedSkillsCount: 6,
    sourceDocumentId: 'doc_resume_v3',
    isCurrent: true,
  },
  {
    id: 'rv_02',
    versionNumber: 2,
    fileName: 'Resume_v2.pdf',
    uploadedAt: '2026-10-10T12:15:00Z',
    fileSize: '398 KB',
    extractedSkillsCount: 4,
    sourceDocumentId: 'doc_resume_v3',
    isCurrent: false,
  },
  {
    id: 'rv_01',
    versionNumber: 1,
    fileName: 'Resume_v1.pdf',
    uploadedAt: '2026-09-15T09:00:00Z',
    fileSize: '360 KB',
    extractedSkillsCount: 3,
    sourceDocumentId: 'doc_resume_v3',
    isCurrent: false,
  },
]

/* ================= Recruiter Consent Preferences ================== */

export const mockRecruiterConsents: RecruiterConsent[] = [
  {
    companyId: 'comp_techcorp',
    companyName: 'TechCorp India',
    category: 'Enterprise Infrastructure & Cloud',
    optedIn: true,
    lastChangedAt: '2026-10-24T10:00:00Z',
    verifiedSkillsVisibleCount: 4,
  },
  {
    companyId: 'comp_finstack',
    companyName: 'FinStack Technologies',
    category: 'Fintech & High-Volume Payments',
    optedIn: true,
    lastChangedAt: '2026-10-25T11:30:00Z',
    verifiedSkillsVisibleCount: 4,
  },
  {
    companyId: 'comp_innovateco',
    companyName: 'InnovateCo',
    category: 'Consumer Web & SaaS Platforms',
    optedIn: false,
    lastChangedAt: '2026-10-28T16:00:00Z',
    verifiedSkillsVisibleCount: 0,
  },
  {
    companyId: 'comp_cloudscale',
    companyName: 'CloudScale Networks',
    category: 'Edge Networking & Distributed Mesh',
    optedIn: false,
    lastChangedAt: '2026-10-30T14:00:00Z',
    verifiedSkillsVisibleCount: 0,
  },
]

/* ================= Faculty Advisees =============================== */

export const mockFacultyAdvisees: FacultyAdvisee[] = [
  {
    id: 'adv_00',
    name: 'Aarav Sharma',
    rollNumber: '231CS001',
    department: 'Computer Science & Engineering',
    cgpa: 8.42,
    overallReadiness: 88,
    skillsCount: 7,
    verifiedCount: 5,
    featuredProject: 'High-Throughput Concurrency Pipeline (FastAPI + Redis Streams)',
    featuredSkillId: 'sk_02',
    institutionVerified: false,
  },
  {
    id: 'adv_01',
    name: 'Priya Sharma',
    rollNumber: '231CS042',
    department: 'Computer Science & Engineering',
    cgpa: 8.2,
    overallReadiness: 85,
    skillsCount: 6,
    verifiedCount: 4,
    featuredProject: 'Order Processing Microservice (FastAPI + Redis Streams)',
    featuredSkillId: 'sk_02',
    institutionVerified: false,
  },
  {
    id: 'adv_02',
    name: 'Rahul Verma',
    rollNumber: '231CS058',
    department: 'Computer Science & Engineering',
    cgpa: 8.9,
    overallReadiness: 92,
    skillsCount: 8,
    verifiedCount: 7,
    featuredProject: 'Distributed Raft Consensus Engine (Go)',
    featuredSkillId: 'sk_01',
    institutionVerified: true,
  },
  {
    id: 'adv_03',
    name: 'Ananya Sen',
    rollNumber: '231CS014',
    department: 'Computer Science & Engineering',
    cgpa: 7.8,
    overallReadiness: 74,
    skillsCount: 5,
    verifiedCount: 3,
    featuredProject: 'Vector Search Semantic Index (Python + pgvector)',
    featuredSkillId: 'sk_05',
    institutionVerified: false,
  },
  {
    id: 'adv_04',
    name: 'Arijeet Basak',
    rollNumber: '231CS128',
    department: 'B.Tech CS (Artificial Intelligence)',
    cgpa: 8.85,
    overallReadiness: 94,
    skillsCount: 9,
    verifiedCount: 8,
    featuredProject: 'CampusBridge Placement Intelligence Engine & RAG Pipeline',
    featuredSkillId: 'sk_03',
    institutionVerified: true,
  },
]

/* ================= Recruiter Candidate View ======================= */

export const mockRecruiterCandidates: RecruiterCandidate[] = [
  {
    id: 'cand_ps',
    anonymousAlias: 'Candidate #231-CS-42',
    department: 'B.Tech Computer Science',
    gradYear: 2027,
    matchScore: 93,
    eligibility: 'MEETS',
    verifiedSkills: ['Python (Advanced)', 'FastAPI Microservices', 'SQL & Database Design', 'Distributed Systems'],
    defenseProofTitle: 'FastAPI Microservice Concurrency Defense',
    defensePassed: true,
    consentGranted: true,
  },
  {
    id: 'cand_rv',
    anonymousAlias: 'Candidate #231-CS-58',
    department: 'B.Tech Computer Science',
    gradYear: 2027,
    matchScore: 89,
    eligibility: 'MEETS',
    verifiedSkills: ['Go Systems', 'Distributed Systems', 'Docker', 'Linux Internals'],
    defenseProofTitle: 'Raft Consensus State Machine Defense',
    defensePassed: true,
    consentGranted: true,
  },
  {
    id: 'cand_as',
    anonymousAlias: 'Candidate #231-CS-14',
    department: 'B.Tech Computer Science',
    gradYear: 2027,
    matchScore: 78,
    eligibility: 'MEETS',
    verifiedSkills: ['Python', 'PostgreSQL', 'Data Structures'],
    defensePassed: false,
    consentGranted: true,
  },
]

