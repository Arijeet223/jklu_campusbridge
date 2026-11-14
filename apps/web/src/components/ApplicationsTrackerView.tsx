'use client'

import React, { useState } from 'react'
import Link from 'next/link'
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
  const [applications] = useState<ApplicationItem[]>(mockApplications)

  return (
    <div className="space-y-6 font-body-md text-on-surface">
      {/* Top Banner Overview */}
      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 shadow-[0_4px_0_#EADECE]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim text-xs font-bold shadow-[0_2px_0_#85B5CE]">
              <span className="material-symbols-outlined text-sm">domain</span>
              <span>Campus Recruitment Pipeline</span>
            </div>
            <h2 className="mt-2 text-headline-sm font-headline-sm font-extrabold text-on-surface">
              My Active Applications &amp; Eligibility Status
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant font-medium">
              Track your progress across campus drives, test readiness milestones, and official Placement Officer reviews.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-4 py-2.5 text-center shadow-[0_2px_0_#d3c2c9]">
              <span className="font-extrabold text-lg text-primary">{applications.length}</span>
              <p className="text-[10px] font-bold text-outline uppercase">Active Drives</p>
            </div>
            <div className="bg-tertiary-container/40 border-2 border-tertiary-fixed-dim rounded-2xl px-4 py-2.5 text-center shadow-[0_2px_0_#a8cfbb]">
              <span className="font-extrabold text-lg text-tertiary">1</span>
              <p className="text-[10px] font-bold text-tertiary uppercase">Shortlisted</p>
            </div>
            <div className="bg-primary-container/30 border-2 border-primary-container rounded-2xl px-4 py-2.5 text-center shadow-[0_2px_0_#DE95BE]">
              <span className="font-extrabold text-lg text-primary">1</span>
              <p className="text-[10px] font-bold text-primary uppercase">In Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Cards List */}
      <div className="space-y-5">
        {applications.map((app) => {
          const currentIdx = getStageIndex(app.currentStage)
          const hasDispute = !!app.dispute
          const isDisputePending = app.dispute?.status === 'PENDING_REVIEW'
          const isDisputeApproved = app.dispute?.status === 'APPROVED_OVERRIDE'

          return (
            <article
              key={app.id}
              className="bg-surface-container-lowest border-[1.5px] border-outline-variant rounded-3xl p-6 shadow-[0_4px_0_#EAD7E2] transition-all hover:shadow-[0_6px_0_#DE95BE]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-extrabold text-sm border border-outline-variant shadow-[0_2px_0_#DE95BE]">
                    {app.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-on-surface">{app.jobTitle}</h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {app.company} • Applied on {app.appliedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold border border-secondary-fixed-dim shadow-[0_2px_0_#85B5CE]">
                    Target CTC: ₹22 LPA
                  </span>
                  <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold border border-tertiary-fixed-dim shadow-[0_2px_0_#a8cfbb]">
                    Stage: {app.currentStage.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Multi-step Pipeline Visualizer */}
              <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pipelineSteps.map((step, idx) => {
                  const isCompleted = idx < currentIdx
                  const isCurrent = idx === currentIdx

                  return (
                    <div
                      key={step.stage}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-primary-container/30 border-primary text-on-primary-container shadow-[0_2px_0_#DE95BE] font-bold'
                          : isCompleted
                          ? 'bg-tertiary-container/30 border-tertiary-fixed-dim text-on-tertiary-container font-medium'
                          : 'bg-surface-container-low border-outline-variant/40 text-outline'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-tertiary text-base font-bold">check_circle</span>
                        ) : isCurrent ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-outline/40"></span>
                        )}
                      </div>
                      <span className="text-[11px] leading-tight block">{step.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Dispute Notice if present */}
              {hasDispute && (
                <div
                  className={`p-3.5 rounded-2xl border mb-4 text-xs font-medium flex items-center justify-between ${
                    isDisputeApproved
                      ? 'bg-tertiary-container/30 border-tertiary-fixed-dim text-on-tertiary-container'
                      : isDisputePending
                      ? 'bg-primary-container/20 border-primary-container text-on-primary-container'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">gavel</span>
                    <span>
                      <strong>Dispute:</strong> {app.dispute?.ruleLabel} — Status: {app.dispute?.status}
                    </span>
                  </div>
                  {isDisputeApproved && <span className="font-bold text-tertiary">✓ Approved by TPO</span>}
                </div>
              )}

              {/* Card Action Footer */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => onOpenDispute(app.jobTitle, app.company, 'Coursework / CGPA Equivalence')}
                  className="text-xs text-outline hover:text-primary font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                  <span>Clarify / File Gate Exception</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenSprint}
                    className="px-4 py-2 rounded-full bg-surface-container text-on-surface text-xs font-bold border border-outline-variant hover:bg-surface-container-high transition-all shadow-[0_2px_0_#d3c2c9]"
                  >
                    View 72h Sprint Quests
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDefense}
                    className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold border border-on-primary-fixed-variant shadow-[0_3px_0_#320e26] active:translate-y-[2px] transition-all flex items-center gap-1 hover:brightness-105"
                  >
                    <span>120s Defense</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
