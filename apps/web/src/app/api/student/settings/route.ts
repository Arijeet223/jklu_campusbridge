import { NextRequest, NextResponse } from 'next/server'

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
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ error: 'Student not found' }, { status: 404 })
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
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
    const errData = await res.json().catch(() => ({}))
    return NextResponse.json(errData, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  return POST(req)
}
