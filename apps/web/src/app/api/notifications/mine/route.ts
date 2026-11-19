import { NextRequest, NextResponse } from 'next/server'
import { getServerlessNotifications } from '@/lib/serverless-store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || searchParams.get('studentId') || 'STU-101'
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/notifications/mine?student_id=${encodeURIComponent(studentId)}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  // Serverless in-app notifications fallback
  const notifs = getServerlessNotifications(studentId).slice(0, limit)
  const unread = notifs.filter((n) => !n.is_read).length

  return NextResponse.json({
    status: 'SUCCESS',
    student_id: studentId,
    notifications: notifs,
    total_count: notifs.length,
    unread_count: unread,
  })
}
