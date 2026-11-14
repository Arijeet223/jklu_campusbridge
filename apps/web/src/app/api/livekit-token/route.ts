import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id') || 'STU-101'
  const studentName = searchParams.get('student_name') || ''
  const targetRoom = searchParams.get('room') || `campusbridge-${studentId}`
  const jobId = searchParams.get('job_id') || ''

  const jobParam = jobId ? `&job_id=${encodeURIComponent(jobId)}` : ''
  const queryPath = `/v1/voice/token?student_id=${encodeURIComponent(studentId)}&student_name=${encodeURIComponent(studentName)}&room=${encodeURIComponent(targetRoom)}${jobParam}`

  // Potential backend base URLs in priority order
  const candidateBases = [
    process.env.CAMPUSBRIDGE_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ].filter(Boolean) as string[]

  let lastError: any = null

  for (const base of candidateBases) {
    const cleanBase = base.replace(/\/+$/, '')
    const targetUrl = `${cleanBase}${queryPath}`
    try {
      const res = await fetch(targetUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch (err) {
      lastError = err
    }
  }

  return NextResponse.json(
    {
      error: 'Backend LiveKit token dispatcher unreachable',
      detail: lastError?.message || 'Failed connecting to backend voice token service',
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://first-w4gv5xp4.livekit.cloud',
      room: targetRoom,
      identity: studentId,
    },
    { status: 502 }
  )
}

