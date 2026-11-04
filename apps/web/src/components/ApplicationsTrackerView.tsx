'use client'

import { useState } from 'react'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertCircle,
  Shield,
  Zap,
  ExternalLink,
} from 'lucide-react'
import { mockApplications } from '@/lib/mock-data'
import type { ApplicationItem, ApplicationStage } from '@/lib/types'

interface ApplicationsTrackerViewProps {
  onOpenDispute: (jobTitle: string, company: string, ruleLabel: string) => void
  onOpenSprint: () => void
  onOpenDefense: () => void
}

const pipelineSteps: { stage: ApplicationStage; label: string }[] = [
  { stage: 'APPLIED', label: '1. Applied' },
  { stage: 'ELIGIBILITY_VERIFIED', label: '2. Eligibility Check' },
  { stage: 'MICRO_DEFENSE_COMPLETE', label: '3. Skill Proof / Defense' },
  { stage: 'SHORTLISTED', label: '4. Shortlisted for Interview' },
]

function getStageIndex(stage: ApplicationStage): number {
  switch (stage) {
    case 'APPLIED':
      return 0
    case 'ELIGIBILITY_VERIFIED':
      return 1
    case 'MICRO_DEFENSE_COMPLETE':
      return 2
    case 'SHORTLISTED':
      return 3
    default:
      return 0
  }
}

