'use client'

import { useState } from 'react'
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

  const [studentName, setStudentName] = useState('Aarav Sharma')
  const [cgpa, setCgpa] = useState(8.42)
  const [skills, setSkills] = useState<Skill[]>(mockSkills)

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
    setSkills((prev) => [...prev, ...newExtractedSkills])
  }

  return (
    <AppLayout pageTitle="AI Career Coach" breadcrumb="Student Workspace">
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <ChatWorkspace
          activeView="all"
          onViewChange={() => {}}
          onOpenSourceDrawer={handleOpenSource}
          onToggleNav={() => {}}
          onRoleSwitch={() => {}}
          onOpenDispute={handleOpenDispute}
          studentName={studentName}
          cgpa={cgpa}
          onUpdateCgpa={setCgpa}
          skills={skills}
          onSetSkills={setSkills}
          onUploadResume={handleUploadResume}
        />
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
        jobTitle={disputeJob.title}
        company={disputeJob.company}
        onOpenSourceSpan={() => handleOpenSource('doc_resume_v3')}
      />
    </AppLayout>
  )
}
