import type { Skill, ProficiencyLevel, EvidenceStatus } from './types'

export interface DimensionMetric {
  id: string
  label: string
  score: number
  statusLabel: string
  statusColor: string
  barColor: string
  isAttentionNeeded: boolean
  matchedSkills: string[]
}

export interface ReadinessProfile {
  overallReadiness: number
  dimensions: {
    dsa: DimensionMetric
    systemDesign: DimensionMetric
    sql: DimensionMetric
    liveDefense: DimensionMetric
    cgpa: DimensionMetric
    provenance: DimensionMetric
  }
  dimensionList: DimensionMetric[]
  radarPoints: string
  radarCircles: Array<{ cx: number; cy: number; color: string; label: string }>
}

/**
 * Deterministic Mathematical Readiness Calculator.
 * Computes exact profile dimension scores grounded in parsed resume skills and verification provenance.
 */
export function computeReadinessProfile(
  skills: Skill[] = [],
  cgpa: number = 8.42,
  completedQuests: string[] = []
): ReadinessProfile {
  // ── STRICT ASSERTION: Filter exclusively confirmed/solid skills ─────────
  // Rejects all mock data arrays and unconfirmed provisional ghost cards
  const solidSkills = (Array.isArray(skills) ? skills : []).filter((s) => {
    if (!s || !s.name) return false
    const nameLower = s.name.toLowerCase()
    // Strict assertion: Reject placeholder and mock skills
    if (s.id?.startsWith('mock-') || nameLower.includes('dummy') || nameLower.includes('mock')) {
      console.warn(`[ReadinessAssertion] Excluded mock/placeholder skill: ${s.name}`)
      return false
    }
    // Strict assertion: Only confirmed solid tokens contribute to Readiness Score
    const isSolid =
      s.evidenceStatus === 'STUDENT_CONFIRMED' ||
      s.evidenceStatus === 'INSTITUTION_VERIFIED' ||
      s.evidenceStatus === 'ASSESSMENT_VERIFIED' ||
      s.evidenceStatus === 'ARTIFACT_LINKED' ||
      (s as any).isConfirmed === true
    return isSolid
  })

  // 1. Helper to score a skill based on its proficiency and provenance tier
  const getSkillStrength = (s: Skill): number => {
    let base = 70
    const prof = (s.proficiency || 'Intermediate').toLowerCase()
    if (prof === 'beginner') base = 55
    else if (prof === 'intermediate') base = 72
    else if (prof === 'advanced') base = 88
    else if (prof === 'expert') base = 96

    // Multiplier based on verification provenance
    let tierMultiplier = 0.0
    if (s.evidenceStatus === 'STUDENT_CONFIRMED') tierMultiplier = 0.95
    else if (s.evidenceStatus === 'ARTIFACT_LINKED') tierMultiplier = 0.97
    else if (s.evidenceStatus === 'ASSESSMENT_VERIFIED' || s.evidenceStatus === 'INSTITUTION_VERIFIED') tierMultiplier = 1.0
    else if ((s as any).isConfirmed) tierMultiplier = 0.95

    return Math.round(base * tierMultiplier)
  }

  // ─────────────────────────────────────────────────────────────
  // 1. DIMENSION: Database & SQL Windowing
  // ─────────────────────────────────────────────────────────────
  const sqlRegex = /\b(sql|postgresql|postgres|mysql|sqlite|database|indexing|cte|dense_rank|window|acid|query optimization)\b/i
  const sqlSkills = solidSkills.filter((s) => sqlRegex.test(s.name) || sqlRegex.test(s.category || ''))

  let sqlScore = 0
  let sqlAttention = true

  if (sqlSkills.length > 0) {
    const bestSql = sqlSkills.reduce((best, cur) => (getSkillStrength(cur) > getSkillStrength(best) ? cur : best), sqlSkills[0])
    const strength = getSkillStrength(bestSql)
    const breadthBonus = Math.min(8, (sqlSkills.length - 1) * 4)
    sqlScore = Math.min(98, strength + breadthBonus)
  }

  if (sqlScore >= 70) {
    sqlAttention = false
  }

  const sqlMetric: DimensionMetric = {
    id: 'sql',
    label: '3. Database & SQL Windowing',
    score: sqlScore,
    statusLabel: sqlScore >= 70 ? `${sqlScore}% (Proficient ✓)` : sqlScore > 0 ? `${sqlScore}% (Attention Needed!)` : '0% (No Verified Evidence)',
    statusColor: sqlScore >= 70 ? 'text-tertiary' : 'text-error',
    barColor: sqlScore >= 70 ? 'bg-tertiary' : 'bg-error',
    isAttentionNeeded: sqlAttention,
    matchedSkills: sqlSkills.map((s) => s.name),
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DIMENSION: DSA & Problem Solving
  // ─────────────────────────────────────────────────────────────
  const dsaRegex = /\b(python|c\+\+|cpp|java|golang|go|rust|algorithms|data structures|dsa|dynamic programming|sliding window|trees|graphs|binary search)\b/i
  const dsaSkills = solidSkills.filter((s) => dsaRegex.test(s.name) || (s.category || '').toLowerCase().includes('algorithm'))

  let dsaScore = 0
  if (dsaSkills.length > 0) {
    const strengths = dsaSkills.map(getSkillStrength)
    const maxStrength = Math.max(...strengths)
    const countBonus = Math.min(10, (dsaSkills.length - 1) * 3)
    dsaScore = Math.min(96, maxStrength + countBonus)
  }

  const dsaMetric: DimensionMetric = {
    id: 'dsa',
    label: '1. DSA & Problem Solving',
    score: dsaScore,
    statusLabel: dsaScore > 0 ? `${dsaScore}%` : '0% (No Verified Evidence)',
    statusColor: 'text-primary',
    barColor: 'bg-primary',
    isAttentionNeeded: dsaScore < 65,
    matchedSkills: dsaSkills.map((s) => s.name),
  }

  // ─────────────────────────────────────────────────────────────
  // 3. DIMENSION: System Design & Concurrency
  // ─────────────────────────────────────────────────────────────
  const sysRegex = /\b(system design|microservices|distributed|redis|kafka|docker|kubernetes|fastapi|concurrency|multithreading|load balancer|caching)\b/i
  const sysSkills = solidSkills.filter((s) => sysRegex.test(s.name) || sysRegex.test(s.category || ''))

  let sysScore = 0
  if (sysSkills.length > 0) {
    const strengths = sysSkills.map(getSkillStrength)
    const maxStrength = Math.max(...strengths)
    const countBonus = Math.min(8, (sysSkills.length - 1) * 3)
    sysScore = Math.min(94, maxStrength + countBonus)
  }

  const sysMetric: DimensionMetric = {
    id: 'sys',
    label: '2. System Design & Concurrency',
    score: sysScore,
    statusLabel: sysScore > 0 ? `${sysScore}%` : '0% (No Verified Evidence)',
    statusColor: 'text-secondary',
    barColor: 'bg-secondary',
    isAttentionNeeded: sysScore < 65,
    matchedSkills: sysSkills.map((s) => s.name),
  }

  // ─────────────────────────────────────────────────────────────
  // 4. DIMENSION: Live Code Defense (120s)
  // ─────────────────────────────────────────────────────────────
  const verifiedCount = solidSkills.filter(
    (s) => s.evidenceStatus === 'ASSESSMENT_VERIFIED' || s.evidenceStatus === 'INSTITUTION_VERIFIED'
  ).length
  const confirmedCount = solidSkills.filter((s) => s.evidenceStatus === 'STUDENT_CONFIRMED' || (s as any).isConfirmed).length

  let defenseScore = 0
  if (verifiedCount > 0 || confirmedCount > 0) {
    defenseScore = Math.min(96, Math.max(50, 60 + verifiedCount * 8 + confirmedCount * 4))
  }

  const defenseMetric: DimensionMetric = {
    id: 'defense',
    label: '4. Live Code Defense (120s)',
    score: defenseScore,
    statusLabel: defenseScore > 0 ? `${defenseScore}%` : '0% (Requires Verification)',
    statusColor: 'text-tertiary',
    barColor: 'bg-tertiary',
    isAttentionNeeded: defenseScore < 60,
    matchedSkills: [],
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DIMENSION: Coursework & CGPA
  // ─────────────────────────────────────────────────────────────
  const validCgpa = Math.max(0.0, Math.min(10.0, Number(cgpa) || 0.0))
  const cgpaScore = validCgpa > 0 ? Math.min(99, Math.round((validCgpa / 10) * 100)) : 0

  const cgpaMetric: DimensionMetric = {
    id: 'cgpa',
    label: '5. Coursework & CGPA',
    score: cgpaScore,
    statusLabel: cgpaScore > 0 ? `${cgpaScore}% (CGPA: ${validCgpa.toFixed(2)})` : '0% (Pending Transcripts)',
    statusColor: 'text-secondary',
    barColor: 'bg-secondary',
    isAttentionNeeded: cgpaScore < 60,
    matchedSkills: [],
  }

  // ─────────────────────────────────────────────────────────────
  // 6. DIMENSION: Provenance & Portfolio Proofs
  // ─────────────────────────────────────────────────────────────
  let provenanceScore = 0
  if (solidSkills.length > 0) {
    const institutionVerifiedCount = solidSkills.filter((s) => s.evidenceStatus === 'INSTITUTION_VERIFIED').length
    provenanceScore = Math.min(98, Math.max(45, Math.round((solidSkills.length / Math.max(1, skills.length)) * 60) + institutionVerifiedCount * 8 + 30))
  }

  const provenanceMetric: DimensionMetric = {
    id: 'provenance',
    label: '6. Provenance & Portfolio Proofs',
    score: provenanceScore,
    statusLabel: provenanceScore > 0 ? `${provenanceScore}%` : '0% (No Provenance)',
    statusColor: 'text-primary',
    barColor: 'bg-primary',
    isAttentionNeeded: provenanceScore < 50,
    matchedSkills: [],
  }

  // ─────────────────────────────────────────────────────────────
  // OVERALL WEIGHTED READINESS INDEX
  // ─────────────────────────────────────────────────────────────
  const overallReadiness = Math.round(
    dsaScore * 0.25 +
    sysScore * 0.20 +
    sqlScore * 0.20 +
    defenseScore * 0.15 +
    cgpaScore * 0.10 +
    provenanceScore * 0.10
  )

  const dimensionList = [dsaMetric, sysMetric, sqlMetric, defenseMetric, cgpaMetric, provenanceMetric]

  // ─────────────────────────────────────────────────────────────
  // DYNAMIC HEXAGONAL RADAR CHART MATH
  // Center: (120, 120), Max Radius: 100
  // Angles: -90° (top), -30°, 30°, 90° (bottom), 150°, 210°
  // ─────────────────────────────────────────────────────────────
  const cx = 120
  const cy = 120
  const maxR = 95
  const anglesDeg = [-90, -30, 30, 90, 150, 210]

  const radarCircles: Array<{ cx: number; cy: number; color: string; label: string }> = []
  const points: string[] = []

  const scores = [dsaScore, sysScore, sqlScore, defenseScore, cgpaScore, provenanceScore]
  const colors = ['#7e506b', '#406373', sqlScore >= 70 ? '#416655' : '#ba1a1a', '#416655', '#406373', '#7e506b']

  for (let i = 0; i < 6; i++) {
    const angleRad = (anglesDeg[i] * Math.PI) / 180
    const r = (scores[i] / 100) * maxR
    const px = Math.round((cx + r * Math.cos(angleRad)) * 10) / 10
    const py = Math.round((cy + r * Math.sin(angleRad)) * 10) / 10
    points.push(`${px},${py}`)
    radarCircles.push({
      cx: px,
      cy: py,
      color: colors[i],
      label: dimensionList[i].label,
    })
  }

  const radarPoints = points.join(' ')

  return {
    overallReadiness,
    dimensions: {
      dsa: dsaMetric,
      systemDesign: sysMetric,
      sql: sqlMetric,
      liveDefense: defenseMetric,
      cgpa: cgpaMetric,
      provenance: provenanceMetric,
    },
    dimensionList,
    radarPoints,
    radarCircles,
  }
}

