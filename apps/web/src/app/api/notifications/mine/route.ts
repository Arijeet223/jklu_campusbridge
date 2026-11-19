import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || searchParams.get('studentId') || 'STU-101'
  const limit = searchParams.get('limit') || '50'

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/notifications/mine?student_id=${encodeURIComponent(studentId)}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }

    const err = await res.json().catch(() => ({}))
    return NextResponse.json(err, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({
      status: 'FALLBACK',
      notifications: [],
      total_count: 0,
      unread_count: 0,
      error: err.message,
    })
  }
}
