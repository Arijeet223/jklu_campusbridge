'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Award,
  CheckCircle2,
  FileText,
  Star,
  Users,
  Search,
  BookOpen,
  ExternalLink,
  Code,
  Briefcase,
  Sliders,
  ShieldAlert,
  Inbox,
  Sparkles,
} from 'lucide-react'
import { mockFacultyAdvisees } from '@/lib/mock-data'
import type { FacultyAdvisee } from '@/lib/types'
import { getCandidateGithubUrl } from '@/lib/url-utils'
import WordResumePreview from './WordResumePreview'
import JDIngestionStudio from './JDIngestionStudio'
import CohortLiquiditySimulator from './CohortLiquiditySimulator'
import ExceptionQueueView from './ExceptionQueueView'

export type FacultyTab = 'ADVISEES' | 'INGESTION' | 'SIMULATOR' | 'EXCEPTIONS'

interface FacultyMentorViewProps {
  onOpenSourceDoc?: (docId: string) => void
  onSkillEndorsed?: (skillId: string) => void
}

export default function FacultyMentorView({
  onOpenSourceDoc,
  onSkillEndorsed,
}: FacultyMentorViewProps) {
  const [activeTab, setActiveTab] = useState<FacultyTab>('ADVISEES')
  const [advisees, setAdvisees] = useState<FacultyAdvisee[]>(mockFacultyAdvisees)
  const [searchQuery, setSearchQuery] = useState('')
  const [endorseNotice, setEndorseNotice] = useState<string | null>(null)
  const [selectedResumeStudent, setSelectedResumeStudent] = useState<FacultyAdvisee | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_faculty_endorsements')
      if (stored) {
        const endorsedIds = JSON.parse(stored) as string[]
        if (Array.isArray(endorsedIds) && endorsedIds.length > 0) {
          setAdvisees((prev) =>
            prev.map((a) =>
              endorsedIds.includes(a.id)
                ? { ...a, institutionVerified: true, verifiedCount: Math.min(a.skillsCount, a.verifiedCount + 1) }
                : a
            )
          )
        }
      }
    } catch {}
  }, [])

  const handleEndorse = (adviseeId: string, skillId: string, studentName: string) => {
    setAdvisees((prev) =>
      prev.map((a) => {
        if (a.id === adviseeId) {
          return { ...a, institutionVerified: true, verifiedCount: a.verifiedCount + 1 }
        }
        return a
      }),
    )

    try {
      const stored = JSON.parse(localStorage.getItem('cb_faculty_endorsements') || '[]')
      if (!stored.includes(adviseeId)) {
        stored.push(adviseeId)
        localStorage.setItem('cb_faculty_endorsements', JSON.stringify(stored))
      }
    } catch {}

    onSkillEndorsed?.(skillId)

    // Upgrade student skills in local ledger if matching
    try {
      const storedSkillsRaw = localStorage.getItem('cb_user_skills')
      if (storedSkillsRaw) {
        const storedSkills = JSON.parse(storedSkillsRaw)
        if (Array.isArray(storedSkills)) {
          const updatedSkills = storedSkills.map((sk: any) => {
            if (sk.id === skillId || sk.evidenceStatus === 'DOUBT_GHOST') {
              return {
                ...sk,
                evidenceStatus: 'INSTITUTION_VERIFIED',
                confidence: 1.0,
                multiplier: 1.0,
              }
            }
            return sk
          })
          localStorage.setItem('cb_user_skills', JSON.stringify(updatedSkills))
          window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: updatedSkills }))
        }
      }
    } catch {}

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
      {/* Top Banner: Faculty Placement Authority Scope */}
      <div className="rounded-2xl border-2 border-[#E6E3DC] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#6D3B56]/10 px-3 py-1 text-xs font-bold text-[#6D3B56] border border-[#DE95BE]/30">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Faculty Departmental Advisory &amp; Placement Operations</span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-ink-primary">
              Advisee Readiness, JD Ingestion &amp; Placement Calibration
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-secondary">
              Direct departmental placement logistics: Ingest recruiter JDs with Qwen 2.5, calibrate mandatory gates vs preferred factors, simulate cohort liquidity, and endorse student capstone deliverables.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Advisees</div>
              <div className="font-mono text-base font-extrabold text-ink-primary">{advisees.length}</div>
            </div>
            <div className="rounded-xl border border-[#B6DEC9] bg-[#B6DEC9]/20 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#255C45]">Endorsed</div>
              <div className="font-mono text-base font-extrabold text-[#255C45]">
                {advisees.filter((a) => a.institutionVerified).length}
              </div>
            </div>
            <div className="rounded-xl border border-[#DE95BE] bg-[#DE95BE]/20 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6D3B56]">Active Drives</div>
              <div className="font-mono text-base font-extrabold text-[#6D3B56]">3</div>
            </div>
          </div>
        </div>

        {/* 4-Tab Workspace Navigation Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-dashed border-[#E6E3DC] pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('ADVISEES')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ADVISEES'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-ink-secondary hover:bg-[#F1EFEA] hover:text-ink-primary'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Advisee Roster &amp; Capstones</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {advisees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INGESTION')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'INGESTION'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-ink-secondary hover:bg-[#F1EFEA] hover:text-ink-primary'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>JD Ingestion Studio &amp; Preferences</span>
            <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 text-[10px] font-mono">
              Qwen 2.5
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SIMULATOR'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-ink-secondary hover:bg-[#F1EFEA] hover:text-ink-primary'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Cohort Liquidity Simulator</span>
            <span className="rounded-full bg-[#B6DEC9]/40 text-[#255C45] px-1.5 py-0.2 text-[10px] font-mono">
              k ≥ 5
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'EXCEPTIONS'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-ink-secondary hover:bg-[#F1EFEA] hover:text-ink-primary'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Exception Queue &amp; Appeals</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Advisee Roster & Capstones */}
      {activeTab === 'ADVISEES' && (
        <div className="space-y-6">
          {/* Endorsement Notice Toast */}
          {endorseNotice && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-800 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>{endorseNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setEndorseNotice(null)}
                className="text-[11px] underline hover:text-ink-primary cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Advisee Table / List */}
          <div className="rounded-2xl border-2 border-[#E6E3DC] bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#F1EFEA] pb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search by student name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] pl-9 pr-3 py-2 text-xs text-ink-primary focus:border-[#6D3B56] focus:outline-hidden"
                />
              </div>
              <span className="text-xs text-ink-muted font-mono font-medium">
                Batch of 2027 • Computer Science &amp; Engineering
              </span>
            </div>

            <div className="space-y-3">
              {filtered.map((advisee) => (
                <div
                  key={advisee.id}
                  className="rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] p-4 transition-all hover:border-[#DE95BE] hover:bg-white"
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
                        <span className="rounded-full bg-[#6D3B56]/10 border border-[#DE95BE]/30 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#6D3B56]">
                          CGPA {advisee.cgpa.toFixed(1)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-ink-secondary">
                        {advisee.department} • Readiness Score:{' '}
                        <strong className="text-[#255C45] font-mono">{advisee.overallReadiness}%</strong>{' '}
                        ({advisee.verifiedCount} of {advisee.skillsCount} skills verified)
                      </p>
                    </div>

                    {/* Endorsement Status & Direct Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedResumeStudent(advisee)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E3DC] bg-white hover:bg-[#F1EFEA] text-xs font-bold text-ink-primary transition-colors shadow-2xs cursor-pointer"
                        title={`Preview verified resume for ${advisee.name}`}
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span>Preview Resume</span>
                      </button>

                      <a
                        href={getCandidateGithubUrl(undefined, advisee.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 transition-colors shadow-2xs cursor-pointer"
                        title={`Open ${advisee.name}'s GitHub in new tab`}
                      >
                        <Code className="h-3.5 w-3.5 text-cyan-400" />
                        <span>GitHub</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>

                      {advisee.institutionVerified ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                          Institution-Verified
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEndorse(advisee.id, advisee.featuredSkillId, advisee.name)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#6D3B56] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#582e44] transition-colors cursor-pointer"
                        >
                          <Star className="h-3.5 w-3.5" />
                          ★ Endorse
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Featured Project Showcase */}
                  <div className="mt-3 rounded-xl border border-[#E6E3DC] bg-white p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-[#6D3B56]" />
                        Featured Capstone Project: {advisee.featuredProject}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenSourceDoc?.('doc_resume_v3')}
                        className="font-mono text-[11px] text-[#6D3B56] hover:underline cursor-pointer"
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
      )}

      {/* Tab 2: JD Ingestion Studio & Preference Calibration */}
      {activeTab === 'INGESTION' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Faculty Authority:</strong> Ingest recruiter specifications using Qwen 2.5 and Qdrant. Toggle criteria between Mandatory Hard Gates and Preferred Soft Factors, and calibrate minimum CGPA and allowed branches before publishing.
            </span>
          </div>
          <JDIngestionStudio
            onOpenSimulator={() => setActiveTab('SIMULATOR')}
            onOpenSource={onOpenSourceDoc}
          />
        </div>
      )}

      {/* Tab 3: Cohort Liquidity Simulator */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-4">
          <CohortLiquiditySimulator />
        </div>
      )}

      {/* Tab 4: Exception Queue & Appeals */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="space-y-4">
          <ExceptionQueueView onOpenSource={onOpenSourceDoc} />
        </div>
      )}

      {/* Word-Style Interactive Resume Document Sheet Modal */}
      {selectedResumeStudent && (
        <WordResumePreview
          isModalOpen={true}
          onCloseModal={() => setSelectedResumeStudent(null)}
          candidateName={selectedResumeStudent.name}
          program={selectedResumeStudent.department}
          cgpa={selectedResumeStudent.cgpa}
          readinessScore={selectedResumeStudent.overallReadiness}
          email={`${selectedResumeStudent.name.toLowerCase().replace(/\s+/g, '.')}@university.edu.in`}
          githubUrl={getCandidateGithubUrl(undefined, selectedResumeStudent.name)}
        />
      )}
    </div>
  )
}

