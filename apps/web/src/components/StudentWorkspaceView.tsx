'use client'

import { useState } from 'react'
import {
  Sparkles,
  Zap,
  Code,
  Compass,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react'
import GhostCard from './GhostCard'
import MatchCard from './MatchCard'
import PracticeArena from './PracticeArena'
import ApplicationsTrackerView from './ApplicationsTrackerView'
import { mockJobMatches } from '@/lib/mock-data'
import type { Skill, EligibilityRule, EvidenceStatus } from '@/lib/types'

interface StudentWorkspaceViewProps {
  studentId: string
  studentName: string
  cgpa: number
  skills: Skill[]
  onSetSkills: React.Dispatch<React.SetStateAction<Skill[]>>
  onOpenSourceDoc?: (docId: string) => void
  onOpenDispute?: (rule: EligibilityRule, jobTitle: string, company: string) => void
  activeTab?: 'readiness' | 'practice' | 'matches' | 'applications'
  onTabChange?: (tab: 'readiness' | 'practice' | 'matches' | 'applications') => void
}

export default function StudentWorkspaceView({
  studentId = 'STU-101',
  studentName = 'Aarav Sharma',
  cgpa = 8.42,
  skills,
  onSetSkills,
  onOpenSourceDoc,
  onOpenDispute,
  activeTab: controlledTab,
  onTabChange,
}: StudentWorkspaceViewProps) {
  const [internalTab, setInternalTab] = useState<'readiness' | 'practice' | 'matches' | 'applications'>(
    'readiness'
  )
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = onTabChange ?? setInternalTab

  // 72-Hour Sprint vs Semester Marathon Mode
  const [isSprintMode, setIsSprintMode] = useState(false)

  // Confirming ghost cards
  const handleConfirmSkill = async (skillId: string) => {
    // Optimistic UI update
    onSetSkills((prev) =>
      prev.map((s) =>
        s.id === skillId
          ? {
              ...s,
              evidenceStatus: 'STUDENT_CONFIRMED' as EvidenceStatus,
              confirmedAt: new Date().toISOString(),
            }
          : s
      )
    )

    // Call backend confirm endpoint to persist
    try {
      await fetch(`/api/backend/v1/profile/extractions/${skillId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
    } catch {
      // Offline fallback
    }
  }

  const handleRejectSkill = (skillId: string) => {
    onSetSkills((prev) => prev.filter((s) => s.id !== skillId))
  }

  const handlePracticeSkillUpgrade = (skillName: string, tier: string) => {
    onSetSkills((prev) => {
      const idx = prev.findIndex((s) => s.name.toLowerCase() === skillName.toLowerCase())
      if (idx !== -1) {
        return prev.map((s, i) =>
          i === idx ? { ...s, evidenceStatus: tier as EvidenceStatus } : s
        )
      }
      return [
        ...prev,
        {
          id: `sk_arena_${Date.now()}`,
          name: skillName,
          proficiency: 'Advanced',
          evidenceStatus: tier as EvidenceStatus,
          sourceDocumentId: 'campusbridge-arena',
          sourceSpan: 'Automated test suite verification',
          confidence: 1.0,
        },
      ]
    })
  }

  const verifiedSkills = skills.filter(
    (s) =>
      s.evidenceStatus === 'INSTITUTION_VERIFIED' ||
      s.evidenceStatus === 'ASSESSMENT_VERIFIED' ||
      s.evidenceStatus === 'STUDENT_CONFIRMED' ||
      s.evidenceStatus === 'ARTIFACT_LINKED'
  )
  const unconfirmedSkills = skills.filter((s) => s.evidenceStatus === 'EXTRACTED')

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto py-4">
      {/* 4 Clean Student Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-hairline bg-surface p-2.5 shadow-xs">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('readiness')}
            className={`flex items-center gap-2 rounded-xl py-2 px-3.5 text-xs font-semibold transition-all ${
              activeTab === 'readiness'
                ? 'bg-oxford text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink-primary hover:bg-canvas'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            1. My Readiness &amp; Profile
            {unconfirmedSkills.length > 0 && (
              <span className="rounded-full bg-amber-surface px-1.5 py-0.5 text-2xs font-bold text-amber">
                {unconfirmedSkills.length} unconfirmed
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 rounded-xl py-2 px-3.5 text-xs font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-oxford text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink-primary hover:bg-canvas'
            }`}
          >
            <Code className="h-4 w-4" />
            2. Practice Arena (DSA + SQL + 120s)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 rounded-xl py-2 px-3.5 text-xs font-semibold transition-all ${
              activeTab === 'matches'
                ? 'bg-oxford text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink-primary hover:bg-canvas'
            }`}
          >
            <Compass className="h-4 w-4" />
            3. Job Matcher &amp; What-If Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 rounded-xl py-2 px-3.5 text-xs font-semibold transition-all ${
              activeTab === 'applications'
                ? 'bg-oxford text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink-primary hover:bg-canvas'
            }`}
          >
            <Shield className="h-4 w-4" />
            4. Applications &amp; Privacy Shield
          </button>
        </div>

        {/* Student Active Persona Callout */}
        <div className="flex items-center gap-2 px-3 py-1 bg-canvas rounded-xl border border-border-hairline text-xs font-mono">
          <span className="font-semibold text-ink-primary">{studentName}</span>
          <span className="text-oxford font-bold">({cgpa} CGPA)</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MY READINESS & GHOST-TO-SOLID PROFILE */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {/* Mode Switcher: 72h Sprint vs Semester Marathon */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-hairline bg-surface p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
                    isSprintMode
                      ? 'bg-amber-surface text-amber border border-amber-border'
                      : 'bg-oxford-surface text-oxford border border-oxford-border'
                  }`}
                >
                  {isSprintMode ? '⚡ 72-HOUR SPRINT MODE ACTIVE' : '🌱 SEMESTER MARATHON MODE'}
                </span>
                <h3 className="font-display text-sm font-semibold text-ink-primary">
                  Adaptive Readiness Coaching Engine
                </h3>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {isSprintMode
                  ? 'Urgent triage: Focused strictly on closing skill gaps for campus drives ending in <72 hours.'
                  : 'Comprehensive career foundation: Balancing long-term capstones, system design depth, and competitive programming.'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-canvas p-1 rounded-xl border border-border-hairline">
              <button
                type="button"
                onClick={() => setIsSprintMode(false)}
                className={`rounded-lg py-1.5 px-3 text-xs font-semibold transition-all ${
                  !isSprintMode
                    ? 'bg-surface text-oxford shadow-xs border border-border-hairline'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                Semester Marathon
              </button>
              <button
                type="button"
                onClick={() => setIsSprintMode(true)}
                className={`rounded-lg py-1.5 px-3 text-xs font-semibold transition-all ${
                  isSprintMode
                    ? 'bg-amber text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                ⚡ 72h Drive Sprint
              </button>
            </div>
          </div>

          {/* 72-Hour Sprint Urgent Triage Checklist */}
          {isSprintMode && (
            <div className="rounded-2xl border border-amber-border bg-amber-surface/40 p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber" />
                  <h4 className="font-display text-sm font-bold text-ink-primary">
                    72-Hour Drive Closing: RazorpayX Labs (Deadline: 48h)
                  </h4>
                </div>
                <span className="font-mono text-2xs font-bold text-amber">High-Yield Triage</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-surface p-3 border border-border-hairline space-y-1">
                  <span className="font-semibold text-xs text-ink-primary block">
                    1. Confirm Ghost Extractions
                  </span>
                  <p className="text-2xs text-ink-muted">
                    Click `✓ Confirm` on the 2 AI-extracted skills below to immediately unlock 0.5x credit.
                  </p>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-border-hairline space-y-1">
                  <span className="font-semibold text-xs text-ink-primary block">
                    2. Pass Sliding Window Test
                  </span>
                  <p className="text-2xs text-ink-muted">
                    Solve DSA-01 in the Practice Arena to upgrade DSA to 1.0x Assessment-Verified.
                  </p>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-border-hairline space-y-1">
                  <span className="font-semibold text-xs text-ink-primary block">
                    3. Run SQL Window Query
                  </span>
                  <p className="text-2xs text-ink-muted">
                    Execute the DENSE_RANK() query in SQL Sandbox for +9% match boost.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unconfirmed Ghost Cards Section */}
          {unconfirmedSkills.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-iris animate-pulse" />
                  <h3 className="font-display text-sm font-semibold text-ink-primary">
                    AI Skill Proposals (Ghost Cards)
                  </h3>
                  <span className="font-mono text-2xs rounded bg-iris-surface px-2 py-0.5 text-iris font-semibold border border-iris-border">
                    {unconfirmedSkills.length} Found in Resume
                  </span>
                </div>
                <span className="text-2xs text-ink-muted">
                  Requires 1-click confirmation to count toward placement drives
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unconfirmedSkills.map((s) => (
                  <GhostCard
                    key={s.id}
                    skillName={s.name}
                    proficiency={s.proficiency}
                    sourcePage="p. 1"
                    sourceSection="Projects & Technical Competencies"
                    confidence={Math.round((s.confidence || 0.94) * 100)}
                    evidenceStatus={s.evidenceStatus}
                    onConfirm={() => handleConfirmSkill(s.id)}
                    onReject={() => handleRejectSkill(s.id)}
                    onClickSource={() => onOpenSourceDoc?.('doc_resume_v3')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Verified Skills Grid (6-Tier Provenance) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald" />
                <h3 className="font-display text-sm font-semibold text-ink-primary">
                  Verified Skills &amp; Provenance Chain ({verifiedSkills.length})
                </h3>
              </div>
              <span className="text-2xs font-mono text-ink-muted">
                100% Deterministic Multipliers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {verifiedSkills.map((s) => {
                const isVerified =
                  s.evidenceStatus === 'ASSESSMENT_VERIFIED' ||
                  s.evidenceStatus === 'INSTITUTION_VERIFIED'
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-border-hairline bg-surface p-3.5 space-y-2 hover:border-oxford/30 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-ink-primary">{s.name}</h4>
                      <span
                        className={`font-mono text-2xs px-1.5 py-0.5 rounded font-semibold ${
                          isVerified
                            ? 'bg-emerald-surface text-emerald border border-emerald-border'
                            : 'bg-oxford-surface text-oxford border border-oxford-border'
                        }`}
                      >
                        {isVerified ? '1.0x (Verified)' : '0.5x (Self-Confirmed)'}
                      </span>
                    </div>

                    <p className="text-2xs text-ink-muted line-clamp-1">
                      {s.sourceSpan || 'Extracted and verified in student portfolio'}
                    </p>

                    <div className="flex items-center justify-between text-2xs text-ink-muted pt-1 border-t border-border-hairline/60">
                      <span>Tier: <code className="font-mono text-ink-secondary">{s.evidenceStatus}</code></span>
                      <button
                        type="button"
                        onClick={() => onOpenSourceDoc?.(s.sourceDocumentId || 'doc_resume_v3')}
                        className="text-oxford hover:underline"
                      >
                        View Span
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: INTERACTIVE PRACTICE ARENA */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'practice' && (
        <PracticeArena
          studentId={studentId}
          studentName={studentName}
          onSkillUpgraded={handlePracticeSkillUpgrade}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: OPPORTUNITY MATCHER & WHAT-IF SANDBOX */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-hairline pb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-ink-primary">
                Two-Stage Career Matching &amp; Counterfactual Sandbox
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Stage 1: Pure deterministic hard eligibility (Zero ML). Stage 2: Transparent weighted alignment with &lt;50ms What-If simulations.
              </p>
            </div>
            <span className="font-mono text-2xs rounded bg-emerald-surface px-2.5 py-1 text-emerald font-semibold border border-emerald-border">
              3 Active Campus Drives
            </span>
          </div>

          <div className="space-y-6">
            {mockJobMatches.map((m) => (
              <MatchCard
                key={m.id}
                jobTitle={m.jobTitle}
                company={m.company}
                deadline={m.deadline}
                eligibilityRules={m.eligibilityRules}
                alignmentScore={m.alignmentScore}
                factorBreakdown={m.factorBreakdown}
                sandboxToggles={m.sandboxToggles}
                onOpenDispute={onOpenDispute}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: PRIVACY SHIELD & APPLICATIONS TRACKER */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <ApplicationsTrackerView
          onOpenDispute={(jobTitle, company, ruleLabel) => {
            onOpenDispute?.(
              {
                id: 'rule-clarify',
                label: ruleLabel,
                status: 'UNKNOWN',
                ruleExpression: '24 credits in CSE minor certified by HOD',
              },
              jobTitle,
              company
            )
          }}
          onOpenSprint={() => {
            setActiveTab('readiness')
            setIsSprintMode(true)
          }}
          onOpenDefense={() => {
            setActiveTab('practice')
          }}
        />
      )}
    </div>
  )
}
