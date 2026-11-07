'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import MatchCard from '@/components/MatchCard'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule } from '@/lib/types'
import { fetchLiveJobMatches, ApiError, formatValidationDetail, getActiveUser } from '@/lib/api-client'
import { SlidersHorizontal, ShieldCheck, RefreshCw, AlertCircle, Briefcase, Sparkles } from 'lucide-react'

export default function StudentMatchesPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [studentId, setStudentId] = useState('STU-101')

  useEffect(() => {
    const user = getActiveUser()
    const activeId = user?.id || 'STU-101'
    setStudentId(activeId)
    fetchLiveMatches(activeId)
  }, [])

  const fetchLiveMatches = async (idToFetch?: string) => {
    const targetId = idToFetch || studentId || 'STU-101'
    setLoading(true)
    setErrorMessage(null)
    try {
      const data = await fetchLiveJobMatches(targetId)
      if (Array.isArray(data)) {
        setMatches(data)
      } else {
        setMatches([])
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          setErrorMessage(`Validation error: ${formatValidationDetail(err.data?.detail)}`)
        } else {
          setErrorMessage(err.message || 'Failed to compute live job alignment from backend.')
        }
      } else {
        setErrorMessage((err as Error)?.message || 'An unexpected error occurred while loading matches.')
      }
      setMatches([])
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
              onClick={() => fetchLiveMatches()}
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

        {/* Error Banner */}
        {errorMessage && (
          <div className="rounded-2xl border-2 border-[#FCA5A5] bg-[#FEF2F2] p-4 text-xs text-[#991B1B] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#DC2626]" />
              <div>
                <p className="font-bold text-sm">Failed to Load Live Matches</p>
                <p className="text-2xs font-mono mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchLiveMatches()}
              className="px-3 py-1 rounded-lg bg-[#DC2626] text-white font-bold text-2xs hover:bg-[#B91C1C] transition-colors shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl bg-white border border-[#E6E3DC] p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-[#F1EFEA] rounded-md" />
                    <div className="h-4 w-32 bg-[#F1EFEA] rounded-md" />
                  </div>
                  <div className="h-10 w-24 bg-[#F1EFEA] rounded-2xl" />
                </div>
                <div className="h-16 w-full bg-[#FAF8F6] rounded-2xl" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-[#F1EFEA] rounded-xl" />
                  <div className="h-8 bg-[#F1EFEA] rounded-xl" />
                  <div className="h-8 bg-[#F1EFEA] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMessage && matches.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-white border border-[#E6E3DC] space-y-3 shadow-xs">
            <Briefcase className="h-10 w-10 text-ink-muted mx-auto" />
            <h3 className="text-base font-display font-bold text-ink-primary">
              No Active Job Opportunities Found
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              No job postings currently match your query or the placement database is being populated. Ensure your resume is uploaded and skills verified.
            </p>
          </div>
        )}

        {/* Opportunity Match Cards */}
        {!loading && matches.length > 0 && (
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
