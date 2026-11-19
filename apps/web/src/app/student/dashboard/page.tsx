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
import type { SourceDocument, Skill, EvidenceStatus } from '@/lib/types'
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
        const combined = {
          ...profileRes.student,
          full_name: profileRes.student.full_name || user?.name || (studentId.toLowerCase().includes('arijeet') ? 'Arijeet Basak' : 'Student Candidate'),
          cgpa: user?.cgpa || profileRes.student.cgpa || 8.0,
          program: profileRes.student.program || user?.program || 'B.Tech CSE',
          readiness_index: profileRes.student.readiness_index || user?.readiness_index || 84,
        }
        setStudent(combined)
      } else if (user) {
        setStudent({
          student_id: user.id,
          full_name: user.name || (studentId.toLowerCase().includes('arijeet') ? 'Arijeet Basak' : 'Student Candidate'),
          cgpa: user.cgpa || 8.0,
          program: user.program || 'B.Tech CSE',
          readiness_index: user.readiness_index || 84,
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
      const mappedSkills: Skill[] = (evidenceRes || []).map((ev: any, idx: number) => {
        const tier = String(ev.tier || ev.evidence_status || ev.evidenceStatus || '')
        let evStatus: EvidenceStatus = 'EXTRACTED'
        if (tier.includes('INSTITUTION')) {
          evStatus = 'INSTITUTION_VERIFIED'
        } else if (tier.includes('ASSESSMENT') || tier.includes('VERIFIED')) {
          evStatus = 'ASSESSMENT_VERIFIED'
        } else if (tier.includes('ARTIFACT')) {
          evStatus = 'ARTIFACT_LINKED'
        } else if (tier.includes('CONFIRMED')) {
          evStatus = 'STUDENT_CONFIRMED'
        }

        return {
          id: ev.evidence_id || ev.id || `ev-${idx}`,
          name: ev.skill_name || ev.name || 'Skill',
          category: ev.category || 'Technical Skills',
          proficiency: (ev.proficiency as any) || (ev.multiplier >= 0.85 ? 'Advanced' : 'Intermediate'),
          evidenceStatus: evStatus,
          sourceDocumentId: ev.source_doc || ev.sourceDocumentId || 'doc_resume_v3',
          sourceSpan: ev.source_span_text || ev.sourceSpan || 'Verified via profile ledger',
          confidence: Number(ev.confidence ?? 0.90),
        }
      })

      if (mappedSkills.length > 0) {
        setSkills(mappedSkills)
      } else if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`cb_user_skills_${studentId}`) || localStorage.getItem('cb_user_skills')
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSkills(parsed)
            }
          }
        } catch {}

        // Fallback fetch to Next.js API evidence route for verified credentials
        fetch(`/api/students/${studentId}/evidence`)
          .then((r) => (r.ok ? r.json() : []))
          .then((evList) => {
            if (Array.isArray(evList) && evList.length > 0) {
              setSkills(evList)
            }
          })
          .catch(() => {})
      }
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
            studentId={student?.student_id || 'STU-101'}
            studentName={student?.full_name || 'Student Candidate'}
            cgpa={parseFloat(student?.cgpa || 8.0)}
            branch={student?.program || 'B.Tech CSE'}
            institution="JKLU (JK Lakshmipat University)"
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
