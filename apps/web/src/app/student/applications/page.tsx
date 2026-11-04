'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import ApplicationsTrackerView from '@/components/ApplicationsTrackerView'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule } from '@/lib/types'
import { ClipboardList, Sparkles } from 'lucide-react'

export default function StudentApplicationsPage() {
  const router = useRouter()
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleOpenDispute = (jobTitle: string, company: string, ruleLabel: string) => {
    setDisputeRule({
      id: 'disp-rule-1',
      label: ruleLabel,
      status: 'UNKNOWN',
      ruleExpression: `Requirement: ${ruleLabel}`,
      clarificationHint: `Attach proof or clarify your standing for ${ruleLabel}`,
    })
    setDisputeJob({ title: jobTitle, company })
    setDisputeDrawerOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex flex-col font-sans">
      <TopNavBar
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onOpenRegisterModal={() => {}}
        onOpenSyncExcelModal={() => {}}
        onOpenPrivacyModal={() => {}}
        onOpenExplainerModal={() => setExplainerOpen(true)}
      />

      <div className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
              <ClipboardList className="h-3.5 w-3.5" />
              Kanban Pipeline &amp; Milestone Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Applications &amp; Interview Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted">
              Track active campus drives from initial opt-in through deterministic eligibility, 120s micro-defense viva, and interview shortlisting.
            </p>
          </div>
        </div>

        <ApplicationsTrackerView
          onOpenDispute={handleOpenDispute}
          onOpenSprint={() => router.push('/student/matches')}
          onOpenDefense={() => router.push('/student/arena')}
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
