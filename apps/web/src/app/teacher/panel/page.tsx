'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import FacultyMentorView from '@/components/FacultyMentorView'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument } from '@/lib/types'
import { Award, BookOpen } from 'lucide-react'

export default function TeacherPanelPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  return (
    <AppLayout
      pageTitle="Advisee Roster & Capstones"
      breadcrumb="Faculty Department Advisory"
      activeRole="FACULTY"
      userName="Dr. Kavita Iyer"
      userSubtitle="Faculty Mentor • Department of CSE"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-iris-surface text-iris border border-iris-border">
              <Award className="h-3.5 w-3.5" />
              Faculty Departmental Advisory Console
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Advisee Roster &amp; Capstone Endorsements
            </h2>
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
    </AppLayout>
  )
}
