'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { getActiveUser } from '@/lib/api-client'
import {
  Zap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Target,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  Layers,
  Award,
  Gamepad2,
  MessageSquare,
} from 'lucide-react'

interface SkillGap {
  skill: string
  category: string
  severity: string
  impact: string
}

interface SprintTask {
  hour_span: string
  task: string
  target_gap: string
  deliverable: string
}

interface SprintPlanData {
  status: string
  job_id: string
  company: string
  role_title: string
  min_cgpa: number
  student_cgpa: number
  ctc_band: string
  skill_gaps: SkillGap[]
  verified_skills_count: number
  sprint_plan: {
    executive_summary?: string
    hours_0_24: SprintTask[]
    hours_25_48: SprintTask[]
    hours_49_72: SprintTask[]
  }
  engine: string
}

export default function StudentSprintPlanPage() {
  const [studentId, setStudentId] = useState('STU-101')
  const [selectedJobs, setSelectedJobs] = useState<any[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [planData, setPlanData] = useState<SprintPlanData | null>(null)

  const [isLoadingDrives, setIsLoadingDrives] = useState(true)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const user = getActiveUser()
    const sid = user?.id || 'STU-101'
    setStudentId(sid)

    let urlJobId: string | null = null
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      urlJobId = sp.get('jobId')
    }

    loadSelectedDrives(sid, urlJobId)
  }, [])

  const loadSelectedDrives = async (sid: string, requestedJobId?: string | null) => {
    setIsLoadingDrives(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/student/drives/selected?student_id=${encodeURIComponent(sid)}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        const jobs = data.selected_jobs || []
        setSelectedJobs(jobs)
        if (jobs.length > 0) {
          const matchRequested = requestedJobId ? jobs.find((j: any) => j.job_id === requestedJobId) : null
          const targetId = matchRequested ? matchRequested.job_id : jobs[0].job_id
          setActiveJobId(targetId)
          generatePlanForJob(targetId, sid)
        }
      }
    } catch (err: any) {
      setErrorMsg('Failed loading selected placement drives.')
    } finally {
      setIsLoadingDrives(false)
    }
  }

  const generatePlanForJob = async (jobId: string, sid?: string) => {
    const currentSid = sid || studentId || 'STU-101'
    setIsGeneratingPlan(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/sprint/generate/${encodeURIComponent(jobId)}?student_id=${encodeURIComponent(currentSid)}`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setPlanData(data)
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.detail || 'Failed generating AI sprint plan.')
      }
    } catch (err: any) {
      setErrorMsg('Error contacting sprint generation engine.')
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const handleSelectJobTab = (jobId: string) => {
    setActiveJobId(jobId)
    generatePlanForJob(jobId)
  }

  const activeJob = selectedJobs.find((j) => j.job_id === activeJobId) || selectedJobs[0]

  return (
    <AppLayout
      pageTitle="72-Hour Sprint Plan"
      breadcrumb="Student Workspace > 72h Sprint Accelerator"
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold border border-outline-variant shadow-2xs mb-3">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Qwen 2.5 • Skill-Gap Curated Accelerator</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1B1C1B] tracking-tight">
                72-Hour Skill-Gap Sprint Plan
              </h1>
              <p className="text-xs sm:text-sm text-[#817379] mt-1 max-w-2xl leading-relaxed">
                Hour-by-hour tactical game plan specifically engineered to close your verified technical deficits before your target placement drive closes.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/student/matches"
                className="px-4 py-2.5 rounded-xl border border-outline-variant bg-[#FAF8F5] text-xs font-bold text-[#1B1C1B] hover:bg-[#F1EFEA] transition-colors flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4 text-primary" />
                <span>Manage Drives ({selectedJobs.length})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoadingDrives && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-[#E6E3DC]">
            <RefreshCw className="h-7 w-7 text-primary animate-spin" />
            <span className="text-xs font-bold text-[#817379]">Loading your selected placement drives...</span>
          </div>
        )}

        {/* EMPTY STATE: STRICTLY SHOWN IF NO DRIVE SELECTED */}
        {!isLoadingDrives && selectedJobs.length === 0 && (
          <div className="py-16 px-6 sm:px-12 bg-white rounded-3xl border-2 border-dashed border-[#E6E3DC] text-center space-y-5 shadow-xs">
            <div className="h-16 w-16 rounded-full bg-primary-container/40 text-primary flex items-center justify-center mx-auto border border-primary-container">
              <Target className="h-8 w-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-display font-extrabold text-lg text-[#1B1C1B]">
                No Placement Drive Selected Yet
              </h3>
              <p className="text-xs text-[#817379] leading-relaxed">
                CampusBridge 72-Hour Sprint Plans are strictly tailored to your specific target company&apos;s job description and skill gaps. Join or select a drive from the Live Opportunities feed to generate your customized roadmap.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/student/matches"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#6D3B56] text-white hover:bg-[#582e44] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-[0_3px_0_#320e26] active:translate-y-[2px]"
              >
                <span>Browse Live Placements &amp; Select Drive</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ACTIVE DRIVE TABS & SPRINT PLAN VIEW */}
        {!isLoadingDrives && selectedJobs.length > 0 && (
          <div className="space-y-6">
            {/* Drive Selection Tabs */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-[#817379] shrink-0">
                Active Drives:
              </span>
              {selectedJobs.map((job) => {
                const isSelected = job.job_id === activeJobId
                return (
                  <button
                    key={job.job_id}
                    type="button"
                    onClick={() => handleSelectJobTab(job.job_id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#6D3B56] text-white shadow-[0_3px_0_#320e26]'
                        : 'bg-white border border-[#E6E3DC] text-[#1B1C1B] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span>{job.company_name} — {job.role_title}</span>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                  </button>
                )
              })}
            </div>

            {/* Target Drive Meta Banner */}
            {activeJob && (
              <div className="p-5 rounded-2xl bg-white border border-[#E6E3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-[#1B1C1B]">{activeJob.company_name}</span>
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] text-primary border border-outline-variant">
                      {activeJob.ctc_band || 'Competitive'}
                    </span>
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                      Drive Selected
                    </span>
                  </div>
                  <p className="text-xs text-[#817379]">
                    Role: <strong className="text-[#1B1C1B]">{activeJob.role_title}</strong> • Min CGPA: {activeJob.min_cgpa}
                  </p>
                  {activeJob.announcement_text && (
                    <div className="mt-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <strong>Faculty Note:</strong> {activeJob.announcement_text}
                    </div>
                  )}
                </div>

                {activeJob.external_link && (
                  <a
                    href={activeJob.external_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-105 shrink-0"
                  >
                    <span>Official Registration / Docs</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* GENERATING SPINNER */}
            {isGeneratingPlan && (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-[#E6E3DC]">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold text-[#1B1C1B]">Qwen 2.5 is auditing skill gaps &amp; assembling sprint roadmap...</span>
                <span className="text-3xs text-[#817379]">Comparing JD mandatory gates against verified student ledger</span>
              </div>
            )}

            {/* ERROR DISPLAY */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SPRINT PLAN CONTENT */}
            {!isGeneratingPlan && planData && (
              <div className="space-y-6">
                {/* 1. Skill Gaps Audit Container */}
                <div className="p-6 rounded-3xl border-2 border-rose-100 bg-rose-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm text-rose-950">
                          Identified Skill Gaps ({planData.skill_gaps.length} Deficits Detected)
                        </h3>
                        <p className="text-2xs text-rose-800">
                          What {planData.company} requires vs. what is currently missing or unverified in your ledger.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-white text-rose-800 border border-rose-200">
                      Audit Precision: 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {planData.skill_gaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <strong className="font-display font-bold text-xs text-[#1B1C1B] truncate">{gap.skill}</strong>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            gap.severity === 'CRITICAL_DEFICIT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4F4449] leading-tight">{gap.impact}</p>
                      </div>
                    ))}
                  </div>

                  {planData.sprint_plan.executive_summary && (
                    <div className="p-3.5 rounded-2xl bg-white/80 border border-rose-200 text-xs text-rose-950 font-medium">
                      <strong>Sprint Directive:</strong> {planData.sprint_plan.executive_summary}
                    </div>
                  )}
                </div>

                {/* 2. Chronological 72-Hour Timeline */}
                <div className="space-y-6">
                  {/* PHASE 1: Hours 00:00 - 24:00 */}
                  <div className="p-6 rounded-3xl border-2 border-[#E6E3DC] bg-white space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-[#1B1C1B]">
                            Phase 1: Hours 00:00 – 24:00
                          </h4>
                          <p className="text-2xs text-[#817379]">
                            Foundational Deficit Closure &amp; Environment Setup
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        Day 1 Focus
                      </span>
                    </div>

                    <div className="space-y-3">
                      {planData.sprint_plan.hours_0_24.map((task, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E3DC] hover:border-primary/40 transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-primary bg-primary-container px-2 py-0.5 rounded-md">
                              {task.hour_span}
                            </span>
                            <span className="text-3xs font-mono font-bold text-[#817379] truncate">
                              Targeting: {task.target_gap}
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-xs text-[#1B1C1B]">{task.task}</h5>
                          <p className="text-[11px] text-[#4F4449]">
                            <strong>Deliverable:</strong> {task.deliverable}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHASE 2: Hours 24:00 - 48:00 */}
                  <div className="p-6 rounded-3xl border-2 border-[#E6E3DC] bg-white space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-[#1B1C1B]">
                            Phase 2: Hours 24:00 – 48:00
                          </h4>
                          <p className="text-2xs text-[#817379]">
                            Deep Implementation, Architecture &amp; Practice Arena Quests
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                        Day 2 Deep Work
                      </span>
                    </div>

                    <div className="space-y-3">
                      {planData.sprint_plan.hours_25_48.map((task, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E3DC] hover:border-primary/40 transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                              {task.hour_span}
                            </span>
                            <span className="text-3xs font-mono font-bold text-[#817379] truncate">
                              Targeting: {task.target_gap}
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-xs text-[#1B1C1B]">{task.task}</h5>
                          <p className="text-[11px] text-[#4F4449]">
                            <strong>Deliverable:</strong> {task.deliverable}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHASE 3: Hours 48:00 - 72:00 */}
                  <div className="p-6 rounded-3xl border-2 border-[#E6E3DC] bg-white space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-[#1B1C1B]">
                            Phase 3: Hours 48:00 – 72:00
                          </h4>
                          <p className="text-2xs text-[#817379]">
                            High-Pressure 120s Arena Micro-Defense Drills &amp; Interview Execution
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                        Day 3 Final Lock
                      </span>
                    </div>

                    <div className="space-y-3">
                      {planData.sprint_plan.hours_49_72.map((task, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E3DC] hover:border-primary/40 transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {task.hour_span}
                            </span>
                            <span className="text-3xs font-mono font-bold text-[#817379] truncate">
                              Targeting: {task.target_gap}
                            </span>
                          </div>
                          <h5 className="font-display font-bold text-xs text-[#1B1C1B]">{task.task}</h5>
                          <p className="text-[11px] text-[#4F4449]">
                            <strong>Deliverable:</strong> {task.deliverable}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Arena & AI Coach CTA Bar */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-[#6D3B56] to-[#452033] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                  <div>
                    <h4 className="font-display font-extrabold text-base">Ready to execute your sprint tasks?</h4>
                    <p className="text-xs text-white/80 mt-0.5">
                      Practice live 120-second code defenses or run voice mock interviews directly with J.A.R.V.I.S.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href="/student/arena"
                      className="px-4 py-2.5 rounded-full bg-white text-[#6D3B56] font-bold text-xs hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Gamepad2 className="h-4 w-4" />
                      <span>120s Arena</span>
                    </Link>
                    <Link
                      href="/student/chat"
                      className="px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>AI Voice Coach</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
