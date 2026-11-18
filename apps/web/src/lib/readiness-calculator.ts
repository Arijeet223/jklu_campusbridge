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
  // Normalize skills
  const safeSkills = Array.isArray(skills) ? skills : []

  // 1. Helper to score a skill based on its proficiency and provenance tier
  const getSkillStrength = (s: Skill): number => {
    let base = 70
    const prof = (s.proficiency || 'Intermediate').toLowerCase()
    if (prof === 'beginner') base = 55
    else if (prof === 'intermediate') base = 72
    else if (prof === 'advanced') base = 88
    else if (prof === 'expert') base = 96

    // Multiplier based on verification provenance
    let tierMultiplier = 0.90 // Ghost / Extracted
    if (s.evidenceStatus === 'DOUBT_GHOST') tierMultiplier = 0.0 // Doubt Ghost has zero evidence
    else if (s.evidenceStatus === 'STUDENT_CONFIRMED') tierMultiplier = 0.95
    else if (s.evidenceStatus === 'ARTIFACT_LINKED') tierMultiplier = 0.97
    else if (s.evidenceStatus === 'ASSESSMENT_VERIFIED' || s.evidenceStatus === 'INSTITUTION_VERIFIED') tierMultiplier = 1.0

    return Math.round(base * tierMultiplier)
  }

  // ─────────────────────────────────────────────────────────────
  // 1. DIMENSION: Database & SQL Windowing
  // ─────────────────────────────────────────────────────────────
  const sqlRegex = /\b(sql|postgresql|postgres|mysql|sqlite|database|indexing|cte|dense_rank|window|acid|query optimization)\b/i
  const sqlSkills = safeSkills.filter((s) => sqlRegex.test(s.name) || sqlRegex.test(s.category || ''))

  let sqlScore = 52
  let sqlAttention = true

  if (sqlSkills.length > 0) {
    // Take the best matching SQL skill
    const bestSql = sqlSkills.reduce((best, cur) => (getSkillStrength(cur) > getSkillStrength(best) ? cur : best), sqlSkills[0])
    const strength = getSkillStrength(bestSql)
    
    // Additional breadth bonus if multiple database technologies exist
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
    statusLabel: sqlScore >= 70 ? `${sqlScore}% (Proficient ✓)` : `${sqlScore}% (Attention Needed!)`,
    statusColor: sqlScore >= 70 ? 'text-tertiary' : 'text-error',
    barColor: sqlScore >= 70 ? 'bg-tertiary' : 'bg-error',
    isAttentionNeeded: sqlAttention,
    matchedSkills: sqlSkills.map((s) => s.name),
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DIMENSION: DSA & Problem Solving
  // ─────────────────────────────────────────────────────────────
  const dsaRegex = /\b(python|c\+\+|cpp|java|golang|go|rust|algorithms|data structures|dsa|dynamic programming|sliding window|trees|graphs|binary search)\b/i
  const dsaSkills = safeSkills.filter((s) => dsaRegex.test(s.name) || (s.category || '').toLowerCase().includes('algorithm'))

  let dsaScore = 65
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
    statusLabel: `${dsaScore}%`,
    statusColor: 'text-primary',
    barColor: 'bg-primary',
    isAttentionNeeded: dsaScore < 65,
    matchedSkills: dsaSkills.map((s) => s.name),
  }

  // ─────────────────────────────────────────────────────────────
  // 3. DIMENSION: System Design & Concurrency
  // ─────────────────────────────────────────────────────────────
  const sysRegex = /\b(system design|microservices|distributed|redis|kafka|docker|kubernetes|fastapi|concurrency|multithreading|load balancer|caching)\b/i
  const sysSkills = safeSkills.filter((s) => sysRegex.test(s.name) || sysRegex.test(s.category || ''))

  let sysScore = 62
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
    statusLabel: `${sysScore}%`,
    statusColor: 'text-secondary',
    barColor: 'bg-secondary',
    isAttentionNeeded: sysScore < 65,
    matchedSkills: sysSkills.map((s) => s.name),
  }

  // ─────────────────────────────────────────────────────────────
  // 4. DIMENSION: Live Code Defense (120s)
  // ─────────────────────────────────────────────────────────────
  const verifiedCount = safeSkills.filter(
    (s) => s.evidenceStatus === 'ASSESSMENT_VERIFIED' || s.evidenceStatus === 'INSTITUTION_VERIFIED'
  ).length
  const confirmedCount = safeSkills.filter((s) => s.evidenceStatus === 'STUDENT_CONFIRMED').length
  
  // Base defense score from live assessment proofs
  let defenseScore = Math.min(96, Math.max(70, 72 + verifiedCount * 6 + confirmedCount * 3))

  const defenseMetric: DimensionMetric = {
    id: 'defense',
    label: '4. Live Code Defense (120s)',
    score: defenseScore,
    statusLabel: `${defenseScore}%`,
    statusColor: 'text-tertiary',
    barColor: 'bg-tertiary',
    isAttentionNeeded: false,
    matchedSkills: [],
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DIMENSION: Coursework & CGPA
  // ─────────────────────────────────────────────────────────────
  const cgpaScore = Math.min(99, Math.max(50, Math.round((cgpa / 10) * 100)))

  const cgpaMetric: DimensionMetric = {
    id: 'cgpa',
    label: '5. Coursework & CGPA',
    score: cgpaScore,
    statusLabel: `${cgpaScore}%`,
    statusColor: 'text-secondary',
    barColor: 'bg-secondary',
    isAttentionNeeded: cgpaScore < 60,
    matchedSkills: [],
  }

  // ─────────────────────────────────────────────────────────────
  // 6. DIMENSION: Provenance & Portfolio Proofs
  // ─────────────────────────────────────────────────────────────
  const totalSkills = safeSkills.length || 1
  const solidTokensCount = safeSkills.filter((s) => s.evidenceStatus !== 'EXTRACTED').length
  const provenanceScore = Math.min(95, Math.max(55, Math.round((solidTokensCount / totalSkills) * 50) + 45))

  const provenanceMetric: DimensionMetric = {
    id: 'provenance',
    label: '6. Provenance & Portfolio Proofs',
    score: provenanceScore,
    statusLabel: `${provenanceScore}%`,
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

