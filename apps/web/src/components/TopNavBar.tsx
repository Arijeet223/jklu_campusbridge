'use client'

import { useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  Upload,
  UserPlus,
  Activity,
  Shield,
  ChevronDown,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'

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
  onOpenPrivacyModal: () => void
  onOpenExplainerModal?: () => void
}

export default function TopNavBar({
  currentPersona,
  onSelectPersona,
  onOpenRegisterModal,
  onOpenSyncExcelModal,
  onOpenPrivacyModal,
  onOpenExplainerModal,
}: TopNavBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleDownloadExcel = () => {
    window.open('/api/backend/v1/admin/export-excel', '_blank')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-hairline bg-surface/95 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Architecture Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-oxford text-white shadow-xs">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-sm font-bold text-ink-primary tracking-tight block">
              CampusBridge AI
            </span>
            <p className="text-2xs text-ink-muted hidden sm:block">
              AI Placement OS
            </p>
          </div>
        </div>

        {/* Center: 1-Click Demo Persona Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-border-hairline bg-canvas hover:bg-subtle px-3 py-1.5 text-xs transition-all shadow-2xs"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-oxford/10 text-oxford font-bold text-2xs">
              {currentPersona.role === 'STUDENT' ? (
                <GraduationCap className="h-3.5 w-3.5" />
              ) : currentPersona.role === 'ADMIN' ? (
                <Activity className="h-3.5 w-3.5 text-amber" />
              ) : (
                <Briefcase className="h-3.5 w-3.5" />
              )}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-ink-primary text-xs">{currentPersona.name}</span>
                <span className="font-mono text-2xs px-1.5 py-0.2 rounded bg-oxford-surface text-oxford font-bold">
                  {currentPersona.role}
                </span>
              </div>
              <p className="text-2xs text-ink-muted truncate max-w-[200px] sm:max-w-[260px]">
                {currentPersona.subtext}
              </p>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-ink-muted ml-1" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute left-0 sm:right-0 mt-2 w-80 rounded-2xl border border-border-hairline bg-surface p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={() => setDropdownOpen(false)}
            >
              <div className="px-2 py-1.5 border-b border-border-hairline mb-1">
                <span className="text-2xs font-semibold uppercase tracking-wider text-ink-muted block">
                  Select Demo Persona
                </span>
              </div>

              {DEMO_PERSONAS.map((p) => {
                const isSelected = p.id === currentPersona.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPersona(p)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left rounded-xl p-2.5 flex items-start gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-oxford-surface text-oxford font-semibold border border-oxford-border/60'
                        : 'hover:bg-subtle text-ink-primary'
                    }`}
                  >
                    <div className="mt-0.5">
                      {p.role === 'STUDENT' ? (
                        <GraduationCap className="h-4 w-4 text-oxford" />
                      ) : p.role === 'ADMIN' ? (
                        <Activity className="h-4 w-4 text-amber" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-emerald" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{p.name}</span>
                        <span className="font-mono text-2xs px-1.5 py-0.2 rounded bg-canvas text-ink-muted">
                          {p.role}
                        </span>
                      </div>
                      <p className="text-2xs text-ink-muted truncate mt-0.5">{p.subtext}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Excel DB & Admin Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download Live Excel DB Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            title="Download live campusbridge_db.xlsx"
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-emerald bg-emerald-surface/50 px-3 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald-surface transition-all shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Live Excel DB (.xlsx)</span>
          </button>

          {/* Upload/Sync Excel DB Button */}
          <button
            type="button"
            onClick={onOpenSyncExcelModal}
            title="Upload or sync campusbridge_db.xlsx"
            className="flex items-center gap-1.5 rounded-xl border border-border-hairline bg-canvas hover:bg-subtle px-3 py-1.5 text-xs font-medium text-ink-primary transition-all shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald" />
            <span className="hidden sm:inline">Upload/Sync Excel DB</span>
          </button>

          {/* Create Account Modal Trigger */}
          <button
            type="button"
            onClick={onOpenRegisterModal}
            title="Create a new Student or Teacher account"
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-border-hairline bg-canvas hover:bg-subtle px-3 py-1.5 text-xs font-medium text-ink-primary transition-all shadow-2xs"
          >
            <UserPlus className="h-3.5 w-3.5 text-oxford" />
            <span>+ Create Account</span>
          </button>

          {/* AI & MCP Diagnostics Button */}
          <button
            type="button"
            onClick={() => {
              const adminPersona = DEMO_PERSONAS.find((p) => p.role === 'ADMIN')
              if (adminPersona) onSelectPersona(adminPersona)
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs ${
              currentPersona.role === 'ADMIN'
                ? 'bg-amber text-white'
                : 'border border-amber-border bg-amber-surface/60 text-amber hover:bg-amber-surface'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">⚡ AI &amp; MCP Status</span>
          </button>
        </div>
      </div>
    </header>
  )
}

