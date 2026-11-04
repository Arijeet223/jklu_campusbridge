'use client'

import AppLayout from '@/components/layout/AppLayout'
import PracticeArena from '@/components/PracticeArena'

export default function StudentArenaPage() {
  return (
    <AppLayout pageTitle="Practice & 120s Arena" breadcrumb="Student Workspace">
      <div className="space-y-6">
        <PracticeArena
          studentId="STU-101"
          studentName="Aarav Sharma"
          onSkillUpgraded={(skillName, newLevel) => {
            console.log(`Skill ${skillName} upgraded to Level ${newLevel}`)
          }}
        />
      </div>
    </AppLayout>
  )
}
