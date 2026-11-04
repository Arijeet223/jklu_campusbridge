'use client'

import { useState } from 'react'
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  UserCheck,
  Building2,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { mockDisputes } from '@/lib/mock-data'
import type { EligibilityDispute } from '@/lib/types'

interface ExceptionQueueViewProps {
  onOpenSource?: (docId: string) => void
}

export const REASON_CODES = [
  {
    code: 'EQUIVALENCE_APPROVED',
    label: 'Equivalence Approved (Institutional Academic Equivalence Policy)',
    description: 'Degree or course curriculum verified as academically equivalent by department head.',
  },
  {
    code: 'TRANSCRIPT_VERIFIED',
    label: 'Transcript Verified (Official Registrar Record)',
    description: 'Direct verification with university academic ERP / official transcript record.',
  },
  {
    code: 'RECRUITER_POLICY_WAIVER',
    label: 'Recruiter Policy Waiver (Written Recruiter Exception)',
    description: 'Recruiter explicitly waived the hard cutoff or broadened eligible branches in writing.',
  },
  {
    code: 'INSUFFICIENT_DOCUMENTATION',
    label: 'Insufficient Documentation (Does Not Meet Standard)',
    description: 'Provided documentation does not satisfy the requirements of the job criteria.',
  },
]

export default function ExceptionQueueView({ onOpenSource }: ExceptionQueueViewProps) {
  const [disputes, setDisputes] = useState<EligibilityDispute[]>(mockDisputes)
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL')
  const [selectedReasonCodes, setSelectedReasonCodes] = useState<Record<string, string>>({
    disp_001: 'EQUIVALENCE_APPROVED',
  })
  const [officerNotes, setOfficerNotes] = useState<Record<string, string>>({
    disp_001: 'Verified CSE department course curriculum against CS recruiter guidelines.',
  })
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null)

  const pendingCount = disputes.filter((d) => d.status === 'PENDING_REVIEW').length
  const resolvedCount = disputes.filter((d) => d.status !== 'PENDING_REVIEW').length

  const filteredDisputes = disputes.filter((d) => {
    if (selectedFilter === 'PENDING') return d.status === 'PENDING_REVIEW'
    if (selectedFilter === 'RESOLVED') return d.status !== 'PENDING_REVIEW'
    return true
  })

  // 1-Click Approve Override (FR-036 / POST /v1/disputes/{id}/resolve)
  const handleResolve = (disputeId: string, decision: 'APPROVED_OVERRIDE' | 'REJECTED') => {
    const reasonCode = selectedReasonCodes[disputeId] || 'EQUIVALENCE_APPROVED'
    const note = officerNotes[disputeId] || ''

    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === disputeId) {
          return {
            ...d,
            status: decision,
            reviewedBy: 'Dr. K. Sharma (Placement Chair)',
            reviewReasonCode: reasonCode,
            resolvedAt: new Date().toISOString(),
          }
        }
        return d
      }),
    )

    // Call backend API to write-through to Excel and record audit log
    fetch(`/api/backend/v1/disputes/${disputeId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: decision, reason_code: reasonCode }),
    }).catch(() => {})

    setResolutionNotice(
      decision === 'APPROVED_OVERRIDE'
        ? `Dispute #${disputeId.toUpperCase()} approved with override code "${reasonCode}". Student eligibility cache invalidated and updated.`
        : `Dispute #${disputeId.toUpperCase()} rejected. Student notified with reason code "${reasonCode}".`,
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      {resolutionNotice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-border bg-emerald-surface p-3.5 text-xs text-emerald animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{resolutionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setResolutionNotice(null)}
            className="text-[11px] underline hover:text-ink-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-amber-surface px-2.5 py-1 text-xs font-semibold text-amber border border-amber-border">
              <ShieldAlert className="h-3.5 w-3.5" />
              Student Eligibility Exception Queue (FR-036)
            </span>
            <span className="font-mono text-provenance text-ink-muted">
              Audit-Enforced Human Overrides
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-ink-primary">
            Student Eligibility Disputes &amp; Proof Adjudication
          </h2>
          <p className="mt-1 text-xs text-ink-secondary">
            Students flagged as <span className="font-mono">UNKNOWN</span> or <span className="font-mono">DOES_NOT_MEET</span> can attach verified document evidence to request departmental course equivalence or registrar overrides.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedFilter === 'ALL'
                ? 'bg-oxford text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            All Tickets ({disputes.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('PENDING')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedFilter === 'PENDING'
                ? 'bg-amber text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            Pending Action ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('RESOLVED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedFilter === 'RESOLVED'
                ? 'bg-emerald text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Disputes Ticket List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-hairline bg-surface p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald" />
            <h3 className="mt-2 font-display text-sm font-semibold text-ink-primary">
              No dispute tickets in this view
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              All student eligibility clarification requests are currently adjudicated.
            </p>
          </div>
        ) : (
          filteredDisputes.map((ticket) => {
            const isPending = ticket.status === 'PENDING_REVIEW'
            const isApproved = ticket.status === 'APPROVED_OVERRIDE'

            return (
              <div
                key={ticket.id}
                className={`rounded-xl border bg-surface p-5 shadow-2xs transition-all ${
                  isPending
                    ? 'border-amber-border bg-white ring-1 ring-amber/20'
                    : isApproved
                    ? 'border-emerald-border/70 bg-surface'
                    : 'border-border-hairline bg-surface opacity-90'
                }`}
              >
                {/* Ticket Top Row: ID, Status, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-hairline pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-oxford">
                      Ticket #{ticket.id.toUpperCase()}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        isPending
                          ? 'bg-amber-surface text-amber border border-amber-border'
                          : isApproved
                          ? 'bg-emerald-surface text-emerald border border-emerald-border'
                          : 'bg-subtle text-ink-muted border border-border-hairline'
                      }`}
                    >
                      {isPending
                        ? 'Pending Officer Adjudication'
                        : isApproved
                        ? '✓ Approved Override'
                        : '✕ Rejected'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted: {new Date(ticket.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Ticket Body: Student & Target Opportunity */}
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
                  {/* Left Column: Student Context & Gate (7 cols) */}
                  <div className="space-y-3 lg:col-span-7">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-ink-primary">
                          Priya Sharma
                        </span>
                        <span className="text-xs text-ink-muted">
                          (Roll: 231CS042 • B.Tech CS &apos;27)
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-secondary">
                        <Building2 className="h-3.5 w-3.5 text-ink-muted" />
                        <span>Target Role: <strong>{ticket.jobTitle}</strong> at <strong>{ticket.company}</strong></span>
                      </div>
                    </div>

                    {/* Disputed Hard Rule Clause */}
                    <div className="rounded-lg border border-border-hairline bg-canvas p-3">
                      <div className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                        Disputed Hard Gate Rule:
                      </div>
                      <div className="mt-0.5 font-display text-xs font-semibold text-ink-primary">
                        {ticket.ruleLabel}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-oxford bg-oxford-surface/60 rounded px-2 py-0.5 inline-block">
                        Rule ID: {ticket.ruleId}
                      </div>
                    </div>

                    {/* Student Clarification Statement & Attached Document Pill */}
                    <div className="rounded-lg border border-oxford-border/60 bg-oxford-surface/30 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-oxford">Student&apos;s Stated Clarification:</span>
                        {ticket.attachedSpan && (
                          <button
                            type="button"
                            onClick={() => onOpenSource?.(ticket.attachedDocumentId ?? 'doc_resume_v3')}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-oxford hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            {ticket.attachedSpan}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-ink-secondary italic leading-relaxed">
                        &ldquo;{ticket.studentNote}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Officer Adjudication Controls (5 cols) */}
                  <div className="rounded-lg border border-border-hairline bg-canvas p-4 space-y-3 lg:col-span-5">
                    {isPending ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary">
                          <UserCheck className="h-4 w-4 text-oxford" />
                          Placement Officer Adjudication (FR-036)
                        </div>

                        {/* Mandatory Reason Code Dropdown */}
                        <div>
                          <label className="block text-[11px] font-medium text-ink-secondary">
                            Mandatory Audit Reason Code *
                          </label>
                          <select
                            value={selectedReasonCodes[ticket.id] ?? 'EQUIVALENCE_APPROVED'}
                            onChange={(e) =>
                              setSelectedReasonCodes((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-border-hairline bg-surface px-2.5 py-1.5 font-mono text-xs text-ink-primary focus:border-oxford focus:outline-none"
                          >
                            {REASON_CODES.map((r) => (
                              <option key={r.code} value={r.code}>
                                {r.code} — {r.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Officer Notes Textarea */}
                        <div>
                          <label className="block text-[11px] font-medium text-ink-secondary">
                            Justification / Resolution Note
                          </label>
                          <textarea
                            rows={2}
                            placeholder="State review notes for institutional audit log..."
                            value={officerNotes[ticket.id] ?? ''}
                            onChange={(e) =>
                              setOfficerNotes((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-border-hairline bg-surface p-2 text-xs text-ink-primary focus:border-oxford focus:outline-none"
                          />
                        </div>

                        {/* Adjudication Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleResolve(ticket.id, 'APPROVED_OVERRIDE')}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald/90 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve Override
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolve(ticket.id, 'REJECTED')}
                            className="flex items-center justify-center gap-1 rounded-lg border border-border-hairline bg-surface px-3 py-2 text-xs font-semibold text-crimson hover:bg-subtle transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Resolved Audit Stamp */
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary">
                          <CheckCircle2 className="h-4 w-4 text-emerald" />
                          Adjudicated Audit Record
                        </div>
                        <div className="rounded border border-border-hairline bg-surface p-2.5 space-y-1.5 text-xs">
                          <div className="flex justify-between text-ink-muted">
                            <span>Reviewed by:</span>
                            <span className="font-medium text-ink-primary">
                              {ticket.reviewedBy ?? 'Dr. K. Sharma (Placement Chair)'}
                            </span>
                          </div>
                          <div className="flex justify-between text-ink-muted">
                            <span>Audit Reason Code:</span>
                            <span className="font-mono text-oxford font-medium">
                              {ticket.reviewReasonCode ?? 'EQUIVALENCE_APPROVED'}
                            </span>
                          </div>
                          {ticket.resolvedAt && (
                            <div className="flex justify-between text-ink-muted">
                              <span>Timestamp:</span>
                              <span className="font-mono text-[11px]">
                                {new Date(ticket.resolvedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted italic">
                          Decision recorded immutably. Match eligibility engine will consume this override for subsequent match runs.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

