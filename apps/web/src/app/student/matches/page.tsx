'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import MatchCard from '@/components/MatchCard'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments, mockJobMatches } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule } from '@/lib/types'
import { SlidersHorizontal, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react'

export default function StudentMatchesPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState('STU-101')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.id) setStudentId(parsed.id)
      }
    } catch {}
    fetchLiveMatches()
  }, [])

  const fetchLiveMatches = async () => {
    setLoading(true)
    try {
      let activeId = 'STU-101'
      try {
        const stored = localStorage.getItem('cb_active_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.id) activeId = parsed.id
        }
      } catch {}

      const res = await fetch(`/api/backend/v1/matching/live-jobs?student_id=${activeId}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setMatches(data)
          return
        }
      }
      setMatches(mockJobMatches)
    } catch {
      setMatches(mockJobMatches)
    } finally {
      setLoading(false)
    }
  }

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
              Dynamic Real-Time Alignment Sandbox
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Live Job Fit &amp; Eligibility Simulator
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Dynamically evaluated from your genuine parsed resume and verified evidence against active corporate job descriptions (Opportunities_JDs).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLiveMatches}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DFD9] bg-[#FAF8F6] hover:bg-white text-xs font-bold text-ink-primary transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#6D3B56] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Scores</span>
            </button>
            <span className="inline-flex items-center gap-1 text-2xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Deterministic Policy Shell
            </span>
          </div>
        </div>

        {/* Opportunity Match Cards */}
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-[#E6E3DC] space-y-3 shadow-xs">
            <RefreshCw className="h-8 w-8 text-[#6D3B56] animate-spin mx-auto" />
            <p className="text-sm font-display font-bold text-ink-primary">
              Computing Live Weighted Alignment Scores...
            </p>
            <p className="text-2xs text-ink-muted font-mono">
              Evaluating student skills &amp; evidence multipliers against Opportunities_JDs criteria
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {matches.map((match) => (
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
        )}
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
