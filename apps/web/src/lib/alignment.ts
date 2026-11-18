/* ------------------------------------------------------------------ */
/*  CampusBridge AI — Deterministic Alignment Calculation              */
/*  MUST mirror the backend Python formula exactly.                    */
/*  All math is client-side, executes in <50 ms.                       */
/* ------------------------------------------------------------------ */

import type { AlignmentFactor, SandboxToggle, EvidenceStatus } from './types'

/**
 * Multiplier applied to a skill's contribution based on its evidence tier.
 * Unconfirmed AI extractions carry zero weight — the student must act.
 */
export const EVIDENCE_TIER_MULTIPLIER: Record<EvidenceStatus, number> = {
  EXTRACTED: 0.0,
  STUDENT_CONFIRMED: 0.5,
  ARTIFACT_LINKED: 0.75,
  ASSESSMENT_VERIFIED: 1.0,
  INSTITUTION_VERIFIED: 1.0,
  EXPIRED: 0.25,
  DOUBT_GHOST: 0.0,
}

/**
 * Rubric dimension weights — must sum to 1.0.
 * These match the backend ALIGNMENT_WEIGHTS constant.
 */
export const ALIGNMENT_WEIGHTS = {
  required_skills: 0.35,
  projects_experience: 0.20,
  preferred_skills: 0.15,
  assessments: 0.15,
  preferences: 0.15,
} as const

export type AlignmentDimension = keyof typeof ALIGNMENT_WEIGHTS

/**
 * Calculate the overall alignment score from factor breakdowns.
 *
 * Formula:
 *   total = Σ (factor.score × factor.weight)
 *
 * Each factor.score is already 0–100 within its dimension; the weight
 * is the fraction of the total rubric it represents.
 *
 * @returns integer 0–100
 */
export function calculateAlignment(factors: AlignmentFactor[]): number {
  let total = 0
  for (const factor of factors) {
    total += factor.score * factor.weight
  }
  return Math.round(Math.min(100, Math.max(0, total)))
}

/**
 * Simulate alignment when sandbox toggles are checked.
 *
 * Adds each checked toggle's `potentialGain` to the base score,
 * capped at 100.
 *
 * @param baseScore   Current alignment score (0–100)
 * @param toggles     The sandbox toggle states
 * @returns projected score (0–100)
 */
export function simulateAlignment(
  baseScore: number,
  toggles: SandboxToggle[],
): number {
  const gain = toggles
    .filter((t) => t.checked)
    .reduce((sum, t) => sum + t.potentialGain, 0)

  return Math.min(100, baseScore + gain)
}
