'use client'

import React, { useState, useEffect } from 'react'
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
  Shield,
  ArrowLeft,
  Sparkles,
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

  const notifications = [
    {
      id: 'notif-1',
      title: 'Razorpay FinTech Sprint JD Live',
      description: '84% match alignment, 0 backlogs required. Fast-track application window closes in 18 hours.',
      time: '10m ago',
      unread: true,
      tag: 'Job Drive',
      tagColor: 'bg-primary-container text-on-primary-container',
      href: '/student/matches',
    },
    {
      id: 'notif-2',
      title: 'Skill Assessment Verified',
      description: 'Python & FastAPI Microservices upgraded to 4_ASSESSMENT_VERIFIED via 120s Micro-Defense (+8 pts).',
      time: '1h ago',
      unread: true,
      tag: 'Skill Verified',
      tagColor: 'bg-tertiary-container text-on-tertiary-container',
      href: '/student/arena',
    },
    {
      id: 'notif-3',
      title: 'TPO Policy Gate Notice',
      description: 'Atlassian Cohort Eligibility Gate updated: Min CGPA set to 7.5. Your 8.42 CGPA meets hard criteria.',
      time: '3h ago',
      unread: false,
      tag: 'TPO Policy',
      tagColor: 'bg-secondary-container text-on-secondary-container',
      href: '/student/matches',
    },
    {
      id: 'notif-4',
      title: 'DPDP Privacy Shield Active',
      description: 'Your profile is protected under DPDP Act 2023 small-cell suppression (k ≥ 5) until explicit application submission.',
      time: '1d ago',
      unread: false,
      tag: 'Privacy Shield',
      tagColor: 'bg-surface-container text-on-surface',
      href: '/student/privacy-shield',
    },
  ]

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.name) setCurrentStudentName(parsed.name)
        if (parsed.program && parsed.cgpa) {
          setCurrentSubtitle(`${parsed.program} • ${parsed.cgpa} CGPA`)
        } else if (parsed.role) {
          setCurrentSubtitle(`${parsed.role} • ${parsed.department || 'JKLU'}`)
        }

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
    { label: 'Dashboard Overview', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Profile & Provenance', href: '/student/profile-evidence', icon: UserCheck },
    { label: 'What-If Fit Sandbox', href: '/student/what-if-sandbox', icon: Target },
    { label: 'Practice & 120s Arena', href: '/student/arena', icon: Gamepad2 },
    { label: 'AI Conversational Coach', href: '/student/chat', icon: MessageSquare },
    { label: 'Applications & Kanban', href: '/student/applications', icon: ClipboardList },
  ]

  const institutionalNavItems = [
    { label: 'Faculty Mentor Hub', href: '/teacher/panel', icon: GraduationCap },
    { label: 'Placement Cell (TPO)', href: '/officer/dashboard', icon: Briefcase },
    { label: 'Orbital Diagnostics', href: '/admin/diagnostics', icon: Activity },
  ]

  const handleLogout = () => {
    try {
      localStorage.removeItem('cb_active_user')
      localStorage.removeItem('cb_auth_token')
    } catch {}
    router.push('/login')
  }

  const displayTitle =
    pageTitle ||
    (pathname === '/student/dashboard'
      ? 'Dashboard Overview'
      : pathname === '/student/profile-evidence'
      ? 'Profile & Evidence Studio'
      : pathname === '/student/arena'
      ? 'Practice & 120s Proof-of-Work Arena'
      : pathname === '/student/what-if-sandbox'
      ? 'What-If Fit Sandbox'
      : pathname === '/student/chat'
      ? 'AI Career Coaching Studio'
      : pathname === '/student/applications'
      ? 'Applications & Pipeline Tracker'
      : pathname === '/student/privacy-shield'
      ? 'Privacy Shield & Resume Vault'
      : pathname === '/teacher/panel'
      ? 'Faculty Mentor Advisory'
      : pathname === '/officer/dashboard' || pathname === '/officer/panel'
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
    <div className="min-h-screen bg-surface text-on-surface flex font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* ────────────────────────────────────────────────────────── */}
      {/*  FIXED LEFT SIDEBAR                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside className="w-[260px] min-w-[260px] h-screen fixed left-0 top-0 bottom-0 bg-surface-container-low border-r-[1.5px] border-outline-variant flex flex-col justify-between z-30 select-none shadow-[2px_0_0_#EAD7E2]">
        <div>
          {/* Top Brand Mark */}
          <div className="h-16 px-5 border-b border-outline-variant/60 flex items-center justify-between">
            <Link href="/student/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container border border-outline-variant shadow-[0_2px_0_#DE95BE] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-lg text-primary font-bold">school</span>
              </div>
              <div>
                <span className="font-extrabold text-sm text-on-surface tracking-tight block leading-tight">
                  CampusBridge AI
                </span>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Tactile Studio • JKLU</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
            {/* Student Readiness Links */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-outline px-3 block mb-2">
                Career Readiness
              </span>
              <nav className="space-y-1">
                {studentNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === '/student/dashboard' && pathname === '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary text-on-primary shadow-[0_3px_0_#643953]'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-on-primary' : 'text-outline'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Institutional Portals Links */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-outline px-3 block mb-2">
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-secondary text-on-secondary shadow-[0_3px_0_#284b5b]'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-on-secondary' : 'text-outline'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Profile Capsule & Logout */}
        <div className="p-3.5 border-t border-outline-variant/60 bg-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container font-bold text-xs flex items-center justify-center border border-outline-variant shadow-[0_2px_0_#DE95BE]">
              {currentStudentName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-surface truncate">{currentStudentName}</div>
              <div className="text-[10px] text-on-surface-variant truncate font-medium">{currentSubtitle}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Link
              href="/student/privacy-shield"
              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-full border border-tertiary-fixed-dim bg-tertiary-container/40 text-[11px] font-bold text-on-tertiary-container hover:brightness-95 transition-all shadow-[0_2px_0_#a8cfbb]"
            >
              <Shield className="h-3 w-3 text-tertiary" />
              <span>Privacy</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-[11px] font-bold text-outline hover:text-error hover:border-error/40 transition-all shadow-[0_2px_0_#d3c2c9]"
              title="Sign Out"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/*  MAIN CONTENT AREA                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen bg-surface">
        {/* Top Tactile Header */}
        <header className="sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/60 px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pathname !== '/student/dashboard' && pathname !== '/' && (
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:border-primary-container text-xs font-bold transition-all shadow-[0_2px_0_#d3c2c9] group"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-primary group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">← Back</span>
              </Link>
            )}

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline">
                <Link href="/student/dashboard" className="hover:text-primary transition-colors">
                  {displayBreadcrumb}
                </Link>
                <ChevronRight className="h-3 w-3 text-outline/60" />
                <span className="text-primary font-bold">{displayTitle}</span>
              </div>
              <h1 className="font-extrabold text-base sm:text-lg text-on-surface tracking-tight leading-tight">
                {displayTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* DPDP FERPA Shield indicator */}
            <Link
              href="/student/privacy-shield"
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/30 border border-tertiary-fixed-dim text-on-tertiary-container text-xs font-bold shadow-[0_2px_0_#a8cfbb] hover:brightness-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
              <span>Zero-Leak Active</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`h-9 w-9 rounded-full border transition-all flex items-center justify-center shadow-[0_2px_0_#d3c2c9] cursor-pointer ${
                  notificationsOpen
                    ? 'bg-primary text-on-primary border-primary shadow-[0_2px_0_#643953]'
                    : 'bg-surface-container-lowest border-outline-variant text-outline hover:text-on-surface'
                }`}
                title="Placement & System Alerts"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error ring-2 ring-white animate-pulse" />
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-surface-container-lowest border-2 border-outline-variant shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-on-surface">Placement &amp; System Alerts</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary-container">
                          2 new
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] text-primary font-bold hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-outline-variant/40">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setNotificationsOpen(false)}
                          className="block pt-2 hover:bg-surface-container-low p-2 rounded-2xl transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.tagColor}`}>
                              {n.tag}
                            </span>
                            <span className="text-[10px] text-outline">{n.time}</span>
                          </div>
                          <p className="text-xs font-bold text-on-surface">{n.title}</p>
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">{n.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Quest CTA */}
            <Link
              href="/student/arena"
              className="bg-primary text-on-primary font-bold text-xs px-3.5 py-2 rounded-full border border-on-primary-fixed-variant shadow-[0_3px_0_#320e26] active:translate-y-[2px] transition-all flex items-center gap-1 hover:brightness-105"
            >
              <span>Arena</span>
              <span className="material-symbols-outlined text-sm">bolt</span>
            </Link>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
