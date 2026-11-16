'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import ChatWorkspace from '@/components/ChatWorkspace'
import SourceDrawer from '@/components/SourceDrawer'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import { mockSourceDocuments, mockSkills } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule, Skill } from '@/lib/types'

export default function StudentChatPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)
  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const [studentId, setStudentId] = useState('STU-101')
  const [studentName, setStudentName] = useState('Aarav Sharma')
  const [cgpa, setCgpa] = useState(8.42)
  const [skills, setSkills] = useState<Skill[]>(mockSkills)
  const [chatKey, setChatKey] = useState(0)

  const handleNewChat = async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`cb_chat_history_${studentId}`)
        localStorage.removeItem('cb_chat_messages')
      } catch {}
    }
    try {
      await fetch('/api/v1/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, messages: [] }),
      })
    } catch {}
    setChatKey((k) => k + 1)
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u.id) setStudentId(u.id)
        if (u.name) setStudentName(u.name)
        if (u.cgpa) setCgpa(Number(u.cgpa))
      }
      const storedSkills = localStorage.getItem('cb_user_skills')
      if (storedSkills) {
        const parsedSkills = JSON.parse(storedSkills)
        if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
          setSkills(parsedSkills)
        }
      }
    } catch {}
  }, [])

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleOpenDispute = (rule: EligibilityRule, jobTitle: string, company: string) => {
    setDisputeRule(rule)
    setDisputeJob({ title: jobTitle, company })
    setDisputeDrawerOpen(true)
  }

  const handleUploadResume = (fileName: string, newExtractedSkills: Skill[]) => {
    setSkills((prev) => {
      const merged = [...prev, ...newExtractedSkills]
      try {
        localStorage.setItem('cb_user_skills', JSON.stringify(merged))
      } catch {}
      return merged
    })
  }

  return (
    <AppLayout pageTitle="AI Coaching Studio" breadcrumb="Student Workspace">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] font-body-md text-on-surface">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: Coaching Sessions & Drives (3 cols)         */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex lg:col-span-3 bg-surface-container-lowest rounded-3xl border border-outline-variant p-4 flex-col justify-between shadow-[0_4px_0_#EAD7E2] overflow-hidden">
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Header with New Chat */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-xl">chat</span>
                <h2 className="text-xs font-bold text-on-surface">Coaching Sessions</h2>
              </div>
              <button
                type="button"
                onClick={handleNewChat}
                className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold shadow-[0_2px_0_#643953] active:translate-y-[1px] transition-all flex items-center gap-1 cursor-pointer hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>New</span>
              </button>
            </div>

            {/* Pinned & Active Drives */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-1 block mb-2">
                Pinned &amp; Active Drives
              </span>
              <div className="flex flex-col gap-2">
                <div className="p-3 rounded-2xl bg-primary-container/20 border-2 border-primary-container cursor-pointer shadow-[0_2px_0_#DE95BE] transition-all hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <p className="text-xs font-bold text-on-surface leading-tight">RazorpayX Backend Prep</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary-container border border-outline-variant">
                      28h left
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">SDE-1 Systems Concurrency drill</p>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant cursor-pointer transition-all hover:border-secondary-fixed-dim">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <p className="text-xs font-medium text-on-surface leading-tight">Atlassian Systems Defense</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim">
                      44h left
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">Jira Cloud Core Distributed Log</p>
                </div>
              </div>
            </div>

            {/* Recent Transcripts & Drills */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-1 block mb-2">
                Recent Drills &amp; Proofs
              </span>
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/student/arena"
                  className="p-2.5 rounded-xl hover:bg-surface-container-low transition flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary">
                      FastAPI Redis Idempotency
                    </span>
                    <span className="text-[10px] text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span> Solid 1.0x Locked
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
                </Link>

                <Link
                  href="/student/arena"
                  className="p-2.5 rounded-xl hover:bg-surface-container-low transition flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary">
                      SQL DENSE_RANK() Debug
                    </span>
                    <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Needs Revision
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Footer: Model Telemetry */}
          <div className="pt-3 border-t border-outline-variant/60">
            <div className="flex items-center justify-between bg-surface-container-low p-2.5 rounded-2xl border border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">terminal</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-on-surface">Ollama qwen2.5:7b</span>
                  <span className="text-[9px] text-outline font-mono">Local • Zero-Cloud-Leak</span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CENTER / RIGHT: Chat Workspace (9 cols)                   */}
        {/* ========================================================= */}
        <section className="col-span-1 lg:col-span-9 bg-surface-container-lowest rounded-3xl border border-outline-variant flex flex-col justify-between shadow-[0_4px_0_#EAD7E2] overflow-hidden h-full">
          <ChatWorkspace
            key={chatKey}
            activeView="all"
            onViewChange={() => {}}
            onOpenSourceDrawer={handleOpenSource}
            onToggleNav={() => {}}
            onRoleSwitch={() => {}}
            onOpenDispute={handleOpenDispute}
            studentId={studentId}
            studentName={studentName}
            cgpa={cgpa}
            onUpdateCgpa={setCgpa}
            skills={skills}
            onSetSkills={setSkills}
            onUploadResume={handleUploadResume}
            onNewChat={handleNewChat}
          />
        </section>
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />

      <DisputeClarificationDrawer
        isOpen={disputeDrawerOpen}
        onClose={() => setDisputeDrawerOpen(false)}
        rule={disputeRule}
        company={disputeJob.company}
        onOpenSourceSpan={() => handleOpenSource('doc_resume_v3')}
      />
    </AppLayout>
  )
}
