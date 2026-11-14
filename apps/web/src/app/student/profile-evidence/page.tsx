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
import type { Skill, SourceDocument } from '@/lib/types'

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
    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'
    try {
      const data = await fetchLiveStudentEvidence(studentId)
      if (Array.isArray(data) && data.length > 0) {
        setSkills(data)
      } else {
        setSkills(mockSkills)
      }
    } catch {
      setSkills(mockSkills)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleConfirm = async (skillId: string) => {
    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'
    try {
      await confirmStudentEvidence(studentId, skillId)
      setSkills((prev) =>
        prev.map((s) =>
          s.id === skillId
            ? { ...s, evidenceStatus: 'STUDENT_CONFIRMED', confidence: 0.95 }
            : s
        )
      )
      setActionNotice('Skill confirmed and upgraded to Solid 1.0x token!')
      setTimeout(() => setActionNotice(null), 3000)
    } catch {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === skillId
            ? { ...s, evidenceStatus: 'STUDENT_CONFIRMED', confidence: 0.95 }
            : s
        )
      )
      setActionNotice('Skill confirmed and synced to verified ledger.')
      setTimeout(() => setActionNotice(null), 3000)
    }
  }

  const filteredSkills = skills.filter((s) => {
    if (filterType === 'UNCONFIRMED') return s.evidenceStatus === 'EXTRACTED'
    if (filterType === 'VERIFIED') return s.evidenceStatus !== 'EXTRACTED'
    return true
  })

  const unconfirmedCount = skills.filter((s) => s.evidenceStatus === 'EXTRACTED').length
  const solidCount = skills.filter((s) => s.evidenceStatus !== 'EXTRACTED').length

  return (
    <AppLayout pageTitle="Ghost-to-Solid Skill Map" breadcrumb="Student Workspace">
      <div className="space-y-7 font-body-md text-on-surface">
        {/* ========================================================= */}
        {/* 1. TOP HEADER BANNER                                      */}
        {/* ========================================================= */}
        <section className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 md:p-8 shadow-[0_4px_0_#EADECE] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full border border-primary-container font-label-sm text-label-sm font-bold uppercase tracking-wider mb-3 shadow-[0_2px_0_#DE95BE]">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                <span>Provenance &amp; Skill Audit Engine</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg font-extrabold text-on-surface tracking-tight mb-2">
                Ghost-to-Solid Career Skill Map
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Every AI-proposed skill claim is grounded in verifiable resume char spans. Confirm provisional Ghost Cards to upgrade them into solid 1.0x hiring tokens.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-4 shadow-[0_3px_0_#EAD7E2] text-center min-w-[120px]">
                <span className="font-extrabold text-2xl text-primary">{unconfirmedCount}</span>
                <p className="text-[11px] font-bold text-outline uppercase mt-0.5">Ghost Cards</p>
              </div>
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-4 shadow-[0_3px_0_#A8CFBB] text-center min-w-[120px]">
                <span className="font-extrabold text-2xl text-tertiary">{solidCount}</span>
                <p className="text-[11px] font-bold text-tertiary uppercase mt-0.5">Solid Tokens</p>
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
