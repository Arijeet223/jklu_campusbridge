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
        <div className="rounded-3xl bg-surface-container-low border border-outline-variant p-6 shadow-[0_4px_0_#EADECE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim shadow-[0_2px_0_#85B5CE]">
              <span className="material-symbols-outlined text-sm">school</span>
              <span>Faculty Departmental Advisory Console • JKLU</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Advisee Roster &amp; Capstone Endorsements
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              Inspect student transcripts and capstone deliverables; endorse verified project proficiencies (upgrades skills to Level 3 in Excel DB).
            </p>
          </div>

          <span className="text-xs font-bold rounded-full bg-tertiary-container text-on-tertiary-container px-3.5 py-1.5 border border-tertiary-fixed-dim shadow-[0_2px_0_#a8cfbb]">
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
