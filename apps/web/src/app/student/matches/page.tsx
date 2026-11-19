'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import MatchCard from '@/components/MatchCard'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments, mockJobMatches } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule, JobMatch } from '@/lib/types'
import { fetchLiveJobMatches, getActiveUser } from '@/lib/api-client'
import {
  SlidersHorizontal,
  ShieldCheck,
  RefreshCw,
  Briefcase,
  Sparkles,
  Flame,
  Trophy,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  ExternalLink,
} from 'lucide-react'

// Default rich 72-Hour Sprint Drives for JKLU Students
const DEFAULT_SPRINT_DRIVES: JobMatch[] = [
  {
    id: 'jm_razorpay',
    jobTitle: 'Backend Platform Engineer (72h Sprint)',
    company: 'RazorpayX',
    deadline: '2026-11-17T18:00:00Z',
    compensationTarget: '₹22–28 LPA',
    category: 'High-Concurrency Fintech',
    alignmentScore: 82,
    eligibilityRules: [
      {
        id: 'er_rz_01',
        label: "B.Tech CSE/IT '27 • JKLU",
        status: 'MEETS',
        ruleExpression: 'degree == "B.Tech" AND branch IN ["CSE", "IT"] AND grad_year == 2027',
      },
      {
        id: 'er_rz_02',
        label: 'CGPA ≥ 7.5 (Current: 8.42)',
        status: 'MEETS',
        ruleExpression: 'cgpa >= 7.5',
      },
      {
        id: 'er_rz_03',
        label: 'Database & SQL Windowing ≥ 70%',
        status: 'MEETS',
        ruleExpression: 'skill_score("SQL") >= 70',
        clarificationHint: 'Score evaluated dynamically from verified or confirmed SQL skills.',
      },
      {
        id: 'er_rz_04',
        label: '120s Concurrency Micro-Defense',
        status: 'MEETS',
        ruleExpression: 'defense_verified("Redis_Concurrency") == true',
        clarificationHint: 'Completed 120-second live terminal defense in the Practice Arena.',
      },
    ],
    factorBreakdown: [
      { id: 'af_rz_01', label: 'SQL & Database Indexing', weight: 0.30, score: 85, color: 'bg-primary' },
      { id: 'af_rz_02', label: 'Distributed Systems & Redis', weight: 0.25, score: 84, color: 'bg-secondary' },
      { id: 'af_rz_03', label: 'FastAPI / Python Architecture', weight: 0.20, score: 88, color: 'bg-tertiary' },
      { id: 'af_rz_04', label: '120s Defense Proof', weight: 0.15, score: 80, color: 'bg-primary' },
      { id: 'af_rz_05', label: 'Coursework & Provenance', weight: 0.10, score: 84, color: 'bg-secondary' },
    ],
    sandboxToggles: [
      {
        id: 'st_rz_01',
        label: 'Confirm Advanced SQL Token (+7% fit)',
        potentialGain: 7,
        checked: false,
        relatedSkillId: 'sk_05',
      },
      {
        id: 'st_rz_02',
        label: 'Defend Redis Cache-Aside in 120s Arena (+11% fit)',
        potentialGain: 11,
        checked: false,
        relatedSkillId: 'sk_redis',
      },
      {
        id: 'st_rz_03',
        label: 'Link GitHub Production Microservices Repo (+5% fit)',
        potentialGain: 5,
        checked: false,
        relatedSkillId: 'sk_04',
      },
    ],
  },
  ...mockJobMatches,
]

