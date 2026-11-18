'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/components/layout/AppLayout'
import StudentHomeDashboard from '@/components/StudentHomeDashboard'
import FacultyMentorView from '@/components/FacultyMentorView'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import { getActiveUser } from '@/lib/api-client'
import type { SourceDocument, Skill } from '@/lib/types'

export default function RootHomePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [activeRole, setActiveRole] = useState<string>('STUDENT')
  const [userName, setUserName] = useState<string>('Aarav Sharma')
  const [userDepartment, setUserDepartment] = useState<string>('B.Tech Computer Science')
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)
  const [skills, setSkills] = useState<Skill[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cb_user_skills')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) return parsed
        }
      } catch {}
    }
    return []
  })

  useEffect(() => {
    try {
      const activeUser = getActiveUser()
      const role = (session?.user?.role || activeUser?.role || 'STUDENT').toUpperCase()
      setActiveRole(role)

      if (session?.user?.name) {
        setUserName(session.user.name)
      } else if (activeUser?.name) {
        setUserName(activeUser.name)
      }

      if (role === 'TEACHER' || role === 'FACULTY' || role === 'FACULTY_MENTOR') {
        setUserDepartment((activeUser as any)?.department || 'Department of CSE')
      }
    } catch {}
  }, [session])

  const isFaculty =
    activeRole === 'FACULTY' ||
    activeRole === 'TEACHER' ||
    activeRole === 'FACULTY_MENTOR' ||
    activeRole === 'PLACEMENT_OFFICER' ||
    activeRole === 'OFFICER' ||
    activeRole === 'TPO' ||
    activeRole === 'PTO' ||
    activeRole === 'ADMIN'

  // If faculty visits root, they can view the Faculty Advisory Console directly or navigate to /teacher/panel
  const isTeacher = isFaculty

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

  // 1. TEACHER VIEW: Advisee Roster, GitHub Code Inspection & Capstone Endorsement
  if (isTeacher) {
    return (
      <AppLayout
        pageTitle="Advisee Roster & Capstones"
        breadcrumb="Faculty Department Advisory"
        activeRole="FACULTY"
        userName={userName || 'Dr. Kavita Iyer'}
        userSubtitle={`Faculty Mentor • ${userDepartment}`}
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
                Inspect student code repositories, review project evidence, and grant official Institution-Verified endorsements.
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

  // 2. STUDENT VIEW (Default)
  return (
    <AppLayout pageTitle="Dashboard Overview" breadcrumb="Student Workspace">
      <div className="space-y-6">
        <StudentHomeDashboard
          studentName={userName || 'Aarav Sharma'}
          cgpa={8.42}
          branch="B.Tech Computer Science"
          institution="JKLU (JK Lakshmipat University)"
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
