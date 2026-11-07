'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import StudentHomeDashboard from '@/components/StudentHomeDashboard'
import SourceDrawer from '@/components/SourceDrawer'
import {
  getActiveUser,
  fetchLiveStudentProfile,
  fetchLiveStudentEvidence,
  ApiError,
} from '@/lib/api-client'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument, Skill } from '@/lib/types'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'

export default function StudentDashboardPage() {
  const router = useRouter()
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [student, setStudent] = useState<any>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setErrorMsg(null)

    const user = getActiveUser()
    const studentId = user?.id || 'STU-101'

    try {
      // 1. Fetch live profile and evidence directly from Excel database
      const [profileRes, evidenceRes] = await Promise.all([
        fetchLiveStudentProfile(studentId).catch(() => null),
        fetchLiveStudentEvidence(studentId).catch(() => []),
      ])

      if (profileRes?.student) {
        setStudent(profileRes.student)
      } else if (user) {
        setStudent({
          student_id: user.id,
          full_name: user.name || 'Student Candidate',
          cgpa: user.cgpa || 8.0,
          program: user.program || 'B.Tech CSE',
          readiness_index: user.readiness_index || 70,
        })
      } else {
        setStudent({
          student_id: 'STU-101',
          full_name: 'Aarav Sharma',
          cgpa: 8.42,
          program: 'B.Tech Computer Science & Engineering',
          readiness_index: 88,
        })
      }

      // 2. Map evidence rows to Skill models
      const mappedSkills: Skill[] = (evidenceRes || []).map((ev: any, idx: number) => ({
        id: ev.evidence_id || `ev-${idx}`,
        name: ev.skill_name || 'Skill',
        category: ev.category || 'Core CS',
        proficiency: ev.multiplier >= 0.85 ? 'Advanced' : 'Intermediate',
        evidenceStatus:
          ev.tier === '4_ASSESSMENT_VERIFIED'
            ? 'ASSESSMENT_VERIFIED'
            : ev.tier === '2_STUDENT_CONFIRMED'
            ? 'STUDENT_CONFIRMED'
            : 'EXTRACTED',
        sourceDocumentId: ev.source_doc || 'doc_resume_v3',
        sourceSpan: ev.source_span_text || 'Verified via curriculum transcript',
        confidence: Number(ev.confidence || 0.90),
      }))

      setSkills(mappedSkills)
    } catch (err: any) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'Unable to synchronize with live database ledger. Please retry.'
      )
    } finally {
      setLoading(false)
    }
  }

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
        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-1 font-bold text-rose-900 underline hover:no-underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-3xl bg-white border border-[#E6E3DC] p-8 animate-pulse flex flex-col justify-between">
              <div className="h-6 w-1/3 bg-[#F1EFEA] rounded-xl" />
              <div className="h-4 w-1/2 bg-[#F1EFEA] rounded-xl" />
              <div className="grid grid-cols-4 gap-4">
                <div className="h-12 bg-[#F1EFEA] rounded-xl" />
                <div className="h-12 bg-[#F1EFEA] rounded-xl" />
                <div className="h-12 bg-[#F1EFEA] rounded-xl" />
                <div className="h-12 bg-[#F1EFEA] rounded-xl" />
              </div>
            </div>
            <div className="h-80 rounded-3xl bg-white border border-[#E6E3DC] p-8 animate-pulse" />
          </div>
        ) : (
          <StudentHomeDashboard
            studentName={student?.full_name || 'Student Candidate'}
            cgpa={parseFloat(student?.cgpa || 8.0)}
            branch={student?.program || 'B.Tech CSE'}
            institution="NIT Karnataka, Surathkal"
            skills={skills}
            onNavigate={handleNavigate}
            onOpenPrivacyVault={() => {}}
            onUploadResume={(fileName, newSkills) => {
              setSkills((prev) => [...prev, ...newSkills])
            }}
            onOpenSourceDoc={handleOpenSource}
          />
        )}
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />
    </AppLayout>
  )
}
