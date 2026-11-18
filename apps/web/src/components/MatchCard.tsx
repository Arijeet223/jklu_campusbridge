'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  ChevronDown,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import type { EligibilityRule, AlignmentFactor, SandboxToggle } from '@/lib/types'
import { ClientOnlyDate } from '@/lib/date-format'
import CounterfactualSandbox from './CounterfactualSandbox'

interface MatchCardProps {
  id?: string
  jobTitle: string
  company: string
  deadline: string
  compensationTarget?: string
  eligibilityRules: EligibilityRule[]
  alignmentScore: number
  factorBreakdown: AlignmentFactor[]
  sandboxToggles: SandboxToggle[]
  eligibilityStatus?: 'ELIGIBLE' | 'ACTION_REQUIRED' | 'FILTERED_OUT'
  failedPreference?: string | null
  missingSkills?: string[]
  onAddPlan?: () => void
  onOpenDispute?: (rule: EligibilityRule, jobTitle: string, company: string) => void
  onOpenSource?: (docId: string) => void
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
      bg: 'bg-tertiary-container/40',
      text: 'text-on-tertiary-container',
      border: 'border-tertiary-fixed-dim',
      icon: 'check',
      labelSuffix: 'Met ✓',
    },
    UNKNOWN: {
      bg: 'bg-primary-container/30',
      text: 'text-on-primary-container',
      border: 'border-primary-container',
      icon: 'help',
      labelSuffix: 'Click to Clarify',
    },
    DOES_NOT_MEET: {
      bg: 'bg-error-container/40',
      text: 'text-error',
      border: 'border-error/30',
      icon: 'close',
      labelSuffix: 'Not Met',
    },
  }
  const c = config[rule.status] || config.UNKNOWN

  return (
    <button
      type="button"
      onClick={() => onClickDispute?.(rule, jobTitle, company)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all shadow-[0_1px_0_rgba(0,0,0,0.06)] hover:brightness-95 cursor-pointer ${c.bg} ${c.text} ${c.border}`}
      title={rule.clarificationHint || `Click to review or clarify ${rule.label}`}
    >
      <span className="material-symbols-outlined text-sm font-bold">{c.icon}</span>
      <span>{rule.label}</span>
      <span className="text-[10px] opacity-80">({c.labelSuffix})</span>
    </button>
  )
}

export default function MatchCard({
  id,
  jobTitle,
  company,
  deadline,
  compensationTarget = '₹18–24 LPA',
  eligibilityRules,
  alignmentScore,
  factorBreakdown,
  sandboxToggles,
  eligibilityStatus,
  failedPreference,
  missingSkills = [],
  onAddPlan,
  onOpenDispute,
  onOpenSource,
}: MatchCardProps) {
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const totalWeight = factorBreakdown.reduce((s, f) => s + f.weight, 0) || 1

  const resolvedStatus: 'ELIGIBLE' | 'ACTION_REQUIRED' | 'FILTERED_OUT' =
    eligibilityStatus ||
    (eligibilityRules.some((r) => r.status === 'DOES_NOT_MEET')
      ? 'FILTERED_OUT'
      : eligibilityRules.some((r) => r.status === 'UNKNOWN')
      ? 'ACTION_REQUIRED'
      : 'ELIGIBLE')

  return (
    <article className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_4px_0_#EAD7E2] transition-all hover:border-primary-container font-body-md text-on-surface">
      {/* Deterministic R.O.N.E.N. Eligibility Status Banner */}
      <div className="mb-4">
        {resolvedStatus === 'ELIGIBLE' && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="font-extrabold uppercase tracking-wide">Eligible for Drive</strong>
                <span className="ml-1 text-emerald-800 text-[11px]">• Meets all Faculty gates &amp; mandatory criteria</span>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
              R.O.N.E.N. Verified ✓
            </span>
          </div>
        )}

        {resolvedStatus === 'ACTION_REQUIRED' && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <strong className="font-extrabold uppercase tracking-wide">Action Required</strong>
              </div>
              <span className="font-mono text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Gate Bottleneck
              </span>
            </div>
            <p className="text-[11px] text-amber-800 pl-6">
              {failedPreference || 'Missing confirmed mandatory skills to pass Faculty filter.'}
            </p>
          </div>
        )}

        {resolvedStatus === 'FILTERED_OUT' && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <strong className="font-extrabold uppercase tracking-wide">Filtered Out</strong>
              </div>
              <span className="font-mono text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                Hard Disqualification
              </span>
            </div>
            <p className="text-[11px] text-rose-800 pl-6">
              {failedPreference || 'Student profile does not meet Faculty baseline gate.'}
            </p>
          </div>
        )}
      </div>

      {/* Header & Compensation */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-extrabold text-xs border border-secondary-fixed-dim shadow-[0_2px_0_#85B5CE]">
              {company.slice(0, 2).toUpperCase()}
            </span>
            <h3 className="text-base font-extrabold text-on-surface">{jobTitle}</h3>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            {company} • Compensation Target: <strong>{compensationTarget}</strong> • Closes{' '}
            <span suppressHydrationWarning>
              <ClientOnlyDate date={deadline} />
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container border border-outline-variant font-bold text-xs shadow-[0_2px_0_#DE95BE]">
            {alignmentScore}% Projected Fit
          </div>
        </div>
      </div>

      {/* Mandatory Eligibility Checklist */}
      <div className="my-4 p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
          Mandatory Criteria &amp; Policy Gates:
        </span>
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

      {/* Alignment Proportional Bar */}
      <div className="mt-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
          {factorBreakdown.map((factor) => {
            const proportion = (factor.score * factor.weight) / totalWeight
            return (
              <div
                key={factor.id}
                className={`${factor.color} transition-all duration-300`}
                style={{ width: `${proportion}%` }}
                title={`${factor.label}: ${factor.score}/100`}
              />
            )
          })}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="font-mono text-on-surface font-bold">
            <span className="text-primary text-sm">{alignmentScore}</span>
            <span className="text-outline"> / 100 Match Alignment</span>
          </span>
          <span className="text-[10px] text-outline font-semibold">
            Deterministic Python/SQL math (Zero hallucination)
          </span>
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant font-medium">
          {factorBreakdown.map((factor) => (
            <div key={factor.id} className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${factor.color}`} />
              <span>
                {factor.label}: <strong>{factor.score}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Sandbox */}
      <Collapsible.Root open={sandboxOpen} onOpenChange={setSandboxOpen} className="mt-5">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-full border border-primary-container bg-primary-container/20 px-4 py-2 text-xs font-bold text-on-primary-container shadow-[0_2px_0_#DE95BE] active:translate-y-[1px] hover:bg-primary-container/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Simulate What-If Improvements ⚡ (Pass 120s quests to jump fit)</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${sandboxOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content className="mt-4">
          <CounterfactualSandbox
            baseScore={alignmentScore}
            toggles={sandboxToggles}
            onAddPlan={onAddPlan}
          />
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Direct What-If Counterfactual Sandbox Link */}
      <div className="mt-3.5 pt-3 border-t border-[#F1EFEA] flex items-center justify-between">
        <span className="text-[11px] text-ink-muted">
          Need to pass this Faculty gate?
        </span>
        <Link
          href={`/student/what-if-sandbox?jobId=${id || 'jm_razorpay'}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D3B56] hover:text-[#582e44] hover:underline"
        >
          <span>Open What-If Sandbox on this Job</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}
