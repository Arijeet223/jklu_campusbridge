import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || 'STU-101'
  const studentName = searchParams.get('student_name') || ''
  const room = searchParams.get('room') || ''

  try {
    const backendUrl = `http://127.0.0.1:8000/v1/voice/token?student_id=${encodeURIComponent(studentId)}&student_name=${encodeURIComponent(studentName)}&room=${encodeURIComponent(room)}`
    const res = await fetch(backendUrl, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Backend token service returned status ${res.status}`)
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    // If backend is unavailable or during SSR, return fallback config
    return NextResponse.json(
      {
        error: 'Backend token unavailable',
        url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://first-w4gv5xp4.livekit.cloud',
        room: `campusbridge-${studentId}`,
        identity: studentId,
      },
      { status: 502 }
    )
  }
}

