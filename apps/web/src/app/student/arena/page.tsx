'use client'

import { useState } from 'react'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import PracticeArena from '@/components/PracticeArena'

export default function StudentArenaPage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
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
        <PracticeArena
          studentId={currentPersona.studentId || 'STU-101'}
          studentName={currentPersona.name}
          onSkillUpgraded={(skillName, newLevel) => {
            console.log(`Skill ${skillName} upgraded to Level ${newLevel}`)
          }}
        />
      </div>

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}
