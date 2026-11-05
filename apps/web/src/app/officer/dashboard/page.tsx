'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PlacementOfficerView from '@/components/PlacementOfficerView'
import SourceDrawer from '@/components/SourceDrawer'
import { mockSourceDocuments } from '@/lib/mock-data'
import type { SourceDocument } from '@/lib/types'
import { Briefcase, ShieldCheck } from 'lucide-react'

export default function OfficerDashboardPage() {
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(mockSourceDocuments['doc_resume_v3'] ?? null)

  const handleOpenSource = (docId: string = 'doc_resume_v3') => {
    setSelectedDoc(mockSourceDocuments[docId] || mockSourceDocuments['doc_resume_v3'])
    setSourceDrawerOpen(true)
  }

  return (
    <AppLayout
      pageTitle="Placement Cell (TPO) Studio"
      breadcrumb="TPO Operational Console"
      activeRole="OFFICER"
      userName="Prof. Rajesh Menon"
      userSubtitle="Head of Placements • Career Development Centre"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
              <Briefcase className="h-3.5 w-3.5" />
              Placement Cell &amp; TPO Operational Studio
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Cohort Liquidity, JD Gates &amp; Exception Queue
            </h2>
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
    </AppLayout>
  )
}

