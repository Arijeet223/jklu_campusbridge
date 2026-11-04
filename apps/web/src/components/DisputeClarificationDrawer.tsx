'use client'

import { useState } from 'react'
import {
  X,
  HelpCircle,
  FileText,
  Send,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import type { EligibilityRule } from '@/lib/types'

interface DisputeClarificationDrawerProps {
  isOpen: boolean
  onClose: () => void
  rule: EligibilityRule | null
  jobTitle?: string
  company?: string
  onSubmitDispute?: (disputeData: {
    ruleId: string
    ruleLabel: string
    documentRef: string
    note: string
  }) => void
  onOpenSourceSpan?: () => void
}

export default function DisputeClarificationDrawer({
  isOpen,
  onClose,
  rule,
  jobTitle = 'Backend Engineer',
  company = 'TechCorp India',
  onSubmitDispute,
  onOpenSourceSpan,
}: DisputeClarificationDrawerProps) {
  const [selectedDoc, setSelectedDoc] = useState('Resume_v3.pdf • p.1, §Education')
  const [note, setNote] = useState('')
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string
    submittedAt: string
  } | null>(null)

  if (!isOpen || !rule) return null

  const isUnknown = rule.status === 'UNKNOWN'
  const isDoesNotMeet = rule.status === 'DOES_NOT_MEET'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return

    const ticketId = `DISP-${Math.floor(1000 + Math.random() * 9000)}`
    setSubmittedTicket({
      id: ticketId,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })

    onSubmitDispute?.({
      ruleId: rule.id,
      ruleLabel: rule.label,
      documentRef: selectedDoc,
      note,
    })
  }

  const handleTemplateClick = (template: string) => {
    setNote(template)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer (420px) */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border-hairline bg-surface shadow-2xl transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-labelledby="dispute-drawer-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border-hairline px-5 py-4 bg-canvas">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isUnknown
                  ? 'bg-amber-surface text-amber'
                  : 'bg-crimson-surface text-crimson'
              }`}
            >
              {isUnknown ? (
                <HelpCircle className="h-4 w-4" />
              ) : (
                <AlertOctagon className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2
                id="dispute-drawer-title"
                className="font-display text-sm font-semibold text-ink-primary"
              >
                Explain or Clarify Eligibility
              </h2>
              <p className="text-[11px] text-ink-muted">
                {company} • {jobTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink-primary transition-colors"
            aria-label="Close clarification drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Rule Information Card */}
          <div className="rounded-xl border border-border-hairline bg-canvas p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-primary">
                Requirement Rule:
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${
                  isUnknown
                    ? 'bg-amber-surface text-amber border border-amber-border'
                    : 'bg-crimson-surface text-crimson border border-crimson-border'
                }`}
              >
                {isUnknown ? '? Status: UNKNOWN' : '✕ Status: DOES NOT MEET'}
              </span>
            </div>

            <p className="font-medium text-ink-primary text-sm">
              {rule.label}
            </p>

            <div className="rounded-lg bg-surface p-2.5 font-mono text-[11px] text-ink-secondary border border-border-hairline">
              <span className="text-ink-muted">Policy Rule: </span>
              {rule.ruleExpression || 'Institutional eligibility policy check'}
            </div>

            {rule.clarificationHint && (
              <p className="text-[11px] text-ink-secondary">
                <strong className="text-oxford">Guidance: </strong>
                {rule.clarificationHint}
              </p>
            )}
          </div>

          {!submittedTicket ? (
            /* Clarification Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  1. Select Attached Document Proof:
                </label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full rounded-lg border border-border-hairline bg-surface p-2.5 text-xs text-ink-primary focus:border-oxford focus:outline-none focus:ring-1 focus:ring-oxford"
                >
                  <option value="Resume_v3.pdf • p.1, §Education">
                    📄 Resume_v3.pdf • p.1, §Education (NITK CS B.Tech)
                  </option>
                  <option value="Resume_v3.pdf • p.2, §Projects">
                    📄 Resume_v3.pdf • p.2, §Projects (Order Service Microservice)
                  </option>
                  <option value="Transcript_Sem6.pdf • p.1, Electives">
                    📄 Official Transcript • CS402 Cloud &amp; Distributed Systems
                  </option>
                  <option value="Department_Equivalence_Letter.pdf">
                    📄 Departmental Equivalence Letter (CSE to CS)
                  </option>
                </select>

                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={onOpenSourceSpan}
                    className="text-[11px] text-oxford hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Preview Highlighted Document Span →
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  2. Your Clarification Note for Placement Officers:
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain why you meet this requirement (e.g., 'My B.Tech is Computer Science & Engineering which is the approved equivalent', or 'Completed CS402 as an elective')..."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-border-hairline bg-surface p-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-oxford focus:outline-none focus:ring-1 focus:ring-oxford leading-relaxed"
                />

                {/* Quick Suggestion Pills */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-ink-muted">Quick templates:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleTemplateClick(
                          'My degree is B.Tech Computer Science & Engineering (CSE) which is the direct NITK institutional equivalent of CS.'
                        )
                      }
                      className="rounded bg-subtle px-2 py-0.5 text-[10px] text-ink-secondary hover:bg-border-hairline transition-colors"
                    >
                      + Degree Title Equivalence
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleTemplateClick(
                          'I completed the prerequisite coursework as a departmental elective (Grade A) approved by the CS department chair.'
                        )
                      }
                      className="rounded bg-subtle px-2 py-0.5 text-[10px] text-ink-secondary hover:bg-border-hairline transition-colors"
                    >
                      + Elective Prerequisite
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-oxford-surface border border-oxford-border p-3 text-[11px] text-ink-secondary leading-snug">
                <span className="font-semibold text-oxford">How this works: </span>
                Submitting this ticket sends your clarification directly into the Placement Officer's <strong>Exception Queue</strong>. Overrides update your match status automatically without emails.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border-hairline px-3.5 py-2 text-xs font-medium text-ink-secondary hover:bg-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!note.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-oxford px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-oxford/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Clarification
                </button>
              </div>
            </form>
          ) : (
            /* Ticket Confirmation State */
            <div className="rounded-xl border border-emerald-border bg-emerald-surface/50 p-5 text-xs space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2 text-emerald font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                Clarification Ticket Submitted!
              </div>

              <div className="rounded-lg bg-white p-3 border border-emerald-border space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Ticket ID:</span>
                  <span className="font-semibold text-ink-primary">{submittedTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Status:</span>
                  <span className="text-amber font-semibold">PENDING_REVIEW (Exception Queue)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Submitted At:</span>
                  <span className="text-ink-secondary">{submittedTicket.submittedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Reviewer:</span>
                  <span className="text-oxford">Placement Officer Queue</span>
                </div>
              </div>

              <p className="text-[11px] text-ink-secondary leading-relaxed">
                Your explanation and verified document proof have been queued. Once the Placement Officer grants an equivalence override, your match badge will update from <strong>UNKNOWN</strong> to <strong>MEETS</strong> automatically.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-oxford px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-oxford/90 transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

