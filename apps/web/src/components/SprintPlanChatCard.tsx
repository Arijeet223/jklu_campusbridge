'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Zap,
  CheckCircle2,
  Trash2,
  Target,
  ExternalLink,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'

interface SprintTask {
  hour_span: string
  task: string
  target_gap: string
  deliverable: string
  points?: number
  done?: boolean
}

interface SkillGap {
  skill: string
  category: string
  severity: string
  impact: string
}

interface PlanResponse {
  status: string
  job_id: string
  company: string
  role_title: string
  min_cgpa: number
  student_cgpa: number
  ctc_band: string
  skill_gaps: SkillGap[]
  sprint_plan: {
    executive_summary?: string
    hours_0_24: SprintTask[]
    hours_25_48: SprintTask[]
    hours_49_72: SprintTask[]
  }
}

export default function SprintPlanChatCard({
  studentId = 'STU-101',
  onTaskToggle,
  onLaunchMicroDefense,
}: {
  studentId?: string
  onTaskToggle?: (taskTitle: string, done: boolean) => void
  onLaunchMicroDefense?: () => void
}) {
  const [resolvedStudentId, setResolvedStudentId] = useState(studentId)
  const [selectedJobs, setSelectedJobs] = useState<any[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [planData, setPlanData] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState(false)
  const [removalNotice, setRemovalNotice] = useState<string | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})

  // Resolve active student ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_active_user')
        if (stored) {
          const u = JSON.parse(stored)
          if (u.id || u.student_id) {
            setResolvedStudentId(u.id || u.student_id)
          }
        }
      } catch {}
    }
  }, [])

  // Fetch student's selected drives
  const loadSelectedDrives = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/student/drives/selected?student_id=${encodeURIComponent(resolvedStudentId)}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        const jobs = data.selected_jobs || []
        setSelectedJobs(jobs)
        if (jobs.length > 0) {
          const currentTarget = activeJobId && jobs.find((j: any) => j.job_id === activeJobId) ? activeJobId : jobs[0].job_id
          setActiveJobId(currentTarget)
          fetchPlan(currentTarget)
        } else {
          setPlanData(null)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  const fetchPlan = async (jobId: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/sprint/generate/${encodeURIComponent(jobId)}?student_id=${encodeURIComponent(resolvedStudentId)}`,
        { method: 'POST' }
      )
      if (res.ok) {
        const data = await res.json()
        setPlanData(data)
      }
    } catch {
      // Error handled cleanly
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSelectedDrives()

    const handleDrivesUpdated = () => {
      loadSelectedDrives()
    }
    window.addEventListener('cb_drives_updated', handleDrivesUpdated)
    window.addEventListener('storage', handleDrivesUpdated)
    return () => {
      window.removeEventListener('cb_drives_updated', handleDrivesUpdated)
      window.removeEventListener('storage', handleDrivesUpdated)
    }
  }, [resolvedStudentId])

  // Deselect / Remove drive from 72h sprint plan
  const handleRemoveFromPlan = async (jobId: string, company: string) => {
    setIsRemoving(true)
    try {
      const res = await fetch(
        `/api/student/drives/${encodeURIComponent(jobId)}/select?student_id=${encodeURIComponent(resolvedStudentId)}`,
        { method: 'POST', headers: { Accept: 'application/json' } }
      )
      if (res.ok) {
        setRemovalNotice(`✓ Removed ${company} from your active 72-Hour Sprint Plan`)
        window.dispatchEvent(new CustomEvent('cb_drives_updated'))
        // Update local state immediately
        const remaining = selectedJobs.filter((j) => j.job_id !== jobId)
        setSelectedJobs(remaining)
        if (remaining.length > 0) {
          setActiveJobId(remaining[0].job_id)
          fetchPlan(remaining[0].job_id)
        } else {
          setActiveJobId(null)
          setPlanData(null)
        }
      }
    } catch {
      setRemovalNotice(`Could not remove ${company}. Please retry.`)
    } finally {
      setIsRemoving(false)
      setTimeout(() => setRemovalNotice(null), 4500)
    }
  }

  const toggleTask = (key: string) => {
    const nextState = !completedTasks[key]
    setCompletedTasks((prev) => ({ ...prev, [key]: nextState }))
    onTaskToggle?.(key, nextState)
  }

  // Calculate earned score
  const allTasks: SprintTask[] = [
    ...(planData?.sprint_plan?.hours_0_24 || []),
    ...(planData?.sprint_plan?.hours_25_48 || []),
    ...(planData?.sprint_plan?.hours_49_72 || []),
  ]
  const completedCount = Object.values(completedTasks).filter(Boolean).length
  const totalTasksCount = allTasks.length || 9
  const earnedPts = completedCount * 8
  const totalPts = totalTasksCount * 8

  // 1. Clean Empty State when no drives are selected
  if (!loading && (!selectedJobs || selectedJobs.length === 0)) {
    return (
      <div className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
            <Zap className="h-4 w-4 text-amber-700" />
          </span>
          <div>
            <h3 className="font-display text-xs font-extrabold text-amber-950">
              No 72-Hour Sprint Plan Selected
            </h3>
            <p className="text-[11px] text-amber-800">
              You haven&apos;t enrolled in an active campus placement sprint yet.
            </p>
          </div>
        </div>

        <p className="text-xs text-amber-900 leading-relaxed">
          Select an active placement drive (such as <strong>RazorpayX</strong> or <strong>Atlassian</strong>) in <strong>Live Opportunities</strong> to generate an hour-by-hour roadmap targeting your exact verified skill deficits.
        </p>

        <div className="pt-1 flex items-center justify-between gap-3">
          <Link
            href="/student/matches"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D3B56] hover:brightness-110 text-white text-xs font-bold shadow-2xs transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Select a Drive in Live Opportunities →</span>
          </Link>
        </div>
      </div>
    )
  }

  const activeJob = selectedJobs.find((j) => j.job_id === activeJobId) || selectedJobs[0] || {}
  const company = planData?.company || activeJob.company || 'Selected Placement Target'
  const roleTitle = planData?.role_title || activeJob.role_title || 'Software Engineer'
  const ctc = planData?.ctc_band || activeJob.ctc_band || 'Competitive'

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#E6E3DC] bg-white p-5 shadow-md space-y-4">
      {/* Removal Notification Toast */}
      {removalNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{removalNotice}</span>
          <button type="button" onClick={() => setRemovalNotice(null)} className="text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Multiple Drive Switcher Pills if >1 drive selected */}
      {selectedJobs.length > 1 && (
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#F1EFEA] flex-wrap">
          <span className="text-3xs font-mono font-bold uppercase tracking-wider text-[#817379] mr-1">
            Active Targets:
          </span>
          {selectedJobs.map((j) => (
            <button
              key={j.job_id}
              type="button"
              onClick={() => {
                setActiveJobId(j.job_id)
                fetchPlan(j.job_id)
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                (activeJobId || selectedJobs[0].job_id) === j.job_id
                  ? 'bg-[#6D3B56] text-white shadow-2xs'
                  : 'bg-[#FAF8F5] text-[#817379] hover:bg-gray-100 hover:text-black border border-[#E6E3DC]'
              }`}
            >
              {j.company}
            </button>
          ))}
        </div>
      )}

      {/* Header Container with Prominent "Remove from Plan" Action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#F1EFEA] pb-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
            <Zap className="h-5 w-5 text-amber-700" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-sm font-extrabold text-[#1B1C1B]">
                {company} — {roleTitle}
              </h3>
              <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {ctc}
              </span>
            </div>
            <p className="text-[11px] text-[#817379] mt-0.5">
              Curated 72-Hour Rapid Ramp • 48h Application Window
            </p>
          </div>
        </div>

        {/* Action Capsule: Points & REMOVE FROM PLAN BUTTON */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right font-mono text-xs hidden sm:block">
            <span className="font-bold text-emerald-700">+{earnedPts}</span>
            <span className="text-[#817379]"> / +{totalPts} pts</span>
          </div>

          {/* CRITICAL FEATURE: PROMINENT OPTION TO REMOVE FROM PLAN */}
          <button
            type="button"
            onClick={() => handleRemoveFromPlan(activeJob.job_id || activeJobId || 'job_razorpay', company)}
            disabled={isRemoving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:translate-y-0.5"
            title="Remove this drive from your active 72-Hour Sprint Plan"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
            <span>{isRemoving ? 'Removing...' : 'Remove from 72h Plan'}</span>
          </button>
        </div>
      </div>

      {/* Identified Skill Gaps Badge Row */}
      {planData?.skill_gaps && planData.skill_gaps.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
          <div className="flex items-center justify-between text-3xs font-mono font-bold uppercase tracking-wider text-rose-800">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-rose-600" />
              <span>Targeted Skill Gaps (Curated by Qwen 2.5):</span>
            </span>
            <span>{planData.skill_gaps.length} Deficits Flagged</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {planData.skill_gaps.map((g, idx) => (
              <span
                key={idx}
                className="font-mono text-3xs px-2 py-0.5 rounded-md bg-white border border-rose-300 text-rose-900 font-bold"
              >
                ⚠️ {g.skill} ({g.category})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary if available */}
      {planData?.sprint_plan?.executive_summary && (
        <p className="text-xs text-[#4F4449] leading-relaxed italic bg-[#FAF8F5] p-3 rounded-xl border border-[#E6E3DC]">
          &ldquo;{planData.sprint_plan.executive_summary}&rdquo;
        </p>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-[#817379] font-bold">
          Synchronizing 72h sprint roadmap...
        </div>
      ) : (
        <div className="space-y-3">
          {/* Phase 1: Hours 00 - 24 */}
          {planData?.sprint_plan?.hours_0_24 && (
            <div className="space-y-2">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-[#817379] block">
                Phase 1: Hours 00–24 • Core Deficit Closure
              </span>
              {planData.sprint_plan.hours_0_24.map((t, idx) => {
                const key = `p1_${idx}`
                const isDone = Boolean(completedTasks[key])
                return (
                  <div
                    key={key}
                    onClick={() => toggleTask(key)}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-300 text-[#817379]'
                        : 'bg-[#FAF8F5] border-[#E6E3DC] hover:border-[#6D3B56] text-[#1B1C1B]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTask(key)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block leading-snug ${isDone ? 'line-through text-gray-400' : ''}`}>
                          {t.task}
                        </span>
                        <div className="flex items-center gap-2 text-3xs font-mono text-[#817379] mt-1 flex-wrap">
                          <span className="font-bold text-[#6D3B56]">⏱ {t.hour_span}</span>
                          <span>•</span>
                          <span>Target: {t.target_gap}</span>
                          {t.deliverable && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{t.deliverable}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-3xs font-extrabold text-emerald-700 shrink-0">+8 pts</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Phase 2: Hours 25 - 48 (Sample top task) */}
          {planData?.sprint_plan?.hours_25_48 && planData.sprint_plan.hours_25_48.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-[#817379] block">
                Phase 2: Hours 25–48 • Microservices &amp; Practice Arena Quests
              </span>
              {planData.sprint_plan.hours_25_48.slice(0, 2).map((t, idx) => {
                const key = `p2_${idx}`
                const isDone = Boolean(completedTasks[key])
                return (
                  <div
                    key={key}
                    onClick={() => toggleTask(key)}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-300 text-[#817379]'
                        : 'bg-[#FAF8F5] border-[#E6E3DC] hover:border-[#6D3B56] text-[#1B1C1B]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTask(key)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block leading-snug ${isDone ? 'line-through text-gray-400' : ''}`}>
                          {t.task}
                        </span>
                        <div className="flex items-center gap-2 text-3xs font-mono text-[#817379] mt-1 flex-wrap">
                          <span className="font-bold text-[#6D3B56]">⏱ {t.hour_span}</span>
                          <span>•</span>
                          <span>{t.deliverable}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-3xs font-extrabold text-emerald-700 shrink-0">+8 pts</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Footer Bar */}
      <div className="pt-3 border-t border-[#F1EFEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {onLaunchMicroDefense && (
            <button
              type="button"
              onClick={onLaunchMicroDefense}
              className="px-3.5 py-1.5 rounded-full bg-[#6D3B56] hover:brightness-110 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span>Launch 120s Arena Defense</span>
            </button>
          )}

          <Link
            href={`/student/sprint-plan?jobId=${activeJobId || ''}`}
            className="px-3 py-1.5 rounded-full border border-[#DE95BE] bg-[#FAF8F5] hover:bg-white text-[#6D3B56] font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-1"
          >
            <span>Full 72h Timeline →</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => handleRemoveFromPlan(activeJob.job_id || activeJobId || 'job_razorpay', company)}
          className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline transition-colors text-right"
        >
          ✕ Remove this drive from plan
        </button>
      </div>
    </div>
  )
}
