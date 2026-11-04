'use client'

import { useState, useRef } from 'react'
import {
  Sparkles,
  Compass,
  Zap,
  Shield,
  Building2,
  Lock,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  GraduationCap,
  Award,
  ChevronRight,
  Layers,
  BarChart3,
} from 'lucide-react'
import {
  mockReadinessDimensions,
  mockResumeVersions,
  mockApplications,
} from '@/lib/mock-data'
import type { Skill, ReadinessDimension, ResumeVersion } from '@/lib/types'

interface StudentHomeDashboardProps {
  studentName: string
  cgpa: number
  branch: string
  institution: string
  skills: Skill[]
  onNavigate: (view: 'skills' | 'sandbox' | 'sprint' | 'defense' | 'applications') => void
  onOpenPrivacyVault: () => void
  onUploadResume: (fileName: string, newSkills: Skill[]) => void
  onOpenSourceDoc?: (docId: string) => void
}

export default function StudentHomeDashboard({
  studentName,
  cgpa,
  branch,
  institution,
  skills,
  onNavigate,
  onOpenPrivacyVault,
  onUploadResume,
  onOpenSourceDoc,
}: StudentHomeDashboardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const verifiedSkills = skills.filter(
    (s) =>
      s.evidenceStatus === 'INSTITUTION_VERIFIED' ||
      s.evidenceStatus === 'ASSESSMENT_VERIFIED' ||
      s.evidenceStatus === 'STUDENT_CONFIRMED',
  )
  const unconfirmedSkills = skills.filter((s) => s.evidenceStatus === 'EXTRACTED')

  // Calculate overall readiness weighted score
  const overallReadiness = Math.round(
    mockReadinessDimensions.reduce((acc, dim) => acc + dim.score, 0) /
      mockReadinessDimensions.length,
  )

  const handleSimulateUpload = (file: File) => {
    setIsProcessingFile(true)
    setUploadNotice(`Parsing and scanning "${file.name}" in isolated sandbox...`)

    setTimeout(() => {
      // Simulate newly extracted skills from uploaded file
      const newExtractedSkills: Skill[] = [
        {
          id: `sk_upload_${Date.now()}_1`,
          name: 'Docker Containerization',
          proficiency: 'Intermediate',
          evidenceStatus: 'EXTRACTED',
          sourceDocumentId: 'doc_resume_v4',
          sourceSpan: `${file.name} • p.1, §Infrastructure`,
          confidence: 0.94,
        },
        {
          id: `sk_upload_${Date.now()}_2`,
          name: 'Redis Streams & Caching',
          proficiency: 'Advanced',
          evidenceStatus: 'EXTRACTED',
          sourceDocumentId: 'doc_resume_v4',
          sourceSpan: `${file.name} • p.2, §Distributed Projects`,
          confidence: 0.91,
        },
      ]

      onUploadResume(file.name, newExtractedSkills)
      setIsProcessingFile(false)
      setUploadNotice(
        `Successfully uploaded and parsed "${file.name}"! Added 2 new AI Skill Suggestions to your verification queue.`,
      )
    }, 1000)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSimulateUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSimulateUpload(e.target.files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Notification Toast */}
      {uploadNotice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-border bg-emerald-surface p-4 text-xs text-emerald shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{uploadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadNotice(null)}
            className="text-[11px] underline hover:text-ink-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Hero Hub Header Card with Vibrant Gradients */}
      <div className="relative overflow-hidden rounded-2xl border border-border-hairline bg-gradient-to-r from-surface via-canvas to-oxford-surface/40 p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-oxford to-oxford/90 px-3 py-1 text-xs font-semibold text-white shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
                Active Placement Cycle 2026-27
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-surface px-2.5 py-0.5 text-xs font-semibold text-emerald border border-emerald-border">
                <CheckCircle2 className="h-3 w-3" />
                Verified Privacy Active
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
              Welcome back, {studentName}! 👋
            </h1>
            <p className="text-sm text-ink-secondary max-w-2xl leading-relaxed">
              Your personalized career command center at <strong className="text-ink-primary">{institution}</strong>.
              Review AI skill proposals, simulate job fit in real time, and pass 2-minute skill proofs before Friday&apos;s campus drives.
            </p>
          </div>

          {/* Overall Readiness Radial / Gauge Card */}
          <div className="flex items-center gap-4 rounded-xl border border-border-hairline bg-surface/90 p-4 shadow-2xs backdrop-blur-sm">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-oxford to-iris text-white shadow-sm">
              <div className="text-center font-display text-lg font-bold">
                {overallReadiness}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Readiness Score
              </div>
              <div className="font-display text-base font-bold text-emerald">
                Placement Ready
              </div>
              <p className="text-[11px] text-ink-secondary">
                Top 15% across CSE &apos;27 cohort
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Standing Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card A: Academic Standing */}
        <div className="rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-oxford-border hover:shadow-xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Academic Standing</span>
            <GraduationCap className="h-4 w-4 text-oxford" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-ink-primary">{cgpa.toFixed(1)}</span>
            <span className="text-xs text-ink-muted">CGPA</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-secondary truncate">{branch}</div>
        </div>

        {/* Card B: Verified Skills */}
        <div
          onClick={() => onNavigate('skills')}
          className="cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-emerald-border hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Verified Skills</span>
            <Award className="h-4 w-4 text-emerald" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald">{verifiedSkills.length}</span>
            <span className="text-xs text-ink-muted">/ {skills.length} total</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald flex items-center gap-1">
            <span>{unconfirmedSkills.length} need review</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </div>
        </div>

        {/* Card C: Active Drives */}
        <div
          onClick={() => onNavigate('applications')}
          className="cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-oxford-border hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Active Campus Drives</span>
            <Building2 className="h-4 w-4 text-oxford" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-oxford">{mockApplications.length}</span>
            <span className="text-xs text-ink-muted">opted in</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-oxford flex items-center gap-1">
            <span>1 Shortlist Confirmed</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </div>
        </div>

        {/* Card D: Privacy Vault Status */}
        <div
          onClick={onOpenPrivacyVault}
          className="cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-iris-border hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Privacy Vault</span>
            <Lock className="h-4 w-4 text-iris" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-iris">2</span>
            <span className="text-xs text-ink-muted">recruiters permitted</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-iris flex items-center gap-1">
            <span>Manage Access &amp; History</span>
            <ChevronRight className="h-2.5 w-2.5" />
          </div>
        </div>
      </div>

      {/* 3. Main Split: 6-Dimension Readiness Bars (Left 7 cols) & Live Resume Drag-Drop (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: 6-Dimension Progress Bars (7 cols) */}
        <div className="rounded-xl border border-border-hairline bg-surface p-6 shadow-2xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-border-hairline pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-oxford-surface text-oxford">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="font-display text-sm font-bold text-ink-primary">
                6-Dimension Readiness Progression (PRD §5.3)
              </h2>
            </div>
            <span className="text-xs font-mono text-ink-muted">
              Benchmark: Top Decile
            </span>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            Every dimension is computed deterministically from verified resume spans, proof-of-work defenses, and objective recruiter rubric weights.
          </p>

          <div className="space-y-3.5 pt-1">
            {mockReadinessDimensions.map((dim) => {
              const isAbove = dim.score >= dim.benchmark
              return (
                <div key={dim.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-primary">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-muted">
                        Cohort median: {dim.benchmark}%
                      </span>
                      <span className="font-mono font-bold text-oxford">{dim.score}%</span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-subtle">
                    {/* Active Student Fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dim.score >= 85
                          ? 'bg-gradient-to-r from-emerald to-emerald/80'
                          : dim.score >= 70
                          ? 'bg-gradient-to-r from-oxford to-iris'
                          : 'bg-gradient-to-r from-amber to-amber/80'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                    {/* Cohort Benchmark Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-ink-muted/70"
                      style={{ left: `${dim.benchmark}%` }}
                      title={`Cohort Median: ${dim.benchmark}%`}
                    />
                  </div>

                  <p className="text-[11px] text-ink-muted leading-tight">
                    {dim.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Live Drag-and-Drop Resume Uploader & Version History (5 cols) */}
        <div className="flex flex-col rounded-xl border border-border-hairline bg-surface p-6 shadow-2xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-hairline pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-iris-surface text-iris">
                <UploadCloud className="h-4 w-4" />
              </div>
              <h2 className="font-display text-sm font-bold text-ink-primary">
                Resume &amp; Artifact Uploader
              </h2>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">
              Auto-Extract v1.1
            </span>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-oxford bg-oxford-surface/50 scale-[1.01]'
                : 'border-border-hairline bg-canvas hover:border-oxford-border hover:bg-subtle/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-oxford-surface text-oxford">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display text-xs font-semibold text-ink-primary">
              {isProcessingFile ? 'Parsing Document...' : 'Drop your new Resume (PDF / DOCX)'}
            </h3>
            <p className="mt-1 text-[11px] text-ink-muted">
              or click to browse your computer
            </p>
            <div className="mt-3 inline-flex items-center gap-1 rounded bg-surface px-2.5 py-1 font-mono text-[10px] text-ink-secondary border border-border-hairline">
              Protected by isolated malware quarantine
            </div>
          </div>

          {/* Recent Resume Version History Pill List */}
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
              <span>Resume Version History</span>
              <button
                type="button"
                onClick={onOpenPrivacyVault}
                className="text-[11px] text-oxford hover:underline"
              >
                View all vault files →
              </button>
            </div>

            <div className="space-y-2">
              {mockResumeVersions.map((ver) => (
                <div
                  key={ver.id}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                    ver.isCurrent
                      ? 'border-oxford-border bg-oxford-surface/40'
                      : 'border-border-hairline bg-canvas'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-ink-muted" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-primary">{ver.fileName}</span>
                        {ver.isCurrent && (
                          <span className="rounded bg-emerald-surface px-1.5 py-0.2 text-[9px] font-bold text-emerald border border-emerald-border">
                            Active Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        {ver.fileSize} • {new Date(ver.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSourceDoc?.(ver.sourceDocumentId)}
                    className="font-mono text-[10px] text-oxford font-medium hover:underline"
                  >
                    Inspect ↗
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick-Jump Action Cards to Workspaces */}
      <div>
        <h3 className="font-display text-sm font-bold text-ink-primary mb-3">
          Explore Your Functional Workspaces
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Action 1: Review Skills */}
          <div
            onClick={() => onNavigate('skills')}
            className="group cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-iris-border hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-iris-surface text-iris group-hover:scale-105 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="rounded bg-iris-surface px-2 py-0.5 font-mono text-[10px] font-bold text-iris border border-iris-border">
                {unconfirmedSkills.length} Needs Check
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-ink-primary group-hover:text-iris transition-colors">
              ✨ Review My Skills
            </h4>
            <p className="mt-1 text-xs text-ink-secondary leading-snug">
              Confirm or edit AI-extracted skills from your latest resume with 1-click provenance links.
            </p>
          </div>

          {/* Action 2: Job Fit & Sandbox */}
          <div
            onClick={() => onNavigate('sandbox')}
            className="group cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-oxford-border hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-oxford-surface text-oxford group-hover:scale-105 transition-transform">
                <Compass className="h-4 w-4" />
              </div>
              <span className="rounded bg-emerald-surface px-2 py-0.5 font-mono text-[10px] font-bold text-emerald border border-emerald-border">
                74% Alignment
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-ink-primary group-hover:text-oxford transition-colors">
              🎯 Job Fit &amp; What-If Sandbox
            </h4>
            <p className="mt-1 text-xs text-ink-secondary leading-snug">
              Simulate how completing projects or micro-defenses boosts your match score before applying.
            </p>
          </div>

          {/* Action 3: 72h Sprint */}
          <div
            onClick={() => onNavigate('sprint')}
            className="group cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-amber-border hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-surface text-amber group-hover:scale-105 transition-transform">
                <Zap className="h-4 w-4" />
              </div>
              <span className="rounded bg-amber-surface px-2 py-0.5 font-mono text-[10px] font-bold text-amber border border-amber-border">
                Friday Drive
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-ink-primary group-hover:text-amber transition-colors">
              ⚡ 72h Interview Prep Sprint
            </h4>
            <p className="mt-1 text-xs text-ink-secondary leading-snug">
              Condensed high-yield checklist for urgent campus drives closing in under 72 hours.
            </p>
          </div>

          {/* Action 4: 2-Min Defense */}
          <div
            onClick={() => onNavigate('defense')}
            className="group cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-emerald-border hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-surface text-emerald group-hover:scale-105 transition-transform">
                <Shield className="h-4 w-4" />
              </div>
              <span className="rounded bg-emerald-surface px-2 py-0.5 font-mono text-[10px] font-bold text-emerald border border-emerald-border">
                Text-Based
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-ink-primary group-hover:text-emerald transition-colors">
              🛡️ 2-Min Skill Proof Defense
            </h4>
            <p className="mt-1 text-xs text-ink-secondary leading-snug">
              Answer 3 fast architectural questions about your project to upgrade evidence to Assessment-Verified.
            </p>
          </div>

          {/* Action 5: Applications */}
          <div
            onClick={() => onNavigate('applications')}
            className="group cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-oxford-border hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-oxford-surface text-oxford group-hover:scale-105 transition-transform">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="rounded bg-oxford-surface px-2 py-0.5 font-mono text-[10px] font-bold text-oxford border border-oxford-border">
                {mockApplications.length} Active
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-ink-primary group-hover:text-oxford transition-colors">
              📋 Applications &amp; Status
            </h4>
            <p className="mt-1 text-xs text-ink-secondary leading-snug">
              Track pipeline milestones and submit source clarifications for UNKNOWN eligibility badges.
            </p>
          </div>

          {/* Action 6: Privacy Shield & Vault */}
          <div
            onClick={onOpenPrivacyVault}
            className="group cursor-pointer rounded-xl border border-border-hairline bg-surface p-4 shadow-2xs transition-all hover:border-iris-border hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-iris-surface text-iris group-hover:scale-105 transition-transform">
                <Lock className="h-4 w-4" />
              </div>
              <span className="rounded bg-subtle px-2 py-0.5 font-mono text-[10px] font-bold text-ink-secondary border border-border-hairline">
                DPDP Ready
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-ink-primary group-hover:text-iris transition-colors">
              🔒 Privacy Shield &amp; Resume Vault
            </h4>
            <p className="mt-1 text-xs text-ink-secondary leading-snug">
              Control per-company access switches, inspect immutable document versions, or export your full data archive.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

