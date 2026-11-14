'use client'

import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Compass,
  Zap,
  Shield,
  Building2,
  Briefcase,
  X,
  GraduationCap,
  Users,
  Award,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'

export type ActiveWorkspaceView =
  | 'overview'
  | 'all'
  | 'skills'
  | 'sandbox'
  | 'sprint'
  | 'defense'
  | 'applications'
  | 'readiness'
  | 'practice'
  | 'matches'

interface CollapsibleNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
  activeView: ActiveWorkspaceView
  onSelectView: (view: ActiveWorkspaceView) => void
  unconfirmedCount?: number
  studentName?: string
  cgpa?: number
}

export default function CollapsibleNavDrawer({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
  activeView,
  onSelectView,
  unconfirmedCount = 2,
  studentName = 'Priya Sharma',
  cgpa = 8.2,
}: CollapsibleNavDrawerProps) {
  const isStudent = currentRole === 'STUDENT'

  const handleItemClick = (view: ActiveWorkspaceView) => {
    onSelectView(view)
    if (!isStudent) {
      onRoleChange('STUDENT')
    }
    onClose()
  }

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role)
    onClose()
  }

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border-hairline bg-surface shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="CampusBridge Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border-hairline px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-oxford text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-sm font-semibold text-ink-primary">
                CampusBridge AI
              </span>
              <p className="text-[11px] text-ink-muted">
                Career Command Center
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink-primary transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Student Profile Snapshot */}
        <div className="border-b border-border-hairline bg-canvas p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-oxford-surface font-display text-xs font-semibold text-oxford">
              PS
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="truncate text-xs font-semibold text-ink-primary">
                {studentName}
              </h4>
              <p className="truncate font-mono text-[11px] text-ink-secondary">
                JKLU • CS &apos;27
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-[10px] text-emerald font-semibold">
                  CGPA {cgpa.toFixed(1)}
                </span>
                <span className="text-[10px] text-ink-muted">•</span>
                <span className="text-[10px] text-oxford font-medium">
                  Active Placement Season
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Functional Views Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
            Student Workspaces
          </div>

          {/* 1. Home / Overview Dashboard */}
          <button
            type="button"
            onClick={() => handleItemClick('overview')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'overview' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="h-4 w-4 text-oxford" />
              Home / Overview Hub
            </span>
            <span className="rounded bg-emerald-surface px-1.5 py-0.2 text-[9px] font-bold text-emerald border border-emerald-border">
              Live
            </span>
          </button>

          {/* 2. All Conversations / AI Companion */}
          <button
            type="button"
            onClick={() => handleItemClick('all')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'all' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-oxford" />
              AI Career Companion
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald" />
          </button>

          {/* 3. Review My Skills */}
          <button
            type="button"
            onClick={() => handleItemClick('skills')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'skills' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-iris" />
              Review My Skills
            </span>
            {unconfirmedCount > 0 && (
              <span className="rounded bg-iris-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-iris">
                {unconfirmedCount} need check
              </span>
            )}
          </button>

          {/* 4. Job Fit & What-If Sandbox */}
          <button
            type="button"
            onClick={() => handleItemClick('sandbox')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'sandbox' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-oxford" />
              Job Fit &amp; What-If Sandbox
            </span>
            <span className="font-mono text-[10px] text-emerald font-semibold">
              TechCorp (74)
            </span>
          </button>

          {/* 5. Last-Minute Prep (72h Sprint) */}
          <button
            type="button"
            onClick={() => handleItemClick('sprint')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'sprint' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber" />
              Last-Minute Prep (72h Sprint)
            </span>
            <span className="rounded bg-amber-surface px-1.5 py-0.5 font-mono text-[10px] text-amber font-semibold">
              Friday Drive
            </span>
          </button>

          {/* 6. Quick Skill Proof (120s Defense) */}
          <button
            type="button"
            onClick={() => handleItemClick('defense')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'defense' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-emerald" />
              Quick Skill Proof (120s Defense)
            </span>
            <span className="font-mono text-[10px] text-emerald">
              Text-Only
            </span>
          </button>

          {/* 7. Applications & Milestone Status */}
          <button
            type="button"
            onClick={() => handleItemClick('applications')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              activeView === 'applications' && isStudent
                ? 'bg-oxford-surface font-semibold text-oxford border border-oxford-border'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-oxford" />
              Applications &amp; Status
            </span>
            <span className="rounded bg-oxford-surface px-1.5 py-0.5 font-mono text-[10px] text-oxford font-semibold">
              3 Active
            </span>
          </button>

          {/* Persona Switcher Section */}
          <div className="pt-3 pb-1 px-2 text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
            Campus Ecosystem Roles (PRD §2.2)
          </div>

          {/* Role A: Placement Officer */}
          <button
            type="button"
            onClick={() => handleRoleSelect('OFFICER')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              currentRole === 'OFFICER'
                ? 'bg-oxford text-white font-semibold'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Briefcase className="h-4 w-4" />
              Placement Officer Console
            </span>
            <span className="text-[10px] opacity-75">Switch →</span>
          </button>

          {/* Role B: Recruiter Partner */}
          <button
            type="button"
            onClick={() => handleRoleSelect('RECRUITER')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              currentRole === 'RECRUITER'
                ? 'bg-emerald text-white font-semibold'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4" />
              Recruiter Partner Portal
            </span>
            <span className="text-[10px] opacity-75">Switch →</span>
          </button>

          {/* Role C: Faculty Mentor */}
          <button
            type="button"
            onClick={() => handleRoleSelect('FACULTY')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              currentRole === 'FACULTY'
                ? 'bg-iris text-white font-semibold'
                : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Award className="h-4 w-4" />
              Faculty Mentor Advisory
            </span>
            <span className="text-[10px] opacity-75">Switch →</span>
          </button>
        </div>

        {/* Footer info: Verified Privacy Status */}
        <div className="border-t border-border-hairline bg-canvas p-4">
          <div className="rounded-lg border border-oxford-border bg-oxford-surface p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-oxford">
              <Shield className="h-3.5 w-3.5" />
              Verified Privacy
            </div>
            <p className="mt-1 text-[11px] text-ink-secondary leading-snug">
              Your profile is private. No recruiter can see unconfirmed skills or personal details without your explicit consent.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
