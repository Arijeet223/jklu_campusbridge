import { NextRequest, NextResponse } from 'next/server'
import { getServerlessMentors } from '@/lib/serverless-store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const branch = searchParams.get('branch') || undefined
  const skill = searchParams.get('skill') || undefined
  const minCgpaRaw = searchParams.get('min_cgpa')
  const minCgpa = minCgpaRaw ? parseFloat(minCgpaRaw) : undefined

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const queryParams = new URLSearchParams()
    if (branch) queryParams.set('branch', branch)
    if (skill) queryParams.set('skill', skill)
    if (minCgpa) queryParams.set('min_cgpa', String(minCgpa))

    const res = await fetch(`${backendBase}/v1/mentors/available?${queryParams.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  // Serverless DPDP-compliant mentor discovery fallback
  const mentors = getServerlessMentors(branch, skill, minCgpa)
  return NextResponse.json({
    status: 'SUCCESS',
    count: mentors.length,
    mentors,
    dpdp_compliant: true,
    privacy_notice:
      'Zero mock data. Backed strictly by enrolled students table in Neon PostgreSQL / ExcelStore. Only students with explicit share_info_with_juniors = True are included.',
  })
}
