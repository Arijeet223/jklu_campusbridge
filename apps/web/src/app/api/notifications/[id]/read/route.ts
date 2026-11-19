import { NextRequest, NextResponse } from 'next/server'
import { markNotificationRead } from '@/lib/serverless-store'

export const runtime = 'nodejs'

async function handleMarkRead(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const notificationId = params.id
  if (!notificationId) {
    return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 })
  }

  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(1500),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  markNotificationRead(notificationId)
  return NextResponse.json({
    status: 'SUCCESS',
    id: notificationId,
    is_read: true,
  })
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return handleMarkRead(req, ctx)
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handleMarkRead(req, ctx)
}
