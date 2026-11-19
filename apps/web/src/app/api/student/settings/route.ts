import { NextRequest, NextResponse } from 'next/server'
import {
  getServerlessStudentSettings,
  saveServerlessStudentSettings,
} from '@/lib/serverless-store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || searchParams.get('studentId') || 'STU-101'
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/students/${studentId}/profile`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  const fallback = getServerlessStudentSettings(studentId)
  return NextResponse.json({
    status: 'SUCCESS',
    student_id: studentId,
    ...fallback,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const studentId = body.student_id || body.studentId || 'STU-101'
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/students/${studentId}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      saveServerlessStudentSettings(studentId, body)
      return NextResponse.json(data)
    }
  } catch {}

  const saved = saveServerlessStudentSettings(studentId, body)
  return NextResponse.json({
    status: 'SUCCESS',
    message: 'Student preferences and alert channels updated successfully.',
    settings: saved,
  })
}

export async function PUT(req: NextRequest) {
  return POST(req)
}
