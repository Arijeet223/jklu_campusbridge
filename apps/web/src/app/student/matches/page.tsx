'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import MatchCard from '@/components/MatchCard'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import SourceDrawer from '@/components/SourceDrawer'
import { mockJobMatches, mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule } from '@/lib/types'
import { SlidersHorizontal, ShieldCheck } from 'lucide-react'

export default function StudentMatchesPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  const handleOpenDispute = (rule: EligibilityRule, jobTitle: string, company: string) => {
    setDisputeRule(rule)
    setDisputeJob({ title: jobTitle, company })
    setDisputeDrawerOpen(true)
  }

  return (
    <AppLayout pageTitle="What-If Fit Sandbox" breadcrumb="Student Workspace">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#B6D9EC]/40 text-[#2B5B75] border border-[#B6D9EC]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Counterfactual &quot;What-If&quot; Opportunity Sandbox
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Live Job Fit &amp; Eligibility Simulator
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Toggle skill simulation checkmarks to view instant &lt;50ms fit score gains, or click any Unmet/Unknown badge to submit a dispute ticket.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-2xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Deterministic Policy Shell
            </span>
          </div>
        </div>

        {/* Opportunity Match Cards */}
        <div className="space-y-5">
          {mockJobMatches.map((match) => (
            <MatchCard
              key={match.id}
              jobTitle={match.jobTitle}
              company={match.company}
              deadline={match.deadline}
              eligibilityRules={match.eligibilityRules}
              alignmentScore={match.alignmentScore}
              factorBreakdown={match.factorBreakdown}
              sandboxToggles={match.sandboxToggles}
              onOpenDispute={handleOpenDispute}
              onAddPlan={() => {
                alert(`Added customized sprint plan for ${match.jobTitle} to your roadmap!`)
              }}
            />
          ))}
        </div>
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
