'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import {
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
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import SourceDrawer from '@/components/SourceDrawer'
import {
  mockRecruiterConsents,
  mockResumeVersions,
  mockStudent,
  mockSourceDocuments,
} from '@/lib/mock-data'
import type { RecruiterConsent, ResumeVersion, SourceDocument } from '@/lib/types'
import { ClientOnlyDate } from '@/lib/date-format'

export default function StudentPrivacyShieldPage() {
  const [consents, setConsents] = useState<RecruiterConsent[]>(mockRecruiterConsents)
  const [versions, setVersions] = useState<ResumeVersion[]>(mockResumeVersions)
  const [activeTab, setActiveTab] = useState<'CONSENT' | 'VERSIONS' | 'DPDP'>('CONSENT')
  const [notification, setNotification] = useState<string | null>(null)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const handleInspectDocument = (docId: string, fileName?: string) => {
    let doc = mockSourceDocuments[docId]
    if (!doc && typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('cb_uploaded_documents') || '{}')
        if (stored[docId]) doc = stored[docId]
      } catch {}
    }
    if (!doc) {
      doc = {
        id: docId,
        fileName: fileName || 'Resume Document',
        pageNumber: 1,
        fullText: `Primary Cryptographic Resume Document (${fileName || docId})\nUploaded and permanently indexed into isolated institutional tenant.\nEvidence Status: 1.0x Solid Tokens Verified.`,
        highlightedText: 'Resume Document',
      }
    }
    setSelectedDoc(doc)
    setSourceDrawerOpen(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedVersions = localStorage.getItem('cb_resume_versions')
        if (storedVersions) {
          const parsed = JSON.parse(storedVersions)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVersions(parsed)
          }
        }
      } catch {}
    }
  }, [])

  const handleToggleConsent = (companyId: string) => {
    setConsents((prev) =>
      prev.map((c) => {
        if (c.companyId === companyId) {
          const nextState = !c.optedIn
          setNotification(
            nextState
              ? `Granted read scope to ${c.companyName}.`
              : `Revoked all data access for ${c.companyName}.`,
          )
          setTimeout(() => setNotification(null), 3000)
          return { ...c, optedIn: nextState, lastChangedAt: new Date().toISOString() }
        }
        return c
      }),
    )
  }

  const handleExportData = () => {
    const dataArchive = {
      exportTimestamp: new Date().toISOString(),
      studentProfile: mockStudent,
      recruiterConsents: consents,
      resumeVersions: versions,
      complianceNote: 'Exported under DPDP Act 2023 / Digital Personal Data Protection Regulations.',
    }
    const blob = new Blob([JSON.stringify(dataArchive, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `JKLU_Career_Privacy_Export_${mockStudent.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout pageTitle="Privacy Shield & Consent Vault" breadcrumb="Student Workspace">
      <div className="space-y-6 font-body-md text-on-surface">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-surface-container-low border border-outline-variant p-6 shadow-[0_4px_0_#EADECE]">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-outline hover:text-primary transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard Overview</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed-dim shadow-[0_2px_0_#a8cfbb]">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span>DPDP §8 Compliant Security Envelope • JKLU</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Privacy Vault &amp; Recruiter Governance
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed font-medium">
              Institutional privacy governance for JKLU students. Control per-recruiter evidence scopes, inspect immutable document audit trails, or export your full data archive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-tertiary-fixed-dim bg-tertiary text-on-tertiary font-bold text-xs shadow-[0_3px_0_#2a4e3e] active:translate-y-[2px] transition-all hover:brightness-105 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Full Archive (JSON)</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-2xl bg-tertiary-container/40 border border-tertiary-fixed-dim p-3.5 text-xs font-bold text-on-tertiary-container shadow-[0_2px_0_#a8cfbb] animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-tertiary" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tab Navigation in Tactile Pills */}
        <div className="flex bg-surface-container-low p-1.5 rounded-full gap-2 border border-outline-variant/60 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('CONSENT')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'CONSENT'
                ? 'bg-primary text-on-primary shadow-[0_3px_0_#320e26]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Recruiter Access &amp; Consents</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VERSIONS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'VERSIONS'
                ? 'bg-primary text-on-primary shadow-[0_3px_0_#320e26]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Immutable Resume Versions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DPDP')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'DPDP'
                ? 'bg-primary text-on-primary shadow-[0_3px_0_#320e26]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Data Rights &amp; Retention</span>
          </button>
        </div>

        {/* Tab Content 1: Recruiter Consents */}
        {activeTab === 'CONSENT' && (
          <div className="rounded-b-2xl border border-border-hairline bg-surface p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
              <div>
                <h3 className="font-display text-sm font-bold text-ink-primary">
                  Granular Corporate Access Permissions
                </h3>
                <p className="text-xs text-ink-secondary">
                  Toggle permissions to instantly revoke or grant verified profile inspection to partner companies.
                </p>
              </div>
              <span className="font-mono text-xs text-emerald font-semibold">
                {consents.filter((c) => c.optedIn).length} of {consents.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {consents.map((consent) => (
                <div
                  key={consent.companyId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border-hairline bg-canvas hover:border-oxford-border transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-ink-primary">
                        {consent.companyName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-oxford-surface text-oxford font-semibold">
                        Domain: {consent.category}
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted flex flex-wrap gap-x-3 gap-y-1">
                      <span>Scope: <strong>{consent.verifiedSkillsVisibleCount} Verified Skills</strong></span>
                      <span>•</span>
                      <span>Updated: <ClientOnlyDate date={consent.lastChangedAt} /></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-ink-secondary">
                      {consent.optedIn ? 'Permitted' : 'Access Revoked'}
                    </span>
                    <Switch.Root
                      checked={consent.optedIn}
                      onCheckedChange={() => handleToggleConsent(consent.companyId)}
                      className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-oxford ${
                        consent.optedIn ? 'bg-emerald' : 'bg-subtle-foreground/30'
                      }`}
                    >
                      <Switch.Thumb className="block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5" />
                    </Switch.Root>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 2: Resume Versions */}
        {activeTab === 'VERSIONS' && (
          <div className="rounded-b-2xl border border-border-hairline bg-surface p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-hairline">
              <div>
                <h3 className="font-display text-sm font-bold text-ink-primary">
                  Immutable Resume Versions &amp; Audit Trail
                </h3>
                <p className="text-xs text-ink-secondary">
                  Every parsed resume is permanently hashed with deterministic UUID5 content addresses and SHA-256 signatures.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/student/profile-evidence"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-on-primary shadow-[0_2px_0_#320e26] hover:brightness-105"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Inspect Ghost Cards</span>
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Upload New PDF</span>
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border-hairline bg-canvas"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-oxford" />
                      <span className="font-mono text-sm font-bold text-ink-primary">
                        {version.fileName}
                      </span>
                      {version.isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-surface text-emerald font-semibold border border-emerald-border">
                          Primary (v{version.versionNumber})
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-ink-muted flex gap-3">
                      <span>Doc: {version.sourceDocumentId}</span>
                      <span>•</span>
                      <span>Size: {version.fileSize}</span>
                      <span>•</span>
                      <span>Uploaded: <ClientOnlyDate date={version.uploadedAt} /></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-ink-secondary">
                      {version.extractedSkillsCount} verified skills
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInspectDocument(version.sourceDocumentId, version.fileName)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim hover:brightness-95 flex items-center gap-1 shadow-[0_1px_0_#85B5CE] cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>View Resume Text</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: DPDP Rights */}
        {activeTab === 'DPDP' && (
          <div className="rounded-b-2xl border border-border-hairline bg-surface p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-sm font-bold text-ink-primary">
              Digital Personal Data Protection (DPDP) Compliance
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              CampusBridge AI operates on strict zero-retention principles for non-institutional data. Your resume evidence is isolated within JKLU’s secure tenant boundary.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border-hairline bg-canvas space-y-2">
                <h4 className="font-display text-sm font-semibold text-ink-primary flex items-center gap-2">
                  <Download className="h-4 w-4 text-oxford" />
                  Right to Data Portability
                </h4>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Download every structured skill, vector embedding span, and verified viva transcript in standardized JSON format.
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="mt-2 text-xs font-semibold text-oxford hover:underline cursor-pointer"
                >
                  Download JSON Archive &rarr;
                </button>
              </div>

              <div className="p-4 rounded-xl border border-border-hairline bg-canvas space-y-2">
                <h4 className="font-display text-sm font-semibold text-ink-primary flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  Right to Erasure &amp; Rectification
                </h4>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Purge unconfirmed AI-extracted cards or update disputed skill records through placement officer arbitration.
                </p>
                <Link
                  href="/student/profile-evidence"
                  className="mt-2 inline-block text-xs font-semibold text-rose-600 hover:underline"
                >
                  Audit Skill Evidence &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />
    </AppLayout>
  )
}

