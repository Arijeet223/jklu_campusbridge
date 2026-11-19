'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Skill, ReadinessDimension, ResumeVersion } from '@/lib/types'
import { mockReadinessDimensions, mockResumeVersions } from '@/lib/mock-data'
import { computeReadinessProfile } from '@/lib/readiness-calculator'
import GradeSheetUploader from './GradeSheetUploader'

interface StudentHomeDashboardProps {
  studentId?: string
  studentName?: string
  cgpa?: number
  branch?: string
  institution?: string
  skills?: Skill[]
  onNavigate?: (view: 'skills' | 'sandbox' | 'sprint' | 'defense' | 'applications') => void
  onOpenPrivacyVault?: () => void
  onUploadResume?: (fileName: string, newSkills: Skill[]) => void
  onOpenSourceDoc?: (docId: string) => void
}

export default function StudentHomeDashboard({
  studentId = 'STU-101',
  studentName = 'Aarav Sharma',
  cgpa = 8.42,
  branch = 'B.Tech CSE',
  institution = 'JKLU (JK Lakshmipat University)',
  skills = [],
  onNavigate,
  onOpenPrivacyVault,
  onUploadResume,
  onOpenSourceDoc,
}: StudentHomeDashboardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [latestDocId, setLatestDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local skills state initialized strictly from current student's database/props
  const [localSkills, setLocalSkills] = useState<Skill[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('cb_active_user')
        const activeId = storedUser ? JSON.parse(storedUser)?.id || 'STU-101' : 'STU-101'
        const stored = localStorage.getItem(`cb_user_skills_${activeId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) return parsed
        }
      } catch { }
    }
    return skills || []
  })

  // Synchronize when external skills prop changes
  useEffect(() => {
    setLocalSkills(skills || [])
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('cb_active_user')
        const activeId = storedUser ? JSON.parse(storedUser)?.id || 'STU-101' : 'STU-101'
        localStorage.setItem(`cb_user_skills_${activeId}`, JSON.stringify(skills || []))
      } catch { }
    }
  }, [skills])

  // Synchronize strictly with active student ID on mount
  useEffect(() => {
    let activeId = 'STU-101'
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_active_user')
        if (stored) {
          const u = JSON.parse(stored)
          if (u.id) activeId = u.id
          if (u.cgpa !== undefined) setCurrentCgpa(Number(u.cgpa))
        }
      } catch { }
    }

    fetch(`/api/students/${activeId}/evidence`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setLocalSkills(data)
          if (typeof window !== 'undefined') {
            localStorage.setItem(`cb_user_skills_${activeId}`, JSON.stringify(data))
          }
        }
      })
      .catch(() => { })
  }, [])

  // Real-time listener for skill changes (e.g. from profile-evidence or home)
  useEffect(() => {
    const handleSkillsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLocalSkills(e.detail)
      } else if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('cb_active_user')
          const activeId = storedUser ? JSON.parse(storedUser)?.id || 'STU-101' : 'STU-101'
          const stored = localStorage.getItem(`cb_user_skills_${activeId}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) setLocalSkills(parsed)
          }
        } catch { }
      }
    }

    window.addEventListener('cb_skills_updated', handleSkillsUpdated)
    window.addEventListener('storage', handleSkillsUpdated)
    return () => {
      window.removeEventListener('cb_skills_updated', handleSkillsUpdated)
      window.removeEventListener('storage', handleSkillsUpdated)
    }
  }, [])

  // Academic Grade Sheet & Performance Scoring state
  const [currentCgpa, setCurrentCgpa] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_active_user')
        if (stored) {
          const u = JSON.parse(stored)
          if (u.cgpa !== undefined) return Number(u.cgpa)
        }
      } catch { }
    }
    return cgpa ?? 0.0
  })

  const [academicStanding, setAcademicStanding] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_active_user')
        if (stored) {
          const u = JSON.parse(stored)
          if (u.academic_standing) return u.academic_standing
        }
      } catch { }
    }
    return 'EXCELLENT'
  })

  const [academicRecordsCount, setAcademicRecordsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_academic_records')
        if (stored) {
          const arr = JSON.parse(stored)
          if (Array.isArray(arr)) return arr.length
        }
      } catch { }
    }
    return 0
  })

  const [showGradeSheetModal, setShowGradeSheetModal] = useState(false)
  const [showRecruiterViewModal, setShowRecruiterViewModal] = useState(false)
  const [previewSkillsExpanded, setPreviewSkillsExpanded] = useState(false)
  const [vaultTab, setVaultTab] = useState<'RESUME' | 'GRADES'>('RESUME')

  // Real-time listener for academic changes
  useEffect(() => {
    const handleAcademicsUpdated = (e: any) => {
      if (e.detail?.cgpa !== undefined) {
        setCurrentCgpa(Number(e.detail.cgpa))
      }
      if (e.detail?.academicStanding) {
        setAcademicStanding(e.detail.academicStanding)
      }
      if (Array.isArray(e.detail?.records)) {
        setAcademicRecordsCount(e.detail.records.length)
      }
    }

    window.addEventListener('cb_academics_updated', handleAcademicsUpdated)
    return () => {
      window.removeEventListener('cb_academics_updated', handleAcademicsUpdated)
    }
  }, [])

  // Dynamic mathematical readiness calculation grounded in active skills & CGPA
  const readinessProfile = computeReadinessProfile(localSkills, currentCgpa)
  const overallReadiness = readinessProfile.overallReadiness

  const verifiedSkills = localSkills.filter(
    (s) =>
      s.evidenceStatus === 'INSTITUTION_VERIFIED' ||
      s.evidenceStatus === 'ASSESSMENT_VERIFIED' ||
      s.evidenceStatus === 'STUDENT_CONFIRMED',
  )

  const handleUploadDocument = async (file: File) => {
    setIsProcessingFile(true)
    setUploadNotice(`Parsing and scanning "${file.name}" with Vercel Serverless Parser in isolated sandbox...`)

    try {
      let activeId = studentId || 'STU-101'
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cb_active_user')
          if (stored) {
            const u = JSON.parse(stored)
            if (u.id) activeId = u.id
          }
        } catch { }
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('student_id', activeId)

      const res = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        const extracted: Skill[] = (data.extracted_skills || []).map((sk: any, i: number) => ({
          id: sk.id || `sk_upload_${Date.now()}_${i}`,
          name: sk.name,
          category: sk.category,
          proficiency: sk.proficiency || 'Advanced',
          evidenceStatus: 'EXTRACTED',
          sourceDocumentId: data.document_id || 'doc_resume_v4',
          sourceSpan: sk.sourceSpan || `${file.name} • p.${sk.sourcePage || 1}`,
          sourcePage: sk.sourcePage || 1,
          confidence: sk.confidence || 0.94,
        }))

        // 1. Record new version into cb_resume_versions in localStorage
        let existingVersions: ResumeVersion[] = []
        try {
          const storedVersions = localStorage.getItem('cb_resume_versions')
          if (storedVersions) existingVersions = JSON.parse(storedVersions)
        } catch { }
        if (!existingVersions.length) existingVersions = [...mockResumeVersions]

        const nextVersionNum = existingVersions.length + 1
        const newVersion: ResumeVersion = {
          id: `rv_${Date.now()}`,
          versionNumber: nextVersionNum,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          extractedSkillsCount: extracted.length,
          sourceDocumentId: data.document_id || `doc_resume_v${nextVersionNum}`,
          isCurrent: true,
        }
        const updatedVersions = [newVersion, ...existingVersions.map((v) => ({ ...v, isCurrent: false }))]
        localStorage.setItem('cb_resume_versions', JSON.stringify(updatedVersions))

        // 2. Merge extracted skills with localSkills (Ghost Cards)
        const updatedSkills = [...localSkills]
        for (const es of extracted) {
          const idx = updatedSkills.findIndex(
            (s) => s.name.toLowerCase() === es.name.toLowerCase(),
          )
          if (idx >= 0) {
            updatedSkills[idx] = es
          } else {
            updatedSkills.unshift(es)
          }
        }
        setLocalSkills(updatedSkills)
        localStorage.setItem('cb_user_skills', JSON.stringify(updatedSkills))
        window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: updatedSkills }))

        // 3. Save document text to cb_uploaded_documents for inspection
        const docRecordId = data.document_id || `doc_resume_v${nextVersionNum}`
        const docRecord = {
          id: docRecordId,
          fileName: file.name,
          pageNumber: 1,
          uploadedAt: new Date().toISOString(),
          fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          fullText: data.raw_text || `Resume text for ${file.name}\n\nExtracted Skills:\n${extracted.map((s: Skill) => `• ${s.name} (${s.proficiency}) - ${s.sourceSpan}`).join('\n')}`,
          highlightedText: extracted[0]?.name || 'SQL',
        }
        try {
          const storedDocs = JSON.parse(localStorage.getItem('cb_uploaded_documents') || '{}')
          storedDocs[docRecordId] = docRecord
          localStorage.setItem('cb_uploaded_documents', JSON.stringify(storedDocs))
        } catch { }

        setLatestDocId(docRecordId)

        if (onUploadResume) {
          onUploadResume(file.name, extracted)
        }
        setIsProcessingFile(false)
        setUploadNotice(
          `Successfully uploaded and parsed "${file.name}"! Found ${extracted.length} provisional skills (Ghost Cards). Resume history updated & scores recalculated!`,
        )
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to process document' }))
        setUploadNotice(`Upload error: ${err.detail || 'Could not parse PDF'}`)
        setIsProcessingFile(false)
      }
    } catch (e: any) {
      setUploadNotice(`Upload error: ${e.message || 'Connection error'}`)
      setIsProcessingFile(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadDocument(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadDocument(e.target.files[0])
    }
  }

  return (
    <div className="space-y-7 pb-12 font-body-md text-on-surface">
      {/* Upload Notification Toast */}
      {uploadNotice && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-tertiary-fixed-dim bg-tertiary-container/40 p-4 text-xs font-semibold text-on-tertiary-container shadow-[0_3px_0_#c3ecd6] animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-tertiary">check_circle</span>
            <span>{uploadNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {latestDocId && (
              <button
                type="button"
                onClick={() => onOpenSourceDoc?.(latestDocId)}
                className="px-3 py-1 bg-secondary text-on-secondary rounded-full text-xs font-bold shadow-[0_2px_0_#2b5b75] hover:brightness-105 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">find_in_page</span>
                <span>Inspect Resume Text →</span>
              </button>
            )}
            <Link
              href="/student/profile-evidence"
              className="px-3 py-1 bg-primary text-on-primary rounded-full text-xs font-bold shadow-[0_2px_0_#320e26] hover:brightness-105"
            >
              Review Ghost Cards →
            </Link>
            <Link
              href="/student/privacy-shield"
              className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface rounded-full text-xs font-bold hover:bg-surface-container-high"
            >
              Resume History →
            </Link>
            <button
              type="button"
              onClick={() => setUploadNotice(null)}
              className="text-[11px] underline hover:text-on-surface ml-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HERO GREETING BANNER & QUICK ACTIONS                    */}
      {/* ========================================================= */}
      <section className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 lg:p-8 shadow-[0_4px_0_#EAD7E2] relative overflow-hidden bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest to-primary-container/20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim text-label-sm font-label-sm mb-3 shadow-[0_2px_0_#a8ccde] max-w-full">
              <span className="material-symbols-outlined text-sm shrink-0">schedule</span>
              <span className="truncate">Placement Sprint Window • 48h Countdown Active • {institution}</span>
            </div>
            <h1 className="text-headline-lg lg:text-headline-xl font-headline-xl text-on-surface tracking-tight font-extrabold break-words">
              Welcome back, {studentName}! 🚀
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-2xl">
              You have 2 campus drives closing in less than 48 hours. Let&apos;s lock in your proof tokens with deterministic 120s defenses!
            </p>
          </div>

          {/* Quick Action Capsule Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRecruiterViewModal(true)}
              className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3.5 rounded-full border border-on-primary-fixed-variant shadow-[0_4px_0_#320e26] active:translate-y-[3px] active:shadow-[0_1px_0_#320e26] transition-all flex items-center gap-2 hover:brightness-105 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>How Recruiters See You</span>
            </button>

            <Link
              href="/student/settings"
              className="bg-surface-container-low text-on-surface font-label-lg text-label-lg px-5 py-3.5 rounded-full border border-outline-variant shadow-[0_3px_0_#d3c2c9] active:translate-y-[2px] active:shadow-[0_1px_0_#d3c2c9] transition-all flex items-center gap-2.5 hover:bg-surface-container group"
              title="Manage personal credentials, career targets, GitHub, Telegram, Resume, and Grade Cards"
            >
              <div className="h-6 w-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs border border-outline-variant shadow-2xs group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-sm">account_circle</span>
              </div>
              <span>Account &amp; Career Info</span>
            </Link>
          </div>
        </div>

        {/* 4-COLUMN KPI BENTO CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-dashed border-outline-variant/50">
          {/* Card 1: Overall Readiness Index */}
          <div className="bg-tertiary-container/30 border-[1.5px] border-tertiary-fixed-dim rounded-2xl p-5 shadow-[0_3px_0_#c3ecd6] transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-label-md text-tertiary font-bold">Overall Readiness Index</span>
              <span className="material-symbols-outlined text-tertiary">insights</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-headline-lg font-headline-lg text-on-surface font-extrabold">{overallReadiness}%</span>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                +12% this week
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-tertiary-container mt-1 font-medium">RazorpayX &amp; Atlassian Target</p>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: `${overallReadiness}%` }}></div>
            </div>
          </div>

          {/* Card 2: Verified Skill Proofs */}
          <div className="bg-secondary-container/35 border-[1.5px] border-secondary-fixed-dim rounded-2xl p-5 shadow-[0_3px_0_#c1e5f8] transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-label-md text-secondary font-bold">Verified Skill Proofs</span>
              <span className="material-symbols-outlined text-secondary">verified</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-headline-lg font-headline-lg text-on-surface font-extrabold">
                {`${verifiedSkills.length} / ${localSkills.length}`}
              </span>
              <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                {localSkills.length > 0 ? Math.round((verifiedSkills.length / localSkills.length) * 100) : 75}% Locked
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-secondary-container mt-1 font-medium">Solid 1.0x Tokens Locked</p>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${localSkills.length > 0 ? Math.round((verifiedSkills.length / localSkills.length) * 100) : 75}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Active Sprint Target */}
          <div className="bg-primary-container/35 border-[1.5px] border-outline-variant rounded-2xl p-5 shadow-[0_3px_0_#EAD7E2] transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-label-md text-primary font-bold">Active Sprint Target</span>
              <span className="material-symbols-outlined text-primary">track_changes</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-headline-md font-headline-md text-on-surface font-extrabold">RazorpayX</span>
              <span className="bg-primary text-on-primary text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                72h Active
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-primary-container mt-1 font-medium">72h Backend Sprint • 2 Quests Remaining</p>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
            </div>
          </div>

          {/* Card 4: Verified Academic Standing & CGPA */}
          <div className="bg-surface-container-low border-[1.5px] border-outline-variant rounded-2xl p-5 shadow-[0_3px_0_#d3c2c9] transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-label-md text-on-surface-variant font-bold">Academic Standing</span>
              <span className="material-symbols-outlined text-secondary">school</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-headline-lg font-headline-lg text-on-surface font-extrabold">{currentCgpa.toFixed(2)}</span>
              <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                {academicStanding}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-body-sm font-body-sm text-outline font-medium">
                {academicRecordsCount > 0 ? `${academicRecordsCount} Courses Verified` : 'Deterministic Scoring'}
              </p>
              <Link
                href="/student/settings"
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                {academicRecordsCount > 0 ? 'Update' : 'Upload'} →
              </Link>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((currentCgpa / 10) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. MAIN 2-COLUMN WORKSPACE GRID (7 COL / 5 COL)           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* LEFT COLUMN: Urgent Deadlines & Sprint Tasks (7 Columns) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">alarm</span>
              <h2 className="text-headline-md font-headline-md text-on-surface tracking-tight font-extrabold">
                Urgent Deadlines (Next 48 Hours)
              </h2>
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant font-bold">
              2 Priority Drives Active
            </span>
          </div>

          {/* Drive Card 1: RazorpayX Labs */}
          <div className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 shadow-[0_4px_0_#EAD7E2] transition-all hover:shadow-[0_6px_0_#DE95BE]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm border border-outline-variant">
                    RX
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold">
                    RazorpayX Labs — SDE-1 Backend
                  </h3>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">
                  Compensation Target: ₹18–22 LPA • Backend Infrastructure Core
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-sm font-label-sm border border-outline-variant font-bold shadow-[0_2px_0_#DE95BE] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">timer</span>
                  <span>Closes in 28h</span>
                </span>
                <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-label-sm font-label-sm border border-tertiary-fixed-dim font-bold shadow-[0_2px_0_#a8cfbb]">
                  85% Projected Fit
                </span>
              </div>
            </div>

            {/* Proof Checklist Section */}
            <div className="mt-5 space-y-3 bg-surface rounded-2xl p-4 border border-outline-variant/60">
              <span className="text-label-sm font-label-sm text-on-surface-variant tracking-wider uppercase font-bold">
                Sprint Gate Checklist:
              </span>

              {/* Checklist Item 1: Complete */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-[0_2px_0_#f0b6d5] gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-base">check</span>
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface font-bold truncate">
                    FastAPI Redis Idempotency 120s Defense
                  </span>
                </div>
                <span className="text-label-sm font-label-sm text-tertiary bg-tertiary-container/40 px-2.5 py-0.5 rounded-full border border-tertiary-fixed-dim font-bold shrink-0 whitespace-nowrap">
                  1.0x Solid Locked
                </span>
              </div>

              {/* Checklist Item 2: Pending Attention */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-primary-container shadow-[0_2px_0_#DE95BE] gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-base">priority_high</span>
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface font-bold truncate">
                    SQL DENSE_RANK() Windowing Quest
                  </span>
                </div>
                <span className="text-label-sm font-label-sm text-primary bg-primary-fixed/50 px-2.5 py-0.5 rounded-full border border-outline-variant font-bold shrink-0 whitespace-nowrap">
                  Estimated 15m
                </span>
              </div>
            </div>

            {/* Quick Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-outline-variant/50">
              <Link
                href="/student/arena"
                className="bg-primary text-on-primary font-label-lg text-label-lg px-5 py-2.5 rounded-full border border-on-primary-fixed-variant shadow-[0_3px_0_#320e26] active:translate-y-[2px] active:shadow-[0_1px_0_#320e26] transition-all flex items-center gap-2 hover:brightness-105"
              >
                <span>Jump to SQL Quest</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
              <Link
                href="/student/sprint-plan"
                className="bg-surface-container text-on-surface font-label-md text-label-md px-4 py-2.5 rounded-full border border-outline-variant shadow-[0_2px_0_#d3c2c9] active:translate-y-[1px] transition-all hover:bg-surface-container-high flex items-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Launch 72h Sprint</span>
              </Link>
            </div>
          </div>

          {/* Drive Card 2: Atlassian Systems Engineer */}
          <div className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 shadow-[0_4px_0_#EAD7E2] transition-all hover:shadow-[0_6px_0_#B6D9EC]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-label-sm border border-secondary-fixed-dim">
                    AT
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold">
                    Atlassian — Systems Engineer
                  </h3>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">
                  Compensation Target: ₹24–28 LPA • Distributed Systems Platform
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-sm border border-secondary-fixed-dim font-bold shadow-[0_2px_0_#85B5CE] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  <span>Closes in 44h</span>
                </span>
                <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full text-label-sm font-label-sm border border-outline-variant font-bold">
                  78% Projected Fit
                </span>
              </div>
            </div>

            {/* TPO Exception Verified Pill */}
            <div className="mt-4 p-3 rounded-2xl bg-tertiary-container/30 border border-tertiary-fixed-dim flex items-center gap-2.5">
              <span className="material-symbols-outlined text-tertiary text-lg font-bold">verified_user</span>
              <p className="text-body-sm font-body-sm text-on-tertiary-container font-medium">
                <strong className="font-bold">TPO Gate Clearance:</strong> Minor in CS Equivalence Approved by Prof. Menon ✓
              </p>
            </div>

            {/* Checklist Item & Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-outline-variant/50">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="material-symbols-outlined text-secondary text-lg shrink-0">add_task</span>
                <span className="text-body-sm font-body-sm text-on-surface font-bold truncate">
                  Optional: Solve Concurrency Deadlock Proof (+6% boost)
                </span>
              </div>
              <Link
                href="/student/arena"
                className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-5 py-2.5 rounded-full border border-secondary-fixed-dim shadow-[0_3px_0_#85B5CE] active:translate-y-[2px] transition-all flex items-center gap-1.5 hover:brightness-95 font-bold shrink-0"
              >
                <span>Start Proof Defense</span>
                <span className="material-symbols-outlined text-base">play_arrow</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Daily Streak & Proof Multiplier Quest Deck */}
          <div className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 shadow-[0_4px_0_#EAD7E2] flex flex-col md:flex-row items-center justify-between gap-5 bg-gradient-to-r from-surface-container-lowest to-surface-container-low">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center border border-outline-variant shadow-[0_3px_0_#DE95BE]">
                <span className="material-symbols-outlined text-3xl text-primary">local_fire_department</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-headline-sm font-headline-sm text-on-surface font-extrabold">5-Day Defense Streak!</h4>
                  <span className="bg-primary text-on-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold">
                    1.25x Multiplier
                  </span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                  Solve 1 micro-defense before midnight to keep your automated recruiter badge active.
                </p>
              </div>
            </div>
            <Link
              href="/student/arena"
              className="whitespace-nowrap bg-primary-container text-on-primary-container font-label-lg text-label-lg px-6 py-3 rounded-full border border-outline-variant shadow-[0_3px_0_#DE95BE] active:translate-y-[2px] transition-all hover:bg-primary-fixed font-bold"
            >
              Play Micro-Quest (5m)
            </Link>
          </div>
        </section>

        {/* RIGHT COLUMN: AI Coach Insights & Readiness Radar (5 Columns) */}
        <section className="lg:col-span-5 space-y-6">
          {/* Card 1: Readiness Radar & Dimensional Progress */}
          <div className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 lg:p-7 shadow-[0_4px_0_#EAD7E2]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl font-bold">radar</span>
                <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold">Readiness Radar</h3>
              </div>
              <span className="text-label-sm font-label-sm bg-surface-container px-3 py-1 rounded-full border border-outline-variant font-bold text-on-surface-variant">
                6 Dimensions
              </span>
            </div>

            {/* Hexagonal Radar Visualizer */}
            <div className="relative py-2 flex justify-center items-center">
              <svg className="w-64 h-64 overflow-visible" viewBox="0 0 240 240">
                <polygon
                  fill="none"
                  points="120,20 206,70 206,170 120,220 34,170 34,70"
                  stroke="#e4e2e0"
                  strokeDasharray="3,3"
                  strokeWidth="1.5"
                ></polygon>
                <polygon
                  fill="none"
                  points="120,50 180,85 180,155 120,190 60,155 60,85"
                  stroke="#e4e2e0"
                  strokeWidth="1.5"
                ></polygon>
                <polygon
                  fill="none"
                  points="120,80 154,100 154,140 120,160 86,140 86,100"
                  stroke="#e4e2e0"
                  strokeWidth="1.5"
                ></polygon>
                <line stroke="#d3c2c9" strokeWidth="1" x1="120" x2="120" y1="120" y2="20"></line>
                <line stroke="#d3c2c9" strokeWidth="1" x1="120" x2="206" y1="120" y2="70"></line>
                <line stroke="#d3c2c9" strokeWidth="1" x1="120" x2="206" y1="120" y2="170"></line>
                <line stroke="#d3c2c9" strokeWidth="1" x1="120" x2="120" y1="120" y2="220"></line>
                <line stroke="#d3c2c9" strokeWidth="1" x1="120" x2="34" y1="120" y2="170"></line>
                <line stroke="#d3c2c9" strokeWidth="1" x1="120" x2="34" y1="120" y2="70"></line>
                {/* Dynamic mathematical student data polygon */}
                <polygon
                  fill="#f0b6d5"
                  fillOpacity="0.45"
                  points={readinessProfile.radarPoints}
                  stroke="#7e506b"
                  strokeWidth="2.5"
                ></polygon>
                {readinessProfile.radarCircles.map((circle, idx) => (
                  <circle
                    key={idx}
                    cx={circle.cx}
                    cy={circle.cy}
                    fill={circle.color}
                    r="4.5"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>

            {/* Dynamic Mathematical Dimension Breakdown List */}
            <div className="space-y-3 mt-4">
              {readinessProfile.dimensionList.map((dim) => {
                const isSql = dim.id === 'sql'
                if (dim.isAttentionNeeded) {
                  return (
                    <div
                      key={dim.id}
                      className="p-2.5 rounded-xl bg-error-container/40 border border-error/20 transition-all"
                    >
                      <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                        <span className="flex items-center gap-1.5 text-error">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          <span>{dim.label}</span>
                        </span>
                        <span className="text-error font-bold">{dim.statusLabel}</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-error rounded-full transition-all duration-500"
                          style={{ width: `${dim.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={dim.id}
                    className={
                      isSql
                        ? 'p-2.5 rounded-xl bg-tertiary-container/20 border border-tertiary-fixed-dim/40 transition-all'
                        : ''
                    }
                  >
                    <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                      <span className={isSql ? 'flex items-center gap-1.5 text-tertiary' : ''}>
                        {isSql && (
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                        )}
                        <span>{dim.label}</span>
                      </span>
                      <span className={`${dim.statusColor} font-bold`}>{dim.statusLabel}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full ${dim.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${dim.score}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 2: Recent AI Coach Insights */}
          <div className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 shadow-[0_4px_0_#EAD7E2] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-headline-sm border border-secondary-fixed-dim shadow-[0_2px_0_#85B5CE]">
                  🤖
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-tertiary rounded-full border-2 border-surface-container-lowest"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-headline-sm font-headline-sm text-on-surface font-extrabold">J.A.R.V.I.S. Coach</h4>
                  <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold">
                    Active Assistant
                  </span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Real-time Placement Model Analysis</p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/60 shadow-inner">
              <p className="text-body-sm font-body-sm text-on-surface leading-relaxed">
                {verifiedSkills.length === 0 ? (
                  <>
                    &ldquo;{studentName || 'Student'}, your profile currently has 0 confirmed skills. Ingest your technical resume or grade card in{' '}
                    <strong className="font-bold text-primary">Account & Career Info</strong> to build your verified knowledge base and unlock personalized placement scoring.&rdquo;
                  </>
                ) : readinessProfile.dimensions.sql.score < 70 ? (
                  <>
                    &ldquo;{studentName || 'Student'}, completing the <strong className="font-bold text-primary">DENSE_RANK() SQL quest</strong> or confirming skills from your parsed resume will push your Database score past 70% and unlock the <strong className="font-bold">80% automated interview shortlist threshold</strong>.&rdquo;
                  </>
                ) : (
                  <>
                    &ldquo;{studentName || 'Student'}, excellent work! Your verified <strong className="font-bold text-tertiary">SQL score is now {readinessProfile.dimensions.sql.score}% (Proficient ✓)</strong>. You have surpassed the automated shortlist threshold for your active placement targets!&rdquo;
                  </>
                )}
              </p>
            </div>

            <div className="mt-5">
              <Link
                href="/student/arena"
                className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-3 rounded-full border border-on-primary-fixed-variant shadow-[0_4px_0_#320e26] active:translate-y-[2px] active:shadow-[0_1px_0_#320e26] transition-all flex items-center justify-center gap-2 hover:brightness-105 font-bold"
              >
                <span className="material-symbols-outlined text-base">bolt</span>
                <span>Practice SQL Now (15 mins)</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* 3. RESUME UPLOAD & PROVISIONAL SKILL INGESTION DOCK       */}
      {/* ========================================================= */}
      <section className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 lg:p-8 shadow-[0_4px_0_#EAD7E2]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-extrabold tracking-tight">
              Ingestion Vault: Resumes &amp; Academic Grade Sheets
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              In-memory parsing with zero disk leakage. Extract technical skills and calculate certified GPAs deterministically.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenSourceDoc?.(latestDocId || 'doc_resume_v3')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-primary text-on-primary shadow-[0_2px_0_#320e26] hover:brightness-105 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Inspect Current Resume</span>
            </button>
            <Link
              href="/student/privacy-shield"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
              <span>Manage Access &amp; History</span>
            </Link>
          </div>
        </div>

        {/* Ingestion Vault Tabs */}
        <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-3 mb-4">
          <button
            type="button"
            onClick={() => setVaultTab('RESUME')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${vaultTab === 'RESUME'
              ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined text-sm">description</span>
            <span>Technical Resume (PDF / DOCX)</span>
          </button>
          <button
            type="button"
            onClick={() => setVaultTab('GRADES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${vaultTab === 'GRADES'
              ? 'bg-secondary text-on-secondary shadow-[0_2px_0_#2b5b75]'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined text-sm">school</span>
            <span>Academic Grade Sheet (PDF / Screenshot)</span>
            {academicRecordsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                ✓ {currentCgpa.toFixed(2)}
              </span>
            )}
          </button>
        </div>

        {vaultTab === 'RESUME' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${isDragging
              ? 'border-primary bg-primary-container/20 shadow-md'
              : 'border-outline-variant bg-surface-container-low hover:border-secondary hover:bg-secondary-container/10'
              }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center border border-secondary-fixed-dim shadow-[0_2px_0_#85B5CE]">
                <span className="material-symbols-outlined text-2xl text-secondary">cloud_upload</span>
              </div>
              <p className="text-body-md font-body-md text-on-surface font-bold mt-1">
                {isProcessingFile ? 'Processing document...' : 'Drop your latest resume PDF here, or click to browse'}
              </p>
              <p className="text-body-sm font-body-sm text-outline">
                Automatic text extraction, character-span provenance anchoring &amp; FERPA-guarded sandbox.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
            <GradeSheetUploader
              studentId={studentId}
              onComplete={(res) => {
                setCurrentCgpa(res.gpa)
                setAcademicStanding(res.academicStanding)
                setAcademicRecordsCount(res.confirmedGrades.length)
              }}
            />
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. EXPLORE YOUR FUNCTIONAL WORKSPACES                      */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <h2 className="text-headline-sm font-headline-sm text-on-surface font-extrabold tracking-tight">
          Explore Your Functional Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            href="/student/profile-evidence"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#DE95BE] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-sm border border-outline-variant mb-4">
              ✨
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-primary transition-colors">
              Review My Skills
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Accept, edit, or reject AI-extracted skills with char-span provenance and confidence indicators.
            </p>
          </Link>

          <Link
            href="/student/sprint-plan"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#85B5CE] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-headline-sm border border-secondary-fixed-dim mb-4">
              ⚡
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-secondary transition-colors">
              72-Hour Placement Sprint Plan
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Curated hour-by-hour sprint plan targeting exact skill gaps for your selected campus placement drives.
            </p>
          </Link>

          <Link
            href="/student/settings"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#a8cfbb] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-headline-sm border border-tertiary-fixed-dim mb-4">
              ⚙️
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-tertiary transition-colors">
              Profile Settings &amp; Ingestion
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Update institutional credentials, GitHub URL, and upload verified resumes and grade cards.
            </p>
          </Link>

          <Link
            href="/student/arena"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#DE95BE] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-sm border border-outline-variant mb-4">
              ⚔️
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-primary transition-colors">
              2-Min Skill Proof Defense
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Timed live coding arena with instant execution feedback and verified proof stamps.
            </p>
          </Link>

          <Link
            href="/student/applications"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#85B5CE] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-headline-sm border border-secondary-fixed-dim mb-4">
              📋
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-secondary transition-colors">
              Applications &amp; Status
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Track multi-stage application workflows and recruiter interview feedback.
            </p>
          </Link>

          <Link
            href="/student/privacy-shield"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#a8cfbb] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-headline-sm border border-tertiary-fixed-dim mb-4">
              🛡️
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-tertiary transition-colors">
              Privacy Shield &amp; Resume Vault
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Control which companies see your profile, review data access logs, and download complete archives.
            </p>
          </Link>
        </div>
      </section>

      {/* Modal Dialog for Grade Sheet Upload */}
      {showGradeSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-[#6D3B56] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-0 ring-0 flex flex-col">
            <GradeSheetUploader
              studentId={studentId}
              isModal
              onClose={() => setShowGradeSheetModal(false)}
              onComplete={(res) => {
                setCurrentCgpa(res.gpa)
                setAcademicStanding(res.academicStanding)
                setAcademicRecordsCount(res.confirmedGrades.length)
                setShowGradeSheetModal(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Dialog for "How Recruiters See You" */}
      {showRecruiterViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-[#6D3B56] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-0 ring-0 flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#6D3B56] text-white px-6 py-4.5 rounded-t-3xl flex items-center justify-between border-b border-[#552940] shrink-0 border-t-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-xl">visibility</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-display font-extrabold text-white tracking-tight">
                      How Recruiters See You
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      Read-Only Talent View
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">
                    FERPA &amp; DPDP compliant snapshot showing only confirmed solid cards and verified telemetry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecruiterViewModal(false)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6 bg-[#FAF8F5] flex-1">
              {/* Candidate Quick Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-white border border-[#E6E3DC] shadow-2xs">
                <div>
                  <h4 className="font-display font-extrabold text-lg text-ink-primary">
                    {studentName}
                  </h4>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    {institution} • ID: <span className="font-mono">{studentId}</span>
                  </p>
                  <span className="inline-block mt-2 font-mono text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Institutional Proof-of-Work Verified
                  </span>
                </div>

                <div className="text-left sm:text-right p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E3DC] shrink-0">
                  <span className="text-3xs font-mono font-bold text-ink-muted uppercase block">
                    Verified CGPA
                  </span>
                  <span className="font-mono text-2xl font-black text-[#6D3B56] block">
                    {currentCgpa.toFixed(2)}
                  </span>
                  <span className="text-3xs font-bold text-emerald-700">
                    {academicStanding}
                  </span>
                </div>
              </div>

              {/* Confirmed Solid Cards ONLY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-display font-bold text-sm text-ink-primary">
                    Confirmed Solid Cards (Visible to Recruiters)
                  </h5>
                  <span className="font-mono text-3xs font-bold text-ink-muted">
                    Provisional Ghost cards hidden
                  </span>
                </div>

                {(() => {
                  const solidOnly = localSkills.filter((s) => {
                    const status = s.evidenceStatus || ''
                    const isSolid =
                      status === 'STUDENT_CONFIRMED' ||
                      status === 'INSTITUTION_VERIFIED' ||
                      status === 'ASSESSMENT_VERIFIED' ||
                      status === 'ARTIFACT_LINKED' ||
                      Boolean((s as any).isConfirmed)
                    return isSolid && !s.name.toLowerCase().includes('mock')
                  })

                  if (solidOnly.length === 0) {
                    return (
                      <div className="p-4 rounded-xl bg-white border border-dashed border-gray-300 text-center text-xs text-gray-500">
                        No confirmed Solid Cards yet. Confirm extracted skills from your profile to display them here.
                      </div>
                    )
                  }

                  const visibleSkills = previewSkillsExpanded ? solidOnly : solidOnly.slice(0, 5)

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visibleSkills.map((sk) => (
                          <div
                            key={sk.id}
                            className="p-3.5 rounded-xl border border-[#E6E3DC] bg-white shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display font-bold text-xs text-ink-primary">
                                {sk.name}
                              </span>
                              <span className="font-mono text-3xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                                Solid 1.0x
                              </span>
                            </div>
                            <p className="text-3xs font-mono text-ink-muted">
                              {sk.proficiency || 'Advanced'} • {sk.sourceSpan || 'Character-span verified'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {solidOnly.length > 5 && (
                        <div className="pt-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setPreviewSkillsExpanded(!previewSkillsExpanded)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-bold text-[#6D3B56] hover:bg-gray-50 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>
                              {previewSkillsExpanded ? 'Show less' : `+ View ${solidOnly.length - 5} more skills`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* GitHub Telemetry */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6E3DC] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-ink-primary">code</span>
                    <span className="font-display font-bold text-xs text-ink-primary">
                      GitHub Engineering Telemetry
                    </span>
                  </div>
                  <span className="font-mono text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    A.T.H.E.N.A. Sandbox Verified
                  </span>
                </div>
                <p className="text-2xs text-ink-secondary">
                  Telemetry verified: Commits and code ownership are validated via isolated Docker runtimes and 120s proctored viva.
                </p>
              </div>

              {/* Footer CTA */}
              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/student/preview"
                  className="px-5 py-2.5 rounded-xl bg-[#6D3B56] text-white hover:bg-[#582e44] text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <span>Open Full Recruiter Dossier Page</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowRecruiterViewModal(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