export default function ApplicationsTrackerView({
  onOpenDispute,
  onOpenSprint,
  onOpenDefense,
}: ApplicationsTrackerViewProps) {
  const [applications, setApplications] = useState<ApplicationItem[]>(mockApplications)

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner Overview */}
      <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-oxford-surface px-2.5 py-1 text-xs font-semibold text-oxford">
              <Building2 className="h-3.5 w-3.5" />
              Campus Recruitment Pipeline
            </span>
            <h2 className="mt-2 font-display text-base font-semibold text-ink-primary">
              My Active Applications &amp; Eligibility Status
            </h2>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Track your progress across campus drives, test readiness milestones, and official Placement Officer reviews.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-canvas border border-border-hairline px-3 py-2 text-center">
              <span className="font-mono text-base font-bold text-oxford">
                {applications.length}
              </span>
              <p className="text-[10px] text-ink-muted">Active Drives</p>
            </div>
            <div className="rounded-lg bg-emerald-surface border border-emerald-border px-3 py-2 text-center">
              <span className="font-mono text-base font-bold text-emerald">1</span>
              <p className="text-[10px] text-emerald">Shortlisted</p>
            </div>
            <div className="rounded-lg bg-amber-surface border border-amber-border px-3 py-2 text-center">
              <span className="font-mono text-base font-bold text-amber">1</span>
              <p className="text-[10px] text-amber">In Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Cards List */}
      <div className="space-y-4">
        {applications.map((app) => {
          const currentIdx = getStageIndex(app.currentStage)
          const hasDispute = !!app.dispute
          const isDisputePending = app.dispute?.status === 'PENDING_REVIEW'
          const isDisputeApproved = app.dispute?.status === 'APPROVED_OVERRIDE'

          return (
            <div
              key={app.id}
              className="overflow-hidden rounded-xl border border-border-hairline bg-surface shadow-2xs"
            >
              {/* Application Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-hairline bg-canvas px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border-hairline text-oxford font-display font-semibold text-xs shadow-2xs">
                    {app.company.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink-primary">
                      {app.jobTitle}
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      {app.company} • Applied{' '}
                      {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs rounded bg-surface border border-border-hairline px-2.5 py-1 text-ink-primary">
                    Match: <strong className="text-oxford">{app.matchScore}</strong> / 100
                  </span>
                  {app.eligibilityStatus === 'MEETS' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-surface border border-emerald-border px-2 py-0.5 text-xs font-medium text-emerald">
                      <CheckCircle2 className="h-3 w-3" />
                      Eligibility Met
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-surface border border-amber-border px-2 py-0.5 text-xs font-medium text-amber">
                      <Clock className="h-3 w-3" />
                      Clarification Active
                    </span>
                  )}
                </div>
              </div>

              {/* Body: Milestone Stepper */}
              <div className="p-5 space-y-4">
                {/* 4-Stage Visual Stepper */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-ink-secondary mb-1">
                    <span className="font-semibold text-ink-primary">
                      Current Recruitment Stage:
                    </span>
                    <span className="font-mono text-provenance text-oxford font-medium">
                      {app.nextMilestone}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {pipelineSteps.map((step, idx) => {
                      const isComplete = idx <= currentIdx
                      const isCurrent = idx === currentIdx

                      return (
                        <div
                          key={step.stage}
                          className={`rounded-lg p-2.5 border text-xs transition-colors ${
                            isCurrent
                              ? 'border-oxford bg-oxford-surface/50 text-oxford font-semibold'
                              : isComplete
                              ? 'border-emerald-border bg-emerald-surface/40 text-emerald'
                              : 'border-border-hairline bg-canvas text-ink-muted'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isComplete ? (
                              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald" />
                            ) : (
                              <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-ink-muted/40" />
                            )}
                            <span className="truncate">{step.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Eligibility Dispute Ticket Status Banner */}
                {hasDispute && (
                  <div
                    className={`rounded-lg p-3 text-xs border ${
                      isDisputePending
                        ? 'border-amber-border bg-amber-surface text-amber'
                        : 'border-emerald-border bg-emerald-surface text-emerald'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        {isDisputePending ? (
                          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-semibold">
                            {isDisputePending
                              ? `Clarification Ticket ${app.dispute?.id} (Pending Placement Review)`
                              : `Clarification Approved (${app.dispute?.id})`}
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-secondary leading-relaxed">
                            <strong>Rule: </strong>
                            {app.dispute?.ruleLabel}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-secondary italic">
                            "{app.dispute?.studentNote}"
                          </p>
                          {isDisputeApproved && app.dispute?.reviewedBy && (
                            <p className="mt-1 font-mono text-[10px] text-emerald font-semibold">
                              ✓ Approved by {app.dispute.reviewedBy} • Equivalence Recorded
                            </p>
                          )}
                        </div>
                      </div>

                      {isDisputePending && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenDispute(
                              app.jobTitle,
                              app.company,
                              app.dispute?.ruleLabel || 'Rule'
                            )
                          }
                          className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-amber border border-amber-border hover:bg-subtle transition-colors flex-shrink-0"
                        >
                          View Ticket
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Shortcuts Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-hairline text-xs">
                  <div className="text-[11px] text-ink-secondary">
                    Next step:{' '}
                    <strong className="text-ink-primary font-medium">
                      {app.nextMilestone}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {app.currentStage === 'SHORTLISTED' && (
                      <button
                        type="button"
                        onClick={onOpenSprint}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-oxford px-3 py-1.5 font-semibold text-white shadow-2xs hover:bg-oxford/90 transition-colors"
                      >
                        <Zap className="h-3 w-3 text-amber" />
                        Open 72h Interview Sprint
                      </button>
                    )}

                    {app.currentStage === 'MICRO_DEFENSE_COMPLETE' && (
                      <button
                        type="button"
                        onClick={onOpenDefense}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-hairline bg-canvas px-3 py-1.5 font-medium text-ink-secondary hover:bg-subtle hover:text-ink-primary transition-colors"
                      >
                        <Shield className="h-3 w-3 text-emerald" />
                        Practice 2-Min Defense
                      </button>
                    )}

                    {app.eligibilityStatus === 'UNKNOWN' && !hasDispute && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDispute(
                            app.jobTitle,
                            app.company,
                            'Degree / Coursework Equivalence'
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-border bg-amber-surface px-3 py-1.5 font-semibold text-amber hover:bg-amber-surface/80 transition-colors"
                      >
                        <HelpCircle className="h-3 w-3" />
                        Submit Clarification
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

