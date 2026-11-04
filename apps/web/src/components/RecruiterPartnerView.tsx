'use client'

import { useState } from 'react'
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react'
import {
  mockRecruiterCandidates,
  mockDraftJDs,
} from '@/lib/mock-data'
import type { RecruiterCandidate } from '@/lib/types'

interface RecruiterPartnerViewProps {
  onOpenSourceDoc?: (docId: string) => void
}

export default function RecruiterPartnerView({ onOpenSourceDoc }: RecruiterPartnerViewProps) {
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>(mockRecruiterCandidates)
  const [selectedJd, setSelectedJd] = useState(mockDraftJDs[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null)

  const filteredCandidates = candidates.filter((c) =>
    c.anonymousAlias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.verifiedSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Top Banner: Recruiter Partner Authority Scope */}
      <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-surface px-2.5 py-1 text-xs font-semibold text-emerald border border-emerald-border">
              <ShieldCheck className="h-3.5 w-3.5" />
              Recruiter Partner Talent Portal (Section 2.2)
            </div>
            <h1 className="mt-2 font-display text-display-h1 text-ink-primary">
              Approved Campus Drive Candidate Pool
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
              Reviewing verified student submissions for <strong className="text-ink-primary">{selectedJd.jobTitle}</strong> at <strong className="text-ink-primary">{selectedJd.company}</strong>. Only opted-in candidates with confirmed evidence are visible.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Consented Candidates</div>
              <div className="font-mono text-lg font-bold text-emerald">{candidates.length}</div>
            </div>
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Defense Verified</div>
              <div className="font-mono text-lg font-bold text-oxford">
                {candidates.filter((c) => c.defensePassed).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Candidate Table & Inspection Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Candidate Roster (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-col gap-3 rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Filter by candidate alias or skill (e.g. FastAPI, Python)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border-hairline bg-canvas pl-9 pr-3 py-1.5 text-xs text-ink-primary focus:border-oxford focus:outline-none"
              />
            </div>
            <div className="text-xs text-ink-muted">
              Showing {filteredCandidates.length} opted-in students
            </div>
          </div>

          <div className="space-y-3">
            {filteredCandidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidate(cand)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedCandidate?.id === cand.id
                    ? 'border-oxford bg-oxford-surface/40 shadow-xs'
                    : 'border-border-hairline bg-surface hover:border-oxford-border/60 hover:shadow-2xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-hairline pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-ink-primary">
                      {cand.anonymousAlias}
                    </span>
                    <span className="rounded bg-emerald-surface px-2 py-0.5 text-[10px] font-semibold text-emerald border border-emerald-border">
                      ✓ MEETS Hard Gates
                    </span>
                    {cand.defensePassed && (
                      <span className="rounded bg-oxford-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-oxford border border-oxford-border">
                        🛡️ 120s Defense Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-muted">Alignment Fit:</span>
                    <span className="font-mono text-base font-bold text-oxford">
                      {cand.matchScore}%
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-1.5">
                    Verified Competencies (Proven by Source Code &amp; Transcripts):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cand.verifiedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md border border-border-hairline bg-canvas px-2.5 py-1 font-mono text-xs text-ink-primary"
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {cand.defenseProofTitle && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-border-hairline bg-canvas p-2 text-xs">
                    <div className="flex items-center gap-2 text-ink-secondary">
                      <Award className="h-3.5 w-3.5 text-emerald" />
                      <span>{cand.defenseProofTitle}</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald font-semibold">
                      Passed STAR Rubric ↗
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Candidate Proof Detail Sheet (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Evidence &amp; Provenance Detail
            </h3>

            {selectedCandidate ? (
              <div className="space-y-3">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink-primary">
                    {selectedCandidate.anonymousAlias}
                  </h4>
                  <p className="text-xs text-ink-secondary">
                    {selectedCandidate.department} • Class of {selectedCandidate.gradYear}
                  </p>
                </div>

                <div className="rounded-lg border border-oxford-border bg-oxford-surface/50 p-3 text-xs space-y-1">
                  <div className="font-semibold text-oxford">Recruiter Notice:</div>
                  <p className="text-ink-secondary leading-snug">
                    Candidate has explicitly consented to share verified technical skills and project artifacts for this opportunity.
                  </p>
                </div>

                {selectedCandidate.defenseProofTitle && (
                  <div className="rounded-lg border border-border-hairline bg-canvas p-3 space-y-2 text-xs">
                    <div className="font-semibold text-ink-primary">
                      120s Proof-of-Work Q&amp;A Defense
                    </div>
                    <div className="font-mono text-[11px] text-ink-muted">
                      Project: FastAPI Order Processing Microservice
                    </div>
                    <p className="text-ink-secondary italic text-[11px]">
                      &ldquo;Implemented Redis Streams consumer groups with explicit ACK semantics to prevent duplicate order processing during node failover.&rdquo;
                    </p>
                    <div className="font-mono text-[10px] text-emerald">
                      Result: Rubric Score 3/3 (Substantive &amp; Grounded)
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onOpenSourceDoc?.('doc_resume_v3')}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border-hairline bg-canvas px-4 py-2 text-xs font-semibold text-oxford hover:bg-subtle transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Inspect Anonymized Resume Spans
                </button>
              </div>
            ) : (
              <p className="text-xs text-ink-muted text-center py-8">
                Select a candidate from the roster to view their verified evidence citations and defense proofs.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

