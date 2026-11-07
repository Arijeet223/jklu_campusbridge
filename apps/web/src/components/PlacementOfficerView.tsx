'use client'

import { useState } from 'react'
import {
  FileText,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Inbox,
  ExternalLink,
  Code,
  Search,
} from 'lucide-react'
import JDIngestionStudio from './JDIngestionStudio'
import CohortLiquiditySimulator from './CohortLiquiditySimulator'
import ExceptionQueueView from './ExceptionQueueView'
import WordResumePreview from './WordResumePreview'
import { mockDraftJDs } from '@/lib/mock-data'
import type { DraftJD } from '@/lib/types'
import { getCandidateGithubUrl } from '@/lib/url-utils'

interface PlacementOfficerViewProps {
  onOpenSource?: (docId: string) => void
}

export type OfficerWorkspaceTab = 'INGESTION' | 'SIMULATOR' | 'EXCEPTIONS' | 'ROSTER'

export default function PlacementOfficerView({ onOpenSource }: PlacementOfficerViewProps) {
  const [activeTab, setActiveTab] = useState<OfficerWorkspaceTab>('INGESTION')
  const [selectedJd, setSelectedJd] = useState<DraftJD>(mockDraftJDs[0])
  const [selectedResumeCandidate, setSelectedResumeCandidate] = useState<any | null>(null)

  const handleOpenSimulatorForJd = (jdId: string) => {
    const matched = mockDraftJDs.find((d) => d.id === jdId)
    if (matched) setSelectedJd(matched)
    setActiveTab('SIMULATOR')
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Placement Officer Authority Console */}
      <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-oxford-surface px-2.5 py-1 text-xs font-semibold text-oxford">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Institutional Placement Officer Authority Scope
            </div>
            <h1 className="mt-2 font-display text-display-h1 text-ink-primary">
              Opportunity Calibration &amp; Cohort Operations Studio
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
              Review AI-parsed recruiter job criteria, simulate candidate pool liquidity in real time, and adjudicate student eligibility exceptions.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Eligible Cohort</div>
              <div className="font-mono text-lg font-bold text-ink-primary">240</div>
            </div>
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Active Postings</div>
              <div className="font-mono text-lg font-bold text-emerald">3</div>
            </div>
            <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-center">
              <div className="text-[11px] font-medium text-ink-muted">Pending Tickets</div>
              <div className="font-mono text-lg font-bold text-amber">1</div>
            </div>
          </div>
        </div>

        {/* 3-Tab Operational Workspace Navigation Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border-hairline pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('INGESTION')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'INGESTION'
                ? 'bg-oxford text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            1. JD Ingestion &amp; Approval Studio (FR-030 &amp; FR-031)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'SIMULATOR'
                ? 'bg-oxford text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            2. Cohort Liquidity Simulator (FR-038)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'EXCEPTIONS'
                ? 'bg-oxford text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            3. Student Eligibility Exception Queue (FR-036)
            <span className="rounded-full bg-amber px-1.5 py-0.2 text-[10px] font-bold text-white">
              1 Pending
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROSTER')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'ROSTER'
                ? 'bg-oxford text-white shadow-2xs'
                : 'border border-border-hairline bg-canvas text-ink-secondary hover:bg-subtle'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            4. Candidate Placement Roster &amp; GitHub Portfolios
          </button>
        </div>
      </div>

      {/* Tab 1: JD Ingestion & Approval Studio (FR-030 & FR-031) */}
      {activeTab === 'INGESTION' && (
        <div className="animate-in fade-in-50 duration-200">
          <JDIngestionStudio
            onOpenSimulator={handleOpenSimulatorForJd}
            onOpenSource={onOpenSource}
          />
        </div>
      )}

      {/* Tab 2: Cohort Liquidity Simulator (FR-038) */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-in fade-in-50 duration-200">
          {/* Left Column: Select Job Opportunity to Calibrate (4 cols) */}
          <div className="space-y-3 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Active Job Opportunities
              </h2>
              <span className="text-xs font-medium text-ink-muted">
                {mockDraftJDs.length} Postings
              </span>
            </div>

            <div className="space-y-2">
              {mockDraftJDs.map((jd) => {
                const isSelected = selectedJd.id === jd.id
                return (
                  <button
                    key={jd.id}
                    type="button"
                    onClick={() => setSelectedJd(jd)}
                    className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                      isSelected
                        ? 'border-oxford bg-oxford-surface shadow-2xs'
                        : 'border-border-hairline bg-surface hover:bg-subtle/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-sm font-semibold text-ink-primary">
                          {jd.jobTitle}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-secondary">
                          <Building2 className="h-3 w-3 text-ink-muted" />
                          {jd.company}
                        </div>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          jd.status === 'Approved'
                            ? 'bg-emerald-surface text-emerald border border-emerald-border'
                            : jd.status === 'Under Review'
                            ? 'bg-amber-surface text-amber border border-amber-border'
                            : 'bg-subtle text-ink-secondary border border-border-hairline'
                        }`}
                      >
                        {jd.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border-hairline/60 pt-2 text-[11px] text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Received {jd.createdAt}
                      </span>
                      <span className="font-mono font-medium text-ink-primary">
                        {jd.eligibleCount} candidates
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Quick Context Callout */}
            <div className="rounded-xl border border-oxford-border/60 bg-oxford-surface/40 p-4">
              <h4 className="font-display text-xs font-semibold text-oxford">
                Why Calibrate with Liquidity Simulator?
              </h4>
              <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                Recruiters often over-specify mandatory criteria (e.g. strict Kubernetes or specific frameworks) which artificially chokes student liquidity. Toggling to Preferred allows adjacent qualified candidates to enter the pool.
              </p>
            </div>
          </div>

          {/* Right Column: Dynamic Simulator with Small-Cell Suppression (8 cols) */}
          <div className="lg:col-span-8">
            <CohortLiquiditySimulator
              jobTitle={selectedJd.jobTitle}
              company={selectedJd.company}
              initialCohortSize={240}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Student Eligibility Exception Queue (FR-036) */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="animate-in fade-in-50 duration-200">
          <ExceptionQueueView onOpenSource={onOpenSource} />
        </div>
      )}

      {/* Tab 4: Candidate Placement Roster & GitHub Portfolios */}
      {activeTab === 'ROSTER' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="rounded-xl border border-border-hairline bg-surface p-5 shadow-2xs space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-hairline pb-4">
              <div>
                <h3 className="font-display text-sm font-bold text-ink-primary">
                  Placement Cohort Candidate Portfolios &amp; Verified Evidence
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Inspect student resumes, verify capstones, and access live GitHub repositories directly.
                </p>
              </div>
              <span className="font-mono text-xs text-emerald font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Live Excel Sync: 240 Students
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Aarav Sharma', roll: '231CS042', branch: 'B.Tech CSE', cgpa: 8.42, readiness: 94, skills: ['Python', 'SQL', 'FastAPI', 'PyTorch', 'Docker'], github: 'https://github.com/aaravsharma-dev' },
                { name: 'Priya Nair', roll: '231CS019', branch: 'B.Tech CSE', cgpa: 8.95, readiness: 98, skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Distributed Systems'], github: 'https://github.com/priyanair' },
                { name: 'Rohan Verma', roll: '231CS088', branch: 'B.Tech IT', cgpa: 7.90, readiness: 82, skills: ['React', 'TypeScript', 'Node.js', 'Next.js'], github: 'https://github.com/rohanverma' },
                { name: 'Arijeet Basak', roll: 'JKLU-2024-AI-042', branch: 'B.Tech AI', cgpa: 8.41, readiness: 96, skills: ['PyTorch', 'OpenAI APIs', 'CrewAI', 'RAG Systems', 'n8n'], github: 'https://github.com/Arijeet223' },
              ].map((cand, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border-hairline bg-canvas p-4 transition-all hover:border-oxford-border"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-bold text-ink-primary">
                          {cand.name}
                        </h4>
                        <span className="font-mono text-xs text-ink-muted">
                          ({cand.roll})
                        </span>
                        <span className="rounded bg-surface border border-border-hairline px-2 py-0.5 font-mono text-[11px] font-semibold text-oxford">
                          CGPA {cand.cgpa.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">
                        {cand.branch} • Readiness Score:{' '}
                        <strong className="text-emerald font-mono">{cand.readiness}%</strong>{' '}
                        • Verified Skills: {cand.skills.slice(0, 3).join(', ')} (+{cand.skills.length - 3} more)
                      </p>
                    </div>

                    {/* Direct Action Buttons: Preview Resume & GitHub */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedResumeCandidate(cand)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-hairline bg-surface hover:bg-subtle text-xs font-semibold text-ink-primary transition-colors shadow-2xs cursor-pointer"
                        title={`Open Word-style verified resume for ${cand.name}`}
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span>Preview Resume</span>
                      </button>

                      <a
                        href={cand.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 transition-colors shadow-2xs cursor-pointer"
                        title={`Open ${cand.name}'s GitHub profile in new tab`}
                      >
                        <Code className="h-3.5 w-3.5 text-cyan-400" />
                        <span>GitHub</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Word-Style Interactive Resume Document Sheet Modal */}
      {selectedResumeCandidate && (
        <WordResumePreview
          isModalOpen={true}
          onCloseModal={() => setSelectedResumeCandidate(null)}
          candidateName={selectedResumeCandidate.name}
          program={selectedResumeCandidate.branch}
          cgpa={selectedResumeCandidate.cgpa}
          readinessScore={selectedResumeCandidate.readiness}
          skills={selectedResumeCandidate.skills}
          email={`${selectedResumeCandidate.name.toLowerCase().replace(/\s+/g, '.')}@university.edu.in`}
          githubUrl={selectedResumeCandidate.github}
        />
      )}
    </div>
  )
}
