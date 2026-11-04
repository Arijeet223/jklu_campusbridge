'use client'

import { useState } from 'react'
import {
  GraduationCap,
  Award,
  CheckCircle2,
  FileText,
  Star,
  Users,
  Search,
  BookOpen,
} from 'lucide-react'
import { mockFacultyAdvisees } from '@/lib/mock-data'
import type { FacultyAdvisee } from '@/lib/types'

interface FacultyMentorViewProps {
  onOpenSourceDoc?: (docId: string) => void
  onSkillEndorsed?: (skillId: string) => void
}

export default function FacultyMentorView({
  onOpenSourceDoc,
  onSkillEndorsed,
}: FacultyMentorViewProps) {
  const [advisees, setAdvisees] = useState<FacultyAdvisee[]>(mockFacultyAdvisees)
  const [searchQuery, setSearchQuery] = useState('')
  const [endorseNotice, setEndorseNotice] = useState<string | null>(null)

  const handleEndorse = (adviseeId: string, skillId: string, studentName: string) => {
    setAdvisees((prev) =>
      prev.map((a) => {
        if (a.id === adviseeId) {
          return { ...a, institutionVerified: true, verifiedCount: a.verifiedCount + 1 }
        }
        return a
      }),
    )

    onSkillEndorsed?.(skillId)
    setEndorseNotice(
      `Successfully endorsed capstone project for ${studentName}! Upgraded skill tier to "INSTITUTION_VERIFIED".`,
    )
  }

  const filtered = advisees.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Top Banner: Faculty Mentor Authority Scope */}
      <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-oxford-surface px-2.5 py-1 text-xs font-semibold text-oxford">
              <GraduationCap className="h-3.5 w-3.5" />
              Faculty Mentor &amp; Departmental Advisory Scope (Section 2.2)
            </div>
            <h1 className="mt-2 font-display text-display-h1 text-ink-primary">
              Student Advisee Readiness &amp; Capstone Endorsements
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
              Review assigned departmental advisees, inspect code repositories and project reports, and grant official <strong className="text-ink-primary">Institution-Verified</strong> credential endorsements.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Assigned Advisees</div>
              <div className="font-mono text-lg font-bold text-ink-primary">{advisees.length}</div>
            </div>
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Endorsed Projects</div>
              <div className="font-mono text-lg font-bold text-emerald">
                {advisees.filter((a) => a.institutionVerified).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Endorsement Notice Toast */}
      {endorseNotice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-border bg-emerald-surface p-3.5 text-xs text-emerald shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{endorseNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setEndorseNotice(null)}
            className="text-[11px] underline hover:text-ink-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Advisee Table / List */}
      <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-hairline pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border-hairline bg-canvas pl-9 pr-3 py-1.5 text-xs text-ink-primary focus:border-oxford focus:outline-none"
            />
          </div>
          <span className="text-xs text-ink-muted">
            Batch of 2027 • Computer Science &amp; Engineering
          </span>
        </div>

        <div className="space-y-3">
          {filtered.map((advisee) => (
            <div
              key={advisee.id}
              className="rounded-xl border border-border-hairline bg-canvas p-4 transition-all hover:border-oxford-border"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-ink-primary">
                      {advisee.name}
                    </h3>
                    <span className="font-mono text-xs text-ink-muted">
                      ({advisee.rollNumber})
                    </span>
                    <span className="rounded bg-surface border border-border-hairline px-2 py-0.5 font-mono text-[11px] font-semibold text-oxford">
                      CGPA {advisee.cgpa.toFixed(1)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-ink-secondary">
                    {advisee.department} • Readiness Score:{' '}
                    <strong className="text-emerald font-mono">{advisee.overallReadiness}%</strong>{' '}
                    ({advisee.verifiedCount} of {advisee.skillsCount} skills verified)
                  </p>
                </div>

                {/* Endorsement Status & Action */}
                <div className="flex items-center gap-2">
                  {advisee.institutionVerified ? (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-border bg-emerald-surface px-3 py-1.5 text-xs font-semibold text-emerald">
                      <Star className="h-3.5 w-3.5 fill-emerald" />
                      Institution-Verified Endorsed
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEndorse(advisee.id, advisee.featuredSkillId, advisee.name)}
                      className="flex items-center gap-1.5 rounded-lg bg-oxford px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-oxford/90 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                      ★ Endorse as Institution-Verified
                    </button>
                  )}
                </div>
              </div>

              {/* Featured Project Showcase */}
              <div className="mt-3 rounded-lg border border-border-hairline bg-surface p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-primary flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-oxford" />
                    Featured Capstone Project: {advisee.featuredProject}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSourceDoc?.('doc_resume_v3')}
                    className="font-mono text-[11px] text-oxford hover:underline"
                  >
                    View Project Report &amp; GitHub Repo ↗
                  </button>
                </div>
                <p className="text-[11px] text-ink-muted leading-tight">
                  High-throughput concurrency pipeline with Redis Streams. Verified against departmental rubric for architectural grounding and async error handling.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

