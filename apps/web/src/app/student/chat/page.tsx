'use client'

import { useState } from 'react'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import ChatWorkspace from '@/components/ChatWorkspace'
import SourceDrawer from '@/components/SourceDrawer'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import { mockSourceDocuments, mockSkills } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule, Skill } from '@/lib/types'

export default function StudentChatPage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)
  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const [studentName, setStudentName] = useState(DEMO_PERSONAS[0].name)
  const [cgpa, setCgpa] = useState(DEMO_PERSONAS[0].cgpa ?? 8.42)
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
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex flex-col font-sans">
      <TopNavBar
        currentPersona={currentPersona}
        onSelectPersona={(p) => {
          setCurrentPersona(p)
          setStudentName(p.name)
          if (p.cgpa) setCgpa(p.cgpa)
        }}
        onOpenRegisterModal={() => {}}
        onOpenSyncExcelModal={() => {}}
        onOpenPrivacyModal={() => {}}
        onOpenExplainerModal={() => setExplainerOpen(true)}
      />

      <div className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
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

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}

