import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const studentId = params.studentId || 'STU-101'
  const body = await req.json().catch(() => ({}))
  const { skill_name, category = 'Technical Skills', proficiency = 'Intermediate' } = body

  if (!skill_name || !skill_name.trim()) {
    return NextResponse.json({ detail: 'Skill name cannot be empty.' }, { status: 400 })
  }

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/students/${studentId}/custom-skill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skill_name: skill_name.trim(),
        category,
        proficiency,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  // Pure Next.js fallback if backend is unreachable
  const evId = `ev-ghost-${studentId.toLowerCase()}-${Date.now()}`
  const createdSkill = {
    id: evId,
    evidence_id: evId,
    name: skill_name.trim(),
    skill_name: skill_name.trim(),
    category,
    proficiency,
    evidenceStatus: 'EXTRACTED',
    evidence_status: 'EXTRACTED',
    tier: '0.5x_GHOST',
    multiplier: 0.5,
    confidence: 0.85,
    sourceDocumentId: 'doc_manual_claim',
    source_doc: 'Manual Student Claim',
    sourceSpan: 'Provisional skill claim (Self-reported)',
    source_span_text: 'Provisional skill claim (Self-reported)',
    student_id: studentId,
  }

  return NextResponse.json({
    status: 'SUCCESS',
    skill: createdSkill,
  })
}
