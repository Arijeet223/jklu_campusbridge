'use client'

import { useState } from 'react'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import DiagnosticsPanel from '@/components/DiagnosticsPanel'
import { Activity, ShieldCheck, Sparkles } from 'lucide-react'

export default function AdminDiagnosticsPage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(
    DEMO_PERSONAS.find((p) => p.role === 'ADMIN') || DEMO_PERSONAS[5]
  )
  const [explainerOpen, setExplainerOpen] = useState(false)

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
        <DiagnosticsPanel />
      </div>

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}

