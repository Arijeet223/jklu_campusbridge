'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ExplainerModal from '@/components/ExplainerModal'
import {
  LayoutDashboard,
  UserCheck,
  Gamepad2,
  Target,
  MessageSquare,
  ClipboardList,
  GraduationCap,
  Briefcase,
  Activity,
  LogOut,
  Bell,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  User,
  ArrowLeft,
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  breadcrumb?: string
  activeRole?: 'STUDENT' | 'FACULTY' | 'OFFICER' | 'ADMIN'
  userName?: string
  userSubtitle?: string
}

export default function AppLayout({
  children,
  pageTitle,
  breadcrumb,
  activeRole = 'STUDENT',
  userName = 'Aarav Sharma',
  userSubtitle = "B.Tech CSE '26 • 8.42 CGPA",
}: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [currentStudentName, setCurrentStudentName] = useState(userName)
  const [currentSubtitle, setCurrentSubtitle] = useState(userSubtitle)

  // Sync user state if saved from login
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.name) setCurrentStudentName(parsed.name)
        if (parsed.program && parsed.cgpa) {
          setCurrentSubtitle(`${parsed.program} • ${parsed.cgpa} CGPA`)
        } else if (parsed.role) {
          setCurrentSubtitle(`${parsed.role} • ${parsed.department || 'NITK'}`)
        }
      }
    } catch {
      // Ignore
    }
  }, [])

  const studentNavItems = [
    {
      label: 'Dashboard Overview',
      href: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Profile & Evidence Hub',
      href: '/student/home',
      icon: UserCheck,
    },
    {
      label: 'Practice & 120s Arena',
      href: '/student/arena',
      icon: Gamepad2,
    },
    {
      label: 'What-If Fit Sandbox',
      href: '/student/matches',
      icon: Target,
    },
    {
      label: 'AI Conversational Coach',
      href: '/student/chat',
      icon: MessageSquare,
    },
    {
      label: 'Applications & Kanban',
      href: '/student/applications',
      icon: ClipboardList,
    },
  ]

  const institutionalNavItems = [
    {
      label: 'Faculty Mentor Hub',
      href: '/teacher/panel',
      icon: GraduationCap,
    },
    {
      label: 'Placement Cell (TPO)',
      href: '/officer/panel',
      icon: Briefcase,
    },
    {
      label: 'System Diagnostics',
      href: '/admin/diagnostics',
      icon: Activity,
    },
  ]

  const handleLogout = () => {
    try {
      localStorage.removeItem('cb_active_user')
      localStorage.removeItem('cb_auth_token')
    } catch {}
    router.push('/login')
  }

  // Derive dynamic title if not explicitly passed
  const displayTitle =
    pageTitle ||
    (pathname === '/student/dashboard'
      ? 'Dashboard Overview'
      : pathname === '/student/home'
      ? 'Profile & Evidence Studio'
      : pathname === '/student/arena'
      ? 'Practice & 120s Proof-of-Work Arena'
      : pathname === '/student/matches'
      ? 'What-If Fit Sandbox'
      : pathname === '/student/chat'
      ? 'AI Career Coaching Studio'
      : pathname === '/student/applications'
      ? 'Applications & Pipeline Tracker'
      : pathname === '/teacher/panel'
      ? 'Faculty Mentor Advisory'
      : pathname === '/officer/panel'
      ? 'Placement Cell & TPO Console'
      : pathname === '/admin/diagnostics'
      ? 'AI Pantheon Orbital Diagnostics'
      : 'Career Readiness')

  const displayBreadcrumb =
    breadcrumb ||
    (pathname.startsWith('/student')
      ? 'Student Workspace'
      : pathname.startsWith('/teacher')
      ? 'Faculty Portal'
      : pathname.startsWith('/officer')
      ? 'Placement Cell'
      : 'Institutional Studio')

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex font-sans antialiased selection:bg-[#F0B6D5] selection:text-[#6D3B56]">
      {/* ────────────────────────────────────────────────────────── */}
      {/*  FIXED LEFT SIDEBAR (Width: 260px, Bg: #F1EFEA)            */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside className="w-[260px] min-w-[260px] h-screen fixed left-0 top-0 bottom-0 bg-[#F1EFEA] border-r-[1.5px] border-[#E2DFD9] flex flex-col justify-between z-30 select-none">
        <div>
          {/* Top Brand Mark */}
          <div className="h-18 px-5 border-b border-[#E2DFD9] flex items-center justify-between">
            <Link href="/student/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6D3B56] text-white shadow-xs font-display font-extrabold text-sm tracking-tight border-b-2 border-[#552940] group-hover:scale-105 transition-transform">
                CB
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-extrabold text-ink-primary tracking-tight">
                    CampusBridge
                  </span>
                  <span className="font-mono text-3xs px-1.5 py-0.5 rounded-full bg-[#E2DFD9] text-[#6D3B56] font-bold">
                    v1.1
                  </span>
                </div>
                <p className="text-3xs text-ink-muted font-medium">Warm Institutional Studio</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* Student Readiness Links */}
            <div>
              <span className="text-3xs font-mono font-bold tracking-wider text-ink-muted uppercase px-3 block mb-2">
                Career Readiness
              </span>
              <nav className="space-y-1">
                {studentNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-[#6D3B56] text-white font-bold shadow-xs border-b-2 border-[#552940]'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-[#E2DFD9]/60'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Institutional Portals Links */}
            <div>
              <span className="text-3xs font-mono font-bold tracking-wider text-ink-muted uppercase px-3 block mb-2">
                Institutional Portals
              </span>
              <nav className="space-y-1">
                {institutionalNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-[#6D3B56] text-white font-bold shadow-xs border-b-2 border-[#552940]'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-[#E2DFD9]/60'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Logged-in User Profile Snippet & Logout */}
        <div className="p-4 border-t border-[#E2DFD9] bg-[#EAE8E3]/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-[#6D3B56]/15 text-[#6D3B56] font-display font-extrabold text-xs flex items-center justify-center border border-[#6D3B56]/30">
              {currentStudentName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-ink-primary truncate">
                {currentStudentName}
              </div>
              <div className="text-3xs text-ink-muted truncate font-medium">
                {currentSubtitle}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full mt-3 py-1.5 px-3 rounded-xl border border-[#E2DFD9] bg-white text-ink-muted hover:text-[#BE123C] hover:border-[#BE123C]/30 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>⇦ Logout</span>
          </button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/*  MAIN CONTENT AREA (Left Margin: 260px)                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen bg-[#FAF8F6]">
        {/* Clean, Spacious Top Header with Sticky Back Navigation */}
        <header className="sticky top-0 z-20 h-18 bg-[#FAF8F6]/95 backdrop-blur-md border-b border-[#E6E3DC] px-6 sm:px-8 flex items-center justify-between">
          {/* Left: Sticky Back Button + Breadcrumbs & Dynamic Page Title */}
          <div className="flex items-center gap-3">
            {pathname !== '/student/dashboard' && (
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DFD9] bg-white text-ink-secondary hover:text-[#6D3B56] hover:border-[#6D3B56]/40 hover:bg-[#F1EFEA] text-xs font-bold transition-all shadow-2xs group"
                title="Return to Student Dashboard Overview"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#6D3B56] group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">← Back to Dashboard</span>
                <span className="sm:hidden">← Back</span>
              </Link>
            )}

            <div>
              <div className="flex items-center gap-1.5 text-2xs font-semibold text-ink-muted">
                <Link href="/student/dashboard" className="hover:text-[#6D3B56] transition-colors">
                  {displayBreadcrumb}
                </Link>
                <ChevronRight className="h-3 w-3 text-ink-muted/60" />
                <span className="text-[#6D3B56] font-bold">{displayTitle}</span>
              </div>
              <h1 className="font-display font-extrabold text-lg sm:text-xl text-ink-primary tracking-tight mt-0.5">
                {displayTitle}
              </h1>
            </div>
          </div>

          {/* Right: Explainer Modal Button, Notification Bell & Avatar */}
          <div className="flex items-center gap-3">
            {/* ✨ How CampusBridge AI Works Button */}
            <button
              type="button"
              onClick={() => setExplainerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#F0B6D5]/40 hover:bg-[#F0B6D5]/60 text-[#6D3B56] border border-[#F0B6D5] font-bold text-xs uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Sparkles className="h-4 w-4 fill-[#F0B6D5] text-[#6D3B56]" />
              <span className="hidden sm:inline">✨ How CampusBridge AI Works</span>
              <span className="sm:hidden">✨ How It Works</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="h-9 w-9 rounded-2xl bg-white border border-[#E6E3DC] hover:border-[#6D3B56]/40 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors shadow-2xs"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#BE123C] ring-2 ring-white" />
              </button>
            </div>

            {/* Minimal Avatar Bubble */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E6E3DC]">
              <div className="h-9 w-9 rounded-2xl bg-[#6D3B56] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-xs">
                {currentStudentName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-6 sm:p-8 flex-1 max-w-[1400px] w-full mx-auto animate-in fade-in-50 duration-150">
          {children}
        </main>
      </div>

      {/* Explainer Modal */}
      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}

