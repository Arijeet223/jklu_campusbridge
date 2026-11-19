'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import GhostCard from '@/components/GhostCard'
import SourceDrawer from '@/components/SourceDrawer'
import {
  getActiveUser,
  fetchLiveStudentEvidence,
  confirmStudentEvidence,
  ApiError,
} from '@/lib/api-client'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { Skill, SourceDocument } from '@/lib/types'
import {
  Sparkles,
  Upload,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function StudentHomePage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [timeHorizon, setTimeHorizon] = useState<'sprint' | 'marathon'>('sprint')
  const [filterType, setFilterType] = useState<'ALL' | 'UNCONFIRMED' | 'VERIFIED'>('ALL')
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadStudentSkills()
  }, [])

  const loadStudentSkills = async () => {
    setLoading(true)
    setErrorMsg(null)
    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'

    try {
      const data = await fetchLiveStudentEvidence(studentId)
      const mapped: Skill[] = (data || []).map((ev: any, idx: number) => {
        const tier = String(ev.tier || ev.evidence_status || ev.evidenceStatus || '')
        let evStatus: any = 'EXTRACTED'
        if (tier.includes('INSTITUTION')) evStatus = 'INSTITUTION_VERIFIED'
        else if (tier.includes('ASSESSMENT') || tier.includes('VERIFIED')) evStatus = 'ASSESSMENT_VERIFIED'
        else if (tier.includes('ARTIFACT')) evStatus = 'ARTIFACT_LINKED'
        else if (tier.includes('CONFIRMED')) evStatus = 'STUDENT_CONFIRMED'

        return {
          id: ev.evidence_id || ev.id || `ev-${idx}`,
          name: ev.skill_name || ev.name || 'Skill',
          category: ev.category || 'Technical Skills',
          proficiency: (ev.proficiency as any) || (ev.multiplier >= 0.85 ? 'Advanced' : 'Intermediate'),
          evidenceStatus: evStatus,
          sourceDocumentId: ev.source_doc || ev.sourceDocumentId || 'doc_resume_v3',
          sourceSpan: ev.source_span_text || ev.sourceSpan || 'Extracted technical skill token',
          confidence: Number(ev.confidence ?? 0.92),
        }
      })

      if (mapped.length > 0) {
        setSkills(mapped)
      } else {
        const stored = localStorage.getItem('cb_user_skills')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) setSkills(parsed)
        }
      }
    } catch (err: any) {
      const stored = localStorage.getItem('cb_user_skills')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) setSkills(parsed)
        } catch {}
      }
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'Could not fetch verified skill evidence from live ledger.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleConfirmSkill = async (id: string) => {
    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'

    // Optimistically update UI
    setSkills((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              evidenceStatus: 'STUDENT_CONFIRMED',
              confirmedAt: new Date().toISOString(),
            }
          : s
      )
    )

    // Write through to Excel DB
    try {
      await confirmStudentEvidence(studentId, id)
    } catch {
      // Non-fatal if offline
    }
  }

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setUploadSuccess(`Parsing "${file.name}" with Python PDF parser in isolated sandbox...`)

    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('student_id', studentId)

      const endpoints = [
        '/api/v1/documents/upload',
        'http://localhost:8000/api/v1/documents/upload',
        'http://localhost:8000/v1/documents/upload',
      ]

      let res: Response | null = null
      for (const ep of endpoints) {
        try {
          const attempt = await fetch(ep, {
            method: 'POST',
            body: formData,
          })
          if (attempt.ok) {
            res = attempt
            break
          }
        } catch {}
      }

      if (res && res.ok) {
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

        setSkills((prev) => [...extracted, ...prev])
        setUploadSuccess(`Successfully parsed "${file.name}"! Extracted ${extracted.length} new Ghost Cards ready for confirmation.`)
        setTimeout(() => setUploadSuccess(null), 5000)
        return
      }

      throw new Error('Failed to parse uploaded resume')
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload and extraction failed.')
      setUploadSuccess(null)
    }
  }

  const unconfirmedCount = skills.filter((s) => s.evidenceStatus === 'EXTRACTED').length
  const verifiedCount = skills.filter(
    (s) => s.evidenceStatus === 'INSTITUTION_VERIFIED' || s.evidenceStatus === 'ASSESSMENT_VERIFIED'
  ).length

  const filteredSkills = skills.filter((s) => {
    if (filterType === 'UNCONFIRMED') return s.evidenceStatus === 'EXTRACTED'
    if (filterType === 'VERIFIED')
      return s.evidenceStatus === 'INSTITUTION_VERIFIED' || s.evidenceStatus === 'ASSESSMENT_VERIFIED'
    return true
  })

  return (
    <AppLayout pageTitle="Profile & Evidence Studio" breadcrumb="Student Workspace">
      <div className="space-y-6">
        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={loadStudentSkills}
              className="flex items-center gap-1 font-bold text-rose-900 underline hover:no-underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Header & Mode Switcher */}
        <div className="rounded-3xl bg-surface-container-low border border-outline-variant p-6 sm:p-8 shadow-[0_4px_0_#EADECE] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-container text-on-primary-container border border-outline-variant shadow-[0_2px_0_#DE95BE]">
              <Sparkles className="h-3.5 w-3.5" />
              Ghost-to-Solid Profile Studio • JKLU
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Skill Provenance &amp; Verification Map
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              Every skill requires verifiable evidence before it can be shared with campus recruiters.
            </p>
          </div>

          {/* Actions & Switchers */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/student/preview"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-[#6D3B56] text-white hover:bg-[#52293F] transition-all shadow-[0_3px_0_#320e26]"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>How Recruiters See You</span>
            </Link>

            {/* Time-Horizon Switcher */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-surface-container border border-outline-variant/60">
              <button
                type="button"
                onClick={() => setTimeHorizon('sprint')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  timeHorizon === 'sprint'
                    ? 'bg-primary text-on-primary shadow-[0_3px_0_#320e26]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Flame className="h-4 w-4" />
                <span>Sprint Mode (14-Day Push)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeHorizon('marathon')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  timeHorizon === 'marathon'
                    ? 'bg-primary text-on-primary shadow-[0_3px_0_#320e26]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Marathon Mode (120-Day)</span>
              </button>
            </div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="rounded-2xl bg-[#B6DEC9]/40 border-2 border-[#B6DEC9] p-4 text-xs font-bold text-[#255C45] flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Stats & Ingestion Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-white border border-[#E6E3DC] p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Unconfirmed AI Suggestions</span>
              <div className="text-3xl font-display font-black text-amber mt-1">
                {unconfirmedCount}
              </div>
              <span className="text-3xs text-ink-muted">Dashed ghost cards requiring student confirmation</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber/10 flex items-center justify-center text-amber">
              <Zap className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E6E3DC] p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Institution &amp; Test Verified</span>
              <div className="text-3xl font-display font-black text-[#255C45] mt-1">
                {verifiedCount}
              </div>
              <span className="text-3xs text-ink-muted">Solid cards backed by DSA/SQL assessment or faculty</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#B6DEC9]/30 flex items-center justify-center text-[#255C45]">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl bg-[#F1EFEA] border border-[#E6E3DC] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Ingest New Resume / Transcript</span>
              <p className="text-2xs text-ink-muted mt-1">Extract skills with automatic character-level citation spans.</p>
            </div>
            <label className="mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAF8F6] border border-[#E6E3DC] text-xs font-bold text-ink-primary transition-all shadow-2xs cursor-pointer">
              <Upload className="h-4 w-4 text-oxford" />
              <span>+ Upload Document (.pdf / .docx)</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleRealFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-muted flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter Skills:
            </span>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'UNCONFIRMED', 'VERIFIED'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all ${
                    filterType === t
                      ? 'bg-[#6D3B56] text-white shadow-2xs'
                      : 'bg-white border border-[#E6E3DC] text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Link
            href="/student/arena"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D3B56] hover:underline"
          >
            <span>Level Up in Practice Arena</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Skills Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-white border border-[#E6E3DC] p-5 animate-pulse" />
            ))}
          </div>
        ) : filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <GhostCard
                key={skill.id}
                skillName={skill.name}
                proficiency={skill.proficiency}
                sourcePage={(skill as any).sourcePage || 'Page 1'}
                sourceSection={(skill as any).sourceSection || 'Verified Evidence'}
                confidence={skill.confidence}
                evidenceStatus={skill.evidenceStatus}
                onConfirm={() => handleConfirmSkill(skill.id)}
                onClickSource={() => handleOpenSource(skill.sourceDocumentId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white border-2 border-dashed border-[#E6E3DC] p-12 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-[#6D3B56] mx-auto opacity-40" />
            <h3 className="font-display font-bold text-base text-ink-primary">No Skill Cards Found</h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              Upload your technical resume or complete problems in the Practice Arena to populate your verified skill provenance map.
            </p>
          </div>
        )}
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />
    </AppLayout>
  )
}
