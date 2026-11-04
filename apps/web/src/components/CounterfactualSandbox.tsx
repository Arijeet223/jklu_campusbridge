'use client'

import { useState } from 'react'
import type { SandboxToggle } from '@/lib/types'
import { simulateAlignment } from '@/lib/alignment'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

interface CounterfactualSandboxProps {
  baseScore: number
  toggles: SandboxToggle[]
  onToggle?: (toggleId: string, checked: boolean) => void
  onAddPlan?: () => void
}

export default function CounterfactualSandbox({
  baseScore,
  toggles: initialToggles,
  onToggle,
  onAddPlan,
}: CounterfactualSandboxProps) {
  const [toggles, setToggles] = useState<SandboxToggle[]>(initialToggles)
  const [addedToPlan, setAddedToPlan] = useState(false)

  const projectedScore = simulateAlignment(baseScore, toggles)
  const gain = projectedScore - baseScore
  const hasSelections = toggles.some((t) => t.checked)

  const handleToggle = (id: string) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
    )
    const toggle = toggles.find((t) => t.id === id)
    if (toggle) {
      onToggle?.(id, !toggle.checked)
    }
  }

  const handleAddPlanClick = () => {
    setAddedToPlan(true)
    onAddPlan?.()
  }

  return (
    <div className="rounded-xl border border-border-hairline bg-canvas p-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-xs font-semibold text-ink-primary">
            What-If Fit Simulator
          </h4>
          <p className="mt-0.5 text-[11px] text-ink-secondary">
            Check off actions you can complete this week to see your score jump in real-time.
          </p>
        </div>
        <span className="font-mono text-provenance rounded bg-oxford-surface px-2 py-0.5 text-oxford">
          &lt;50ms Real-Time
        </span>
      </div>

      {/* Action check list */}
      <ul className="mt-3 space-y-1.5" role="list">
        {toggles.map((toggle) => (
          <li key={toggle.id}>
            <label className="flex min-h-[38px] cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-transparent p-2 transition-colors hover:border-border-hairline hover:bg-surface">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={toggle.checked}
                  onChange={() => handleToggle(toggle.id)}
                  className="h-4 w-4 rounded border-border-hairline text-emerald accent-emerald focus:ring-emerald"
                />
                <span className="text-xs font-medium text-ink-primary">
                  {toggle.label}
                </span>
              </div>
              <span className="font-mono text-provenance text-emerald font-semibold">
                +{toggle.potentialGain} pts
              </span>
            </label>
          </li>
        ))}
      </ul>

      {/* Real-time score projection bar */}
      <div className="mt-4 rounded-lg border border-border-hairline bg-surface p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-ink-secondary">
            Projected Match Score:
          </span>
          <span className="font-mono text-xs font-semibold text-ink-primary">
            {baseScore} → <span className="text-emerald font-bold">{projectedScore}</span> / 100
            {gain > 0 && (
              <span className="ml-1 text-emerald">(+{gain} points boost!)</span>
            )}
          </span>
        </div>

        {/* Stacked preview bar with striped emerald progress */}
        <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#F3F1EC]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-oxford transition-all duration-150"
            style={{ width: `${baseScore}%` }}
          />
          {gain > 0 && (
            <div
              className="absolute inset-y-0 rounded-r-full transition-all duration-150"
              style={{
                left: `${baseScore}%`,
                width: `${gain}%`,
                background:
                  'repeating-linear-gradient(135deg, #0F766E 0px, #0F766E 3px, #99F6E4 3px, #99F6E4 6px)',
              }}
            />
          )}
        </div>
      </div>

      {/* Warm actionable button */}
      {hasSelections && (
        <button
          type="button"
          onClick={handleAddPlanClick}
          className="mt-3 inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-oxford px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-oxford/90 transition-colors"
        >
          {addedToPlan ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald" />
              <span>Added to Your 72-Hour Prep Plan!</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Add These Actions to My 72h Interview Prep Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
