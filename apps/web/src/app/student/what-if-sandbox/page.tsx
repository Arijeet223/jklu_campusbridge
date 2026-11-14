'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import MatchCard from '@/components/MatchCard'
import DisputeClarificationDrawer from '@/components/DisputeClarificationDrawer'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments, mockJobMatches } from '@/lib/mock-data'
import type { SourceDocument, EligibilityRule, JobMatch } from '@/lib/types'
import { fetchLiveJobMatches, getActiveUser } from '@/lib/api-client'

export default function WhatIfSandboxPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const [disputeRule, setDisputeRule] = useState<EligibilityRule | null>(null)
  const [disputeJob, setDisputeJob] = useState({ title: 'Backend Engineer', company: 'TechCorp India' })

  const [matches, setMatches] = useState<JobMatch[]>(mockJobMatches)
  const [loading, setLoading] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'FINTECH' | 'CLOUD' | 'HIGH_CTC'>('ALL')

  // Interactive What-If Simulator Toggle States
  const [sqlQuestToggle, setSqlQuestToggle] = useState(true)
  const [fastApiToggle, setFastApiToggle] = useState(true)
  const [deadlockToggle, setDeadlockToggle] = useState(false)

  // Derived simulation boosts
  const totalBoost = (sqlQuestToggle ? 9 : 0) + (fastApiToggle ? 12 : 0) + (deadlockToggle ? 10 : 0)
  const baseScore = 64
  const simulatedScore = Math.min(98, baseScore + totalBoost)

  useEffect(() => {
    const user = getActiveUser()
    const activeId = user?.id || 'STU-101'
    fetchLiveMatches(activeId)
  }, [])

  const fetchLiveMatches = async (idToFetch?: string) => {
    setLoading(true)
    try {
      const data = await fetchLiveJobMatches(idToFetch || 'STU-101')
      if (Array.isArray(data) && data.length > 0) {
        setMatches(data)
      } else {
        setMatches(mockJobMatches)
      }
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

  const filteredMatches = matches.filter((m) => {
    const matchSearch =
      m.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchFilter.toLowerCase())
    if (!matchSearch) return false

    if (activeCategory === 'FINTECH') {
      return m.company.toLowerCase().includes('razorpay') || m.jobTitle.toLowerCase().includes('fintech')
    }
    if (activeCategory === 'CLOUD') {
      return m.company.toLowerCase().includes('atlassian') || m.company.toLowerCase().includes('cloud')
    }
    if (activeCategory === 'HIGH_CTC') {
      return m.compensationTarget ? m.compensationTarget.includes('2') || m.compensationTarget.includes('3') : true
    }
    return true
  })

  return (
    <AppLayout pageTitle="What-If Fit Sandbox" breadcrumb="Student Workspace">
      <div className="space-y-8 font-body-md text-on-surface">
        {/* ========================================================= */}
        {/* 1. TOP HEADER BANNER (SPACIOUS & JOYFUL STITCH ARTWORK)   */}
        {/* ========================================================= */}
        <section className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 md:p-8 shadow-[0_4px_0_#EADECE] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 left-1/3 w-72 h-72 bg-primary-fixed/50 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left Banner Typography */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full border border-primary-container font-label-sm text-label-sm font-bold uppercase tracking-wider mb-3 shadow-[0_2px_0_#DE95BE]">
                <span className="material-symbols-outlined text-xs">insights</span>
                <span>Prescriptive Proof Engine</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg font-extrabold text-on-surface tracking-tight mb-2">
                Counterfactual Opportunity Sandbox
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Simulate zero-risk career trajectory leaps. Test what happens before you write a single line of code.
              </p>
            </div>

            {/* Right Flat Vector Spot Simulation Graphic */}
            <div className="w-full lg:w-auto flex items-center justify-center">
              <div className="relative bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-4 shadow-[0_4px_0_#EAD7E2] flex items-center gap-4 min-w-[280px]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-secondary-container border border-secondary text-on-secondary-container flex items-center justify-center font-bold text-headline-sm shadow-[0_2px_0_#85B5CE]">
                    <span className="material-symbols-outlined">person_play</span>
                  </div>
                  <span className="text-label-sm font-label-sm text-on-surface-variant font-bold">Sandbox Active</span>
                </div>
                {/* Floating boost bubbles with tactile shelves */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-container border border-tertiary-container px-3 py-1 rounded-full shadow-[0_2px_0_#A8CFBB] font-label-md text-label-md font-bold animate-bounce" style={{ animationDuration: '3s' }}>
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    <span>+{sqlQuestToggle ? 9 : 0}% Fit (SQL)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-primary-container text-on-primary-container border border-primary text-label-md font-label-md px-3 py-1 rounded-full shadow-[0_2px_0_#DE95BE] font-bold">
                    <span className="material-symbols-outlined text-xs">rocket_launch</span>
                    <span>+{fastApiToggle ? 12 : 0}% FastAPI Boost</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter drives by role, skill, or CTC..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-full pl-11 pr-4 py-2.5 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary shadow-[0_2px_0_#EADECE] transition-all"
              />
            </div>

            {/* Filter Chips Row */}
            <div className="flex flex-wrap items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-bold transition-transform active:translate-y-[1px] ${
                  activeCategory === 'ALL'
                    ? 'bg-primary text-on-primary border border-on-primary-fixed-variant shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant shadow-[0_2px_0_#EADECE]'
                }`}
              >
                All Companies ({matches.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('FINTECH')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-transform active:translate-y-[1px] ${
                  activeCategory === 'FINTECH'
                    ? 'bg-primary text-on-primary border border-on-primary-fixed-variant shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant shadow-[0_2px_0_#EADECE]'
                }`}
              >
                Fintech &amp; Payments
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('CLOUD')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-transform active:translate-y-[1px] ${
                  activeCategory === 'CLOUD'
                    ? 'bg-primary text-on-primary border border-on-primary-fixed-variant shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant shadow-[0_2px_0_#EADECE]'
                }`}
              >
                Cloud Platforms
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('HIGH_CTC')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-transform active:translate-y-[1px] ${
                  activeCategory === 'HIGH_CTC'
                    ? 'bg-primary text-on-primary border border-on-primary-fixed-variant shadow-[0_2px_0_#320e26]'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant shadow-[0_2px_0_#EADECE]'
                }`}
              >
                CTC &gt; 20 LPA
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. TWO-COLUMN BENTO WORKSPACE (4 COL / 8 COL)             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 4 COLUMNS: "WHAT-IF" SANDBOX TOGGLE DECK */}
          <aside className="lg:col-span-4 sticky top-24">
            <div className="bg-secondary-container/40 border-2 border-secondary-container rounded-3xl p-6 shadow-[0_4px_0_#98C5DC]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎛️</span>
                <h2 className="text-headline-sm font-headline-sm font-extrabold text-on-surface">What-If Fit Simulator</h2>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-5">
                Deterministic &lt;50ms math. Toggle quests to preview your score jump:
              </p>

              {/* Interactive Tactile Pill Toggle Cards */}
              <div className="space-y-3">
                {/* Card 1: SQL Quest */}
                <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant shadow-[0_3px_0_#EADECE] hover:border-secondary transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs text-on-surface">Pass SQL DENSE_RANK() Quest</h3>
                      <p className="text-[11px] text-on-surface-variant">Unlocks placement eligibility window filter</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSqlQuestToggle(!sqlQuestToggle)}
                      aria-label="Toggle SQL Quest"
                      className={`relative w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shadow-inner cursor-pointer shrink-0 ${
                        sqlQuestToggle ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-surface-container-lowest rounded-full shadow-[0_2px_0_rgba(0,0,0,0.15)] transition-transform ${
                          sqlQuestToggle ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-tertiary-fixed text-on-tertiary-container font-label-md text-label-md font-bold px-2.5 py-0.5 rounded-full border border-tertiary-container text-[11px]">
                      +9% Fit (0.0x → 1.0x)
                    </span>
                    <span className="text-[10px] text-outline font-semibold">Verified Rubric</span>
                  </div>
                </div>

                {/* Card 2: FastAPI Defense */}
                <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant shadow-[0_3px_0_#EADECE] hover:border-secondary transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs text-on-surface">Pass 120s FastAPI Defense</h3>
                      <p className="text-[11px] text-on-surface-variant">Solidify Redis idempotency artifact proof</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFastApiToggle(!fastApiToggle)}
                      aria-label="Toggle FastAPI Defense"
                      className={`relative w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shadow-inner cursor-pointer shrink-0 ${
                        fastApiToggle ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-surface-container-lowest rounded-full shadow-[0_2px_0_rgba(0,0,0,0.15)] transition-transform ${
                          fastApiToggle ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-tertiary-fixed text-on-tertiary-container font-label-md text-label-md font-bold px-2.5 py-0.5 rounded-full border border-tertiary-container text-[11px]">
                      +12% Fit (0.75x → 1.0x)
                    </span>
                    <span className="text-[10px] text-outline font-semibold">Auto-Graded</span>
                  </div>
                </div>

                {/* Card 3: Graph Deadlock */}
                <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant shadow-[0_3px_0_#EADECE] hover:border-secondary transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs text-on-surface">Solve Graph Deadlock DSA Quest</h3>
                      <p className="text-[11px] text-on-surface-variant">Distributed consensus lock simulation</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeadlockToggle(!deadlockToggle)}
                      aria-label="Toggle Graph Deadlock"
                      className={`relative w-12 h-6 rounded-full transition-colors flex items-center p-0.5 shadow-inner cursor-pointer shrink-0 ${
                        deadlockToggle ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-surface-container-lowest rounded-full shadow-[0_2px_0_rgba(0,0,0,0.15)] transition-transform ${
                          deadlockToggle ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-container text-on-primary-container font-label-md text-label-md font-bold px-2.5 py-0.5 rounded-full border border-primary text-[11px]">
                      +10% Fit (0.5x → 1.0x)
                    </span>
                    <span className="text-[10px] text-outline font-semibold">Optional Boost</span>
                  </div>
                </div>
              </div>

              {/* Summary Callout Banner */}
              <div className="mt-5 bg-tertiary-fixed/60 border border-tertiary rounded-2xl p-4 text-center shadow-[0_2px_0_#A8CFBB]">
                <p className="font-extrabold text-sm text-on-tertiary-container">
                  ✨ Your RazorpayX fit jumps from {baseScore}% → {simulatedScore}%!
                </p>
                <p className="text-[11px] text-tertiary font-bold mt-0.5">
                  Eligibility gates fully unlocked for Day-1 shortlist
                </p>
              </div>

              {/* Pin Quests CTA */}
              <Link
                href="/student/matches"
                className="w-full mt-4 bg-primary text-on-primary font-bold text-xs py-3 px-6 rounded-full shadow-[0_4px_0_#320e26] active:translate-y-1 active:shadow-[0_1px_0_#320e26] hover:brightness-105 transition-all flex items-center justify-center gap-2"
              >
                <span>📌</span>
                <span>Pin These Quests to My 72h Sprint</span>
              </Link>

              {/* Deterministic Assurance Note */}
              <div className="flex items-center justify-center gap-1.5 mt-4 text-outline text-[11px] font-semibold">
                <span className="material-symbols-outlined text-sm">lock_clock</span>
                <span>Zero impact on live college placement record</span>
              </div>
            </div>
          </aside>

          {/* RIGHT 8 COLUMNS: TWO-STAGE MATCH CARDS */}
          <section className="lg:col-span-8 space-y-6">
            {filteredMatches.map((m) => (
              <MatchCard
                key={m.id}
                jobTitle={m.jobTitle}
                company={m.company}
                deadline={m.deadline}
                compensationTarget={m.compensationTarget}
                eligibilityRules={m.eligibilityRules}
                alignmentScore={m.company.toLowerCase().includes('razorpay') ? simulatedScore : m.alignmentScore}
                factorBreakdown={m.factorBreakdown}
                sandboxToggles={m.sandboxToggles}
                onOpenDispute={(rule) => handleOpenDispute(rule, m.jobTitle, m.company)}
                onOpenSource={handleOpenSource}
              />
            ))}
          </section>
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
        company={disputeJob.company}
        onOpenSourceSpan={() => handleOpenSource('doc_resume_v3')}
      />
    </AppLayout>
  )
}
