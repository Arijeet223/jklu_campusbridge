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
} from '@/lib/api-client'
import { mockSourceDocuments, mockSkills } from '@/lib/mock-data'
import { computeReadinessProfile } from '@/lib/readiness-calculator'
import type { Skill, SourceDocument, ProficiencyLevel, EvidenceStatus } from '@/lib/types'

export default function ProfileEvidencePage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'ALL' | 'UNCONFIRMED' | 'VERIFIED'>('ALL')
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    loadStudentSkills()
  }, [])

  const loadStudentSkills = async () => {
    setLoading(true)
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

    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'
    try {
      const data = await fetchLiveStudentEvidence(studentId)
      if (Array.isArray(data) && data.length > 0) {
        setSkills(data)
        if (typeof window !== 'undefined') {
          localStorage.setItem('cb_user_skills', JSON.stringify(data))
        }
      } else {
        setSkills(mockSkills)
        if (typeof window !== 'undefined') {
          localStorage.setItem('cb_user_skills', JSON.stringify(mockSkills))
        }
      }
    } catch {
      setSkills(mockSkills)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cb_user_skills', JSON.stringify(mockSkills))
      }
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
    setActionNotice('Provisional skill claim dismissed.')
    setTimeout(() => setActionNotice(null), 3000)
  }

  const filteredSkills = skills.filter((s) => {
    if (filterType === 'UNCONFIRMED') return s.evidenceStatus === 'EXTRACTED'
    if (filterType === 'VERIFIED') return s.evidenceStatus !== 'EXTRACTED'
    return true
  })

  const unconfirmedCount = skills.filter((s) => s.evidenceStatus === 'EXTRACTED').length
  const solidCount = skills.filter((s) => s.evidenceStatus !== 'EXTRACTED').length
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
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                <span>Provenance &amp; Skill Audit Engine • JKLU</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg font-extrabold text-on-surface tracking-tight mb-2">
                Ghost-to-Solid Career Skill Map
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Every AI-proposed skill claim is grounded in verifiable resume char spans. Confirm provisional Ghost Cards or adjust proficiency (e.g., set SQL to Advanced/High) to drive your profile score above 70%.
              </p>
            </div>

            {/* Quick Metrics Bento */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-3.5 shadow-[0_3px_0_#EAD7E2] text-center min-w-[105px]">
                <span className="font-extrabold text-2xl text-primary">{unconfirmedCount}</span>
                <p className="text-[10px] font-bold text-outline uppercase mt-0.5">Ghost Cards</p>
              </div>
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-3.5 shadow-[0_3px_0_#A8CFBB] text-center min-w-[105px]">
                <span className="font-extrabold text-2xl text-tertiary">{solidCount}</span>
                <p className="text-[10px] font-bold text-tertiary uppercase mt-0.5">Solid Tokens</p>
              </div>
              <div className={`border-2 rounded-2xl p-3.5 shadow-[0_3px_0_#A8CFBB] text-center min-w-[125px] ${
                readiness.dimensions.sql.score >= 70
                  ? 'bg-tertiary-container/30 border-tertiary-fixed-dim'
                  : 'bg-error-container/30 border-error/30'
              }`}>
                <span className={`font-extrabold text-2xl ${
                  readiness.dimensions.sql.score >= 70 ? 'text-tertiary' : 'text-error'
                }`}>
                  {readiness.dimensions.sql.score}%
                </span>
                <p className={`text-[10px] font-bold uppercase mt-0.5 ${
                  readiness.dimensions.sql.score >= 70 ? 'text-tertiary' : 'text-error'
                }`}>
                  {readiness.dimensions.sql.score >= 70 ? 'SQL Proficient ✓' : 'SQL Focus!'}
                </p>
              </div>
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-3.5 shadow-[0_3px_0_#85B5CE] text-center min-w-[105px]">
                <span className="font-extrabold text-2xl text-secondary">{readiness.overallReadiness}%</span>
                <p className="text-[10px] font-bold text-secondary uppercase mt-0.5">Overall Fit</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterType === 'ALL'
                    ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container'
                }`}
              >
                All Skills ({skills.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UNCONFIRMED')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterType === 'UNCONFIRMED'
                    ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container'
                }`}
              >
                Provisional Ghost Cards ({unconfirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('VERIFIED')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterType === 'VERIFIED'
                    ? 'bg-primary text-on-primary shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container'
                }`}
              >
                Solid Tokens ({solidCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenSource('doc_resume_v3')}
              className="text-xs font-bold text-secondary flex items-center gap-1.5 bg-secondary-container/40 px-3 py-1.5 rounded-full border border-secondary-fixed-dim hover:brightness-95 transition-all shadow-[0_2px_0_#85B5CE]"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span>Inspect Resume PDF</span>
            </button>
          </div>
        </section>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3.5 bg-tertiary-container/40 border border-tertiary-fixed-dim rounded-2xl text-xs font-bold text-on-tertiary-container shadow-[0_2px_0_#a8cfbb] animate-in fade-in">
            {actionNotice}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SKILL CARDS GRID                                       */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSkills.map((sk) => (
            <GhostCard
              key={sk.id}
              skillName={sk.name}
              proficiency={sk.proficiency || 'Intermediate'}
              sourcePage={sk.sourcePage ? `p.${sk.sourcePage}` : 'p.1'}
              sourceSection={sk.category || 'Technical Skills'}
              confidence={sk.confidence || 0.94}
              evidenceStatus={sk.evidenceStatus}
              onConfirm={() => handleConfirm(sk.id)}
              onReject={() => handleReject(sk.id)}
              onChangeProficiency={(newProf) => handleProficiencyChange(sk.id, newProf)}
              onClickSource={() => handleOpenSource(sk.sourceDocumentId || 'doc_resume_v3')}
            />
          ))}
        </section>
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />
    </AppLayout>
  )
}
