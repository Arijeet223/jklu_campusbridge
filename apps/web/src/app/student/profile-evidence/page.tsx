'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import GhostCard from '@/components/GhostCard'
import SourceDrawer from '@/components/SourceDrawer'
import {
  getActiveUser,
  fetchLiveStudentEvidence,
  confirmStudentEvidence,
  addCustomStudentSkill,
} from '@/lib/api-client'
import { mockSourceDocuments } from '@/lib/mock-data'
import { computeReadinessProfile } from '@/lib/readiness-calculator'
import type { Skill, SourceDocument, ProficiencyLevel, EvidenceStatus } from '@/lib/types'
import {
  Plus,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  FileText,
  CheckCircle2,
  HelpCircle,
  X,
  RefreshCw,
} from 'lucide-react'

export default function ProfileEvidencePage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'ALL' | 'UNCONFIRMED' | 'VERIFIED' | 'DOUBT'>('ALL')
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Add Custom Skill Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [customSkillName, setCustomSkillName] = useState('')
  const [customSkillCategory, setCustomSkillCategory] = useState('Technical Skills')
  const [customSkillProficiency, setCustomSkillProficiency] = useState<ProficiencyLevel>('Intermediate')
  const [isSubmittingCustomSkill, setIsSubmittingCustomSkill] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    loadStudentSkills()
  }, [])

  const loadStudentSkills = async () => {
    setLoading(true)
    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'

    // 1. Check local storage first for freshly parsed or edited skills
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_user_skills')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSkills(parsed)
            setLoading(false)
            return
          }
        }
      } catch {}
    }

    try {
      const data = await fetchLiveStudentEvidence(studentId)
      if (Array.isArray(data) && data.length > 0) {
        setSkills(data)
        if (typeof window !== 'undefined') {
          localStorage.setItem('cb_user_skills', JSON.stringify(data))
        }
      } else {
        // Strict Purge: Never fallback to mockSkills. If empty, keep empty.
        setSkills([])
      }
    } catch {
      // Strict Purge: Never fallback to mockSkills on error.
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    let doc = mockSourceDocuments[docId]
    if (!doc && typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('cb_uploaded_documents') || '{}')
        if (stored[docId]) doc = stored[docId]
      } catch {}
    }
    setSelectedDoc(doc || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleProficiencyChange = (skillId: string, newProf: ProficiencyLevel) => {
    const updated = skills.map((s) => (s.id === skillId ? { ...s, proficiency: newProf } : s))
    setSkills(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_user_skills', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: updated }))
    }
    const changedSkill = updated.find((s) => s.id === skillId)
    const readiness = computeReadinessProfile(updated)
    setActionNotice(
      `Updated "${changedSkill?.name}" proficiency to ${newProf}! Database & SQL readiness recalculated to ${readiness.dimensions.sql.score}% (${readiness.dimensions.sql.statusLabel}).`
    )
    setTimeout(() => setActionNotice(null), 4500)
  }

  const handleConfirm = async (skillId: string) => {
    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'
    const updated = skills.map((s) =>
      s.id === skillId
        ? { ...s, evidenceStatus: 'STUDENT_CONFIRMED' as EvidenceStatus, confidence: 0.96 }
        : s
    )
    setSkills(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_user_skills', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: updated }))
    }
    const confirmedSkill = updated.find((s) => s.id === skillId)
    const readiness = computeReadinessProfile(updated)
    setActionNotice(
      `Skill "${confirmedSkill?.name}" solidified into 1.0x token! Provenance score is now ${readiness.dimensions.provenance.score}% and SQL readiness is ${readiness.dimensions.sql.score}%.`
    )
    setTimeout(() => setActionNotice(null), 4500)
    try {
      await confirmStudentEvidence(studentId, skillId)
    } catch {}
  }

  const handleReject = (skillId: string) => {
    const updated = skills.filter((s) => s.id !== skillId)
    setSkills(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_user_skills', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: updated }))
    }
    setActionNotice('Skill claim dismissed.')
    setTimeout(() => setActionNotice(null), 3000)
  }

  // Handle Add Custom Skill (Doubt Ghost Card)
  const handleAddCustomSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = customSkillName.trim()
    if (!trimmed) {
      setModalError('Please enter a valid skill name.')
      return
    }

    // Check for duplicate
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setModalError(`Skill "${trimmed}" is already in your profile ledger.`)
      return
    }

    setIsSubmittingCustomSkill(true)
    setModalError(null)

    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'
    const newId = `ev-doubt-${studentId.toLowerCase()}-${Date.now()}`

    const newSkill: Skill = {
      id: newId,
      name: trimmed,
      category: customSkillCategory,
      proficiency: customSkillProficiency,
      evidenceStatus: 'DOUBT_GHOST',
      sourceDocumentId: 'doc_manual_claim',
      sourceSpan: 'Manual Student Claim (No Evidence)',
      confidence: 0.0,
    }

    try {
      await addCustomStudentSkill(studentId, {
        skill_name: trimmed,
        category: customSkillCategory,
        proficiency: customSkillProficiency,
      })
    } catch {}

    const updated = [newSkill, ...skills]
    setSkills(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_user_skills', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: updated }))
    }

    setActionNotice(
      `Added "${trimmed}" as a Doubt Ghost Card! Awaiting faculty endorsement or certificate evidence.`
    )
    setTimeout(() => setActionNotice(null), 5000)

    setCustomSkillName('')
    setIsAddModalOpen(false)
    setIsSubmittingCustomSkill(false)
  }

  const unconfirmedCount = skills.filter((s) => s.evidenceStatus === 'EXTRACTED').length
  const solidCount = skills.filter(
    (s) => s.evidenceStatus !== 'EXTRACTED' && s.evidenceStatus !== 'DOUBT_GHOST'
  ).length
  const doubtCount = skills.filter((s) => s.evidenceStatus === 'DOUBT_GHOST').length

  const filteredSkills = skills.filter((s) => {
    if (filterType === 'UNCONFIRMED') return s.evidenceStatus === 'EXTRACTED'
    if (filterType === 'VERIFIED')
      return s.evidenceStatus !== 'EXTRACTED' && s.evidenceStatus !== 'DOUBT_GHOST'
    if (filterType === 'DOUBT') return s.evidenceStatus === 'DOUBT_GHOST'
    return true
  })

  const readiness = computeReadinessProfile(skills)

  return (
    <AppLayout pageTitle="Ghost-to-Solid Skill Map" breadcrumb="Student Workspace">
      <div className="space-y-7 font-body-md text-on-surface">
        {/* ========================================================= */}
        {/* 1. TOP HEADER BANNER                                      */}
        {/* ========================================================= */}
        <section className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 md:p-8 shadow-[0_4px_0_#EADECE] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full border border-primary-container font-label-sm text-label-sm font-bold uppercase tracking-wider mb-3 shadow-[0_2px_0_#DE95BE]">
                <Sparkles className="h-3.5 w-3.5 text-[#6D3B56]" />
                <span>Provenance &amp; Skill Audit Engine • JKLU</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg font-extrabold text-on-surface tracking-tight mb-2">
                Ghost-to-Solid Career Skill Map
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Every AI-proposed skill claim is grounded in verifiable resume char spans. Confirm provisional Ghost Cards, inspect evidence, or report custom skills as Doubt Ghost Cards.
              </p>
            </div>

            {/* Quick Metrics Bento */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-3.5 shadow-[0_3px_0_#EAD7E2] text-center min-w-[95px]">
                <span className="font-extrabold text-2xl text-primary">{unconfirmedCount}</span>
                <p className="text-[10px] font-bold text-outline uppercase mt-0.5">Ghost Cards</p>
              </div>

              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-3.5 shadow-[0_3px_0_#A8CFBB] text-center min-w-[95px]">
                <span className="font-extrabold text-2xl text-tertiary">{solidCount}</span>
                <p className="text-[10px] font-bold text-tertiary uppercase mt-0.5">Solid Tokens</p>
              </div>

              {/* Doubt Ghost Cards Metric */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 shadow-[0_3px_0_#F59E0B] text-center min-w-[95px]">
                <span className="font-extrabold text-2xl text-amber-800">{doubtCount}</span>
                <p className="text-[10px] font-bold text-amber-700 uppercase mt-0.5">Doubt Ghosts</p>
              </div>

              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-3.5 shadow-[0_3px_0_#85B5CE] text-center min-w-[95px]">
                <span className="font-extrabold text-2xl text-secondary">{readiness.overallReadiness}%</span>
                <p className="text-[10px] font-bold text-secondary uppercase mt-0.5">Overall Fit</p>
              </div>
            </div>
          </div>

          {/* Filter Pills & Add Custom Skill Action Bar */}
          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container'
                }`}
              >
                All Skills ({skills.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('VERIFIED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'VERIFIED'
                    ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container'
                }`}
              >
                Solid Tokens ({solidCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UNCONFIRMED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'UNCONFIRMED'
                    ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container'
                }`}
              >
                Ghost Cards ({unconfirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('DOUBT')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterType === 'DOUBT'
                    ? 'bg-amber-600 text-white shadow-[0_2px_0_#B45309]'
                    : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Doubt Ghosts ({doubtCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Prominent Add Custom Skill Button */}
              <button
                type="button"
                onClick={() => {
                  setModalError(null)
                  setIsAddModalOpen(true)
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#6D3B56] text-white hover:bg-[#582e44] transition-all flex items-center gap-1.5 shadow-[0_2px_0_#552940] active:translate-y-0.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Custom Skill</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSource('doc_resume_v3')}
                className="text-xs font-bold text-secondary flex items-center gap-1.5 bg-secondary-container/40 px-3 py-1.5 rounded-full border border-secondary-fixed-dim hover:brightness-95 transition-all shadow-[0_2px_0_#85B5CE] cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Inspect Resume PDF</span>
              </button>
            </div>
          </div>
        </section>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3.5 bg-tertiary-container/40 border border-tertiary-fixed-dim rounded-2xl text-xs font-bold text-on-tertiary-container shadow-[0_2px_0_#a8cfbb] animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SKILL CARDS GRID                                       */}
        {/* ========================================================= */}
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 text-[#6D3B56] animate-spin" />
            <p className="text-xs font-bold text-outline">Loading verified skills from ledger...</p>
          </div>
        ) : filteredSkills.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSkills.map((sk) => (
              <GhostCard
                key={sk.id}
                skillName={sk.name}
                proficiency={sk.proficiency || 'Intermediate'}
                sourcePage={sk.sourcePage ? `p.${sk.sourcePage}` : 'p.1'}
                sourceSection={sk.category || 'Technical Skills'}
                confidence={sk.confidence ?? (sk.evidenceStatus === 'DOUBT_GHOST' ? 0 : 0.94)}
                evidenceStatus={sk.evidenceStatus}
                onConfirm={() => handleConfirm(sk.id)}
                onReject={() => handleReject(sk.id)}
                onChangeProficiency={(newProf) => handleProficiencyChange(sk.id, newProf)}
                onClickSource={() => handleOpenSource(sk.sourceDocumentId || 'doc_resume_v3')}
              />
            ))}
          </section>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-base text-on-surface">
              {filterType === 'DOUBT'
                ? 'No Doubt Ghost Cards'
                : filterType === 'UNCONFIRMED'
                ? 'No Unconfirmed Ghost Cards'
                : filterType === 'VERIFIED'
                ? 'No Solid Tokens Verified Yet'
                : 'No Skills in Profile Ledger'}
            </h3>
            <p className="text-xs text-outline max-w-md mx-auto">
              {filterType === 'DOUBT'
                ? 'Any skills you add manually without resume or grade card evidence will appear here.'
                : 'Upload your technical resume or click "Add Custom Skill" to add verified or provisional capabilities.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setModalError(null)
                setIsAddModalOpen(true)
              }}
              className="px-4 py-2 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Skill</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. ADD CUSTOM SKILL MODAL (DOUBT GHOST CARD)              */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#E6E3DC] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <AlertTriangle className="h-3 w-3 text-amber-700" />
                  <span>Doubt Ghost Card Generation</span>
                </div>
                <h3 className="font-display font-extrabold text-base text-gray-900">
                  Add Custom Skill
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Caution Explainer Callout */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HelpCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Evidence Requirement Notice</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Because this skill is self-reported and lacks document provenance from your resume or transcripts, it enters as a <strong>Doubt Ghost Card (0.0x)</strong>. It will only solidify if verified by a faculty mentor or confirmed via future certificate upload.
              </p>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddCustomSkillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Skill Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Kubernetes, Rust, GraphQL, Spring Boot..."
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#6D3B56] focus:outline-hidden transition-all bg-[#FAF8F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={customSkillCategory}
                    onChange={(e) => setCustomSkillCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#6D3B56] focus:outline-hidden transition-all bg-[#FAF8F6] cursor-pointer"
                  >
                    <option value="Technical Skills">Technical Skills</option>
                    <option value="Databases & SQL">Databases &amp; SQL</option>
                    <option value="DevOps & Cloud">DevOps &amp; Cloud</option>
                    <option value="Core CS">Core CS</option>
                    <option value="Soft Skills">Soft Skills</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Proficiency Level
                  </label>
                  <select
                    value={customSkillProficiency}
                    onChange={(e) => setCustomSkillProficiency(e.target.value as ProficiencyLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:border-[#6D3B56] focus:outline-hidden transition-all bg-[#FAF8F6] cursor-pointer"
                  >
                    <option value="Beginner">Beginner (55%)</option>
                    <option value="Intermediate">Intermediate (72%)</option>
                    <option value="Advanced">Advanced (88%)</option>
                    <option value="Expert">Expert (96%)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomSkill}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#6D3B56] text-white hover:bg-[#582e44] transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCustomSkill ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add as Doubt Ghost Card</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />
    </AppLayout>
  )
}
