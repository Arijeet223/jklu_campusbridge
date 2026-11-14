'use client'

import React, { useState } from 'react'
import type { EvidenceStatus, ProficiencyLevel } from '@/lib/types'

interface GhostCardProps {
  skillName: string
  proficiency: ProficiencyLevel
  sourcePage?: string
  sourceSection?: string
  confidence?: number
  evidenceStatus: EvidenceStatus
  onConfirm?: () => void
  onEdit?: () => void
  onReject?: () => void
  onClickSource?: () => void
  onChangeProficiency?: (newProficiency: ProficiencyLevel) => void
}

export default function GhostCard({
  skillName,
  proficiency,
  sourcePage = 'p.1',
  sourceSection = 'Technical Skills',
  confidence = 0.92,
  evidenceStatus,
  onConfirm,
  onReject,
  onClickSource,
  onChangeProficiency,
}: GhostCardProps) {
  const [localStatus, setLocalStatus] = useState<EvidenceStatus>(evidenceStatus)
  const [isRejected, setIsRejected] = useState(false)

  const isGhost = localStatus === 'EXTRACTED'

  const handleConfirm = () => {
    setLocalStatus('STUDENT_CONFIRMED')
    onConfirm?.()
  }

  const handleReject = () => {
    setIsRejected(true)
    onReject?.()
  }

  if (isRejected) {
    return (
      <div className="rounded-3xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-center text-xs text-outline">
        Skill claim dismissed.
      </div>
    )
  }

  return (
    <div
      className={`rounded-3xl p-5 transition-all duration-200 ${
        isGhost
          ? 'border-2 border-dashed border-primary-container bg-primary-container/15 shadow-[0_3px_0_#DE95BE]'
          : 'border-[1.5px] border-outline-variant bg-surface-container-lowest shadow-[0_4px_0_#EAD7E2]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-extrabold text-sm text-on-surface truncate max-w-[200px] sm:max-w-xs">{skillName}</h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                isGhost
                  ? 'bg-primary-container text-on-primary-container border border-outline-variant'
                  : 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed-dim'
              }`}
            >
              {isGhost ? '0.5x Ghost' : '1.0x Solid'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant font-medium flex-wrap">
            <span className="text-outline">Proficiency:</span>
            {onChangeProficiency ? (
              <select
                aria-label={`Select proficiency for ${skillName}`}
                value={proficiency}
                onChange={(e) => onChangeProficiency(e.target.value as ProficiencyLevel)}
                className={`text-xs font-bold rounded-lg px-2 py-0.5 border cursor-pointer transition-colors ${
                  proficiency === 'Advanced' || proficiency === 'Expert'
                    ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-fixed-dim'
                    : 'bg-surface-container-high text-on-surface border-outline-variant'
                }`}
              >
                <option value="Beginner">Beginner (55%)</option>
                <option value="Intermediate">Intermediate (72%)</option>
                <option value="Advanced">Advanced (88% - High)</option>
                <option value="Expert">Expert (96% - High)</option>
              </select>
            ) : (
              <strong className="text-on-surface">{proficiency}</strong>
            )}
            <span className="text-outline">• Match Confidence: {Math.round(confidence * 100)}%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClickSource}
          className="text-xs text-secondary font-bold hover:underline flex items-center gap-1 bg-secondary-container/40 px-2.5 py-1 rounded-full border border-secondary-fixed-dim shadow-[0_1px_0_#85B5CE] shrink-0"
        >
          <span className="material-symbols-outlined text-sm">find_in_page</span>
          <span>Provenance</span>
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-dashed border-outline-variant/60 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="text-[11px] text-outline font-medium flex items-center gap-1 min-w-0 truncate">
          <span className="material-symbols-outlined text-sm shrink-0">description</span>
          <span className="truncate">
            {sourceSection} • {sourcePage}
          </span>
        </span>

        {isGhost ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              className="text-[11px] text-outline font-bold hover:text-error transition-colors px-2 py-1"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-primary text-on-primary font-bold text-xs px-3.5 py-1.5 rounded-full border border-on-primary-fixed-variant shadow-[0_2px_0_#320e26] active:translate-y-[1px] transition-all flex items-center gap-1 hover:brightness-105"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Confirm &amp; Solidify</span>
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-tertiary bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>Verified in Profile</span>
          </span>
        )}
      </div>
    </div>
  )
}
