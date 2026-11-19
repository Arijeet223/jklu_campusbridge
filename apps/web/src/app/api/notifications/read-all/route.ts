import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || 'STU-101'

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/notifications/read-all?student_id=${encodeURIComponent(studentId)}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }

    const err = await res.json().catch(() => ({}))
    return NextResponse.json(err, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({
      status: 'SUCCESS',
      marked_count: 0,
    })
  }
}
