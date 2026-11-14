import { NextRequest, NextResponse } from 'next/server'
import { mockJobMatches } from '@/lib/mock-data'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl?.searchParams?.get('student_id') || 'STU-101'

    // Forward to remote or local Python backend if configured and available
    const backendBase = process.env.CAMPUSBRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    try {
      const cleanBase = backendBase.replace(/\/+$/, '')
      const forwardRes = await fetch(`${cleanBase}/v1/matching/live-jobs?student_id=${encodeURIComponent(studentId)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(1000),
      })
      if (forwardRes.ok) {
        const remoteData = await forwardRes.json()
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          return NextResponse.json(remoteData)
        }
      }
    } catch {
      // Backend not running or timeout; fall back to built-in Vercel serverless evaluator
    }

    // Dynamic 72-Hour Sprint Live Opportunities (JKLU Campus Drives)
    const liveOpportunities = [
      {
        id: 'jm_razorpay',
        jobTitle: 'Backend Platform Engineer (72h Sprint)',
        company: 'RazorpayX',
        deadline: '2026-11-17T18:00:00Z',
        compensationTarget: '₹22–28 LPA',
        category: 'High-Concurrency Fintech',
        alignmentScore: 82,
        eligibilityRules: [
          {
            id: 'er_rz_01',
            label: "B.Tech CSE/IT '27 • JKLU",
            status: 'MEETS',
            ruleExpression: 'degree == "B.Tech" AND branch IN ["CSE", "IT"] AND grad_year == 2027',
          },
          {
            id: 'er_rz_02',
            label: 'CGPA ≥ 7.5 (Current: 8.42)',
            status: 'MEETS',
            ruleExpression: 'cgpa >= 7.5',
          },
          {
            id: 'er_rz_03',
            label: 'Database & SQL Windowing ≥ 70%',
            status: 'MEETS',
            ruleExpression: 'skill_score("SQL") >= 70',
            clarificationHint: 'Score evaluated dynamically from verified or confirmed SQL skills.',
          },
          {
            id: 'er_rz_04',
            label: '120s Concurrency Micro-Defense',
            status: 'MEETS',
            ruleExpression: 'defense_verified("Redis_Concurrency") == true',
            clarificationHint: 'Complete the 120-second live terminal defense in the Practice Arena to unlock auto-shortlist.',
          },
        ],
        factorBreakdown: [
          { id: 'af_rz_01', label: 'SQL & Database Indexing', weight: 0.30, score: 85, color: 'bg-primary' },
          { id: 'af_rz_02', label: 'Distributed Systems & Redis', weight: 0.25, score: 84, color: 'bg-secondary' },
          { id: 'af_rz_03', label: 'FastAPI / Python Architecture', weight: 0.20, score: 88, color: 'bg-tertiary' },
          { id: 'af_rz_04', label: '120s Defense Proof', weight: 0.15, score: 80, color: 'bg-primary' },
          { id: 'af_rz_05', label: 'Coursework & Provenance', weight: 0.10, score: 84, color: 'bg-secondary' },
        ],
        sandboxToggles: [
          {
            id: 'st_rz_01',
            label: 'Confirm Advanced SQL Token (+7% fit)',
            potentialGain: 7,
            checked: false,
            relatedSkillId: 'sk_05',
          },
          {
            id: 'st_rz_02',
            label: 'Defend Redis Cache-Aside in 120s Arena (+11% fit)',
            potentialGain: 11,
            checked: false,
            relatedSkillId: 'sk_redis',
          },
          {
            id: 'st_rz_03',
            label: 'Link GitHub Production Microservices Repo (+5% fit)',
            potentialGain: 5,
            checked: false,
            relatedSkillId: 'sk_04',
          },
        ],
      },
      ...mockJobMatches,
    ]

    return NextResponse.json(liveOpportunities)
  } catch (error: any) {
    return NextResponse.json(mockJobMatches)
  }
}
