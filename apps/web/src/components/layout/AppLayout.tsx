'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const [currentStudentName, setCurrentStudentName] = useState(userName)
  const [currentSubtitle, setCurrentSubtitle] = useState(userSubtitle)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const notifications = [
    {
      id: 'notif-1',
      title: 'Razorpay FinTech Sprint JD Live',
      description: '84% match alignment, 0 backlogs required. Fast-track application window closes in 18 hours.',
      time: '10m ago',
      unread: true,
      tag: 'Job Drive',
      tagColor: 'bg-[#F0B6D5]/40 text-[#6D3B56]',
      href: '/student/matches',
    },
    {
      id: 'notif-2',
      title: 'Skill Assessment Verified',
      description: 'Python & FastAPI Microservices upgraded to 4_ASSESSMENT_VERIFIED via 120s Micro-Defense (+8 pts).',
      time: '1h ago',
      unread: true,
      tag: 'Skill Verified',
      tagColor: 'bg-[#B6DEC9]/40 text-[#255C45]',
      href: '/student/arena',
    },
    {
      id: 'notif-3',
      title: 'TPO Policy Gate Notice',
      description: 'Atlassian Cohort Eligibility Gate updated: Min CGPA set to 7.5. Your 8.42 CGPA meets hard criteria.',
      time: '3h ago',
      unread: false,
      tag: 'TPO Policy',
      tagColor: 'bg-[#B6D9EC]/50 text-[#2B5B75]',
      href: '/student/matches',
    },
    {
      id: 'notif-4',
      title: 'DPDP Privacy Shield Active',
      description: 'Your profile is protected under DPDP Act 2023 small-cell suppression (k ≥ 5) until explicit application submission.',
      time: '1d ago',
      unread: false,
      tag: 'Privacy Shield',
      tagColor: 'bg-[#E2DFD9] text-ink-primary',
      href: '/student/home',
    },
  ]

  // Sync user state and enforce Onboarding Guard
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

        // Onboarding Guard: check if student has uploaded resume or verified evidence
        if (parsed.role === 'STUDENT' || !parsed.role) {
          if (parsed.needs_onboarding && pathname !== '/student/onboarding') {
            router.push('/student/onboarding')
          }
        }
      }
    } catch {
      // Ignore
    }
  }, [pathname, router])

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

          {/* Right: Notification Bell & Avatar with Active Dropdowns */}
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell Dropdown Container */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev)
                  setProfileOpen(false)
                }}
                className={`h-9 w-9 rounded-2xl border transition-all flex items-center justify-center shadow-2xs cursor-pointer ${
                  notificationsOpen
                    ? 'bg-[#6D3B56] text-white border-[#6D3B56]'
                    : 'bg-white border-[#E6E3DC] text-ink-muted hover:text-ink-primary hover:border-[#6D3B56]/40'
                }`}
                title="Placement & System Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#BE123C] ring-2 ring-white animate-pulse" />
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border-2 border-[#E6E3DC] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E6E3DC]">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-extrabold text-xs text-ink-primary">
                          Placement &amp; System Alerts
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-3xs font-mono font-bold bg-[#F0B6D5]/40 text-[#6D3B56]">
                          2 new
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-3xs text-[#6D3B56] font-bold hover:underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-[#E6E3DC]/60">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setNotificationsOpen(false)}
                          className="block pt-2 first:pt-0 hover:bg-[#FAF8F6] p-2 rounded-xl transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${n.tagColor}`}>
                              {n.tag}
                            </span>
                            <span className="text-3xs text-ink-muted">{n.time}</span>
                          </div>
                          <h4 className="text-xs font-bold text-ink-primary group-hover:text-[#6D3B56] transition-colors">
                            {n.title}
                          </h4>
                          <p className="text-3xs text-ink-muted leading-relaxed mt-0.5">
                            {n.description}
                          </p>
                        </Link>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#E6E3DC] text-center">
                      <Link
                        href="/student/matches"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-2xs font-bold text-[#6D3B56] hover:underline"
                      >
                        Explore all live match opportunities →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Dropdown Container */}
            <div className="relative pl-2 border-l border-[#E6E3DC]">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev)
                  setNotificationsOpen(false)
                }}
                className={`h-9 w-9 rounded-2xl font-display font-extrabold text-xs flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                  profileOpen
                    ? 'bg-[#552940] text-white ring-2 ring-[#6D3B56]/50'
                    : 'bg-[#6D3B56] text-white hover:scale-105'
                }`}
                title="Account Settings & Profile"
              >
                {currentStudentName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white border-2 border-[#E6E3DC] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5">
                    {/* User Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-[#E6E3DC]">
                      <div className="h-10 w-10 rounded-2xl bg-[#6D3B56] text-white font-display font-extrabold text-sm flex items-center justify-center shadow-xs">
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
                        <div className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono text-3xs font-bold bg-[#B6DEC9]/40 text-[#255C45]">
                          STU-101 • Verified
                        </div>
                      </div>
                    </div>

                    {/* Quick Profile Nav Links */}
                    <div className="space-y-1">
                      <Link
                        href="/student/home"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-ink-primary hover:bg-[#FAF8F6] hover:text-[#6D3B56] transition-colors"
                      >
                        <User className="h-3.5 w-3.5 text-[#6D3B56]" />
                        <span>Profile &amp; Evidence Hub</span>
                      </Link>

                      <Link
                        href="/student/matches"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-ink-primary hover:bg-[#FAF8F6] hover:text-[#6D3B56] transition-colors"
                      >
                        <Target className="h-3.5 w-3.5 text-[#6D3B56]" />
                        <span>What-If Fit Sandbox</span>
                      </Link>

                      <Link
                        href="/student/arena"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-ink-primary hover:bg-[#FAF8F6] hover:text-[#6D3B56] transition-colors"
                      >
                        <Gamepad2 className="h-3.5 w-3.5 text-[#6D3B56]" />
                        <span>Practice &amp; 120s Arena</span>
                      </Link>

                      <Link
                        href="/admin/diagnostics"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-ink-primary hover:bg-[#FAF8F6] hover:text-[#6D3B56] transition-colors"
                      >
                        <Activity className="h-3.5 w-3.5 text-[#6D3B56]" />
                        <span>AI Pantheon Diagnostics</span>
                      </Link>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-2 border-t border-[#E6E3DC]">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 text-[#BE123C] hover:bg-rose-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out Securely</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-6 sm:p-8 flex-1 max-w-[1400px] w-full mx-auto animate-in fade-in-50 duration-150">
          {children}
        </main>
      </div>
    </div>
  )
}

