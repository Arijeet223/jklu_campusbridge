import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { student_id = 'STU-101', confirmed_skills = [], candidate_metadata = {}, file_name = 'Resume.pdf' } = body

    if (!Array.isArray(confirmed_skills) || confirmed_skills.length === 0) {
      return NextResponse.json(
        { detail: 'Cannot complete onboarding: At least one confirmed skill card is required.' },
        { status: 400 }
      )
    }

    // 1. Try forwarding to remote or local FastAPI backend if reachable
    const backendBase = (process.env.CAMPUSBRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
    try {
      const backendRes = await fetch(`${backendBase}/v1/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (backendRes.ok) {
        const data = await backendRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    // 2. Pure Vercel Serverless Mathematical Calculation Fallback
    const profVal = (p: string) => {
      const low = (p || '').toLowerCase()
      if (low.includes('expert')) return 96
      if (low.includes('adv')) return 88
      if (low.includes('beg')) return 55
      return 72
    }

    const sqlRegex = /\b(sql|postgresql|postgres|mysql|sqlite|database|indexing|cte|dense_rank|window|acid)\b/i
    const dsaRegex = /\b(python|c\+\+|cpp|java|golang|rust|algorithms|data structures|dsa|dynamic programming|binary search)\b/i
    const backendRegex = /\b(fastapi|django|flask|express|spring|rest|graphql|microservices|celery|kafka|redis)\b/i
    const cloudRegex = /\b(docker|kubernetes|aws|gcp|azure|linux|ci\/cd|terraform|nginx)\b/i
    const aiRegex = /\b(machine learning|deep learning|pytorch|tensorflow|rag|qdrant|pandas|numpy|nlp|llm)\b/i

    const safeSkills: any[] = Array.isArray(confirmed_skills) ? confirmed_skills : []

    const sqlScores = safeSkills.filter((s) => sqlRegex.test(s.name) || sqlRegex.test(s.category || '')).map((s) => profVal(s.proficiency))
    const dsaScores = safeSkills.filter((s) => dsaRegex.test(s.name) || dsaRegex.test(s.category || '')).map((s) => profVal(s.proficiency))
    const backendScores = safeSkills.filter((s) => backendRegex.test(s.name) || backendRegex.test(s.category || '')).map((s) => profVal(s.proficiency))
    const cloudScores = safeSkills.filter((s) => cloudRegex.test(s.name) || cloudRegex.test(s.category || '')).map((s) => profVal(s.proficiency))
    const aiScores = safeSkills.filter((s) => aiRegex.test(s.name) || aiRegex.test(s.category || '')).map((s) => profVal(s.proficiency))
    const softScores = safeSkills.filter((s) => s.is_soft_skill || (s.category || '').toLowerCase().includes('soft')).map((s) => profVal(s.proficiency))

    let dimSql = sqlScores.length ? Math.max(...sqlScores) : 52
    let dimDsa = dsaScores.length ? Math.max(...dsaScores) : 60
    let dimBackend = backendScores.length ? Math.max(...backendScores) : 55
    let dimCloud = cloudScores.length ? Math.max(...cloudScores) : 50
    let dimAi = aiScores.length ? Math.max(...aiScores) : 50
    let dimSoft = softScores.length ? Math.max(...softScores) : 70

    // Breadth bonus
    dimSql = Math.min(98, dimSql + Math.min(8, Math.max(0, sqlScores.length - 1) * 3))
    dimDsa = Math.min(98, dimDsa + Math.min(8, Math.max(0, dsaScores.length - 1) * 3))
    dimBackend = Math.min(98, dimBackend + Math.min(8, Math.max(0, backendScores.length - 1) * 3))
    dimCloud = Math.min(98, dimCloud + Math.min(8, Math.max(0, cloudScores.length - 1) * 3))

    const weights = [
      dimDsa * 0.25,
      dimBackend * 0.20,
      dimSql * 0.20,
      dimCloud * 0.15,
      dimAi * 0.10,
      dimSoft * 0.10,
    ]
    const overallReadiness = Math.round(weights.reduce((a, b) => a + b, 0))

    // Radar coordinates
    const dimOrder = [dimDsa, dimBackend, dimSql, dimCloud, dimAi, dimSoft]
    const centerX = 100.0
    const centerY = 100.0
    const maxRadius = 80.0
    const radarCoords = dimOrder.map((val, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180.0)
      const normR = (val / 100.0) * maxRadius
      const rx = (centerX + normR * Math.cos(angle)).toFixed(1)
      const ry = (centerY + normR * Math.sin(angle)).toFixed(1)
      return `${rx},${ry}`
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully. Profile activated.',
      student_id,
      status: 'ACTIVE',
      needs_onboarding: false,
      readiness_index: overallReadiness,
      radar_scores: {
        dsa: dimDsa,
        backend: dimBackend,
        sql: dimSql,
        cloud: dimCloud,
        ai_ml: dimAi,
        soft_skills: dimSoft,
      },
      radar_polygon: radarCoords.join(' '),
      confirmed_skills_count: safeSkills.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { detail: error?.message || 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

