'use client'

import { useState } from 'react'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import FacultyMentorView from '@/components/FacultyMentorView'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument } from '@/lib/types'
import { Award, Sparkles, BookOpen } from 'lucide-react'

export default function TeacherPanelPage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(
    DEMO_PERSONAS.find((p) => p.role === 'FACULTY') || DEMO_PERSONAS[3]
  )
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

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
        {/* Header */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-iris-surface text-iris border border-iris-border">
              <Award className="h-3.5 w-3.5" />
              Faculty Departmental Advisory Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Advisee Roster &amp; Capstone Endorsements
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted">
              Inspect student transcripts and capstone deliverables; endorse verified project proficiencies (upgrades skills to Level 3 in Excel DB).
            </p>
          </div>

          <span className="font-mono text-2xs rounded-full bg-iris-surface px-3 py-1 text-iris font-bold border border-iris-border">
            Academic Scope Authority
          </span>
        </div>

        <FacultyMentorView
          onOpenSourceDoc={handleOpenSource}
          onSkillEndorsed={(skillId) => {
            console.log(`Faculty endorsed skill: ${skillId}`)
          }}
        />
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

