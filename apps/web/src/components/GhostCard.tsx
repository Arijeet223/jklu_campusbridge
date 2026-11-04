'use client'

import { useState } from 'react'
import type { EvidenceStatus, ProficiencyLevel } from '@/lib/types'

/* ------------------------------------------------------------------ */
/*  GhostCard — Student-Friendly AI Skill Suggestion Card             */
/*  Dashed soft violet (unconfirmed) → solid warm card (confirmed)     */
/* ------------------------------------------------------------------ */

interface GhostCardProps {
  skillName: string
  proficiency: ProficiencyLevel
  sourcePage: string
  sourceSection: string
  confidence: number
  evidenceStatus: EvidenceStatus
  onConfirm?: () => void
  onEdit?: () => void
  onReject?: () => void
  onClickSource?: () => void
}

function tierBadge(status: EvidenceStatus) {
  switch (status) {
    case 'ASSESSMENT_VERIFIED':
    case 'INSTITUTION_VERIFIED':
      return {
        label: '✓ Verified by Assessment',
        className: 'bg-emerald-surface text-emerald border border-emerald-border',
      }
    case 'ARTIFACT_LINKED':
      return {
        label: '🔗 Linked to Project Code',
        className: 'bg-oxford-surface text-oxford border border-oxford-border',
      }
    case 'STUDENT_CONFIRMED':
      return {
        label: '✓ Confirmed by You',
        className: 'bg-emerald-surface text-emerald border border-emerald-border',
      }
    case 'EXPIRED':
      return {
        label: '⏱ Needs Refresh',
        className: 'bg-amber-surface text-amber border border-amber-border',
      }
    default:
      return null
  }
}

export default function GhostCard({
  skillName,
  proficiency,
  sourcePage,
  sourceSection,
  confidence,
  evidenceStatus,
  onConfirm,
  onEdit,
  onReject,
  onClickSource,
}: GhostCardProps) {
  const [localStatus, setLocalStatus] = useState<EvidenceStatus>(evidenceStatus)
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null)
  const [isRejected, setIsRejected] = useState(false)

  const isGhost = localStatus === 'EXTRACTED'

  const handleConfirm = () => {
    setLocalStatus('STUDENT_CONFIRMED')
    setConfirmedAt(new Date().toISOString())
    onConfirm?.()
  }

  const handleReject = () => {
    setIsRejected(true)
    onReject?.()
  }

  const badge = tierBadge(localStatus)

  if (isRejected) {
    return (
      <div className="rounded-xl border border-dashed border-border-hairline bg-subtle/50 p-3 text-center text-xs text-ink-muted">
        Skill removed from suggestions.
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl p-4 transition-all duration-200 ${
        isGhost
          ? 'border-[1.5px] border-dashed border-[#C4B5FD] bg-[#F5F3FF]'
          : 'border border-solid border-[#E6E3DC] bg-white shadow-2xs'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Friendly Header Badge */}
      {isGhost ? (
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#6D28D9]">
          <span>✨ AI Found in Resume • Needs Your Confirmation</span>
          <span className="font-mono text-[10px] opacity-75">
            {Math.round(confidence * 100)}% match
          </span>
        </div>
      ) : (
        badge && (
          <div className="mb-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        )
      )}

      {/* Skill Name & Level */}
      <h3 className="font-display text-base font-semibold text-ink-primary">
        {skillName}
      </h3>
      <p className="mt-0.5 text-xs text-ink-secondary">
        Level: <strong className="text-ink-primary font-medium">{proficiency}</strong>
      </p>

      {/* Monospace Provenance Source Button */}
      <div className="mt-2.5">
        <button
          type="button"
          onClick={onClickSource}
          className={`inline-flex min-h-[38px] items-center rounded-md border px-2.5 py-1 text-xs font-mono transition-colors hover:opacity-90 ${
            isGhost
              ? 'border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]'
              : 'border-[#E6E3DC] bg-[#F3F1EC] text-ink-secondary'
          }`}
          title="Click to view exact resume highlight"
        >
          📄 Found in Resume_v3.pdf • {sourcePage}, {sourceSection}
        </button>
      </div>

      {/* Confirmed timestamp */}
      {confirmedAt && (
        <p className="mt-2 text-xs font-medium text-emerald">
          ✓ Added to your verified profile facts
        </p>
      )}

      {/* Friendly Warm Action Bar */}
      {isGhost && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald/90"
          >
            ✓ Looks Good, Confirm
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-subtle hover:text-ink-primary transition-colors"
          >
            ✎ Edit Level
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-crimson hover:bg-crimson-surface transition-colors"
          >
            ✕ Not My Skill
          </button>
        </div>
      )}
    </div>
  )
}
