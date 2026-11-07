'use client'

import { useState, useEffect } from 'react'
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
    <AppLayout pageTitle="AI Career Coach" breadcrumb="Student Workspace">
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <ChatWorkspace
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
