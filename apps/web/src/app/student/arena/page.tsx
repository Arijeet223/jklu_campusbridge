'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PracticeArena from '@/components/PracticeArena'

export default function StudentArenaPage() {
  const [studentId, setStudentId] = useState('STU-101')
  const [studentName, setStudentName] = useState('Aarav Sharma')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u.id) setStudentId(u.id)
        if (u.name) setStudentName(u.name)
      }
    } catch {}
  }, [])

  return (
    <AppLayout pageTitle="Practice & 120s Arena" breadcrumb="Student Workspace">
      <div className="space-y-6">
        <PracticeArena
          studentId={studentId}
          studentName={studentName}
          onSkillUpgraded={(skillName, newLevel) => {
            console.log(`Skill ${skillName} upgraded to Level ${newLevel}`)
          }}
        />
      </div>
    </AppLayout>
  )
}
