import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const studentId = (formData.get('student_id') as string) || 'STU-101'

    if (!file) {
      return NextResponse.json({ detail: 'No grade sheet or transcript file provided.' }, { status: 400 })
    }

    const backendBase =
      process.env.CAMPUSBRIDGE_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000'
    const cleanBase = backendBase.replace(/\/+$/, '')

    const endpoints = [
      `${cleanBase}/api/academic/upload-grades`,
      `${cleanBase}/v1/academic/upload-grades`,
      `${cleanBase}/academic/upload-grades`,
    ]

    let lastErrorDetail = 'Failed to connect to backend academic parsing service.'
    let lastStatusCode = 503

    for (const ep of endpoints) {
      try {
        const forwardData = new FormData()
        forwardData.append('file', file, file.name)
        forwardData.append('student_id', studentId)

        const forwardRes = await fetch(ep, {
          method: 'POST',
          body: forwardData,
          signal: AbortSignal.timeout(35000), // OCR + LLM can take up to 25-30s on heavy image
        })

        if (forwardRes.ok) {
          const data = await forwardRes.json()
          return NextResponse.json(data)
        } else {
          const errJson = await forwardRes.json().catch(() => ({}))
          lastErrorDetail = errJson.detail || `Backend returned HTTP ${forwardRes.status}`
          lastStatusCode = forwardRes.status
          console.warn(`Endpoint ${ep} returned ${forwardRes.status}:`, errJson)
        }
      } catch (err: any) {
        lastErrorDetail = err.message || 'Connection failed'
        console.warn(`Failed forwarding to ${ep}:`, err)
      }
    }

    // Never return mock/dummy courses (e.g. DBMS, Computer Networks)
    return NextResponse.json(
      {
        detail: lastErrorDetail || 'Unable to extract academic grades. Please ensure the document is clear and readable.',
      },
      { status: lastStatusCode }
    )
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to process grade sheet upload.' },
      { status: 500 }
    )
  }
}
