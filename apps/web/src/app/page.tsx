'use client'

import { useState } from 'react'
import Link from 'next/link'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import PrivacyShieldBar from '@/components/PrivacyShieldBar'
import CollapsibleNavDrawer, { ActiveWorkspaceView } from '@/components/CollapsibleNavDrawer'
import StudentWorkspaceView from '@/components/StudentWorkspaceView'
import DiagnosticsPanel from '@/components/DiagnosticsPanel'
import ChatWorkspace from '@/components/ChatWorkspace'
import SourceDrawer from '@/components/SourceDrawer'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import PlacementOfficerView from '@/components/PlacementOfficerView'
import RecruiterPartnerView from '@/components/RecruiterPartnerView'
import FacultyMentorView from '@/components/FacultyMentorView'
import PrivacyControlModal from '@/components/PrivacyControlModal'
import RegisterAccountModal from '@/components/RegisterAccountModal'
import SyncExcelModal from '@/components/SyncExcelModal'
import ExplainerModal from '@/components/ExplainerModal'
import { mockSourceDocuments, mockStudent, mockSkills } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule, UserRole, Skill } from '@/lib/types'
import { ArrowLeft, MessageSquare, LayoutGrid, Sparkles } from 'lucide-react'

export default function Home() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
  const [currentRole, setCurrentRole] = useState<UserRole | 'ADMIN'>('STUDENT')
  const [studentMode, setStudentMode] = useState<'workspace' | 'chat'>('workspace')
  const [studentTab, setStudentTab] = useState<'readiness' | 'practice' | 'matches' | 'applications'>(
    'readiness'
  )

  const [navDrawerOpen, setNavDrawerOpen] = useState(false)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [syncExcelModalOpen, setSyncExcelModalOpen] = useState(false)
  const [explainerModalOpen, setExplainerModalOpen] = useState(false)

  // Live Student State Memory
  const [studentName, setStudentName] = useState(DEMO_PERSONAS[0].name)
  const [cgpa, setCgpa] = useState(DEMO_PERSONAS[0].cgpa ?? 8.42)
  const [skills, setSkills] = useState<Skill[]>(mockSkills)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(
    mockSourceDocuments['doc_resume_v3'] ?? null
  )

  const handleSelectPersona = (persona: DemoPersona) => {
    setCurrentPersona(persona)
    if (persona.role === 'STUDENT') {
      setCurrentRole('STUDENT')
      setStudentName(persona.name)
      if (persona.cgpa) setCgpa(persona.cgpa)
    } else {
      setCurrentRole(persona.role)
    }
  }

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    const doc = mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3']
    setSelectedDoc(doc)
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

  const handlePurgeUnconfirmed = () => {
    setSkills((prev) => prev.filter((s) => s.evidenceStatus !== 'EXTRACTED'))
  }

  const handleSkillEndorsed = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId
          ? { ...s, evidenceStatus: 'INSTITUTION_VERIFIED', confirmedAt: new Date().toISOString() }
          : s
      )
    )
  }

  const unconfirmedCount = skills.filter((s) => s.evidenceStatus === 'EXTRACTED').length

  return (
    <main className="min-h-screen bg-canvas text-ink-primary flex flex-col font-sans">
      {/* 1. Global Top Navigation & 1-Click Demo Persona Bar */}
      <TopNavBar
        currentPersona={currentPersona}
        onSelectPersona={handleSelectPersona}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
        onOpenSyncExcelModal={() => setSyncExcelModalOpen(true)}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
        onOpenExplainerModal={() => setExplainerModalOpen(true)}
      />

      {/* 2. Privacy Shield Status Bar */}
      <PrivacyShieldBar
        onOpenPrivacyCenter={() => setPrivacyModalOpen(true)}
        activeRecruitersCount={2}
      />

      {/* 2b. 11-Route Master Navigation Strip */}
      <div className="bg-[#F1EFEA] border-b border-[#E6E3DC] px-4 py-2 overflow-x-auto">
        <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-2xs font-bold text-ink-muted whitespace-nowrap">
          <span className="text-ink-primary uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#6D3B56]" /> 11 Live Next.js Routes:
          </span>
          <Link href="/auth" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /auth
          </Link>
          <Link href="/login" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /login
          </Link>
          <Link href="/student/dashboard" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /student/dashboard
          </Link>
          <Link href="/student/home" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /student/home
          </Link>
          <Link href="/student/arena" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /student/arena
          </Link>
          <Link href="/student/matches" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /student/matches
          </Link>
          <Link href="/student/chat" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /student/chat
          </Link>
          <Link href="/student/applications" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /student/applications
          </Link>
          <Link href="/teacher/panel" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /teacher/panel
          </Link>
          <Link href="/officer/panel" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /officer/panel
          </Link>
          <Link href="/admin/diagnostics" className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DC] hover:text-[#6D3B56] transition-colors">
            /admin/diagnostics
          </Link>
        </div>
      </div>

      {/* 3. Collapsible Navigation Drawer */}
      <CollapsibleNavDrawer
        isOpen={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        currentRole={currentRole === 'ADMIN' ? 'OFFICER' : currentRole}
        onRoleChange={(r) => {
          setCurrentRole(r)
          const p = DEMO_PERSONAS.find((dp) => dp.role === r)
          if (p) setCurrentPersona(p)
        }}
        activeView={studentMode === 'chat' ? 'all' : studentTab}
        onSelectView={(v) => {
          if (v === 'all') {
            setStudentMode('chat')
          } else {
            setStudentMode('workspace')
            if (v === 'skills') setStudentTab('readiness')
            else if (v === 'sandbox') setStudentTab('matches')
            else if (v === 'sprint') setStudentTab('readiness')
            else if (v === 'defense') setStudentTab('practice')
            else if (v === 'applications') setStudentTab('applications')
            else setStudentTab('readiness')
          }
          setCurrentRole('STUDENT')
        }}
        unconfirmedCount={unconfirmedCount}
        studentName={studentName}
        cgpa={cgpa}
      />

      {/* 4. Central Dynamic Content Area According to Active Persona */}
      <div className="flex-1 flex flex-col px-4 sm:px-6">
        {/* VIEW A: System Admin / AI & MCP Diagnostics Console */}
        {currentRole === 'ADMIN' && <DiagnosticsPanel />}

        {/* VIEW B: Placement Officer Console */}
        {currentRole === 'OFFICER' && (
          <div className="flex-1 max-w-[1240px] w-full mx-auto py-6 animate-in fade-in-50 duration-200">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-hairline bg-surface p-3.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPersona(DEMO_PERSONAS[0])}
                  className="flex items-center gap-1.5 rounded-lg border border-border-hairline bg-canvas px-3 py-1.5 text-xs font-semibold text-oxford hover:bg-subtle transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Student Hub
                </button>
                <span className="font-display text-sm font-semibold text-ink-primary">
                  Placement Officer Console — Criteria, Cohort Liquidity &amp; Dispute Queue
                </span>
              </div>
              <span className="font-mono text-2xs rounded bg-oxford-surface px-2.5 py-1 text-oxford font-medium">
                DPDP Anonymized Cohort Protection ($k \ge 5$)
              </span>
            </div>
            <PlacementOfficerView onOpenSource={handleOpenSource} />
          </div>
        )}

        {/* VIEW C: Recruiter Partner Portal */}
        {currentRole === 'RECRUITER' && (
          <div className="flex-1 max-w-[1240px] w-full mx-auto py-6 animate-in fade-in-50 duration-200">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-hairline bg-surface p-3.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPersona(DEMO_PERSONAS[0])}
                  className="flex items-center gap-1.5 rounded-lg border border-border-hairline bg-canvas px-3 py-1.5 text-xs font-semibold text-oxford hover:bg-subtle transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Student Hub
                </button>
                <span className="font-display text-sm font-semibold text-ink-primary">
                  Recruiter Partner Portal — Consented Candidates &amp; Provenance Evidence
                </span>
              </div>
              <span className="font-mono text-2xs rounded bg-emerald-surface px-2.5 py-1 text-emerald font-medium border border-emerald-border">
                Zero-Trust Consent Enforced
              </span>
            </div>
            <RecruiterPartnerView onOpenSourceDoc={handleOpenSource} />
          </div>
        )}

        {/* VIEW D: Faculty Mentor Advisory */}
        {currentRole === 'FACULTY' && (
          <div className="flex-1 max-w-[1240px] w-full mx-auto py-6 animate-in fade-in-50 duration-200">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-hairline bg-surface p-3.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPersona(DEMO_PERSONAS[0])}
                  className="flex items-center gap-1.5 rounded-lg border border-border-hairline bg-canvas px-3 py-1.5 text-xs font-semibold text-oxford hover:bg-subtle transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Student Hub
                </button>
                <span className="font-display text-sm font-semibold text-ink-primary">
                  Faculty Mentor Advisory — Advisee Readiness &amp; Capstone Endorsements
                </span>
              </div>
              <span className="font-mono text-2xs rounded bg-iris-surface px-2.5 py-1 text-iris font-medium border border-iris-border">
                Departmental Authority Scope
              </span>
            </div>
            <FacultyMentorView
              onOpenSourceDoc={handleOpenSource}
              onSkillEndorsed={handleSkillEndorsed}
            />
          </div>
        )}

        {/* VIEW E: Student Experience (4 Clean Workspace Tabs OR AI Career Companion Chat) */}
        {currentRole === 'STUDENT' && (
          <div className="flex-1 max-w-[1240px] w-full mx-auto py-4 space-y-4">
            {/* Mode Switcher Banner: 4 Workspace Tabs vs AI Chat */}
            <div className="flex items-center justify-between rounded-xl border border-border-hairline bg-surface p-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNavDrawerOpen(true)}
                  className="rounded-lg border border-border-hairline bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-primary hover:bg-subtle"
                >
                  ☰ Menu
                </button>
                <span className="font-display text-sm font-bold text-ink-primary">
                  {studentMode === 'workspace'
                    ? 'Student Career Readiness Studio'
                    : 'AI Career Companion Chat'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudentMode('workspace')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    studentMode === 'workspace'
                      ? 'bg-oxford text-white shadow-2xs'
                      : 'border border-border-hairline bg-canvas text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  4-Tab Studio
                </button>

                <button
                  type="button"
                  onClick={() => setStudentMode('chat')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    studentMode === 'chat'
                      ? 'bg-oxford text-white shadow-2xs'
                      : 'border border-border-hairline bg-canvas text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  AI Companion Chat
                </button>
              </div>
            </div>

            {studentMode === 'workspace' ? (
              <StudentWorkspaceView
                studentId={currentPersona.studentId || 'STU-101'}
                studentName={studentName}
                cgpa={cgpa}
                skills={skills}
                onSetSkills={setSkills}
                onOpenSourceDoc={handleOpenSource}
                onOpenDispute={handleOpenDispute}
                activeTab={studentTab}
                onTabChange={setStudentTab}
              />
            ) : (
              <ChatWorkspace
                activeView="all"
                onViewChange={(v) => {
                  if (v === 'overview') setStudentMode('workspace')
                }}
                onOpenSourceDrawer={handleOpenSource}
                onToggleNav={() => setNavDrawerOpen(true)}
                onRoleSwitch={(r) => {
                  setCurrentRole(r)
                  const p = DEMO_PERSONAS.find((dp) => dp.role === r)
                  if (p) setCurrentPersona(p)
                }}
                onOpenDispute={handleOpenDispute}
                studentName={studentName}
                cgpa={cgpa}
                onUpdateCgpa={setCgpa}
                skills={skills}
                onSetSkills={setSkills}
                onUploadResume={handleUploadResume}
              />
            )}
          </div>
        )}
      </div>

      {/* 5. Modals & Slide-over Drawers */}
      <RegisterAccountModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onAccountCreated={(acc) => {
          // If created student, switch to it
          if (acc.student_id) {
            const newP: DemoPersona = {
              id: acc.student_id,
              name: acc.student.full_name,
              role: 'STUDENT',
              subtext: `${acc.student.program} • ${acc.student.cgpa} CGPA`,
              cgpa: acc.student.cgpa,
              studentId: acc.student_id,
            }
            DEMO_PERSONAS.push(newP)
            handleSelectPersona(newP)
          }
        }}
      />

      <SyncExcelModal
        isOpen={syncExcelModalOpen}
        onClose={() => setSyncExcelModalOpen(false)}
      />

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

      <PrivacyControlModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        onOpenSourceDoc={handleOpenSource}
        onPurgeUnconfirmed={handlePurgeUnconfirmed}
      />

      <ExplainerModal
        isOpen={explainerModalOpen}
        onClose={() => setExplainerModalOpen(false)}
      />
    </main>
  )
}
