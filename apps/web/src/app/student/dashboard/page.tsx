'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import StudentHomeDashboard from '@/components/StudentHomeDashboard'
import SourceDrawer from '@/components/SourceDrawer'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import { mockSourceDocuments, mockSkills } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule, Skill } from '@/lib/types'

export default function StudentDashboardPage() {
  const router = useRouter()
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)
  const [skills, setSkills] = useState<Skill[]>(mockSkills)

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleNavigate = (view: 'skills' | 'sandbox' | 'sprint' | 'defense' | 'applications') => {
    switch (view) {
      case 'skills':
        router.push('/student/home')
        break
      case 'sandbox':
      case 'sprint':
        router.push('/student/matches')
        break
      case 'defense':
        router.push('/student/arena')
        break
      case 'applications':
        router.push('/student/applications')
        break
    }
  }

  return (
    <AppLayout pageTitle="Dashboard Overview" breadcrumb="Student Workspace">
      <div className="space-y-6">
        <StudentHomeDashboard
          studentName="Aarav Sharma"
          cgpa={8.42}
          branch="B.Tech Computer Science"
          institution="NIT Karnataka, Surathkal"
          skills={skills}
          onNavigate={handleNavigate}
          onOpenPrivacyVault={() => {}}
          onUploadResume={(fileName, newSkills) => {
            setSkills((prev) => [...prev, ...newSkills])
          }}
          onOpenSourceDoc={handleOpenSource}
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
