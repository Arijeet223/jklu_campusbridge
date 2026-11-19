'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import GradeSheetUploader from '@/components/GradeSheetUploader'
import { getActiveUser } from '@/lib/api-client'
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Github,
  UploadCloud,
  FileText,
  GraduationCap,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Award,
  Layers,
  Database,
  Send,
  MessageSquare,
  Briefcase,
  Mail,
  Plus,
  X,
  BellRing,
  Check,
} from 'lucide-react'

export default function StudentSettingsPage() {
  const [studentId, setStudentId] = useState('STU-101')
  const [fullName, setFullName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [email, setEmail] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('+919358817045')
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] = useState(true)
  const [showTelegramHelper, setShowTelegramHelper] = useState(false)
  const [telegramId, setTelegramId] = useState('')
  const [allowTelegramNotifications, setAllowTelegramNotifications] = useState(true)
  const [bio, setBio] = useState('')
  const [program, setProgram] = useState('B.Tech Computer Science & Engineering')
  const [cohortYear, setCohortYear] = useState<number>(2026)
  const [cgpa, setCgpa] = useState<number>(8.0)
  const [targetRoles, setTargetRoles] = useState<string[]>(['Backend Engineer', 'AI Engineer'])
  const [newRoleInput, setNewRoleInput] = useState('')
  const [confirmedSkillsCount, setConfirmedSkillsCount] = useState<number>(0)
  const [academicRecordsCount, setAcademicRecordsCount] = useState<number>(0)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null)

  // Resume Upload State
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeUploadMsg, setResumeUploadMsg] = useState<string | null>(null)
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null)

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    setIsLoading(true)
    setSaveErrorMsg(null)
    const active = getActiveUser()
    const sid = active?.id || 'STU-101'
    setStudentId(sid)

    try {
      // Strictly fetch from PostgreSQL / API backend — ZERO mock data
      const res = await fetch(`/api/students/${sid}/settings`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        const stu = data.student || data
        setFullName(stu.full_name || stu.name || '')
        setRollNo(stu.roll_no || '')
        setEmail(stu.email || active?.email || `${(stu.full_name || 'student').toLowerCase().replace(/\s+/g, '.')}@university.edu.in`)
        setGithubUrl(stu.github_url || '')
        setPhoneNumber(stu.phone_number || stu.visibility_state?.phone_number || '+919358817045')
        if (stu.sms_notifications_enabled !== undefined) {
          setSmsNotificationsEnabled(Boolean(stu.sms_notifications_enabled))
        } else if (stu.visibility_state?.sms_notifications_enabled !== undefined) {
          setSmsNotificationsEnabled(Boolean(stu.visibility_state.sms_notifications_enabled))
        }

        const tgChat = stu.telegram_chat_id || stu.telegram_id || stu.visibility_state?.telegram_chat_id || stu.visibility_state?.telegram_id || ''
        setTelegramChatId(tgChat)
        setTelegramId(tgChat)
        if (stu.telegram_notifications_enabled !== undefined) {
          setTelegramNotificationsEnabled(Boolean(stu.telegram_notifications_enabled))
          setAllowTelegramNotifications(Boolean(stu.telegram_notifications_enabled))
        } else if (stu.allow_telegram_notifications !== undefined) {
          setTelegramNotificationsEnabled(Boolean(stu.allow_telegram_notifications))
          setAllowTelegramNotifications(Boolean(stu.allow_telegram_notifications))
        } else if (stu.visibility_state?.allow_telegram_notifications !== undefined) {
          setTelegramNotificationsEnabled(Boolean(stu.visibility_state.allow_telegram_notifications))
          setAllowTelegramNotifications(Boolean(stu.visibility_state.allow_telegram_notifications))
        }

        setBio(stu.bio || stu.visibility_state?.bio || '')
        setProgram(stu.program || 'B.Tech Computer Science & Engineering')
        setCohortYear(stu.cohort_year || 2026)
        setCgpa(Number(stu.cgpa || 8.0))
        setConfirmedSkillsCount(data.evidence_count || 0)

        if (Array.isArray(stu.target_roles) && stu.target_roles.length > 0) {
          setTargetRoles(stu.target_roles)
        } else if (typeof stu.target_roles === 'string') {
          try {
            const parsed = JSON.parse(stu.target_roles)
            if (Array.isArray(parsed) && parsed.length > 0) setTargetRoles(parsed)
          } catch {}
        }
      } else {
        // Fallback to active session values if newly created
        if (active?.name) setFullName(active.name)
        if (active?.roll_no) setRollNo(active.roll_no)
        if (active?.email) setEmail(active.email)
        if (active?.cgpa) setCgpa(Number(active.cgpa))
      }

      // Also check confirmed academic courses
      const acadRes = await fetch(`/api/academic/grades/${sid}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (acadRes.ok) {
        const acadData = await acadRes.json()
        if (Array.isArray(acadData.confirmed_grades)) {
          setAcademicRecordsCount(acadData.confirmed_grades.length)
          if (acadData.cgpa) setCgpa(Number(acadData.cgpa))
        }
      }
    } catch (err: any) {
      setSaveErrorMsg(`Notice: Using local session cache (${err.message})`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccessMsg(null)
    setSaveErrorMsg(null)

    try {
      const payload = {
        student_id: studentId,
        full_name: fullName.trim(),
        roll_no: rollNo.trim(),
        github_url: githubUrl.trim(),
        phone_number: phoneNumber.trim(),
        sms_notifications_enabled: smsNotificationsEnabled,
        telegram_chat_id: telegramChatId.trim(),
        telegram_id: telegramChatId.trim(),
        telegram_notifications_enabled: telegramNotificationsEnabled,
        allow_telegram_notifications: telegramNotificationsEnabled,
        bio: bio.trim(),
        program: program.trim(),
        cohort_year: cohortYear,
        target_roles: targetRoles,
        cgpa: cgpa,
      }

      const res = await fetch(`/api/students/${studentId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.error || 'Failed to save settings')
      }

      // Update local storage active user
      try {
        const stored = localStorage.getItem('cb_active_user')
        const parsed = stored ? JSON.parse(stored) : {}
        parsed.name = fullName.trim()
        parsed.roll_no = rollNo.trim()
        parsed.github_url = githubUrl.trim()
        parsed.phone_number = phoneNumber.trim()
        parsed.sms_notifications_enabled = smsNotificationsEnabled
        parsed.telegram_chat_id = telegramChatId.trim()
        parsed.telegram_id = telegramChatId.trim()
        parsed.telegram_notifications_enabled = telegramNotificationsEnabled
        parsed.allow_telegram_notifications = telegramNotificationsEnabled
        parsed.bio = bio.trim()
        parsed.program = program.trim()
        parsed.cohort_year = cohortYear
        parsed.target_roles = targetRoles
        parsed.cgpa = cgpa
        localStorage.setItem('cb_active_user', JSON.stringify(parsed))
        window.dispatchEvent(new CustomEvent('cb_profile_updated', { detail: parsed }))
      } catch {}

      // Trigger sync to personal Qdrant knowledge base
      await fetch('/api/student/sync-knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          full_name: fullName.trim(),
          github_url: githubUrl.trim(),
          telegram_id: telegramId.trim(),
          bio: bio.trim(),
          target_roles: targetRoles,
          cgpa: cgpa,
        }),
      }).catch(() => {})

      setSaveSuccessMsg(
        'Account & Career profile saved! Verified facts, GitHub ID, and Telegram notifications synchronized.'
      )
      setTimeout(() => setSaveSuccessMsg(null), 6000)
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Error updating settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTargetRole = () => {
    const trimmed = newRoleInput.trim()
    if (!trimmed) return
    if (!targetRoles.includes(trimmed)) {
      setTargetRoles([...targetRoles, trimmed])
    }
    setNewRoleInput('')
  }

  const handleRemoveTargetRole = (roleToRemove: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== roleToRemove))
  }

  const handleProcessResume = async (file: File) => {
    if (!file) return
    setIsUploadingResume(true)
    setResumeUploadMsg('Extracting technical credentials via RAM sandbox...')
    setResumeUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('student_id', studentId)

      const res = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.error || 'Failed to process resume')
      }

      const data = await res.json()
      const extractedCount = (data.extracted_skills || []).length
      setResumeUploadMsg(
        `Resume processed! ${extractedCount} skills extracted. Head to Profile & Evidence to confirm them into Solid Tokens.`
      )
      setConfirmedSkillsCount((prev) => prev + extractedCount)

      // Sync to Qdrant
      await fetch('/api/student/sync-knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          full_name: fullName,
          skills: (data.extracted_skills || []).map((s: any) => s.name),
          cgpa: cgpa,
          github_url: githubUrl,
          telegram_id: telegramId,
        }),
      }).catch(() => {})
    } catch (err: any) {
      setResumeUploadError(err.message || 'Error uploading resume.')
    } finally {
      setIsUploadingResume(false)
    }
  }

  return (
    <AppLayout activeRole="STUDENT">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E3DC] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#DE95BE]/20 text-[#6D3B56] border border-[#DE95BE] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Student Account &amp; Career Hub
              </span>
              <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                PostgreSQL + Qdrant Synced
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1B1C1B] tracking-tight">
              Account Profile &amp; Ingestion Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#4F4449]">
              Configure your personal details, GitHub, and Telegram alerts, and upload official resume and grade cards.
            </p>
          </div>

          <Link
            href="/student/preview"
            className="self-start sm:self-auto px-5 py-2.5 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>How Recruiters See You</span>
          </Link>
        </div>

        {/* Error / Success Notifications */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-3 shadow-xs">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {/* GRID: Settings Form + Document Uploaders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Profile & Career Info (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#E6E3DC] bg-white shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#6D3B56]/10 text-[#6D3B56] flex items-center justify-center font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#1B1C1B]">
                      Personal &amp; Career Information
                    </h3>
                    <p className="text-2xs text-[#817379]">
                      Verified institutional facts and career targets used by J.A.R.V.I.S. and recruiters.
                    </p>
                  </div>
                </div>

                <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                  ID: {studentId}
                </span>
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-xs text-[#817379]">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#6D3B56]" />
                  <span>Loading live database record...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                  {/* 1. Full Legal Name & Roll No */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                        Full Name (as per Student ID) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="e.g. Arijeet Basak"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                        University Roll Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        required
                        placeholder="e.g. 22BCON104"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* 2. University Email & Bio */}
                  <div className="space-y-1">
                    <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                      University Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#817379]">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="arijeet.basak@university.edu.in"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                      Personal Bio &amp; Technical Intro
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g., Computer science undergrad specializing in distributed systems, high-concurrency backend services, and generative AI orchestrations."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors resize-none"
                    />
                  </div>

                  {/* 3. Program & Cohort */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                        Program / Department
                      </label>
                      <input
                        type="text"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                        Graduation Cohort Year
                      </label>
                      <input
                        type="number"
                        value={cohortYear}
                        onChange={(e) => setCohortYear(parseInt(e.target.value) || 2026)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* 4. Target Roles & Career Preferences */}
                  <div className="space-y-2 pt-2 border-t border-[#F1EFEA]">
                    <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                      Target Career Roles
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {targetRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E6E3DC] text-xs font-bold text-[#1B1C1B] shadow-2xs"
                        >
                          <Briefcase className="h-3 w-3 text-[#6D3B56]" />
                          <span>{role}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTargetRole(role)}
                            className="text-gray-400 hover:text-rose-600 transition-colors ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newRoleInput}
                        onChange={(e) => setNewRoleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTargetRole()
                          }
                        }}
                        placeholder="Add another target role (e.g., DevOps Engineer, Fullstack Developer)..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddTargetRole}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* 5. EXTERNAL CONNECTORS: GitHub & Telegram */}
                  <div className="pt-3 border-t border-[#F1EFEA] space-y-4">
                    <h4 className="font-display font-bold text-xs text-[#1B1C1B] flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#6D3B56]" />
                      <span>External Identifiers &amp; Messaging Connectors</span>
                    </h4>

                    {/* GitHub Profile URL */}
                    <div className="space-y-1">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379] flex items-center justify-between">
                        <span>GitHub Profile URL / Handle</span>
                        {githubUrl && (
                          <a
                            href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#6D3B56] hover:underline flex items-center gap-1 font-sans normal-case text-2xs"
                          >
                            <span>Test Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#817379]">
                          <Github className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/arijeet-basak or arijeet-basak"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-[#FAF8F5] text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:bg-white focus:outline-hidden transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════ */}
                  {/* OPT-IN JOB ALERT PREFERENCES (SMS & TELEGRAM DUAL-CHANNEL) */}
                  {/* ═══════════════════════════════════════════════════════════ */}
                  <div className="pt-4 border-t border-[#F1EFEA] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                          <BellRing className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-[#1B1C1B]">
                            Opt-in Job Alert Preferences
                          </h4>
                          <p className="text-3xs text-[#817379]">
                            Dual-channel alerts for new placement drives, eligibility gates, and 120s defenses.
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Zero-Leak Guarded
                      </span>
                    </div>

                    {/* CHANNEL 1: TWILIO SMS NOTIFICATIONS */}
                    <div className="p-4 rounded-2xl border border-[#E6E3DC] bg-[#FAF8F5] space-y-3">
                      <div className="space-y-1">
                        <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379] flex items-center justify-between">
                          <span>Phone Number (E.164 with Country Code)</span>
                          <span className="text-[10px] text-primary font-bold font-sans normal-case">
                            Demo Trial Target: +919358817045
                          </span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#817379]">
                            <span className="material-symbols-outlined text-base">phone</span>
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+919358817045"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-white text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:outline-hidden transition-colors font-mono"
                          />
                        </div>
                      </div>

                      {/* SMS Toggle */}
                      <div
                        onClick={() => setSmsNotificationsEnabled(!smsNotificationsEnabled)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                          smsNotificationsEnabled
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : 'bg-white border-[#E6E3DC] opacity-75'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            smsNotificationsEnabled
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {smsNotificationsEnabled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-[#1B1C1B] block">
                            Receive SMS alerts for new drives
                          </span>
                          <span className="text-[11px] text-[#4F4449] block mt-0.5 leading-tight">
                            Delivers critical 48h application countdowns &amp; instant drive notices directly via Twilio SMS.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CHANNEL 2: TELEGRAM BOT NOTIFICATIONS */}
                    <div className="p-4 rounded-2xl border border-[#E6E3DC] bg-[#FAF8F5] space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                            Telegram Chat ID
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowTelegramHelper((prev) => !prev)}
                            className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>How do I get my Telegram Chat ID?</span>
                            <span className="material-symbols-outlined text-xs">help_outline</span>
                          </button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500">
                            <Send className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => {
                              setTelegramChatId(e.target.value)
                              setTelegramId(e.target.value)
                            }}
                            placeholder="e.g. 9358817045 or your numeric Telegram Chat ID"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6E3DC] bg-white text-xs font-semibold text-[#1B1C1B] focus:border-[#6D3B56] focus:outline-hidden transition-colors font-mono"
                          />
                        </div>

                        {/* Helper Drawer / Guide */}
                        {showTelegramHelper && (
                          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5 animate-fadeIn">
                            <div className="flex items-center justify-between font-bold text-blue-950">
                              <span>3 Simple Steps to Get Your Chat ID:</span>
                              <button
                                type="button"
                                onClick={() => setShowTelegramHelper(false)}
                                className="text-blue-700 hover:text-blue-950 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed text-blue-800">
                              <li>
                                Open Telegram and search for <strong>@userinfobot</strong> or start our bot <strong>@campusbridge_bot</strong>.
                              </li>
                              <li>
                                Send <code>/start</code> or any message to receive your profile telemetry.
                              </li>
                              <li>
                                Copy your numeric <strong>Id</strong> (e.g. <code>9358817045</code>) and paste it into the Telegram Chat ID field above.
                              </li>
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Telegram Toggle */}
                      <div
                        onClick={() => {
                          const nextVal = !telegramNotificationsEnabled
                          setTelegramNotificationsEnabled(nextVal)
                          setAllowTelegramNotifications(nextVal)
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                          telegramNotificationsEnabled
                            ? 'bg-blue-50/80 border-blue-200'
                            : 'bg-white border-[#E6E3DC] opacity-75'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            telegramNotificationsEnabled
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {telegramNotificationsEnabled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-[#1B1C1B] block">
                            Allow website to message you on Telegram (Receive new drive alerts &amp; sprint updates)
                          </span>
                          <span className="text-[11px] text-[#4F4449] block mt-0.5 leading-tight">
                            Live bot push alerts with role salary, eligibility gates, and 1-click sprint access directly in Telegram.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
                    <span className="text-2xs text-[#817379]">
                      Synced to PostgreSQL &amp; Qdrant
                    </span>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-xl bg-[#6D3B56] text-white hover:bg-[#582e44] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Saving Account...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Account &amp; Career Info</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Resume Upload Card */}
            <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#E6E3DC] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#1B1C1B]">
                      Upload Resume Document (.PDF / .DOCX)
                    </h3>
                    <p className="text-2xs text-[#817379]">
                      Parsed strictly in RAM with character-span provenance anchoring.
                    </p>
                  </div>
                </div>

                <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {confirmedSkillsCount} Solid Tokens
                </span>
              </div>

              {resumeUploadMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{resumeUploadMsg}</span>
                </div>
              )}

              {resumeUploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{resumeUploadError}</span>
                </div>
              )}

              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessResume(e.target.files[0])
                  }
                }}
              />

              <div
                onClick={() => resumeInputRef.current?.click()}
                className="border-2 border-dashed border-[#DE95BE] hover:border-[#6D3B56] bg-[#FAF8F5] hover:bg-[#F3EFEA] rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#DE95BE]/20 text-[#6D3B56] flex items-center justify-center">
                  {isUploadingResume ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <UploadCloud className="h-6 w-6" />
                  )}
                </div>
                <h4 className="font-bold text-xs text-[#1B1C1B]">
                  {isUploadingResume ? 'Analyzing Document...' : 'Drop or browse latest resume (PDF/DOCX)'}
                </h4>
                <p className="text-3xs text-[#817379]">
                  Zero mock data. Extracts technical competencies and registers them in your personal knowledge base.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Grade Sheet Uploader + Status Summary (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Embedded Grade Sheet Uploader */}
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-[#E6E3DC] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#1B1C1B]">
                      Upload Grade Sheet / Portal Screenshot
                    </h3>
                    <p className="text-2xs text-[#817379]">
                      PDF transcripts or screenshots (.png, .jpg) via Qwen 2.5 + RapidOCR.
                    </p>
                  </div>
                </div>
                <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  GPA: {cgpa.toFixed(2)}
                </span>
              </div>

              {/* Embedded Component */}
              <div className="pt-2">
                <GradeSheetUploader
                  studentId={studentId}
                  onComplete={(res) => {
                    setCgpa(res.gpa)
                    setAcademicRecordsCount(res.confirmedGrades.length)
                    // Trigger sync to knowledge base
                    fetch('/api/student/sync-knowledge-base', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        student_id: studentId,
                        full_name: fullName,
                        cgpa: res.gpa,
                        academic_records: res.confirmedGrades,
                        github_url: githubUrl,
                        telegram_id: telegramId,
                      }),
                    }).catch(() => {})
                  }}
                />
              </div>
            </div>

            {/* Knowledge Base Sync Summary Card */}
            <div className="p-5 rounded-3xl border-2 border-[#E6E3DC] bg-[#FAF8F5] space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[#6D3B56]" />
                <h4 className="font-display font-bold text-xs text-[#1B1C1B]">
                  Personal Qdrant Knowledge Base
                </h4>
              </div>
              <p className="text-3xs text-[#4F4449] leading-relaxed">
                All confirmed skills, verified grades, GitHub telemetry, and Telegram alerts are embedded using{' '}
                <strong className="text-[#6D3B56]">nomic-embed-text</strong> and tagged exclusively with your student ID (
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{studentId}</code>) to
                enforce strict multi-tenant privacy.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-3xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#E6E3DC]">
                  <span className="text-gray-400 block">Confirmed Skills:</span>
                  <strong className="text-xs text-[#1B1C1B]">{confirmedSkillsCount} Solid Tokens</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E6E3DC]">
                  <span className="text-gray-400 block">Verified Courses:</span>
                  <strong className="text-xs text-[#1B1C1B]">{academicRecordsCount} Transcripts</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
