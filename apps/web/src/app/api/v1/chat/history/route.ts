import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('student_id') || 'STU-101'
    const backendBase = process.env.CAMPUSBRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const cleanBase = backendBase.replace(/\/+$/, '')

    try {
      const forwardRes = await fetch(`${cleanBase}/v1/chat/history?student_id=${encodeURIComponent(studentId)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      })
      if (forwardRes.ok) {
        const data = await forwardRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    return NextResponse.json({
      status: 'OK',
      student_id: studentId,
      messages: [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const studentId = req.nextUrl.searchParams.get('student_id') || body.student_id || 'STU-101'
    if (!body.student_id) {
      body.student_id = studentId
    }
    const backendBase = process.env.CAMPUSBRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const cleanBase = backendBase.replace(/\/+$/, '')

    try {
      const forwardRes = await fetch(`${cleanBase}/v1/chat/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      })
      if (forwardRes.ok) {
        const data = await forwardRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    return NextResponse.json({ status: 'OK', message: 'Chat history acknowledged' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
