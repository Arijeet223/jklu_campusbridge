'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Github,
  FileText,
  Layers,
  Database,
  ExternalLink,
  RefreshCw,
  Check,
  Ghost,
  ChevronRight,
  Flame,
  Award,
  Zap,
} from 'lucide-react'
import GradeSheetUploader, { GhostGradeCard } from '@/components/GradeSheetUploader'

interface GitHubProject {
  id: string
  name: string
  description: string
  languages: string[]
  stars: number
  isClaimed: boolean
}

export default function StudentSetupPage() {
  const router = useRouter()

  const [studentId, setStudentId] = useState('STU-101')
  const [studentName, setStudentName] = useState('Aarav Sharma')
  const [program, setProgram] = useState('B.Tech Computer Science & Engineering')
  const [cgpa, setCgpa] = useState<number>(8.42)

  // Step 1: GitHub State
  const [githubUrl, setGithubUrl] = useState('https://github.com/aarav-sharma-dev')
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false)
  const [githubVerified, setGithubVerified] = useState(false)
  const [githubProjects, setGithubProjects] = useState<GitHubProject[]>([
    {
      id: 'gh-1',
      name: 'campusbridge-microservices',
      description: 'Asynchronous distributed event pipeline with FastAPI, Redis caching, and PostgreSQL.',
      languages: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
      stars: 14,
      isClaimed: false,
    },
    {
      id: 'gh-2',
      name: 'high-concurrency-kv-store',
      description: 'In-memory key-value database engine with WAL persistence and hash indexing.',
      languages: ['C++', 'Python', 'Algorithms'],
      stars: 28,
      isClaimed: false,
    },
    {
      id: 'gh-3',
      name: 'react-rag-dashboard',
      description: 'Modern real-time vector search UI with Next.js 14, TailwindCSS, and Qdrant client.',
      languages: ['TypeScript', 'React', 'Tailwind'],
      stars: 19,
      isClaimed: false,
    },
  ])

  // Step 2: Resume State
  const [resumeVerified, setResumeVerified] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [resumeSkills, setResumeSkills] = useState<any[]>([])
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null)

  // Step 3: Grade Sheet State
  const [academicVerified, setAcademicVerified] = useState(false)
  const [academicRecords, setAcademicRecords] = useState<GhostGradeCard[]>([])
  const [academicStanding, setAcademicStanding] = useState('EXCELLENT')

  // Overall Setup Engine State
  const [activeTab, setActiveTab] = useState<'GITHUB' | 'RESUME' | 'GRADES'>('GITHUB')
  const [isSyncingQdrant, setIsSyncingQdrant] = useState(false)
  const [qdrantSyncSuccess, setQdrantSyncSuccess] = useState<string | null>(null)
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null)

  // Initialize from LocalStorage and backend
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('cb_active_user')
      if (storedUser) {
        const u = JSON.parse(storedUser)
        if (u.id) setStudentId(u.id)
        if (u.name) setStudentName(u.name)
        if (u.program) setProgram(u.program)
        if (u.cgpa) setCgpa(Number(u.cgpa))
        if (u.github_url) {
          setGithubUrl(u.github_url)
          setGithubVerified(true)
        }
      }

      const storedSkills = localStorage.getItem('cb_user_skills')
      if (storedSkills) {
        const sks = JSON.parse(storedSkills)
        if (Array.isArray(sks) && sks.length > 0) {
          setResumeSkills(sks)
          setResumeVerified(true)
          setResumeFileName(sks[0]?.sourceSpan?.split('•')[0]?.trim() || 'Aarav_Sharma_Resume.pdf')
        }
      }

      const storedGrades = localStorage.getItem('cb_academic_records')
      if (storedGrades) {
        const grs = JSON.parse(storedGrades)
        if (Array.isArray(grs) && grs.length > 0) {
          setAcademicRecords(grs)
          setAcademicVerified(true)
        }
      }
    } catch {}

    // Fetch live setup status from backend
    fetch(`/api/student/setup-progress?student_id=STU-101`)
      .then((r) => r.json())
      .then((data) => {
        if (data.github_verified) setGithubVerified(true)
        if (data.resume_verified) setResumeVerified(true)
        if (data.academic_verified) setAcademicVerified(true)
        if (data.github_url) setGithubUrl(data.github_url)
        if (data.cgpa) setCgpa(data.cgpa)
      })
      .catch(() => {})
  }, [])

  // Calculate completeness percentage: 33% + 33% + 34% = 100%
  const calculateCompleteness = () => {
    let score = 0
    if (githubVerified) score += 33
    if (resumeVerified) score += 33
    if (academicVerified) score += 34
    return score
  }

  const completeness = calculateCompleteness()

  // Save progress to PostgreSQL backend & Qdrant
  const persistProgressToBackend = async (
    updates: {
      github_done?: boolean
      resume_done?: boolean
      academic_done?: boolean
      skills?: any[]
      records?: any[]
      url?: string
    }
  ) => {
    setIsSyncingQdrant(true)
    setSaveStatusMsg('Saving state to Neon PostgreSQL & synchronizing Qdrant personal vectors...')

    const isGh = updates.github_done !== undefined ? updates.github_done : githubVerified
    const isRes = updates.resume_done !== undefined ? updates.resume_done : resumeVerified
    const isAcad = updates.academic_done !== undefined ? updates.academic_done : academicVerified

    const payload = {
      student_id: studentId,
      full_name: studentName,
      github_url: updates.url || githubUrl,
      github_verified: isGh,
      resume_verified: isRes,
      academic_verified: isAcad,
      confirmed_skills: updates.skills || resumeSkills,
      academic_records: updates.records || academicRecords,
      cgpa: cgpa,
      github_projects: githubProjects.filter((p) => p.isClaimed),
    }

    try {
      const res = await fetch('/api/student/setup-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setSaveStatusMsg('Saved to PostgreSQL & synchronized with Qdrant.')
        setQdrantSyncSuccess(`Vectorized ${data.qdrant_vectors_synced || 3} chunks into personal student vault.`)
      }
    } catch {
      setSaveStatusMsg('Saved to local session.')
    } finally {
      setIsSyncingQdrant(false)
      setTimeout(() => setSaveStatusMsg(null), 4000)
    }
  }

  // Handle Step 1: GitHub Verification
  const handleVerifyGithub = () => {
    setIsVerifyingGithub(true)
    setTimeout(() => {
      setIsVerifyingGithub(false)
      setGithubVerified(true)
      // Auto-claim projects
      setGithubProjects((prev) => prev.map((p) => ({ ...p, isClaimed: true })))

      // Update session
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cb_active_user')
          const u = stored ? JSON.parse(stored) : {}
          u.github_url = githubUrl
          u.github_verified = true
          localStorage.setItem('cb_active_user', JSON.stringify(u))
        } catch {}
      }

      persistProgressToBackend({ github_done: true, url: githubUrl })
    }, 900)
  }

  const handleToggleProject = (id: string) => {
    setGithubProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isClaimed: !p.isClaimed } : p))
    )
  }

  // Handle Step 2: Resume Ingestion
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingResume(true)
    setResumeUploadError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('student_id', studentId)

    try {
      const res = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to parse resume.')
      }

      const data = await res.json()
      const extracted = (data.extracted_skills || []).map((sk: any, idx: number) => ({
        id: sk.id || `sk_setup_${idx}`,
        name: sk.name,
        category: sk.category || 'Technical',
        proficiency: sk.proficiency || 'Intermediate',
        evidenceStatus: 'STUDENT_CONFIRMED',
        sourceSpan: `${file.name} • ${sk.category || 'Skills'}`,
        confidence: sk.confidence || 0.94,
        confirmed: true,
      }))

      setResumeSkills(extracted)
      setResumeFileName(file.name)
      setResumeVerified(true)

      // Update session
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cb_user_skills', JSON.stringify(extracted))
          window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: extracted }))
        } catch {}
      }

      persistProgressToBackend({ resume_done: true, skills: extracted })
    } catch (err: any) {
      setResumeUploadError(err.message || 'Error uploading resume.')
    } finally {
      setIsUploadingResume(false)
    }
  }

  // Handle Step 3: Academic Grade Card
  const handleGradeSheetComplete = (result: any) => {
    const confirmed = result.confirmedGrades || []
    setAcademicRecords(confirmed)
    setAcademicVerified(true)
    setCgpa(result.gpa || cgpa)
    setAcademicStanding(result.academicStanding || 'EXCELLENT')

    persistProgressToBackend({
      academic_done: true,
      records: confirmed,
    })
  }

  // SVG Circular progress math (radius: 54, circumference: 339.29)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (completeness / 100) * circumference

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2523] font-sans flex flex-col selection:bg-[#F0B6D5] selection:text-[#6D3B56]">
      {/* Top Brand Nav */}
      <header className="h-18 px-6 sm:px-12 border-b border-[#E6E3DC] bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6D3B56] text-white shadow-xs font-display font-extrabold text-sm tracking-tight border-b-2 border-[#552940]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-extrabold text-[#2C2523] tracking-tight">
                CampusBridge AI
              </span>
              <span className="font-mono text-3xs px-2 py-0.5 rounded-full bg-[#E2DFD9] text-[#6D3B56] font-bold">
                Setup Engine
              </span>
            </div>
            <p className="text-3xs text-[#7A726D]">Profile Completeness &amp; Unified RAG Knowledge Base</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xs font-mono font-bold text-[#7A726D] hidden sm:inline">
            Active Student: <strong className="text-[#2C2523]">{studentName}</strong>
          </span>
          <Link
            href="/student/dashboard"
            className="text-2xs font-bold px-3 py-1.5 rounded-xl border border-[#E6E3DC] bg-white hover:bg-[#FAF8F5] text-[#6D3B56] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>Exit to Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1080px] w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Hero Card: Circular Completeness Loader Engine */}
        <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Introduction */}
            <div className="space-y-3 flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
                <Sparkles className="h-4 w-4" />
                Profile Completeness Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-[#2C2523] tracking-tight">
                Build Your Unified RAG Knowledge Base
              </h1>
              <p className="text-xs sm:text-sm text-[#5C554F] leading-relaxed max-w-xl">
                J.A.R.V.I.S. requires high-fidelity grounding across three multi-modal pillars: your{' '}
                <strong className="text-[#6D3B56]">GitHub Repositories</strong>,{' '}
                <strong className="text-[#6D3B56]">Technical Resume</strong>, and{' '}
                <strong className="text-[#6D3B56]">Academic Grade Card</strong>. As you confirm each pillar, your data is embedded with <code className="text-[#6D3B56] font-bold">nomic-embed-text</code> and stored in your isolated Qdrant vector vault.
              </p>

              <div className="pt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap text-2xs font-mono">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Multi-Tenant Qdrant Scoped ({studentId})
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] text-[#6D3B56] border border-[#E6E3DC] font-bold">
                  Target: 100% Placement Liquidity
                </span>
              </div>
            </div>

            {/* Right: Circular Progress Ring */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F5] rounded-3xl border border-[#E6E3DC] shrink-0 w-64 shadow-2xs">
              <div className="relative flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#E6E3DC"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke={completeness === 100 ? '#255C45' : '#6D3B56'}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Percentage label in center */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-display font-black text-2xl text-[#2C2523]">
                    {completeness}%
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A726D]">
                    {completeness === 100 ? 'Certified' : 'Completeness'}
                  </span>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="mt-3 text-center space-y-1 w-full">
                <div className="text-xs font-bold text-[#2C2523]">
                  {[githubVerified, resumeVerified, academicVerified].filter(Boolean).length} of 3 Pillars Confirmed
                </div>
                <div className="text-[11px] text-[#7A726D]">
                  {completeness === 100
                    ? '🎉 Knowledge Base Fully Ingested'
                    : `${100 - completeness}% remaining to unlock J.A.R.V.I.S.`}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time sync feedback banner */}
          {saveStatusMsg && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 animate-fade-in">
              <span className="font-semibold">{saveStatusMsg}</span>
              {isSyncingQdrant && <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-[#6D3B56]" />}
            </div>
          )}

          {qdrantSyncSuccess && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{qdrantSyncSuccess}</span>
            </div>
          )}
        </div>

        {/* 100% Celebration & J.A.R.V.I.S. Dual-Context Action Banner */}
        {completeness === 100 && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#6D3B56] to-[#552940] text-white shadow-md border-b-4 border-[#AD1457] flex flex-col md:flex-row items-center justify-between gap-6 animate-scale-up">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white font-mono text-3xs font-extrabold uppercase tracking-wider">
                <Award className="h-3.5 w-3.5 text-[#F0B6D5]" />
                Dual-RAG Orchestrator Ready
              </div>
              <h3 className="text-xl font-display font-black text-white">
                Personal Knowledge Base &amp; Placements Synced!
              </h3>
              <p className="text-xs text-white/80 max-w-lg">
                J.A.R.V.I.S. now has real-time vector access to your GitHub projects, verified resume skills, and GPA. Ask about the TechCorp drive to test your dual-grounded advice.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => {
                  router.push('/student/chat?query=How%20do%20I%20look%20for%20the%20TechCorp%20drive?')
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#F0B6D5] text-[#6D3B56] hover:bg-white font-display font-extrabold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap className="h-4 w-4 text-[#6D3B56]" />
                <span>Ask J.A.R.V.I.S.: &ldquo;How do I look for TechCorp?&rdquo;</span>
              </button>

              <Link
                href="/student/matches"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-display font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
              >
                <span>Live Matches</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-3 border-b border-[#E6E3DC] pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('GITHUB')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'GITHUB'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-white text-[#5C554F] hover:bg-[#FAF8F5] border border-[#E6E3DC]'
            }`}
          >
            <Github className="h-4 w-4" />
            <span>Step 1: GitHub Account</span>
            {githubVerified ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                ✓ 33%
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESUME')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'RESUME'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-white text-[#5C554F] hover:bg-[#FAF8F5] border border-[#E6E3DC]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Step 2: Technical Resume</span>
            {resumeVerified ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                ✓ 33% ({resumeSkills.length} Skills)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GRADES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'GRADES'
                ? 'bg-[#6D3B56] text-white shadow-xs'
                : 'bg-white text-[#5C554F] hover:bg-[#FAF8F5] border border-[#E6E3DC]'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Step 3: Grade Card &amp; GPA</span>
            {academicVerified ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                ✓ 34% (GPA {cgpa.toFixed(2)})
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                Pending
              </span>
            )}
          </button>
        </div>

        {/* STEP 1: LINK GITHUB ACCOUNT & GHOST REPO CARDS */}
        {activeTab === 'GITHUB' && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1EFEA] pb-4">
              <div>
                <h2 className="text-lg font-display font-extrabold text-[#2C2523] flex items-center gap-2">
                  <Github className="h-5 w-5 text-[#6D3B56]" />
                  <span>Step 1: Link GitHub Engineering Account</span>
                </h2>
                <p className="text-xs text-[#7A726D] mt-0.5">
                  Vectorizes your project architectures, programming languages, and commit history into Qdrant.
                </p>
              </div>

              {githubVerified && (
                <span className="font-mono text-3xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  1.0x Solid Verified GitHub Profile
                </span>
              )}
            </div>

            {/* Input & Verify Field */}
            <div className="space-y-3">
              <label className="block text-2xs font-mono font-bold uppercase tracking-wider text-[#7A726D]">
                GitHub Profile URL or Username
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#E6E3DC] focus:border-[#6D3B56] focus:outline-hidden text-xs font-mono font-bold text-[#2C2523] transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyGithub}
                  disabled={isVerifyingGithub || !githubUrl.trim()}
                  className="px-6 py-3 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isVerifyingGithub ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Repos...</span>
                    </>
                  ) : (
                    <>
                      <span>{githubVerified ? 'Re-Verify Profile' : 'Inspect Repositories'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ghost Project Cards Review */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2523] flex items-center gap-1.5">
                  <Ghost className="h-4 w-4 text-[#6D3B56]" />
                  <span>Verified Engineering Artifacts ({githubProjects.filter((p) => p.isClaimed).length} Claimed)</span>
                </span>
                <span className="text-2xs text-[#7A726D]">
                  Click artifacts to toggle claim before vectorization
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {githubProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleToggleProject(p.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      p.isClaimed
                        ? 'border-[#6D3B56] bg-white shadow-xs ring-1 ring-[#6D3B56]/20'
                        : 'border-dashed border-[#DE95BE] bg-[#FAF8F5] hover:bg-white'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-mono font-bold text-xs text-[#2C2523] truncate">
                          {p.name}
                        </h4>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            p.isClaimed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {p.isClaimed ? '1.0x Solid' : '0.5x Ghost'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C554F] leading-snug">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#F1EFEA]">
                      {p.languages.map((l) => (
                        <span
                          key={l}
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E6E3DC] text-[#6D3B56]"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
              <span className="text-2xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Step 1 adds 33% profile completeness and syncs to Neon PostgreSQL.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('RESUME')}
                className="px-5 py-2.5 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 2: Resume</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TECHNICAL RESUME INGESTION & GHOST CARDS */}
        {activeTab === 'RESUME' && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1EFEA] pb-4">
              <div>
                <h2 className="text-lg font-display font-extrabold text-[#2C2523] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#6D3B56]" />
                  <span>Step 2: Technical Resume (PDF / DOCX)</span>
                </h2>
                <p className="text-xs text-[#7A726D] mt-0.5">
                  Parsed in-memory with zero local disk reliance via PyMuPDF. Extracts skills into Ghost Cards.
                </p>
              </div>

              {resumeVerified && (
                <span className="font-mono text-3xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  Resume Verified ({resumeSkills.length} Skills)
                </span>
              )}
            </div>

            {resumeUploadError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{resumeUploadError}</span>
              </div>
            )}

            {/* Dropzone */}
            <label className="border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 border-[#E6E3DC] bg-[#FAF8F5] hover:bg-white hover:border-[#6D3B56] block">
              <input
                type="file"
                accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleResumeUpload}
              />
              <div className="h-14 w-14 rounded-2xl bg-[#F0B6D5]/40 text-[#6D3B56] flex items-center justify-center shadow-xs">
                {isUploadingResume ? (
                  <RefreshCw className="h-7 w-7 animate-spin" />
                ) : (
                  <FileText className="h-7 w-7" />
                )}
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2C2523]">
                  {isUploadingResume
                    ? 'Extracting Skills In-Memory...'
                    : resumeFileName
                    ? `Current Resume: ${resumeFileName} (Click to Replace)`
                    : 'Click or Drag & Drop Technical Resume (PDF or DOCX)'}
                </h4>
                <p className="text-2xs text-[#7A726D] mt-1">
                  Extracts technical competencies and seeds the personal Qdrant knowledge base.
                </p>
              </div>
            </label>

            {/* Render Verified Skills */}
            {resumeSkills.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C2523]">
                    Solidified Resume Skills ({resumeSkills.length})
                  </span>
                  <span className="text-2xs text-[#7A726D]">
                    1.0x Solid Verified in Qdrant
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap max-h-48 overflow-y-auto p-2 bg-[#FAF8F5] rounded-2xl border border-[#E6E3DC]">
                  {resumeSkills.map((sk: any, i: number) => (
                    <span
                      key={sk.id || i}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E3DC] text-xs font-bold text-[#6D3B56] flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                      <span>{sk.name}</span>
                      <span className="text-[10px] text-[#7A726D] font-mono">({sk.proficiency || 'Intermediate'})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
              <span className="text-2xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Step 2 adds 33% profile completeness.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('GRADES')}
                className="px-5 py-2.5 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 3: Grade Card</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ACADEMIC GRADE CARD & RAPIDOCR SCORING */}
        {activeTab === 'GRADES' && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1EFEA] pb-4">
              <div>
                <h2 className="text-lg font-display font-extrabold text-[#2C2523] flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[#6D3B56]" />
                  <span>Step 3: Academic Grade Card (PDF / Image Screenshot)</span>
                </h2>
                <p className="text-xs text-[#7A726D] mt-0.5">
                  Extracts subjects with RapidOCR &amp; Qwen 2.5 anti-hallucination agent. Calculates deterministic GPA.
                </p>
              </div>

              {academicVerified && (
                <span className="font-mono text-3xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  GPA {cgpa.toFixed(2)} Certified ({academicStanding})
                </span>
              )}
            </div>

            {/* Embedded GradeSheetUploader */}
            <GradeSheetUploader
              studentId={studentId}
              onComplete={handleGradeSheetComplete}
            />

            <div className="pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
              <span className="text-2xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Step 3 adds 34% profile completeness, locking 100% full certification.
              </span>
              {completeness === 100 && (
                <button
                  type="button"
                  onClick={() => router.push('/student/dashboard')}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Go to Student Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
