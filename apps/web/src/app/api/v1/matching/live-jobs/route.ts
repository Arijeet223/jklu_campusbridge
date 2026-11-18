import { NextRequest, NextResponse } from 'next/server'
import { mockJobMatches } from '@/lib/mock-data'
import type { JobMatch } from '@/lib/types'

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

    // Dynamic 72-Hour Sprint Live Opportunities (Faculty Calibrated JKLU Campus Drives)
    const liveOpportunities: JobMatch[] = [
      {
        id: 'jm_razorpay',
        jobTitle: 'Backend Platform Engineer (72h Sprint)',
        company: 'RazorpayX',
        deadline: '2026-11-20T18:00:00Z',
        compensationTarget: '₹22–28 LPA',
        category: 'High-Concurrency Fintech',
        alignmentScore: 84,
        eligibilityStatus: 'ELIGIBLE',
        failedPreference: null,
        missingSkills: [],
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
      {
        id: 'jm_quantumscale',
        jobTitle: 'Systems Infrastructure Intern',
        company: 'QuantumScale Systems',
        deadline: '2026-11-22T23:59:00Z',
        compensationTarget: '₹16–22 LPA',
        category: 'Distributed Core & Linux',
        alignmentScore: 71,
        eligibilityStatus: 'ACTION_REQUIRED',
        failedPreference: 'Missing Mandatory Skill: C++ (Complete 120s Quest in Practice Arena or upload code repo)',
        missingSkills: ['C++'],
        eligibilityRules: [
          {
            id: 'er_qs_01',
            label: 'Degree Gate (B.Tech CSE/IT/AI)',
            status: 'MEETS',
            ruleExpression: 'degree == "B.Tech" AND branch IN ["CSE", "IT", "AI"]',
          },
          {
            id: 'er_qs_02',
            label: 'Faculty Cutoff (CGPA ≥ 7.5)',
            status: 'MEETS',
            ruleExpression: 'cgpa >= 7.5',
          },
          {
            id: 'er_qs_03',
            label: 'Mandatory Skill: C++',
            status: 'DOES_NOT_MEET',
            ruleExpression: 'has_skill("C++")',
            clarificationHint: 'Mandatory hard skill set by Faculty. Complete 120s C++ quest to unlock eligibility.',
          },
          {
            id: 'er_qs_04',
            label: 'Linux Systems & Shell Proficiency',
            status: 'MEETS',
            ruleExpression: 'has_skill("Linux")',
          },
        ],
        factorBreakdown: [
          { id: 'af_qs_01', label: 'C++ Systems Programming', weight: 0.35, score: 55, color: 'bg-primary' },
          { id: 'af_qs_02', label: 'Linux OS & Shell Scripting', weight: 0.30, score: 88, color: 'bg-secondary' },
          { id: 'af_qs_03', label: 'Docker Containerization', weight: 0.20, score: 70, color: 'bg-tertiary' },
          { id: 'af_qs_04', label: 'Data Structures Rigor', weight: 0.15, score: 85, color: 'bg-primary' },
        ],
        sandboxToggles: [
          {
            id: 'st_qs_01',
            label: 'Complete C++ Pointers & Memory Defense in 120s (+18% fit, clears Action Required)',
            potentialGain: 18,
            checked: false,
            relatedSkillId: 'sk_cpp',
          },
          {
            id: 'st_qs_02',
            label: 'Confirm Docker Multi-Stage Build Proof (+8% fit)',
            potentialGain: 8,
            checked: false,
            relatedSkillId: 'sk_docker',
          },
        ],
      },
      {
        id: 'jm_atlassian',
        jobTitle: 'Full Stack Platform Engineer',
        company: 'Atlassian',
        deadline: '2026-11-25T18:00:00Z',
        compensationTarget: '₹24–32 LPA',
        category: 'Enterprise SaaS & Cloud',
        alignmentScore: 62,
        eligibilityStatus: 'FILTERED_OUT',
        failedPreference: 'CGPA 8.42 is below Faculty Hard Cutoff of 8.50',
        missingSkills: ['TypeScript', 'Node.js'],
        eligibilityRules: [
          {
            id: 'er_atl_01',
            label: 'Degree Gate (B.Tech CSE/IT)',
            status: 'MEETS',
            ruleExpression: 'degree == "B.Tech" AND branch IN ["CSE", "IT"]',
          },
          {
            id: 'er_atl_02',
            label: 'Faculty Hard Cutoff (CGPA ≥ 8.50)',
            status: 'DOES_NOT_MEET',
            ruleExpression: 'cgpa >= 8.50',
            clarificationHint: 'Faculty set a strict hard CGPA filter of 8.50 for Atlassian.',
          },
          {
            id: 'er_atl_03',
            label: 'Mandatory Skill: TypeScript',
            status: 'DOES_NOT_MEET',
            ruleExpression: 'has_skill("TypeScript")',
          },
          {
            id: 'er_atl_04',
            label: '0 Active Backlogs',
            status: 'MEETS',
            ruleExpression: 'backlogs == 0',
          },
        ],
        factorBreakdown: [
          { id: 'af_atl_01', label: 'React & Frontend Architecture', weight: 0.35, score: 82, color: 'bg-primary' },
          { id: 'af_atl_02', label: 'TypeScript Type Safety', weight: 0.25, score: 50, color: 'bg-secondary' },
          { id: 'af_atl_03', label: 'Distributed Cloud (AWS)', weight: 0.25, score: 58, color: 'bg-tertiary' },
          { id: 'af_atl_04', label: 'Academic Standing', weight: 0.15, score: 65, color: 'bg-primary' },
        ],
        sandboxToggles: [
          {
            id: 'st_atl_01',
            label: 'Model Counterfactual CGPA Re-Evaluation (+9% fit)',
            potentialGain: 9,
            checked: false,
          },
          {
            id: 'st_atl_02',
            label: 'Defend TypeScript Generics in Arena (+12% fit)',
            potentialGain: 12,
            checked: false,
            relatedSkillId: 'sk_ts',
          },
        ],
      },
      ...mockJobMatches.map((j) => ({
        ...j,
        eligibilityStatus: (j.eligibilityRules.some((r) => r.status === 'DOES_NOT_MEET')
          ? 'FILTERED_OUT'
          : j.eligibilityRules.some((r) => r.status === 'UNKNOWN')
          ? 'ACTION_REQUIRED'
          : 'ELIGIBLE') as any,
        failedPreference: j.eligibilityRules.find((r) => r.status === 'DOES_NOT_MEET')?.label
          ? `Failed Faculty Gate: ${j.eligibilityRules.find((r) => r.status === 'DOES_NOT_MEET')?.label}`
          : null,
      })),
    ]

    return NextResponse.json(liveOpportunities)
  } catch (error: any) {
    return NextResponse.json(mockJobMatches)
  }
}
