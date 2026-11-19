import { NextRequest, NextResponse } from 'next/server'
import { getServerlessJobs, addServerlessJob } from '@/lib/serverless-store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/jobs`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  // Resilient Serverless Fallback for Vercel
  const jobs = getServerlessJobs()
  return NextResponse.json({
    status: 'SUCCESS',
    jobs: jobs,
    total_count: jobs.length,
  })
}

export async function POST(req: NextRequest) {
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const body = await req.json().catch(() => ({}))

    // Forward to local backend if online
    try {
      const res = await fetch(`${backendBase}/v1/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      })
      if (res.ok) {
        const data = await res.json()
        addServerlessJob(body)
        return NextResponse.json(data)
      }
    } catch {}

    // Resilient serverless creation with live notification & Telegram alert
    const createdJob = addServerlessJob(body)
    return NextResponse.json({
      status: 'SUCCESS',
      job: createdJob,
      message: `Placement drive for ${createdJob.company_name} published and broadcast to students.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
