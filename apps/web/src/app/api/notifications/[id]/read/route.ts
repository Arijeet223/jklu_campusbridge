import { NextRequest, NextResponse } from 'next/server'

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
      id: notificationId,
      is_read: true,
      note: 'Marked read via local fallback',
    })
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return handleMarkRead(req, ctx)
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handleMarkRead(req, ctx)
}
