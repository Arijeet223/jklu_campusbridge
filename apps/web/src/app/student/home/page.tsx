'use client'

import { useState } from 'react'
import Link from 'next/link'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import GhostCard from '@/components/GhostCard'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSkills, mockSourceDocuments } from '@/lib/mock-data'
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
} from 'lucide-react'

export default function StudentHomePage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [skills, setSkills] = useState<Skill[]>(mockSkills)
  const [timeHorizon, setTimeHorizon] = useState<'sprint' | 'marathon'>('sprint')
  const [filterType, setFilterType] = useState<'ALL' | 'UNCONFIRMED' | 'VERIFIED'>('ALL')
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleConfirmSkill = (id: string) => {
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
  }

  const handleSimulateUpload = () => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: 'Kubernetes & Helm',
      proficiency: 'Intermediate',
      evidenceStatus: 'EXTRACTED',
      sourceDocumentId: 'doc_resume_v3',
      sourceSpan: 'Deployed microservices to Kubernetes cluster with Helm charts',
      confidence: 0.91,
    }
    setSkills((prev) => [newSkill, ...prev])
    setUploadSuccess('Resume parsed! Extracted new skill: "Kubernetes & Helm" (Level 2: AI Suggestion)')
    setTimeout(() => setUploadSuccess(null), 4000)
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
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex flex-col font-sans">
      <TopNavBar
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onOpenRegisterModal={() => {}}
        onOpenSyncExcelModal={() => {}}
        onOpenPrivacyModal={() => {}}
        onOpenExplainerModal={() => setExplainerOpen(true)}
      />

      <div className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header & Mode Switcher */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
              <Sparkles className="h-3.5 w-3.5" />
              Ghost-to-Solid Profile Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Skill Provenance &amp; Verification Map
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted">
              Every skill requires verifiable evidence before it can be shared with campus recruiters.
            </p>
          </div>

          {/* Time-Horizon Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F1EFEA] border border-[#E6E3DC]">
            <button
              type="button"
              onClick={() => setTimeHorizon('sprint')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeHorizon === 'sprint'
                  ? 'bg-[#6D3B56] text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>Sprint Mode (14-Day Push)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeHorizon('marathon')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeHorizon === 'marathon'
                  ? 'bg-oxford text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Marathon Mode (120-Day)</span>
            </button>
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
            <button
              type="button"
              onClick={handleSimulateUpload}
              className="mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-[#FAF8F6] border border-[#E6E3DC] text-xs font-bold text-ink-primary transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="h-4 w-4 text-oxford" />
              <span>+ Upload Document (.pdf / .docx)</span>
            </button>
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
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}
