'use client'

import { useState } from 'react'
import {
  X,
  ShieldCheck,
  Building2,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import {
  mockRecruiterConsents,
  mockResumeVersions,
  mockStudent,
} from '@/lib/mock-data'
import type { RecruiterConsent, ResumeVersion } from '@/lib/types'

interface PrivacyControlModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSourceDoc?: (docId: string) => void
  onPurgeUnconfirmed?: () => void
}

export default function PrivacyControlModal({
  isOpen,
  onClose,
  onOpenSourceDoc,
  onPurgeUnconfirmed,
}: PrivacyControlModalProps) {
  const [consents, setConsents] = useState<RecruiterConsent[]>(mockRecruiterConsents)
  const [versions, setVersions] = useState<ResumeVersion[]>(mockResumeVersions)
  const [activeTab, setActiveTab] = useState<'CONSENT' | 'VERSIONS' | 'DPDP'>('CONSENT')
  const [notification, setNotification] = useState<string | null>(null)

  if (!isOpen) return null

  const handleToggleConsent = (companyId: string) => {
    setConsents((prev) =>
      prev.map((c) => {
        if (c.companyId === companyId) {
          const nextOpt = !c.optedIn
          setNotification(
            nextOpt
              ? `Granted recruiter visibility to ${c.companyName}.`
              : `Revoked visibility from ${c.companyName}. Cache invalidated immediately per DPDP rule.`,
          )
          return {
            ...c,
            optedIn: nextOpt,
            lastChangedAt: new Date().toISOString(),
          }
        }
        return c
      }),
    )
  }

  const handleDownloadArchive = () => {
    const studentDataArchive = {
      exportVersion: '1.1',
      exportedAt: new Date().toISOString(),
      compliance: 'DPDP 2023 Compliant Subject Access Request',
      studentProfile: mockStudent,
      consents,
      resumeVersions: versions,
    }

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(studentDataArchive, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `campusbridge_data_archive_${mockStudent.name.toLowerCase().replace(/\s+/g, '_')}.json`,
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    setNotification('Data archive exported successfully as JSON format.')
  }

  const handlePurge = () => {
    if (confirm('Are you sure you want to purge all unconfirmed AI skill suggestions? Verified skills will remain untouched.')) {
      onPurgeUnconfirmed?.()
      setNotification('Unconfirmed skills successfully purged from profile cache.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border-hairline bg-surface shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-hairline p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-oxford text-white">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink-primary">
                Privacy Shield &amp; Data Control Center
              </h2>
              <p className="text-xs text-ink-secondary">
                DPDP Compliant Data Governance &amp; Version Vault (FR-004, FR-014, FR-015)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-muted hover:bg-subtle hover:text-ink-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-hairline bg-canvas px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('CONSENT')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'CONSENT'
                ? 'border-oxford text-oxford'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            1. Recruiter Consent (FR-004)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VERSIONS')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'VERSIONS'
                ? 'border-oxford text-oxford'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            2. Resume Version Vault (FR-014)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DPDP')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'DPDP'
                ? 'border-oxford text-oxford'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            3. Data Export &amp; Erasure (FR-015)
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {notification && (
            <div className="flex items-center justify-between rounded-lg border border-oxford-border bg-oxford-surface p-3 text-xs text-oxford animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{notification}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-[11px] underline hover:text-ink-primary"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: Per-Company Consent Switches */}
          {activeTab === 'CONSENT' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-oxford-border/60 bg-oxford-surface/40 p-3 text-xs text-ink-secondary">
                <strong className="text-oxford">Zero-Trust Privacy Principle:</strong> No employer or recruiter can view your profile or verified skills until you explicitly opt in for their campus recruitment drive. Revoking consent immediately drops recruiter access and invalidates all cached views.
              </div>

              <div className="space-y-2 pt-1">
                {consents.map((company) => (
                  <div
                    key={company.companyId}
                    className="flex items-center justify-between rounded-xl border border-border-hairline bg-surface p-3.5 transition-colors hover:border-oxford-border"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-ink-muted" />
                        <h4 className="font-display text-sm font-semibold text-ink-primary">
                          {company.companyName}
                        </h4>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            company.optedIn
                              ? 'bg-emerald-surface text-emerald border border-emerald-border'
                              : 'bg-subtle text-ink-muted border border-border-hairline'
                          }`}
                        >
                          {company.optedIn ? 'Opted In' : 'Private / Blocked'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-secondary">
                        {company.category} • Last updated {new Date(company.lastChangedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-ink-muted">
                        {company.optedIn ? 'Visible' : 'Hidden'}
                      </span>
                      <Switch.Root
                        checked={company.optedIn}
                        onCheckedChange={() => handleToggleConsent(company.companyId)}
                        className="relative h-6 w-11 cursor-pointer rounded-full bg-border-hairline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-oxford focus:ring-offset-2 data-[state=checked]:bg-oxford"
                      >
                        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-xs transition-transform duration-200 will-change-transform data-[state=checked]:translate-x-[22px]" />
                      </Switch.Root>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Immutable Resume Versions */}
          {activeTab === 'VERSIONS' && (
            <div className="space-y-3">
              <div className="text-xs text-ink-secondary">
                Prior uploaded resumes and portfolio artifacts are maintained in an immutable audit ledger. You can inspect any prior version&apos;s source layout at any time.
              </div>

              <div className="space-y-2.5">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between rounded-xl border border-border-hairline bg-surface p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-oxford" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-semibold text-ink-primary">
                            {ver.fileName}
                          </span>
                          <span className="font-mono text-[10px] text-ink-muted">
                            (v{ver.versionNumber})
                          </span>
                          {ver.isCurrent && (
                            <span className="rounded bg-emerald-surface px-1.5 py-0.2 text-[9px] font-bold text-emerald border border-emerald-border">
                              Current Profile
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                          <span>Size: {ver.fileSize}</span>
                          <span>Uploaded: {new Date(ver.uploadedAt).toLocaleDateString()}</span>
                          <span className="font-medium text-oxford">
                            {ver.extractedSkillsCount} extracted skills
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenSourceDoc?.(ver.sourceDocumentId)
                      }}
                      className="flex items-center gap-1 rounded-lg border border-border-hairline bg-canvas px-3 py-1.5 font-mono text-xs font-medium text-oxford hover:bg-subtle transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Inspect Span
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DPDP Data Export & Erasure */}
          {activeTab === 'DPDP' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border-hairline bg-canvas p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-primary">
                  <Download className="h-4 w-4 text-oxford" />
                  Subject Access Request (SAR) — Export My Data Archive
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Download a complete, machine-readable JSON archive of your personal profile facts, verified skills, micro-defense transcripts, and consent audit log.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadArchive}
                  className="flex items-center gap-1.5 rounded-lg bg-oxford px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-oxford/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download My Data Archive (JSON)
                </button>
              </div>

              <div className="rounded-lg border border-crimson-border/60 bg-crimson-surface/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-crimson">
                  <Trash2 className="h-4 w-4 text-crimson" />
                  Right to Rectification &amp; Erasure — Purge Unconfirmed Data
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Permanently delete all provisional AI extractions and unconfirmed suggestions. Your institution-verified and student-confirmed skills remain intact.
                </p>
                <button
                  type="button"
                  onClick={handlePurge}
                  className="flex items-center gap-1.5 rounded-lg border border-crimson-border bg-surface px-4 py-2 text-xs font-semibold text-crimson hover:bg-crimson-surface/50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Purge Unconfirmed AI Suggestions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-hairline bg-canvas p-4 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald" />
            <span>Digital Personal Data Protection (DPDP) Act Compliant</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-hairline bg-surface px-4 py-1.5 font-semibold text-ink-primary hover:bg-subtle"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

