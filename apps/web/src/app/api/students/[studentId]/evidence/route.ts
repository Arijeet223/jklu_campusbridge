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
  ],
}

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
  if (DEMO_EVIDENCE[normId]) {
    return NextResponse.json(DEMO_EVIDENCE[normId])
  }

  // Strict assertion: For brand new unregistered student accounts, return 0 skills
  return NextResponse.json([])
}
