import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEMO_EVIDENCE: Record<string, any[]> = {
  'STU-101': [
    {
      id: 'ev-101-1',
      name: 'Python',
      skill_name: 'Python',
      category: 'Programming Languages',
      proficiency: 'Expert',
      evidenceStatus: 'INSTITUTION_VERIFIED',
      evidence_status: 'INSTITUTION_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.98,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: 'Resume • Core Languages & Async Concurrency',
    },
    {
      id: 'ev-101-2',
      name: 'FastAPI',
      skill_name: 'FastAPI',
      category: 'Backend Frameworks',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.96,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: 'Resume • Microservices & OpenAPI Spec',
    },
    {
      id: 'ev-101-3',
      name: 'SQL',
      skill_name: 'SQL',
      category: 'Databases',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.95,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: 'Transcripts & SQL Windowing Defense',
    },
    {
      id: 'ev-101-4',
      name: 'PostgreSQL',
      skill_name: 'PostgreSQL',
      category: 'Databases',
      proficiency: 'Advanced',
      evidenceStatus: 'INSTITUTION_VERIFIED',
      evidence_status: 'INSTITUTION_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.94,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: 'Resume • Relational Indexing & Query Tuning',
    },
    {
      id: 'ev-101-5',
      name: 'Docker',
      skill_name: 'Docker',
      category: 'DevOps & Cloud',
      proficiency: 'Intermediate',
      evidenceStatus: 'STUDENT_CONFIRMED',
      evidence_status: 'STUDENT_CONFIRMED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 0.95,
      confidence: 0.92,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: 'Resume • Multi-stage Container Builds',
    },
    {
      id: 'ev-101-6',
      name: 'Redis',
      skill_name: 'Redis',
      category: 'Distributed Systems',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.93,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: '120s Defense • Distributed Locks & TTL Invalidation',
    },
    {
      id: 'ev-101-7',
      name: 'React',
      skill_name: 'React',
      category: 'Frontend Engineering',
      proficiency: 'Intermediate',
      evidenceStatus: 'STUDENT_CONFIRMED',
      evidence_status: 'STUDENT_CONFIRMED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 0.95,
      confidence: 0.90,
      sourceDocumentId: 'doc_resume_v3.pdf',
      sourceSpan: 'Resume • State Management & Next.js SSR',
    },
  ],
  'STU-102': [
    {
      id: 'ev-102-1',
      name: 'Python',
      skill_name: 'Python',
      category: 'Programming Languages',
      proficiency: 'Expert',
      evidenceStatus: 'INSTITUTION_VERIFIED',
      evidence_status: 'INSTITUTION_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.99,
      sourceDocumentId: 'doc_resume_priya.pdf',
      sourceSpan: 'Resume • Core Python & NumPy Vectorization',
    },
    {
      id: 'ev-102-2',
      name: 'PyTorch',
      skill_name: 'PyTorch',
      category: 'Machine Learning',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.97,
      sourceDocumentId: 'doc_resume_priya.pdf',
      sourceSpan: 'Project • Transformer Fine-tuning & Evaluation',
    },
    {
      id: 'ev-102-3',
      name: 'SQL',
      skill_name: 'SQL',
      category: 'Databases',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.95,
      sourceDocumentId: 'doc_resume_priya.pdf',
      sourceSpan: 'Transcripts • Analytics & Window Aggregations',
    },
    {
      id: 'ev-102-4',
      name: 'FastAPI',
      skill_name: 'FastAPI',
      category: 'Backend Frameworks',
      proficiency: 'Intermediate',
      evidenceStatus: 'STUDENT_CONFIRMED',
      evidence_status: 'STUDENT_CONFIRMED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 0.95,
      confidence: 0.91,
      sourceDocumentId: 'doc_resume_priya.pdf',
      sourceSpan: 'Resume • RESTful Model Serving Endpoints',
    },
  ],
  'STU-128': [
    {
      id: 'ev-128-1',
      name: 'Python',
      skill_name: 'Python',
      category: 'Programming Languages',
      proficiency: 'Expert',
      evidenceStatus: 'INSTITUTION_VERIFIED',
      evidence_status: 'INSTITUTION_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.98,
      sourceDocumentId: 'doc_resume_arijeet.pdf',
      sourceSpan: 'Resume • AI Engine Architecture',
    },
    {
      id: 'ev-128-2',
      name: 'FastAPI',
      skill_name: 'FastAPI',
      category: 'Backend Frameworks',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.96,
      sourceDocumentId: 'doc_resume_arijeet.pdf',
      sourceSpan: 'Resume • Real-time Event Streaming',
    },
    {
      id: 'ev-128-3',
      name: 'SQL',
      skill_name: 'SQL',
      category: 'Databases',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.95,
      sourceDocumentId: 'doc_resume_arijeet.pdf',
      sourceSpan: 'PostgreSQL Indexing & Partitioning',
    },
    {
      id: 'ev-128-4',
      name: 'Docker',
      skill_name: 'Docker',
      category: 'DevOps & Cloud',
      proficiency: 'Intermediate',
      evidenceStatus: 'STUDENT_CONFIRMED',
      evidence_status: 'STUDENT_CONFIRMED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 0.95,
      confidence: 0.92,
      sourceDocumentId: 'doc_resume_arijeet.pdf',
      sourceSpan: 'Containerization & Microservices',
    },
    {
      id: 'ev-128-5',
      name: 'Redis',
      skill_name: 'Redis',
      category: 'Distributed Systems',
      proficiency: 'Advanced',
      evidenceStatus: 'ASSESSMENT_VERIFIED',
      evidence_status: 'ASSESSMENT_VERIFIED',
      tier: 'CONFIRMED_SOLID',
      multiplier: 1.0,
      confidence: 0.95,
      sourceDocumentId: 'doc_resume_arijeet.pdf',
      sourceSpan: 'FastAPI Redis Idempotency 120s Defense • 1.0x Solid Locked',
    },
  ],
  'STU-115': [
    { id: 'ev-115-1', name: 'SQL', skill_name: 'SQL', category: 'Databases', proficiency: 'Advanced', evidenceStatus: 'ASSESSMENT_VERIFIED', evidence_status: 'ASSESSMENT_VERIFIED', tier: 'CONFIRMED_SOLID', multiplier: 1.0, confidence: 0.98, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'PostgreSQL Indexing, CTEs & Window Functions Defense' },
    { id: 'ev-115-2', name: 'PostgreSQL', skill_name: 'PostgreSQL', category: 'Databases', proficiency: 'Advanced', evidenceStatus: 'ASSESSMENT_VERIFIED', evidence_status: 'ASSESSMENT_VERIFIED', tier: 'CONFIRMED_SOLID', multiplier: 1.0, confidence: 0.97, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Relational Indexing, Partitioning & ACID Compliance' },
    { id: 'ev-115-3', name: 'MySQL', skill_name: 'MySQL', category: 'Databases', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Database Schemas & Normalization' },
    { id: 'ev-115-4', name: 'Redis', skill_name: 'Redis', category: 'Databases', proficiency: 'Advanced', evidenceStatus: 'ASSESSMENT_VERIFIED', evidence_status: 'ASSESSMENT_VERIFIED', tier: 'CONFIRMED_SOLID', multiplier: 1.0, confidence: 0.96, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Distributed Caching & In-Memory Key-Value Stores' },
    { id: 'ev-115-5', name: 'MongoDB', skill_name: 'MongoDB', category: 'Databases', proficiency: 'Intermediate', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.94, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Document Stores & Aggregation Pipelines' },
    { id: 'ev-115-6', name: 'Python', skill_name: 'Python', category: 'Languages', proficiency: 'Advanced', evidenceStatus: 'ASSESSMENT_VERIFIED', evidence_status: 'ASSESSMENT_VERIFIED', tier: 'CONFIRMED_SOLID', multiplier: 1.0, confidence: 0.98, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Core Python, Async Concurrency & Data Structures' },
    { id: 'ev-115-7', name: 'Express.js', skill_name: 'Express.js', category: 'Backend', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'RESTful API Endpoints & Middleware Architecture' },
    { id: 'ev-115-8', name: 'React', skill_name: 'React', category: 'Frontend', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'State Management, Hooks & Responsive UI' },
    { id: 'ev-115-9', name: 'Tailwind CSS', skill_name: 'Tailwind CSS', category: 'Frontend', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Design Systems & Utility Styling' },
    { id: 'ev-115-10', name: 'Linux', skill_name: 'Linux', category: 'DevOps', proficiency: 'Intermediate', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.94, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Shell Scripting & Server Administration' },
    { id: 'ev-115-11', name: 'Machine Learning', skill_name: 'Machine Learning', category: 'AI / ML', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.96, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Supervised & Unsupervised Model Training' },
    { id: 'ev-115-12', name: 'PyTorch', skill_name: 'PyTorch', category: 'AI / ML', proficiency: 'Advanced', evidenceStatus: 'ASSESSMENT_VERIFIED', evidence_status: 'ASSESSMENT_VERIFIED', tier: 'CONFIRMED_SOLID', multiplier: 1.0, confidence: 0.97, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Neural Networks & Deep Learning Architectures' },
    { id: 'ev-115-13', name: 'Scikit-learn', skill_name: 'Scikit-learn', category: 'AI / ML', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Classification, Regression & Model Evaluation' },
    { id: 'ev-115-14', name: 'Pandas', skill_name: 'Pandas', category: 'AI / ML', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Tabular Data Wrangling & Feature Engineering' },
    { id: 'ev-115-15', name: 'LLMs & GenAI', skill_name: 'LLMs & GenAI', category: 'AI / ML', proficiency: 'Advanced', evidenceStatus: 'ASSESSMENT_VERIFIED', evidence_status: 'ASSESSMENT_VERIFIED', tier: 'CONFIRMED_SOLID', multiplier: 1.0, confidence: 0.97, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Prompt Engineering, RAG & Vector Embeddings' },
    { id: 'ev-115-16', name: 'Natural Language Processing', skill_name: 'Natural Language Processing', category: 'AI / ML', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Tokenization, Transformers & Text Classification' },
    { id: 'ev-115-17', name: 'Computer Vision', skill_name: 'Computer Vision', category: 'AI / ML', proficiency: 'Intermediate', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.93, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Convolutional Networks & Image Segmentation' },
    { id: 'ev-115-18', name: 'Git & Version Control', skill_name: 'Git & Version Control', category: 'Tools', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.96, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Branching, PRs & Trunk-Based Development' },
    { id: 'ev-115-19', name: 'Postman', skill_name: 'Postman', category: 'Tools', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'API Testing, Automated Collections & Mock Servers' },
    { id: 'ev-115-20', name: 'Agile & Scrum', skill_name: 'Agile & Scrum', category: 'Soft Skills', proficiency: 'Advanced', evidenceStatus: 'STUDENT_CONFIRMED', evidence_status: 'STUDENT_CONFIRMED', tier: 'CONFIRMED_SOLID', multiplier: 0.95, confidence: 0.95, sourceDocumentId: 'doc_resume_devansh.pdf', sourceSpan: 'Sprint Planning & Standups' },
  ],
}

// Aliases for STU-115
DEMO_EVIDENCE['STU-537'] = DEMO_EVIDENCE['STU-115']
DEMO_EVIDENCE['STU-105'] = DEMO_EVIDENCE['STU-115']

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const studentId = (params.studentId || 'STU-101').trim()
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/students/${studentId}/evidence`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data)
      }
    }
  } catch {}

  // Fallback: If it's a known institutional demo profile, return verified demo credentials
  const normId = studentId.toUpperCase()
  if (normId.includes('ARIJEET') || normId === 'STU-128') {
    return NextResponse.json(DEMO_EVIDENCE['STU-128'])
  }
  if (normId.includes('DEVANSH') || normId === 'STU-115' || normId === 'STU-537' || normId === 'STU-105') {
    return NextResponse.json(DEMO_EVIDENCE['STU-115'])
  }
  if (normId.includes('PRIYA') || normId === 'STU-102') {
    return NextResponse.json(DEMO_EVIDENCE['STU-102'])
  }
  if (normId.includes('AARAV') || normId === 'STU-101') {
    return NextResponse.json(DEMO_EVIDENCE['STU-101'])
  }
  if (DEMO_EVIDENCE[normId]) {
    return NextResponse.json(DEMO_EVIDENCE[normId])
  }

  // Strict assertion: For brand new unregistered student accounts, return 0 skills
  return NextResponse.json([])
}
