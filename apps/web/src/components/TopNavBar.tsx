'use client'

import React from 'react'
import type { UserRole } from '@/lib/types'
import TactileTopDock from './TactileTopDock'

export interface DemoPersona {
  id: string
  name: string
  role: UserRole | 'ADMIN'
  subtext: string
  cgpa?: number
  branch?: string
  studentId?: string
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'STU-101',
    name: 'Aarav Sharma',
    role: 'STUDENT',
    subtext: "CSE '26 • 8.42 CGPA • Backend Focus",
    cgpa: 8.42,
    branch: 'B.Tech CSE',
    studentId: 'STU-101',
  },
  {
    id: 'STU-102',
    name: 'Priya Nair',
    role: 'STUDENT',
    subtext: "AI/DS '26 • 8.95 CGPA • Applied AI Focus",
    cgpa: 8.95,
    branch: 'B.Tech CSE (AI & DS)',
    studentId: 'STU-102',
  },
  {
    id: 'STU-103',
    name: 'Rohan Verma',
    role: 'STUDENT',
    subtext: "ECE '26 • 6.90 CGPA • Has 'Unknown' Gate Flag",
    cgpa: 6.90,
    branch: 'B.Tech ECE (Minor in CS)',
    studentId: 'STU-103',
  },
  {
    id: 'FAC-014',
    name: 'Dr. Kavita Iyer',
    role: 'FACULTY',
    subtext: 'Faculty Mentor • Department Advisory & Endorsements',
  },
  {
    id: 'TPO-001',
    name: 'Prof. Rajesh Menon',
    role: 'OFFICER',
    subtext: 'Placement Officer • Cohort Liquidity & Exceptions',
  },
  {
    id: 'ADM-001',
    name: 'System Admin Console',
    role: 'ADMIN',
    subtext: 'AI, RAG & MCP Diagnostics & Observability',
  },
]

interface TopNavBarProps {
  currentPersona: DemoPersona
  onSelectPersona: (persona: DemoPersona) => void
  onOpenRegisterModal: () => void
  onOpenSyncExcelModal: () => void
  onOpenPrivacyModal?: () => void
  onOpenExplainerModal?: () => void
}

export default function TopNavBar({
  currentPersona,
  onSelectPersona,
  onOpenRegisterModal,
  onOpenSyncExcelModal,
}: TopNavBarProps) {
  return (
    <TactileTopDock
      currentPersona={currentPersona}
      onSelectPersona={onSelectPersona}
      onOpenSyncExcelModal={onOpenSyncExcelModal}
      onOpenRegisterModal={onOpenRegisterModal}
    />
  )
}
