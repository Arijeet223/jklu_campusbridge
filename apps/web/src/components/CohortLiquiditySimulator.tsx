'use client'

import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { Users, AlertTriangle, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import type { CohortFunnelStep } from '@/lib/types'

/* ------------------------------------------------------------------ */
/*  CohortLiquiditySimulator — Pre-Publish Liquidity Simulator        */
/*  §5.6 of DESIGN.md                                                  */
/*  Enforces small-cell suppression (< 5 students) & dynamic gating   */
/* ------------------------------------------------------------------ */

interface CohortLiquiditySimulatorProps {
  initialCohortSize?: number
  initialSteps?: CohortFunnelStep[]
  jobTitle?: string
  company?: string
  onApprove?: (publishedEligibleCount: number) => void
}

interface InteractiveCriterion {
  id: string
  label: string
  gateType: 'MANDATORY' | 'PREFERRED'
  cohortIfMandatory: number
  cohortIfPreferred: number
  description: string
}

export default function CohortLiquiditySimulator({
  initialCohortSize = 240,
  jobTitle = 'Backend Engineer Intern',
  company = 'FinStack Technologies',
  onApprove,
}: CohortLiquiditySimulatorProps) {
  const [minCgpa, setMinCgpa] = useState(7.5)
  const [maxBacklogs, setMaxBacklogs] = useState(0)

  // Configurable criteria that can be toggled between Mandatory Gate and Preferred Weight
  const [criteria, setCriteria] = useState<InteractiveCriterion[]>([
    {
      id: 'crit_degree',
      label: 'Degree Gate (B.Tech CS / IT)',
      gateType: 'MANDATORY',
      cohortIfMandatory: 180,
      cohortIfPreferred: 240,
      description: 'Graduating Batch 2027 from accredited computer science departments',
    },
    {
      id: 'crit_cgpa',
      label: 'CGPA Gate (≥ 8.0 Cutoff)',
      gateType: 'MANDATORY',
      cohortIfMandatory: 64,
      cohortIfPreferred: 180,
      description: 'Official academic transcript standing from university registrar',
    },
    {
      id: 'crit_k8s',
      label: 'Production Kubernetes Experience',
      gateType: 'MANDATORY',
      cohortIfMandatory: 6,
      cohortIfPreferred: 64,
      description: 'Requires verified cluster orchestration and container deployment evidence',
    },
    {
      id: 'crit_cloud',
      label: 'Cloud Deployment (AWS / GCP)',
      gateType: 'PREFERRED',
      cohortIfMandatory: 4,
      cohortIfPreferred: 64,
      description: 'Experience managing live infrastructure pipelines or serverless endpoints',
    },
  ])

  const [published, setPublished] = useState(false)

  // Toggle criterion between MANDATORY and PREFERRED
  const toggleGateType = (id: string) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextType = c.gateType === 'MANDATORY' ? 'PREFERRED' : 'MANDATORY'
          return { ...c, gateType: nextType }
        }
        return c
      }),
    )
    setPublished(false)
  }

  // Calculate current eligible pool through the active mandatory criteria in cascade
  const mandatoryRules = criteria.filter((c) => c.gateType === 'MANDATORY')
  const preferredRules = criteria.filter((c) => c.gateType === 'PREFERRED')

  // Calculate liquidity based on active mandatory rules & sliders
  let cgpaEligible = Math.round(
    initialCohortSize * Math.max(0.04, Math.min(1.0, (10 - minCgpa) / 3.5))
  )
  if (maxBacklogs === 0) {
    cgpaEligible = Math.round(cgpaEligible * 0.88)
  }

  let currentEligible = cgpaEligible
  for (const rule of criteria) {
    if (rule.gateType === 'MANDATORY') {
      currentEligible = Math.min(currentEligible, rule.cohortIfMandatory)
    }
  }

  // Small cell suppression threshold (< 5 students)
  const isSuppressed = currentEligible < 5
  const displayEligible = isSuppressed ? '< 5' : currentEligible.toString()

  const handleApprove = () => {
    setPublished(true)
    onApprove?.(currentEligible)
  }

  return (
    <div className="rounded-xl border border-border-hairline bg-surface p-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border-hairline pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-oxford-surface px-2.5 py-1 text-xs font-semibold text-oxford">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Pre-Publish Liquidity Simulator
            </span>
            <span className="font-mono text-provenance text-ink-muted">
              v1.1 Deterministic Preview
            </span>
          </div>
          <h2 className="mt-2 font-display text-display-h2 text-ink-primary">
            Cohort Liquidity Analysis for {jobTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Simulate how mandatory recruiter gates impact applicant pool depth across{' '}
            <strong className="text-ink-primary">{company}</strong> before publishing the drive.
          </p>
        </div>

        {/* Live Eligible Count Badge */}
        <div className="flex items-center gap-3 rounded-xl border border-oxford-border bg-oxford-surface px-4 py-3">
          <div className="text-right">
            <span className="text-[11px] font-medium uppercase tracking-wider text-oxford">
              Eligible Cohort Depth
            </span>
            <div className="font-mono text-2xl font-bold tabular-nums text-oxford">
              {displayEligible}{' '}
              <span className="text-xs font-normal text-ink-secondary">
                / {initialCohortSize} students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Small Cell Suppression Alert if < 5 */}
      {isSuppressed && (
        <div
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-border bg-amber-surface p-3 text-xs text-amber"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div>
            <strong>Student Privacy Protection Alert:</strong> Active mandatory criteria result in
            fewer than 5 eligible students ({displayEligible}). Exact student counts are
            safeguarded to protect individual privacy. Consider converting niche criteria to
            Preferred alignment factors to give more students an opportunity to interview.
          </div>
        </div>
      )}

      {/* Interactive Threshold Sliders */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-border-hairline bg-canvas p-4">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-ink-primary">Minimum CGPA Hard Cutoff</span>
            <span className="font-mono text-oxford font-bold">{minCgpa.toFixed(1)} / 10.0</span>
          </div>
          <input
            type="range"
            min="6.0"
            max="9.0"
            step="0.1"
            value={minCgpa}
            onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
            className="w-full accent-oxford cursor-pointer"
          />
          <div className="flex justify-between text-2xs text-ink-muted mt-1 font-mono">
            <span>6.0 (Broad Pool)</span>
            <span>7.5 (Standard)</span>
            <span>9.0 (Elite Cutoff)</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-ink-primary">Active Backlogs Permitted</span>
            <span className="font-mono text-oxford font-bold">{maxBacklogs} backlogs</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={maxBacklogs}
            onChange={(e) => setMaxBacklogs(parseInt(e.target.value, 10))}
            className="w-full accent-oxford cursor-pointer"
          />
          <div className="flex justify-between text-2xs text-ink-muted mt-1 font-mono">
            <span>0 (Strict Clean Record)</span>
            <span>1 Backlog</span>
            <span>2 Backlogs</span>
          </div>
        </div>
      </div>

      {/* Funnel Visualisation */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Dynamic Cohort Funnel Breakdown
        </h3>
        <div className="mt-3 space-y-2">
          {criteria.map((crit, idx) => {
            const isMandatory = crit.gateType === 'MANDATORY'
            const count = isMandatory ? crit.cohortIfMandatory : crit.cohortIfPreferred
            const pct = Math.round((count / initialCohortSize) * 100)

            return (
              <div key={crit.id} className="rounded-lg border border-border-hairline bg-canvas p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-muted">0{idx + 1}.</span>
                    <span className="font-medium text-ink-primary">{crit.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        isMandatory
                          ? 'bg-crimson-surface text-crimson border border-crimson-border'
                          : 'bg-emerald-surface text-emerald border border-emerald-border'
                      }`}
                    >
                      {isMandatory ? 'Mandatory Gate' : 'Preferred (15% Weight)'}
                    </span>
                  </div>
                  <span className="font-mono text-provenance tabular-nums text-ink-primary">
                    {count < 5 ? '< 5 students' : `${count} students`} ({pct}%)
                  </span>
                </div>

                {/* Bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-subtle">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isMandatory ? 'bg-oxford' : 'bg-emerald'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive Criteria Calibration Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Criteria Calibration Switches (Recruiter Negotiation Sandbox)
          </h3>
          <span className="text-xs text-ink-muted">
            Toggle rule weight to preview cohort liquidity shifts
          </span>
        </div>

        <div className="mt-3 divide-y divide-border-hairline rounded-lg border border-border-hairline">
          {criteria.map((crit) => {
            const isMandatory = crit.gateType === 'MANDATORY'
            return (
              <div
                key={crit.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-subtle/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-ink-primary">{crit.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-secondary">{crit.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-muted">
                    If Mandatory: <span className="text-crimson">{crit.cohortIfMandatory} students</span> |
                    If Preferred: <span className="text-emerald">{crit.cohortIfPreferred} students</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-secondary">
                    {isMandatory ? 'Hard Gate' : 'Weighted'}
                  </span>
                  <Switch.Root
                    checked={isMandatory}
                    onCheckedChange={() => toggleGateType(crit.id)}
                    className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxford ${
                      isMandatory ? 'bg-oxford' : 'bg-emerald'
                    }`}
                    aria-label={`Toggle ${crit.label} between mandatory and preferred`}
                  >
                    <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recruiter Talking Point Callout */}
      <div className="mt-6 rounded-lg border border-oxford-border bg-oxford-surface p-4">
        <div className="flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-oxford" aria-hidden="true" />
          <div className="text-xs text-oxford">
            <p className="font-semibold">Placement Officer Negotiation Recommendation:</p>
            <p className="mt-1 text-ink-secondary leading-relaxed">
              Converting <strong>"Production Kubernetes Experience"</strong> from a Mandatory
              Gate to Preferred Weight expands the qualified interview pool from{' '}
              <strong className="text-crimson">6 students</strong> to{' '}
              <strong className="text-emerald">64 students</strong> who already hold verified
              Docker, FastAPI, and Linux infrastructure credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-border-hairline pt-4">
        <div className="text-xs text-ink-muted">
          Active Criteria: {mandatoryRules.length} Mandatory • {preferredRules.length} Preferred
        </div>

        <div className="flex items-center gap-3">
          {published ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-surface px-4 py-2 text-xs font-semibold text-emerald border border-emerald-border">
              <CheckCircle className="h-4 w-4" />
              JD Published with {currentEligible} Eligible Candidates
            </span>
          ) : (
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-oxford px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-oxford/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxford"
            >
              Approve &amp; Publish JD Criteria
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

