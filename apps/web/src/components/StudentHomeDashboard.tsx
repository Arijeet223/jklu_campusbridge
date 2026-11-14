'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import type { Skill, ReadinessDimension, ResumeVersion } from '@/lib/types'
import { mockReadinessDimensions } from '@/lib/mock-data'

interface StudentHomeDashboardProps {
  studentId?: string
  studentName: string
  cgpa: number
  branch: string
  institution?: string
  skills: Skill[]
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

  const overallReadiness = Math.round(
    mockReadinessDimensions.reduce((acc, dim) => acc + dim.score, 0) /
      mockReadinessDimensions.length,
  )

  const handleUploadDocument = async (file: File) => {
    setIsProcessingFile(true)
    setUploadNotice(`Parsing and scanning "${file.name}" with Python PDF parser in isolated sandbox...`)

    try {
      let activeId = studentId || 'STU-101'
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cb_active_user')
          if (stored) {
            const u = JSON.parse(stored)
            if (u.id) activeId = u.id
          }
        } catch {}
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
          proficiency: sk.proficiency || 'Intermediate',
          evidenceStatus: 'EXTRACTED',
          sourceDocumentId: data.document_id || 'doc_resume_v4',
          sourceSpan: sk.sourceSpan || `${file.name} • p.${sk.sourcePage || 1}`,
          sourcePage: sk.sourcePage || 1,
          confidence: sk.confidence || 0.94,
        }))

        if (onUploadResume) {
          onUploadResume(file.name, extracted)
        }
        setIsProcessingFile(false)
        setUploadNotice(
          `Successfully uploaded and parsed "${file.name}"! Found ${extracted.length} provisional skills (Ghost Cards) ready for verification.`,
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
        <div className="flex items-center justify-between rounded-2xl border border-tertiary-fixed-dim bg-tertiary-container/40 p-4 text-xs font-semibold text-on-tertiary-container shadow-[0_3px_0_#c3ecd6] animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-tertiary">check_circle</span>
            <span>{uploadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadNotice(null)}
            className="text-[11px] underline hover:text-on-surface"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HERO GREETING BANNER & QUICK ACTIONS                    */}
      {/* ========================================================= */}
      <section className="bg-surface-container-lowest rounded-3xl border-[1.5px] border-outline-variant p-6 lg:p-8 shadow-[0_4px_0_#EAD7E2] relative overflow-hidden bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest to-primary-container/20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim text-label-sm font-label-sm mb-3 shadow-[0_2px_0_#a8ccde]">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Placement Sprint Window • 48h Countdown Active • {institution}</span>
            </div>
            <h1 className="text-headline-xl font-headline-xl text-on-surface tracking-tight font-extrabold">
              Welcome back, {studentName}! 🚀
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-2xl">
              You have 2 campus drives closing in less than 48 hours. Let&apos;s lock in your proof tokens with deterministic 120s defenses!
            </p>
          </div>

          {/* Quick Action Capsule Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/student/matches"
              className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3.5 rounded-full border border-on-primary-fixed-variant shadow-[0_4px_0_#320e26] active:translate-y-[3px] active:shadow-[0_1px_0_#320e26] transition-all flex items-center gap-2 hover:brightness-105"
            >
              <span>Resume 72h Sprint</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <Link
              href="/student/what-if-sandbox"
              className="bg-surface-container-low text-on-surface font-label-lg text-label-lg px-5 py-3.5 rounded-full border border-outline-variant shadow-[0_3px_0_#d3c2c9] active:translate-y-[2px] active:shadow-[0_1px_0_#d3c2c9] transition-all flex items-center gap-2 hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-base text-secondary">science</span>
              <span>Run What-If Simulation</span>
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
                {verifiedSkills.length > 0 ? `${verifiedSkills.length} / ${skills.length || 8}` : '6 / 8'}
              </span>
              <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                75% Locked
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-secondary-container mt-1 font-medium">Solid 1.0x Tokens Locked</p>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
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

          {/* Card 4: Pending Disputes / Gate Exceptions */}
          <div className="bg-surface-container-low border-[1.5px] border-outline-variant rounded-2xl p-5 shadow-[0_3px_0_#d3c2c9] transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-label-md text-on-surface-variant font-bold">Gate Exceptions</span>
              <span className="material-symbols-outlined text-tertiary">check_circle</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-headline-md font-headline-md text-on-surface font-extrabold">0 Blockers</span>
              <span className="bg-surface-container-high text-on-surface text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                Cleared
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-tertiary mt-1 font-medium">All TPO Approvals Clear ✓</p>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '100%' }}></div>
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
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-[0_2px_0_#f0b6d5]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-base">check</span>
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface font-bold">
                    FastAPI Redis Idempotency 120s Defense
                  </span>
                </div>
                <span className="text-label-sm font-label-sm text-tertiary bg-tertiary-container/40 px-2.5 py-0.5 rounded-full border border-tertiary-fixed-dim font-bold">
                  1.0x Solid Locked
                </span>
              </div>

              {/* Checklist Item 2: Pending Attention */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-primary-container shadow-[0_2px_0_#DE95BE]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-base">priority_high</span>
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface font-bold">
                    SQL DENSE_RANK() Windowing Quest
                  </span>
                </div>
                <span className="text-label-sm font-label-sm text-primary bg-primary-fixed/50 px-2.5 py-0.5 rounded-full border border-outline-variant font-bold">
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
                href="/student/what-if-sandbox"
                className="bg-surface-container text-on-surface font-label-md text-label-md px-4 py-2.5 rounded-full border border-outline-variant shadow-[0_2px_0_#d3c2c9] active:translate-y-[1px] transition-all hover:bg-surface-container-high flex items-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-sm">assignment</span>
                <span>View Drive Rubric</span>
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
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">add_task</span>
                <span className="text-body-sm font-body-sm text-on-surface font-bold">
                  Optional: Solve Concurrency Deadlock Proof (+6% boost)
                </span>
              </div>
              <Link
                href="/student/arena"
                className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-5 py-2.5 rounded-full border border-secondary-fixed-dim shadow-[0_3px_0_#85B5CE] active:translate-y-[2px] transition-all flex items-center gap-1.5 hover:brightness-95 font-bold"
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
                {/* Student actual data polygon */}
                <polygon
                  fill="#f0b6d5"
                  fillOpacity="0.5"
                  points="120,32 191,79 176,152 120,212 48,162 45,78"
                  stroke="#7e506b"
                  strokeWidth="2.5"
                ></polygon>
                <circle cx="120" cy="32" fill="#7e506b" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="191" cy="79" fill="#406373" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="176" cy="152" fill="#ba1a1a" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="120" cy="212" fill="#416655" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="48" cy="162" fill="#406373" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="45" cy="78" fill="#7e506b" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
              </svg>
            </div>

            {/* Dimension Breakdown List */}
            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                  <span>1. DSA &amp; Problem Solving</span>
                  <span className="text-primary font-bold">88%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                  <span>2. System Design &amp; Concurrency</span>
                  <span className="text-secondary font-bold">82%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-error-container/40 border border-error/20">
                <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                  <span className="flex items-center gap-1.5 text-error">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>3. Database &amp; SQL Windowing</span>
                  </span>
                  <span className="text-error font-bold">65% (Attention Needed!)</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                  <span>4. Live Code Defense (120s)</span>
                  <span className="text-tertiary font-bold">92%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                  <span>5. Coursework &amp; CGPA</span>
                  <span className="text-secondary font-bold">84%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-body-sm font-body-sm mb-1 font-bold text-on-surface">
                  <span>6. Provenance &amp; Portfolio Proofs</span>
                  <span className="text-primary font-bold">75%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
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
                &ldquo;Aarav, completing the <strong className="font-bold text-primary">DENSE_RANK() SQL quest</strong> will push your RazorpayX fit score past the <strong className="font-bold">80% automated interview shortlist threshold</strong>. Your Redis defense was rated in the top 5% of the cohort!&rdquo;
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
              AI Resume Ingestion &amp; Evidence Vault
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Upload updated PDF resumes to extract provisional skills (Ghost Cards) grounded in verifiable char spans.
            </p>
          </div>
          <Link
            href="/student/privacy-shield"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
            <span>Manage Access &amp; History</span>
          </Link>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
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
            href="/student/what-if-sandbox"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#85B5CE] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-headline-sm border border-secondary-fixed-dim mb-4">
              🎛️
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-secondary transition-colors">
              Job Fit &amp; What-If Sandbox
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Deterministic &lt;50ms scoring simulator. Toggle skills, electives, and micro-defenses in real-time.
            </p>
          </Link>

          <Link
            href="/student/matches"
            className="block group p-6 rounded-3xl bg-surface-container-lowest border-[1.5px] border-outline-variant shadow-[0_4px_0_#EAD7E2] hover:shadow-[0_6px_0_#a8cfbb] transition-all hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-headline-sm border border-tertiary-fixed-dim mb-4">
              ⚡
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-extrabold group-hover:text-tertiary transition-colors">
              72h Interview Prep Sprint
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Curated quests tailored to incoming drives closing in 72 hours.
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
    </div>
  )
}
