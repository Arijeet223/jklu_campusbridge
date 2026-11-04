'use client'

import { useState } from 'react'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import PlacementOfficerView from '@/components/PlacementOfficerView'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument } from '@/lib/types'
import { Briefcase, ShieldCheck } from 'lucide-react'

export default function OfficerPanelPage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(
    DEMO_PERSONAS.find((p) => p.role === 'OFFICER') || DEMO_PERSONAS[4]
  )
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
              <Briefcase className="h-3.5 w-3.5" />
              Placement Cell &amp; TPO Operational Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Cohort Liquidity, JD Gates &amp; Exception Queue
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted">
              Approve recruiter job criteria, simulate cohort liquidity with DPDP Act 2023 small-cell suppression ($k \ge 5$), and resolve student disputes.
            </p>
          </div>

          <span className="font-mono text-2xs rounded-full bg-[#B6DEC9]/40 px-3 py-1 text-[#255C45] font-bold border border-[#B6DEC9]">
            DPDP Privacy Shield ($k \ge 5$)
          </span>
        </div>

        <PlacementOfficerView onOpenSource={handleOpenSource} />
      </div>

      <SourceDrawer
        isOpen={sourceDrawerOpen}
        onClose={() => setSourceDrawerOpen(false)}
        sourceDocument={selectedDoc}
      />

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}

