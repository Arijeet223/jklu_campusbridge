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
  Edit3,
  Trash2,
  Plus,
  X,
  Building,
  Save,
  AlertCircle,
  Zap,
  Check,
} from 'lucide-react'
import { mockFacultyAdvisees } from '@/lib/mock-data'
import type { FacultyAdvisee } from '@/lib/types'
import { getCandidateGithubUrl } from '@/lib/url-utils'
import WordResumePreview from './WordResumePreview'
import JDIngestionStudio from './JDIngestionStudio'
import CohortLiquiditySimulator from './CohortLiquiditySimulator'
import ExceptionQueueView from './ExceptionQueueView'

export type FacultyTab = 'ADVISEES' | 'INGESTION' | 'SIMULATOR' | 'EXCEPTIONS' | 'DRIVES'

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

  // ── Placements & Drives Live CRUD State ──────────────────────────────
  const [drives, setDrives] = useState<any[]>([])
  const [loadingDrives, setLoadingDrives] = useState(false)
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null)
  const [driveFormTitle, setDriveFormTitle] = useState('')
  const [driveFormCompany, setDriveFormCompany] = useState('')
  const [driveFormCtc, setDriveFormCtc] = useState('22 LPA')
  const [driveFormMinCgpa, setDriveFormMinCgpa] = useState<number>(7.5)
  const [driveFormBranches, setDriveFormBranches] = useState('CSE, IT, ECE')
  const [driveFormMandatorySkills, setDriveFormMandatorySkills] = useState('SQL, Python, Docker')
  const [driveFormPreferredSkills, setDriveFormPreferredSkills] = useState('Redis, Kubernetes')
  const [driveFormAnnouncement, setDriveFormAnnouncement] = useState('')
  const [driveFormExternalLink, setDriveFormExternalLink] = useState('')
  const [isSavingDrive, setIsSavingDrive] = useState(false)
  const [driveNotice, setDriveNotice] = useState<string | null>(null)

  const fetchDrives = async () => {
    setLoadingDrives(true)
    try {
      const res = await fetch('/api/jobs', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setDrives(data)
        } else if (Array.isArray(data.jobs)) {
          setDrives(data.jobs)
        }
      }
    } catch (err) {
      console.error('Error fetching drives:', err)
    } finally {
      setLoadingDrives(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'DRIVES') {
      fetchDrives()
    }
  }, [activeTab])

  const openCreateDriveModal = () => {
    setEditingDriveId(null)
    setDriveFormTitle('')
    setDriveFormCompany('')
    setDriveFormCtc('22 LPA')
    setDriveFormMinCgpa(7.5)
    setDriveFormBranches('CSE, IT, ECE')
    setDriveFormMandatorySkills('Python, SQL, Microservices')
    setDriveFormPreferredSkills('Redis, Docker')
    setDriveFormAnnouncement('')
    setDriveFormExternalLink('')
    setIsDriveModalOpen(true)
  }

  const openEditDriveModal = (drive: any) => {
    setEditingDriveId(drive.id || drive.job_id)
    setDriveFormTitle(drive.role_title || drive.title || drive.jobTitle || '')
    setDriveFormCompany(drive.company || '')
    setDriveFormCtc(typeof drive.ctc_lpa === 'number' ? `${drive.ctc_lpa} LPA` : (drive.ctc_lpa || drive.compensationTarget || '22 LPA'))
    setDriveFormMinCgpa(Number(drive.min_cgpa || 7.5))
    setDriveFormBranches(Array.isArray(drive.allowed_branches) ? drive.allowed_branches.join(', ') : (drive.allowed_branches || 'CSE, IT'))
    setDriveFormMandatorySkills(Array.isArray(drive.mandatory_skills) ? drive.mandatory_skills.join(', ') : (drive.mandatory_skills || ''))
    setDriveFormPreferredSkills(Array.isArray(drive.preferred_skills) ? drive.preferred_skills.join(', ') : (drive.preferred_skills || ''))
    setDriveFormAnnouncement(drive.announcement_text || '')
    setDriveFormExternalLink(drive.external_link || '')
    setIsDriveModalOpen(true)
  }

  const handleSaveDrive = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingDrive(true)
    try {
      const payload = {
        role_title: driveFormTitle,
        company: driveFormCompany,
        ctc_lpa: parseFloat(driveFormCtc.replace(/[^0-9.]/g, '')) || 20.0,
        min_cgpa: Number(driveFormMinCgpa),
        allowed_branches: driveFormBranches.split(',').map((b) => b.trim()).filter(Boolean),
        mandatory_skills: driveFormMandatorySkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_skills: driveFormPreferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        announcement_text: driveFormAnnouncement.trim(),
        external_link: driveFormExternalLink.trim(),
      }

      if (editingDriveId) {
        const res = await fetch(`/api/jobs/${encodeURIComponent(editingDriveId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          setDriveNotice(`✓ Successfully updated placement drive for ${driveFormCompany}!`)
          setIsDriveModalOpen(false)
          fetchDrives()
        } else {
          setDriveNotice('Error saving drive changes. Please retry.')
        }
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          setDriveNotice(`✓ Created new placement drive for ${driveFormCompany}!`)
          setIsDriveModalOpen(false)
          fetchDrives()
        } else {
          setDriveNotice('Error creating drive. Please retry.')
        }
      }
    } catch (err: any) {
      setDriveNotice(`Error: ${err.message}`)
    } finally {
      setIsSavingDrive(false)
      setTimeout(() => setDriveNotice(null), 4000)
    }
  }

  const handleDeleteDrive = async (driveId: string, company: string) => {
    if (!window.confirm(`Are you sure you want to delete the placement drive for ${company}?`)) {
      return
    }
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(driveId)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setDriveNotice(`✓ Deleted placement drive for ${company}`)
        setDrives((prev) => prev.filter((d) => (d.id || d.job_id) !== driveId))
      } else {
        setDriveNotice('Could not delete drive. Please retry.')
      }
    } catch (err: any) {
      setDriveNotice(`Error deleting drive: ${err.message}`)
    }
    setTimeout(() => setDriveNotice(null), 4000)
  }

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
            if (sk.id === skillId) {
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

          <button
            type="button"
            onClick={() => setActiveTab('DRIVES')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'DRIVES'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-ink-secondary hover:bg-[#F1EFEA] hover:text-ink-primary'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Placement Drives &amp; Links</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 text-[10px] font-mono">
              Full CRUD
            </span>
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

      {/* Tab 5: Placement Drives & Resources (Full CRUD) */}
      {activeTab === 'DRIVES' && (
        <div className="space-y-6">
          {driveNotice && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-800 shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{driveNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setDriveNotice(null)}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border-2 border-[#E6E3DC] bg-white shadow-2xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-3xs font-mono font-bold border border-emerald-200 uppercase mb-1">
                Synchronous Database Ledger
              </div>
              <h3 className="font-display font-extrabold text-base text-[#1B1C1B]">
                Active Campus Placement Drives ({drives.length})
              </h3>
              <p className="text-xs text-[#817379]">
                Full Faculty CRUD operations: Publish updates, attach registration links, announcements, and calibrate gates. Changes reflect synchronously across all student workspaces.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={fetchDrives}
                disabled={loadingDrives}
                className="px-3 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-bold text-[#1B1C1B] hover:bg-white transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={openCreateDriveModal}
                className="px-4 py-2 rounded-xl bg-[#6D3B56] hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create Placement Drive</span>
              </button>
            </div>
          </div>

          {/* Drives Structured List */}
          {loadingDrives ? (
            <div className="py-12 text-center text-xs font-bold text-[#817379]">
              Loading active placement drives from database...
            </div>
          ) : drives.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-[#E6E3DC] text-center text-xs text-[#817379] space-y-2">
              <Building className="h-8 w-8 text-[#DE95BE] mx-auto" />
              <p className="font-bold">No active placement drives found.</p>
              <button
                type="button"
                onClick={openCreateDriveModal}
                className="text-xs text-[#6D3B56] font-bold hover:underline"
              >
                Create the first campus drive →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drives.map((d) => {
                const jid = d.id || d.job_id
                const title = d.role_title || d.title || d.jobTitle || 'Software Engineer'
                const company = d.company || 'Enterprise Partner'
                const ctc = typeof d.ctc_lpa === 'number' ? `₹${d.ctc_lpa} LPA` : (d.ctc_lpa || d.compensationTarget || '₹18–24 LPA')
                const minCgpa = d.min_cgpa || 7.0
                const branches = Array.isArray(d.allowed_branches) ? d.allowed_branches : ['CSE', 'IT']
                const mandatory = Array.isArray(d.mandatory_skills) ? d.mandatory_skills : []
                const preferred = Array.isArray(d.preferred_skills) ? d.preferred_skills : []
                const announcement = d.announcement_text || ''
                const extLink = d.external_link || ''

                return (
                  <div
                    key={jid}
                    className="p-5 rounded-2xl border-2 border-[#E6E3DC] bg-white hover:border-[#DE95BE] transition-all shadow-2xs space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-extrabold text-base text-[#1B1C1B]">
                            {company}
                          </span>
                          <span className="text-xs text-[#817379]">•</span>
                          <span className="font-display font-bold text-sm text-[#6D3B56]">
                            {title}
                          </span>
                          <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                            {ctc}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-3xs font-mono text-[#817379] mt-1 flex-wrap">
                          <span>Min CGPA: <strong>{minCgpa}</strong></span>
                          <span>•</span>
                          <span>Branches: <strong>{branches.join(', ')}</strong></span>
                          <span>•</span>
                          <span>ID: <code>{jid}</code></span>
                        </div>
                      </div>

                      {/* Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditDriveModal(d)}
                          className="px-3 py-1.5 rounded-xl border border-[#DE95BE] bg-[#FAF8F5] hover:bg-white text-xs font-bold text-[#6D3B56] flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDrive(jid, company)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Announcement Callout if present */}
                    {announcement && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-700 text-sm mt-0.5">campaign</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800 block">Faculty Announcement:</span>
                          <p className="mt-0.5 leading-snug">{announcement}</p>
                        </div>
                      </div>
                    )}

                    {/* Skills & Shared Links Footer */}
                    <div className="pt-2 border-t border-[#F1EFEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-3xs font-mono font-bold text-[#817379] uppercase">Mandatory:</span>
                        {mandatory.slice(0, 4).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="font-mono text-3xs px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E3DC] text-[#4F4449]"
                          >
                            {s}
                          </span>
                        ))}
                        {preferred.slice(0, 2).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="font-mono text-3xs px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>

                      {extLink && (
                        <a
                          href={extLink.startsWith('http') ? extLink : `https://${extLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#6D3B56] hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Shared Resource / Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Drive Modal */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-[#E6E3DC] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#1B1C1B]">
                  {editingDriveId ? 'Edit Placement Drive' : 'Create New Campus Drive'}
                </h3>
                <p className="text-xs text-[#817379]">
                  Configures JD gates, salary, announcements, and external registration links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDrive} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={driveFormCompany}
                    onChange={(e) => setDriveFormCompany(e.target.value)}
                    placeholder="e.g. RazorpayX, Atlassian, Microsoft"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={driveFormTitle}
                    onChange={(e) => setDriveFormTitle(e.target.value)}
                    placeholder="e.g. Systems Engineer, SDE-1"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    CTC Band / LPA
                  </label>
                  <input
                    type="text"
                    value={driveFormCtc}
                    onChange={(e) => setDriveFormCtc(e.target.value)}
                    placeholder="e.g. 24 LPA"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    Min CGPA Cutoff
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={driveFormMinCgpa}
                    onChange={(e) => setDriveFormMinCgpa(Number(e.target.value))}
                    placeholder="7.5"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    Allowed Branches
                  </label>
                  <input
                    type="text"
                    value={driveFormBranches}
                    onChange={(e) => setDriveFormBranches(e.target.value)}
                    placeholder="CSE, IT, ECE"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    Mandatory Skills (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    value={driveFormMandatorySkills}
                    onChange={(e) => setDriveFormMandatorySkills(e.target.value)}
                    placeholder="SQL, Python, Docker"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                    Preferred Skills (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    value={driveFormPreferredSkills}
                    onChange={(e) => setDriveFormPreferredSkills(e.target.value)}
                    placeholder="Redis, Kubernetes, gRPC"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Faculty Announcement Note */}
              <div className="space-y-1">
                <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                  Faculty Announcement / Notice (Optional)
                </label>
                <textarea
                  rows={2}
                  value={driveFormAnnouncement}
                  onChange={(e) => setDriveFormAnnouncement(e.target.value)}
                  placeholder="e.g., Online assessment scheduled for Saturday 10:00 AM. Bring verified 1.0x solid tokens."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* External Registration / Resource Link */}
              <div className="space-y-1">
                <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                  External Drive Link (Registration Form / Test Link / Resources)
                </label>
                <input
                  type="text"
                  value={driveFormExternalLink}
                  onChange={(e) => setDriveFormExternalLink(e.target.value)}
                  placeholder="https://forms.gle/... or https://atlassian.com/careers"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1EFEA]">
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6E3DC] text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDrive}
                  className="px-5 py-2 rounded-xl bg-[#6D3B56] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingDrive ? 'Saving...' : editingDriveId ? 'Save Changes' : 'Create Drive'}</span>
                </button>
              </div>
            </form>
          </div>
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

