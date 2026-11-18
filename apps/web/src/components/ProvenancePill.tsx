'use client'

import type { EvidenceStatus } from '@/lib/types'

/* ------------------------------------------------------------------ */
/*  ProvenancePill — Split two-part inline citation chip               */
/*  §5.3 of DESIGN.md                                                  */
/*  Rule: JetBrains Mono right segment = immutable provenance data     */
/* ------------------------------------------------------------------ */

interface ProvenancePillProps {
  skillName: string
  proficiency: string
  evidenceStatus: EvidenceStatus
  sourceRef: string
  onClickSource?: () => void
}

/** Visual configuration per evidence tier. */
const tierConfig: Record<
  EvidenceStatus,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  INSTITUTION_VERIFIED: {
    bg: 'bg-[#F0FDFA]',
    text: 'text-[#0F766E]',
    border: 'border-[#99F6E4]',
    icon: '✓',
    label: 'Institution Verified',
  },
  ASSESSMENT_VERIFIED: {
    bg: 'bg-[#F0FDFA]',
    text: 'text-[#0F766E]',
    border: 'border-[#99F6E4]',
    icon: '✓',
    label: 'Defense Passed',
  },
  ARTIFACT_LINKED: {
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1E3A8A]',
    border: 'border-[#BFDBFE]',
    icon: '🔗',
    label: 'GitHub Repo',
  },
  STUDENT_CONFIRMED: {
    bg: 'bg-[#F3F1EC]',
    text: 'text-[#4B5563]',
    border: 'border-[#E6E3DC]',
    icon: '●',
    label: 'Self-Confirmed',
  },
  EXTRACTED: {
    bg: 'bg-[#F5F3FF]',
    text: 'text-[#6D28D9]',
    border: 'border-[#DDD6FE]',
    icon: '✨',
    label: 'Unconfirmed',
  },
  EXPIRED: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    icon: '⏱',
    label: 'Expired',
  },
  DOUBT_GHOST: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: '⚠',
    label: 'Doubt Ghost',
  },
}

export default function ProvenancePill({
  skillName,
  proficiency,
  evidenceStatus,
  sourceRef,
  onClickSource,
}: ProvenancePillProps) {
  const tier = tierConfig[evidenceStatus]

  return (
    <button
      type="button"
      onClick={onClickSource}
      className={`inline-flex min-h-[44px] items-center overflow-hidden rounded-md border text-xs transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxford ${tier.border}`}
      aria-label={`${skillName} — ${tier.label}: ${sourceRef}`}
    >
      {/* Left: skill name + proficiency (sans font) */}
      <span className="flex items-center gap-1 bg-surface px-2.5 py-1.5 font-sans text-ink-primary">
        {skillName}
        <span className="text-ink-muted">•</span>
        <span className="text-ink-secondary">{proficiency}</span>
      </span>

      {/* Right: verification tier + source ref (mono font) */}
      <span
        className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-provenance ${tier.bg} ${tier.text}`}
      >
        <span aria-hidden="true">{tier.icon}</span>
        {tier.label}
        {sourceRef && (
          <>
            <span className="opacity-40">|</span>
            <span>{sourceRef}</span>
          </>
        )}
      </span>
    </button>
  )
}
