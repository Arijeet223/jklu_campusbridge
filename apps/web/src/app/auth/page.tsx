'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import RegisterAccountModal from '@/components/RegisterAccountModal'
import SyncExcelModal from '@/components/SyncExcelModal'
import {
  FileSpreadsheet,
  Download,
  Upload,
  UserPlus,
  GraduationCap,
  Briefcase,
  Activity,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react'

export default function AuthPage() {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [syncExcelModalOpen, setSyncExcelModalOpen] = useState(false)
  const [dbStats, setDbStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchDbStats = async () => {
    try {
      setLoadingStats(true)
      const res = await fetch('/api/backend/v1/admin/db-stats')
      if (res.ok) {
        const data = await res.json()
        setDbStats(data)
      }
    } catch {
      // Fallback
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchDbStats()
  }, [])

  const handleDownloadExcel = () => {
    window.open('/api/backend/v1/admin/export-excel', '_blank')
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex flex-col font-sans">
      <TopNavBar
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
        onOpenSyncExcelModal={() => setSyncExcelModalOpen(true)}
        onOpenPrivacyModal={() => {}}
        onOpenExplainerModal={() => setExplainerOpen(true)}
      />

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 sm:p-10 shadow-xs overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-[#F0B6D5]/20 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
                <Sparkles className="h-3.5 w-3.5" />
                Live Excel Account Hub &amp; Role Switcher
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-ink-primary tracking-tight">
                Switch Personas &amp; Manage Excel DB
              </h1>
              <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
                CampusBridge AI uses a <strong className="text-ink-primary">two-way Excel Database Engine (`data/campusbridge_db.xlsx`)</strong> with 8 auto-seeded worksheets, memory-cached for &lt;5ms reads and instant write-through. Select a persona below to jump straight into their specialized studio.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#255C45] hover:bg-[#1e4836] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md border-b-4 border-[#16382a] active:translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                <span>Download .xlsx</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncExcelModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F1EFEA] text-ink-primary font-bold text-xs border-2 border-[#E6E3DC] transition-all shadow-xs"
              >
                <Upload className="h-4 w-4 text-[#255C45]" />
                <span>Upload &amp; Replace</span>
              </button>
            </div>
          </div>
        </div>

        {/* Excel DB Live Telemetry Bento */}
        <div className="rounded-3xl bg-[#F1EFEA] border border-[#E6E3DC] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#255C45]" />
              <h2 className="font-display font-extrabold text-base text-ink-primary">
                Live Excel Storage Engine Status
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-mono font-bold bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              IN-MEMORY CACHE ACTIVE (&lt;5ms)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E3DC] shadow-2xs">
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Students</span>
              <div className="text-2xl font-display font-black text-ink-primary mt-1">
                {dbStats?.row_counts?.Accounts_Students ?? 15}
              </div>
              <span className="text-3xs text-ink-muted">Accounts_Students sheet</span>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E3DC] shadow-2xs">
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Teachers &amp; TPO</span>
              <div className="text-2xl font-display font-black text-ink-primary mt-1">
                {dbStats?.row_counts?.Accounts_Teachers ?? 4}
              </div>
              <span className="text-3xs text-ink-muted">Accounts_Teachers sheet</span>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E3DC] shadow-2xs">
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Practice Bank</span>
              <div className="text-2xl font-display font-black text-ink-primary mt-1">
                {(dbStats?.row_counts?.DSA_Practice_Bank ?? 13) + (dbStats?.row_counts?.SQL_Practice_Bank ?? 5)}
              </div>
              <span className="text-3xs text-ink-muted">13 DSA + 5 SQL Quests</span>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E3DC] shadow-2xs">
              <span className="text-2xs text-ink-muted uppercase font-bold tracking-wider">Active Drives</span>
              <div className="text-2xl font-display font-black text-ink-primary mt-1">
                {dbStats?.row_counts?.Opportunities_JDs ?? 5}
              </div>
              <span className="text-3xs text-ink-muted">Opportunities_JDs sheet</span>
            </div>
          </div>
        </div>

        {/* 1-Click Persona Selection Hub */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-xl text-ink-primary">
              Select Demo Persona (Instant Login &amp; Workspace Launch)
            </h2>
            <button
              type="button"
              onClick={() => setRegisterModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#6D3B56] hover:underline"
            >
              <UserPlus className="h-4 w-4" />
              + Create New Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_PERSONAS.map((persona) => {
              const isStudent = persona.role === 'STUDENT'
              const isOfficer = persona.role === 'OFFICER'
              const isFaculty = persona.role === 'FACULTY'
              const isAdmin = persona.role === 'ADMIN'

              const targetHref = isStudent
                ? '/student/dashboard'
                : isOfficer
                ? '/officer/panel'
                : isFaculty
                ? '/teacher/panel'
                : '/admin/diagnostics'

              return (
                <div
                  key={persona.id}
                  className="rounded-3xl bg-white border-2 border-[#E6E3DC] hover:border-[#6D3B56] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-2xl bg-[#F1EFEA] flex items-center justify-center">
                          {isStudent ? (
                            <GraduationCap className="h-5 w-5 text-oxford" />
                          ) : isAdmin ? (
                            <Activity className="h-5 w-5 text-amber" />
                          ) : (
                            <Briefcase className="h-5 w-5 text-[#255C45]" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-ink-primary">
                            {persona.name}
                          </h3>
                          <span className="font-mono text-3xs text-ink-muted">{persona.id}</span>
                        </div>
                      </div>

                      <span className="font-mono text-2xs px-2.5 py-0.5 rounded-full font-bold bg-[#F1EFEA] text-ink-primary">
                        {persona.role}
                      </span>
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed">
                      {persona.subtext}
                    </p>

                    {persona.cgpa && (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-oxford/5 border border-oxford/20 text-xs text-oxford font-semibold">
                        <span>CGPA: <strong>{persona.cgpa}</strong></span>
                        <span>•</span>
                        <span>{persona.branch}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E6E3DC] flex items-center justify-between">
                    <Link
                      href={targetHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D3B56] hover:text-[#552940] transition-colors"
                    >
                      <span>Launch {persona.role} Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Route Directory */}
        <div className="rounded-3xl bg-white border-2 border-[#E6E3DC] p-6 space-y-4">
          <h2 className="font-display font-bold text-base text-ink-primary">
            Quick Route Directory (11 Next.js App Router Pages)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            <Link href="/" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              / — Integrated Master Hub
            </Link>
            <Link href="/auth" className="p-2.5 rounded-xl bg-[#F0B6D5]/30 font-bold text-[#6D3B56]">
              /auth — Role &amp; Excel Hub
            </Link>
            <Link href="/login" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /login — Role-Based Gateway
            </Link>
            <Link href="/student/dashboard" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /student/dashboard — Readiness Hub
            </Link>
            <Link href="/student/home" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /student/home — Skill Map
            </Link>
            <Link href="/student/arena" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /student/arena — Practice Arena
            </Link>
            <Link href="/student/matches" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /student/matches — What-If Fit
            </Link>
            <Link href="/student/chat" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /student/chat — AI Companion Chat
            </Link>
            <Link href="/student/applications" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /student/applications — Kanban
            </Link>
            <Link href="/teacher/panel" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /teacher/panel — Faculty Mentor
            </Link>
            <Link href="/officer/panel" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /officer/panel — Placement Cell
            </Link>
            <Link href="/admin/diagnostics" className="p-2.5 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] font-medium text-ink-primary">
              /admin/diagnostics — AI Diagnostics
            </Link>
          </div>
        </div>
      </div>

      <RegisterAccountModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onAccountCreated={fetchDbStats}
      />

      <SyncExcelModal
        isOpen={syncExcelModalOpen}
        onClose={() => setSyncExcelModalOpen(false)}
      />

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}