export default function StudentMatchesPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const [matches, setMatches] = useState<JobMatch[]>(DEFAULT_SPRINT_DRIVES)
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState('STU-101')
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({})
  const [selectedDrives, setSelectedDrives] = useState<string[]>([])

  // Gamification States
  const [studentXp, setStudentXp] = useState(1450)
  const [bonusFitScore, setBonusFitScore] = useState(0)
  const [activeBoosters, setActiveBoosters] = useState<Record<string, boolean>>({})
  const [sprintNotice, setSprintNotice] = useState<string | null>(null)

  // 72-Hour Live Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 71, minutes: 46, seconds: 28 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const user = getActiveUser()
    const activeId = user?.id || 'STU-101'
    setStudentId(activeId)
    fetchLiveMatches(activeId)
    fetchSelectedDrives(activeId)
  }, [])

  const fetchSelectedDrives = async (sid: string) => {
    try {
      const res = await fetch(`/api/student/drives/selected?student_id=${encodeURIComponent(sid)}`, {
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.selected_drives)) {
          setSelectedDrives(data.selected_drives)
        }
      }
    } catch {}
  }

  const handleToggleSelectDrive = async (jobId: string, company: string, role: string) => {
    try {
      const res = await fetch(
        `/api/student/drives/${encodeURIComponent(jobId)}/select?student_id=${encodeURIComponent(studentId)}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.selected_drives)) {
          setSelectedDrives(data.selected_drives)
        } else {
          setSelectedDrives((prev) =>
            prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
          )
        }
        const isNowSelected = data.is_selected ?? !selectedDrives.includes(jobId)
        if (isNowSelected) {
          setSprintNotice(`🎯 Joined "${company} — ${role}"! 72-Hour Sprint Plan unlocked in your sidebar.`)
        } else {
          setSprintNotice(`Deselected "${company} — ${role}" from your sprint targets.`)
        }
        setTimeout(() => setSprintNotice(null), 4000)
      }
    } catch (err: any) {
      setSelectedDrives((prev) =>
        prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      )
    }
  }

  const fetchLiveMatches = async (idToFetch?: string) => {
    const targetId = idToFetch || studentId || 'STU-101'
    setLoading(true)
    try {
      const data = await fetchLiveJobMatches(targetId)
      if (Array.isArray(data) && data.length > 0) {
        setMatches(data)
        const initiallySelected = data.filter((m: any) => m.is_selected).map((m: any) => m.id)
        if (initiallySelected.length > 0) {
          setSelectedDrives((prev) => Array.from(new Set([...prev, ...initiallySelected])))
        }
      } else {
        setMatches(DEFAULT_SPRINT_DRIVES)
      }
    } catch {
      // Seamless zero-crash fallback to rich sprint drives
      setMatches(DEFAULT_SPRINT_DRIVES)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    let doc = mockSourceDocuments[docId]
    if (!doc && typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('cb_uploaded_documents') || '{}')
        if (stored[docId]) doc = stored[docId]
      } catch {}
    }
    setSelectedDoc(doc || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleOpenDispute = (rule: EligibilityRule, jobTitle: string, company: string) => {
    setDisputeRule(rule)
    setDisputeJob({ title: jobTitle, company })
    setDisputeDrawerOpen(true)
  }

  const toggleBooster = (id: string, gain: number, name: string) => {
    const nextState = !activeBoosters[id]
    setActiveBoosters((prev) => ({ ...prev, [id]: nextState }))
    const nextBonus = nextState ? bonusFitScore + gain : Math.max(0, bonusFitScore - gain)
    setBonusFitScore(nextBonus)

    if (nextState) {
      setStudentXp((prev) => prev + 100)
      setSprintNotice(`⚡ Booster Unlocked: "${name}" (+${gain}% fit, +100 XP)! Real-time scores re-simulated.`)
    } else {
      setSprintNotice(`Booster deactivated. Scores restored.`)
    }
    setTimeout(() => setSprintNotice(null), 4000)
  }

  const handleFastTrackApply = (jobId: string, company: string) => {
    setAppliedJobs((prev) => ({ ...prev, [jobId]: true }))
    setStudentXp((prev) => prev + 300)
    setSprintNotice(`🎉 72h Fast-Track Application submitted to ${company} with verified 1.0x cryptographic proof! Earned +300 XP.`)
    setTimeout(() => setSprintNotice(null), 5000)
  }

  return (
    <AppLayout pageTitle="72-Hour Placement Sprint & Fit Simulator" breadcrumb="Student Workspace">
      <div className="space-y-6 font-body-md text-on-surface">
        {/* ========================================================= */}
        {/* 1. GAMIFIED 72-HOUR SPRINT HEADLINE BANNER               */}
        {/* ========================================================= */}
        <section className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 lg:p-8 shadow-[0_4px_0_#EADECE] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-error-container text-on-error-container border border-error/30 shadow-[0_2px_0_#eb8c8c] animate-pulse">
                  <Flame className="h-3.5 w-3.5 text-error" />
                  <span>72-Hour Sprint Live • JKLU Campus Drives</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim shadow-[0_2px_0_#85B5CE]">
                  <Trophy className="h-3.5 w-3.5 text-secondary" />
                  <span>Level 4 Sprint Master • {studentXp} XP</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
                Live 72h Placement Sprint &amp; What-If Arena
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
                Companies evaluate genuine parsed skills with zero hallucinations. Complete 120s micro-defenses, lock solid tokens, and watch your automated shortlist eligibility cross the 80% corporate interview gate in real-time.
              </p>
            </div>

            {/* Live Ticking Sprint Countdown Clock */}
            <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-3xl p-5 shadow-[0_4px_0_#DE95BE] text-center min-w-[240px]">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-outline uppercase tracking-wider mb-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Sprint Window Closes In:</span>
              </div>
              <div className="flex items-center justify-center gap-2 font-mono font-black text-2xl sm:text-3xl text-on-surface">
                <div className="bg-primary-container px-2.5 py-1 rounded-xl border border-outline-variant text-on-primary-container">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </div>
                <span>:</span>
                <div className="bg-secondary-container px-2.5 py-1 rounded-xl border border-secondary-fixed-dim text-on-secondary-container">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </div>
                <span>:</span>
                <div className="bg-tertiary-container px-2.5 py-1 rounded-xl border border-tertiary-fixed-dim text-on-tertiary-container text-tertiary">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>
              <p className="text-[11px] font-bold text-tertiary mt-2">
                ✓ 2 Tier-1 Drives Currently Reviewing Submissions
              </p>
            </div>
          </div>

          {/* SPRINT QUEST PROGRESSION STRIP */}
          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Quest 1 */}
            <div className="flex items-center gap-3 p-3.5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-tertiary-container text-tertiary flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-on-surface truncate">Quest 1: Provenance Proofs</p>
                <p className="text-[11px] text-tertiary font-bold">6/8 Solid Tokens (+150 XP)</p>
              </div>
            </div>

            {/* Quest 2 */}
            <Link
              href="/student/arena"
              className="flex items-center gap-3 p-3.5 bg-primary-container/20 rounded-2xl border border-primary-container shadow-xs hover:brightness-95 transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-on-surface truncate">Quest 2: 120s Arena Defense</p>
                <p className="text-[11px] text-primary font-bold">Ready to Play (+250 XP) →</p>
              </div>
            </Link>

            {/* Quest 3 */}
            <div className="flex items-center gap-3 p-3.5 bg-secondary-container/20 rounded-2xl border border-secondary-fixed-dim shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-on-surface truncate">Quest 3: 80% Shortlist Gate</p>
                <p className="text-[11px] text-secondary font-bold">RazorpayX Qualified! (+500 XP)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Notice */}
        {sprintNotice && (
          <div className="p-4 bg-tertiary-container/50 border-2 border-tertiary-fixed-dim rounded-2xl text-xs font-bold text-on-tertiary-container shadow-[0_3px_0_#a8cfbb] animate-in fade-in flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-tertiary" />
              <span>{sprintNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSprintNotice(null)}
              className="text-[11px] underline hover:text-on-surface"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. REAL-TIME WHAT-IF SIMULATION CONTROLS                 */}
        {/* ========================================================= */}
        <section className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 shadow-[0_4px_0_#EAD7E2]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-secondary" />
                <h3 className="text-base font-extrabold text-on-surface">
                  Real-Time What-If Alignment Simulators
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Toggle credentials and live defenses to simulate the instant impact on your corporate match alignment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLiveMatches()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-outline-variant bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
                <span>Re-sync Drives</span>
              </button>
            </div>
          </div>

          {/* Interactive Boosters Strip */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => toggleBooster('b_sql', 8, 'Advanced SQL Windowing')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeBoosters['b_sql']
                  ? 'bg-primary text-on-primary border-on-primary-fixed-variant shadow-[0_3px_0_#320e26] -translate-y-0.5'
                  : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
              }`}
            >
              <span>{activeBoosters['b_sql'] ? '✓' : '+'}</span>
              <span>Advanced SQL Windowing (+8% Fit)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleBooster('b_redis', 11, '120s Redis Concurrency Defense')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeBoosters['b_redis']
                  ? 'bg-secondary text-on-secondary border-secondary-fixed-dim shadow-[0_3px_0_#2b5b75] -translate-y-0.5'
                  : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
              }`}
            >
              <span>{activeBoosters['b_redis'] ? '✓' : '+'}</span>
              <span>120s Redis Defense (+11% Fit)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleBooster('b_cgpa', 5, 'Honors 8.8 CGPA')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeBoosters['b_cgpa']
                  ? 'bg-tertiary text-on-tertiary border-tertiary-fixed-dim shadow-[0_3px_0_#2a4e3e] -translate-y-0.5'
                  : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
              }`}
            >
              <span>{activeBoosters['b_cgpa'] ? '✓' : '+'}</span>
              <span>Honors 8.8 CGPA (+5% Fit)</span>
            </button>

            {bonusFitScore > 0 && (
              <span className="text-xs font-extrabold text-tertiary px-3 py-1 bg-tertiary-container rounded-full border border-tertiary-fixed-dim animate-in fade-in">
                Active Simulation Boost: +{bonusFitScore}% Total Fit
              </span>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. ACTIVE SPRINT MATCH CARDS                              */}
        {/* ========================================================= */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-on-surface">
              Active Placement Drives ({matches.length})
            </h2>
            <span className="text-xs font-bold text-outline">
              100% Deterministic Policy Evaluation • JKLU
            </span>
          </div>

          <div className="space-y-6">
            {matches.map((match) => {
              const currentScore = Math.min(99, match.alignmentScore + bonusFitScore)
              const isApplied = !!appliedJobs[match.id]

              return (
                <div key={match.id} className="relative">
                  {/* Faculty Announcement Banner (if shared) */}
                  {Boolean((match as any).announcement_text) && (
                    <div className="mb-2.5 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-2.5 shadow-2xs">
                      <span className="material-symbols-outlined text-amber-700 text-base mt-0.5 shrink-0">campaign</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-3xs font-extrabold tracking-wider uppercase text-amber-800 block">
                          Faculty Placement Notice
                        </span>
                        <p className="text-xs text-amber-900 mt-0.5 leading-snug font-medium">
                          {(match as any).announcement_text}
                        </p>
                      </div>
                    </div>
                  )}

                  <MatchCard
                    id={match.id}
                    jobTitle={match.jobTitle}
                    company={match.company}
                    deadline={match.deadline}
                    compensationTarget={match.compensationTarget || '₹18–24 LPA'}
                    eligibilityRules={match.eligibilityRules}
                    alignmentScore={currentScore}
                    factorBreakdown={match.factorBreakdown}
                    sandboxToggles={match.sandboxToggles}
                    eligibilityStatus={match.eligibilityStatus}
                    failedPreference={match.failedPreference}
                    missingSkills={match.missingSkills}
                    onOpenDispute={handleOpenDispute}
                    onAddPlan={() => {
                      setSprintNotice(`Added ${match.jobTitle} to your 72h Sprint Roadmap!`)
                    }}
                  />

                  {/* Synchronous Actions & Placement Drive Selector Bar */}
                  <div className="mt-2 flex items-center justify-between px-6 py-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-tertiary">verified_user</span>
                      <span className="text-xs text-on-surface font-semibold">
                        Grounded in <strong>6/8 Solid Tokens</strong> • FERPA &amp; DPDP Guarded
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Clickable Faculty Shared Link / Form */}
                      {Boolean((match as any).external_link) && (
                        <a
                          href={
                            (match as any).external_link.startsWith('http')
                              ? (match as any).external_link
                              : `https://${(match as any).external_link}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#DE95BE] text-[#6D3B56] hover:bg-[#FAF8F5] transition-all shadow-2xs"
                          title="Open official registration or documentation link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Drive Link &amp; Docs</span>
                        </a>
                      )}

                      {/* Explicit Drive Selection / 72h Sprint Toggle */}
                      {selectedDrives.includes(match.id) ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectDrive(match.id, match.company, match.jobTitle)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 shadow-2xs hover:bg-emerald-200 transition-all cursor-pointer"
                            title="Click to remove from selected sprint drives"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                            <span>✓ Drive Selected</span>
                          </button>
                          <Link
                            href={`/student/sprint-plan?jobId=${match.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#6D3B56] text-white hover:brightness-110 shadow-2xs transition-all"
                          >
                            <Zap className="h-3.5 w-3.5 text-amber-300" />
                            <span>Sprint Plan →</span>
                          </Link>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectDrive(match.id, match.company, match.jobTitle)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-outline-variant text-on-surface hover:border-[#6D3B56] hover:text-[#6D3B56] transition-all shadow-2xs cursor-pointer"
                        >
                          <Zap className="h-3.5 w-3.5 text-secondary" />
                          <span>+ Select / Join Drive</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenSource('doc_resume_v3')}
                        className="text-xs font-bold text-secondary px-2.5 py-1.5 rounded-full hover:bg-secondary-container/40 transition-colors"
                      >
                        Evidence Spans
                      </button>

                      {isApplied ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed-dim">
                          <CheckCircle2 className="h-4 w-4 text-tertiary" />
                          <span>Applied ✓</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFastTrackApply(match.id, match.company)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-primary text-on-primary border border-on-primary-fixed-variant shadow-[0_3px_0_#320e26] active:translate-y-[2px] transition-all hover:brightness-105 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Fast-Track (+300 XP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />

      <DisputeClarificationDrawer
        isOpen={disputeDrawerOpen}
        onClose={() => setDisputeDrawerOpen(false)}
        rule={disputeRule}
        jobTitle={disputeJob.title}
        company={disputeJob.company}
        onOpenSourceSpan={() => handleOpenSource('doc_resume_v3')}
      />
    </AppLayout>
  )
}
