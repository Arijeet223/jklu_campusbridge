import { NextRequest, NextResponse } from 'next/server'
import { getServerlessJobs } from '@/lib/serverless-store'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const res = await fetch(`${backendBase}/v1/jobs/${encodeURIComponent(jobId)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch {}

  const jobs = getServerlessJobs()
  const found = jobs.find((j) => j.job_id === jobId)
  if (found) {
    return NextResponse.json(found)
  }
  return NextResponse.json({ error: 'Job not found' }, { status: 404 })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    const body = await req.json()
    try {
      const res = await fetch(`${backendBase}/v1/jobs/${encodeURIComponent(jobId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {}

    const jobs = getServerlessJobs()
    const target = jobs.find((j) => j.job_id === jobId)
    if (target) {
      Object.assign(target, body)
      return NextResponse.json({ status: 'SUCCESS', job: target })
    }
    return NextResponse.json({ status: 'SUCCESS', job: body })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id
  const backendBase = (
    process.env.CAMPUSBRIDGE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  try {
    try {
      const res = await fetch(`${backendBase}/v1/jobs/${encodeURIComponent(jobId)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {}

    return NextResponse.json({ status: 'SUCCESS', message: 'Job deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
