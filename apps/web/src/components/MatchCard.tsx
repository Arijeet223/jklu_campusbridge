'use client'

import { useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, Calendar, Building2, Sparkles, CheckCircle2 } from 'lucide-react'
import type { EligibilityRule, AlignmentFactor, SandboxToggle } from '@/lib/types'
import { ClientOnlyDate } from '@/lib/date-format'
import CounterfactualSandbox from './CounterfactualSandbox'

interface MatchCardProps {
  jobTitle: string
  company: string
  deadline: string
  eligibilityRules: EligibilityRule[]
  alignmentScore: number
  factorBreakdown: AlignmentFactor[]
  sandboxToggles: SandboxToggle[]
  onAddPlan?: () => void
  onOpenDispute?: (rule: EligibilityRule, jobTitle: string, company: string) => void
}

function EligibilityPill({
  rule,
  jobTitle,
  company,
  onClickDispute,
}: {
  rule: EligibilityRule
  jobTitle: string
  company: string
  onClickDispute?: (rule: EligibilityRule, jobTitle: string, company: string) => void
}) {
  const config = {
    MEETS: {
      bg: 'bg-emerald-surface',
      text: 'text-emerald',
      border: 'border-emerald-border',
      icon: '✓',
      labelSuffix: 'Met',
    },
    UNKNOWN: {
      bg: 'bg-amber-surface',
      text: 'text-amber',
      border: 'border-amber-border',
      icon: '?',
      labelSuffix: 'Click to Clarify',
    },
    DOES_NOT_MEET: {
      bg: 'bg-crimson-surface',
      text: 'text-crimson',
      border: 'border-crimson-border',
      icon: '✕',
      labelSuffix: 'Not Met',
    },
  }
  const c = config[rule.status]

  return (
    <button
      type="button"
      onClick={() => onClickDispute?.(rule, jobTitle, company)}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-90 ${c.bg} ${c.text} ${c.border}`}
      title={rule.clarificationHint || `Click to review or clarify ${rule.label}`}
    >
      <span aria-hidden="true" className="font-bold">{c.icon}</span>
      <span>{rule.label}</span>
      <span className="font-mono text-[10px] opacity-75">({c.labelSuffix})</span>
    </button>
  )
}

export default function MatchCard({
  jobTitle,
  company,
  deadline,
  eligibilityRules,
  alignmentScore,
  factorBreakdown,
  sandboxToggles,
  onAddPlan,
  onOpenDispute,
}: MatchCardProps) {
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const totalWeight = factorBreakdown.reduce((s, f) => s + f.weight, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-border-hairline bg-surface shadow-2xs">
      {/* Top Bar: Mandatory Eligibility Checklist */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E3DC] bg-[#FAF8F5] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-ink-primary">
            Mandatory Criteria:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {eligibilityRules.map((rule) => (
            <EligibilityPill
              key={rule.id}
              rule={rule}
              jobTitle={jobTitle}
              company={company}
              onClickDispute={onOpenDispute}
            />
          ))}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-primary">
              {jobTitle}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-ink-secondary">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-oxford" />
                {company}
              </span>
              <span className="flex items-center gap-1" suppressHydrationWarning>
                <Calendar className="h-3.5 w-3.5 text-amber" />
                Apply by <ClientOnlyDate date={deadline} />
              </span>
            </div>
          </div>
        </div>

        {/* Proportional Match Bar */}
        <div className="mt-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#F3F1EC]">
            {factorBreakdown.map((factor) => {
              const proportion = (factor.score * factor.weight) / totalWeight
              return (
                <div
                  key={factor.id}
                  className={`${factor.color} transition-all duration-200`}
                  style={{ width: `${proportion}%` }}
                  title={`${factor.label}: ${factor.score}/100`}
                />
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-mono text-ink-primary">
              <span className="font-bold text-sm text-oxford">{alignmentScore}</span>
              <span className="text-ink-secondary"> / 100 Match Alignment</span>
            </span>
            <span className="text-[11px] text-ink-muted">
              Deterministic rubric match (not a hiring guarantee)
            </span>
          </div>

          {/* Factor legend */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-secondary">
            {factorBreakdown.map((factor) => (
              <div key={factor.id} className="flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${factor.color}`} />
                <span>{factor.label}: {factor.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Sandbox */}
        <Collapsible.Root
          open={sandboxOpen}
          onOpenChange={setSandboxOpen}
          className="mt-4"
        >
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="flex min-h-[40px] w-full items-center justify-between rounded-lg border border-dashed border-border-ai-dashed bg-ai-ghost px-3.5 py-2 text-xs font-semibold text-iris transition-colors hover:bg-iris-surface"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Test What-If Improvements ⚡ (Simulate instant score boost)
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  sandboxOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </Collapsible.Trigger>

          <Collapsible.Content className="mt-3">
            <CounterfactualSandbox
              baseScore={alignmentScore}
              toggles={sandboxToggles}
              onAddPlan={onAddPlan}
            />
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  )
}
