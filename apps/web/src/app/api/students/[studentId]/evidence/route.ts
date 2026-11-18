import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const studentId = params.studentId || 'STU-101'
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/students/${studentId}/evidence`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return NextResponse.json(data)
      }
    }
  } catch {}

  // Fallback: Return empty array, never mock data
  return NextResponse.json([])
}
