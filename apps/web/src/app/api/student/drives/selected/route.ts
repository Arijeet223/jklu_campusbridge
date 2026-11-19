import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || 'STU-101'

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(
      `${backendBase}/v1/student/drives/selected?student_id=${encodeURIComponent(studentId)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    )
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(err, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({
      status: 'SUCCESS',
      student_id: studentId,
      selected_drive_ids: [],
      selected_jobs: [],
      count: 0,
    })
  }
}
