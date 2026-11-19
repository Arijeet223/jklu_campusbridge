'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  UserCheck,
  UserCog,
  User,
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
  Menu,
  X,
  Zap,
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  breadcrumb?: string
  activeRole?: 'STUDENT' | 'FACULTY' | 'OFFICER' | 'ADMIN' | 'TEACHER' | 'PLACEMENT_OFFICER'
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
  const { data: session } = useSession()

  const [localRole, setLocalRole] = useState<string | null>(null)
  const [currentStudentId, setCurrentStudentId] = useState('STU-101')
  const [currentStudentName, setCurrentStudentName] = useState(userName)
  const [currentSubtitle, setCurrentSubtitle] = useState(userSubtitle)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  const loadNotifications = useCallback(async (sid: string) => {
    try {
      setIsLoadingNotifications(true)
      const res = await fetch(`/api/notifications/mine?student_id=${encodeURIComponent(sid)}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
          const unread = data.unread_count ?? data.notifications.filter((n: any) => !n.is_read).length
          setUnreadCount(unread)
        }
      }
    } catch (e) {
      console.warn('Could not fetch real notifications:', e)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  // 1. Resolve Active Role from NextAuth Session with localStorage fallback
  useEffect(() => {
    let resolvedSid = 'STU-101'
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.id || parsed.student_id) {
          resolvedSid = parsed.id || parsed.student_id
          setCurrentStudentId(resolvedSid)
        }
        if (parsed.role) setLocalRole(parsed.role)
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
    } catch {}
    setMobileSidebarOpen(false)
    loadNotifications(resolvedSid)

    const handleProfileOrNotifsUpdated = () => {
      loadNotifications(resolvedSid)
    }
    window.addEventListener('cb_notifications_updated', handleProfileOrNotifsUpdated)
    window.addEventListener('cb_profile_updated', handleProfileOrNotifsUpdated)

    // Optional 30s background poll for incoming alerts
    const timer = setInterval(() => {
      loadNotifications(resolvedSid)
    }, 30000)

    return () => {
      window.removeEventListener('cb_notifications_updated', handleProfileOrNotifsUpdated)
      window.removeEventListener('cb_profile_updated', handleProfileOrNotifsUpdated)
      clearInterval(timer)
    }
  }, [pathname, router, loadNotifications])

  const resolvedRole = (
    (session?.user?.role as string) ||
    localRole ||
    activeRole ||
    'STUDENT'
  ).toUpperCase()

  const isFaculty =
    resolvedRole === 'FACULTY' ||
    resolvedRole === 'TEACHER' ||
    resolvedRole === 'FACULTY_MENTOR' ||
    resolvedRole === 'PLACEMENT_OFFICER' ||
    resolvedRole === 'OFFICER' ||
    resolvedRole === 'TPO' ||
    resolvedRole === 'PTO' ||
    resolvedRole === 'ADMIN'

  // Strict 2-way system: Student vs Faculty
  const isStudent = !isFaculty

  const roleHome = isFaculty ? '/teacher/panel' : '/student/dashboard'

  // 2. Strict 2-Way Navigation Definitions
  const studentNavItems = [
    { label: 'Dashboard Overview', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Live Opportunities', href: '/student/matches', icon: Briefcase },
    { label: '72-Hour Sprint Plan', href: '/student/sprint-plan', icon: Zap },
    { label: 'Profile & Provenance', href: '/student/profile-evidence', icon: UserCheck },
    { label: 'Practice & 120s Arena', href: '/student/arena', icon: Gamepad2 },
    { label: 'AI Conversational Coach', href: '/student/chat', icon: MessageSquare },
    { label: 'Applications & Kanban', href: '/student/applications', icon: ClipboardList },
    { label: 'Account & Ingestion', href: '/student/settings', icon: UserCog },
  ]

  const facultyNavItems = [
    { label: 'Advisees & Placements', href: '/teacher/panel', icon: GraduationCap },
    { label: 'AI Orbital Check', href: '/admin/diagnostics', icon: Activity },
  ]

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, unread: false } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
      })
    } catch (e) {
      console.warn('Failed marking notification read:', e)
    }
  }

  const handleMarkAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, unread: false }))
    )
    setUnreadCount(0)

    try {
      await fetch(`/api/notifications/read-all?student_id=${encodeURIComponent(currentStudentId)}`, {
        method: 'POST',
      })
    } catch (e) {
      console.warn('Failed marking all notifications read:', e)
    }
  }

  // Safe Logout & Client-Side Cache Eviction
  const handleLogout = async () => {
    try {
      localStorage.removeItem('cb_active_user')
      localStorage.removeItem('cb_auth_token')
      localStorage.removeItem('cb_user_skills')
      localStorage.removeItem('cb_uploaded_documents')
      localStorage.removeItem('cb_resume_versions')
      sessionStorage.clear()
      // Expire edge middleware role cookie
      document.cookie = 'cb_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      await signOut({ redirect: false })
    } catch {}
    router.push('/login')
    router.refresh()
  }

  // Safe Back Button Handler respecting RBAC boundaries
  const handleSafeBack = () => {
    if (
      typeof window !== 'undefined' &&
      window.history.length > 2 &&
      document.referrer &&
      !document.referrer.includes('/login')
    ) {
      router.back()
    } else {
      router.push(roleHome)
    }
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
      : pathname === '/teacher/panel' || pathname.startsWith('/faculty')
      ? 'Faculty Advisory & Placement Operations'
      : pathname === '/admin/diagnostics'
      ? 'AI Pantheon Orbital Diagnostics'
      : isFaculty
      ? 'Faculty Advisory & Placements'
      : 'Career Readiness')

  const displayBreadcrumb =
    breadcrumb ||
    (pathname.startsWith('/student')
      ? 'Student Workspace'
      : pathname.startsWith('/teacher') || pathname.startsWith('/faculty') || pathname.startsWith('/officer') || pathname.startsWith('/pto') || pathname.startsWith('/tpo')
      ? 'Faculty Console'
      : pathname.startsWith('/admin')
      ? 'Orbital Check'
      : isFaculty
      ? 'Faculty Advisory & Placements'
      : 'Student Workspace')

  return (
    <div className="min-h-screen bg-surface text-on-surface flex font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/*  FIXED LEFT SIDEBAR                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={`w-[260px] min-w-[260px] h-screen fixed left-0 top-0 bottom-0 bg-surface-container-low border-r-[1.5px] border-outline-variant flex flex-col justify-between z-50 select-none shadow-[2px_0_0_#EAD7E2] transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top Brand Mark */}
          <div className="h-16 px-5 border-b border-outline-variant/60 flex items-center justify-between">
            <Link href={roleHome} className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container border border-outline-variant shadow-[0_2px_0_#DE95BE] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-lg text-primary font-bold">school</span>
              </div>
              <div>
                <span className="font-extrabold text-sm text-on-surface tracking-tight block leading-tight">
                  CampusBridge AI
                </span>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  {isFaculty ? 'Faculty Portal • Placements & Advisory' : 'Tactile Studio • JKLU'}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-full text-outline hover:text-on-surface"
              aria-label="Close Navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Items: STRICT 2-WAY CONDITIONAL RENDERING */}
          <div className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
            {/* 1. STUDENT ONLY NAVIGATION */}
            {isStudent && (
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
            )}

            {/* 2. FACULTY ONLY NAVIGATION */}
            {isFaculty && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline px-3 block mb-2">
                  Faculty Advisory &amp; Placements
                </span>
                <nav className="space-y-1">
                  {facultyNavItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/teacher/panel' &&
                        (pathname.startsWith('/teacher') ||
                          pathname.startsWith('/faculty') ||
                          pathname.startsWith('/officer') ||
                          pathname.startsWith('/pto') ||
                          pathname.startsWith('/tpo')))
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
            )}
          </div>
        </div>

        {/* Sidebar Footer: Account Page at Bottom of Side Panel */}
        <div className="p-3.5 border-t border-outline-variant/60 bg-surface-container space-y-2.5">
          {/* Dedicated Account Page Link at Bottom of Side Panel */}
          {isStudent && (
            <Link
              href="/student/settings"
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl border transition-all ${
                pathname === '/student/settings' || pathname === '/student/account'
                  ? 'bg-primary text-on-primary border-primary shadow-[0_2px_0_#643953]'
                  : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container-high shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${
                    pathname === '/student/settings' || pathname === '/student/account'
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-primary-container text-on-primary-container border-outline-variant shadow-2xs'
                  }`}
                >
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-xs font-bold block truncate leading-tight">Account &amp; Career Info</span>
                  <span
                    className={`text-[10px] block truncate ${
                      pathname === '/student/settings' || pathname === '/student/account'
                        ? 'text-white/80'
                        : 'text-outline'
                    }`}
                  >
                    GitHub, Telegram &amp; Ingestion
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 opacity-60 shrink-0" />
            </Link>
          )}

          {/* Student Profile Capsule linking to Account */}
          <Link
            href={isStudent ? '/student/settings' : roleHome}
            className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity p-1 -m-1 rounded-xl"
            title="Manage Student Account"
          >
            <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container font-bold text-xs flex items-center justify-center border border-outline-variant shadow-[0_2px_0_#DE95BE] group-hover:scale-105 transition-transform shrink-0">
              {currentStudentName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors flex items-center gap-1">
                <span>{currentStudentName}</span>
                <span className="material-symbols-outlined text-[12px] text-outline">settings</span>
              </div>
              <div className="text-[10px] text-on-surface-variant truncate font-medium">{currentSubtitle}</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 pt-1">
            {isStudent ? (
              <Link
                href="/student/privacy-shield"
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-full border border-tertiary-fixed-dim bg-tertiary-container/40 text-[11px] font-bold text-on-tertiary-container hover:brightness-95 transition-all shadow-[0_2px_0_#a8cfbb]"
              >
                <Shield className="h-3 w-3 text-tertiary" />
                <span>Privacy</span>
              </Link>
            ) : (
              <div className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-full border border-secondary-fixed-dim bg-secondary-container/40 text-[11px] font-bold text-on-secondary-container shadow-[0_2px_0_#85B5CE]">
                <Shield className="h-3 w-3 text-secondary" />
                <span>FERPA Verified</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-[11px] font-bold text-outline hover:text-error hover:border-error/40 transition-all shadow-[0_2px_0_#d3c2c9] cursor-pointer"
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
      <div className="w-full lg:ml-[260px] flex-1 flex flex-col min-h-screen bg-surface min-w-0 overflow-x-hidden">
        {/* Top Tactile Header */}
        <header className="sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/60 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface shadow-[0_2px_0_#d3c2c9] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Bounded Safe Back Button */}
            {pathname !== roleHome && pathname !== '/' && (
              <button
                type="button"
                onClick={handleSafeBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:border-primary-container text-xs font-bold transition-all shadow-[0_2px_0_#d3c2c9] group shrink-0 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-primary group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">← Back</span>
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline truncate">
                <Link href={roleHome} className="hover:text-primary transition-colors shrink-0">
                  {displayBreadcrumb}
                </Link>
                <ChevronRight className="h-3 w-3 text-outline/60 shrink-0" />
                <span className="text-primary font-bold truncate">{displayTitle}</span>
              </div>
              <h1 className="font-extrabold text-base sm:text-lg text-on-surface tracking-tight leading-tight truncate">
                {displayTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* DPDP FERPA Shield indicator */}
            {isStudent ? (
              <Link
                href="/student/privacy-shield"
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/30 border border-tertiary-fixed-dim text-on-tertiary-container text-xs font-bold shadow-[0_2px_0_#a8cfbb] hover:brightness-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
                <span>Zero-Leak Active</span>
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/30 border border-secondary-fixed-dim text-on-secondary-container text-xs font-bold shadow-[0_2px_0_#85B5CE]">
                <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
                <span>Role Gateway Guarded</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`h-9 w-9 rounded-full border transition-all flex items-center justify-center shadow-[0_2px_0_#d3c2c9] cursor-pointer relative ${
                  notificationsOpen
                    ? 'bg-primary text-on-primary border-primary shadow-[0_2px_0_#643953]'
                    : 'bg-surface-container-lowest border-outline-variant text-outline hover:text-on-surface'
                }`}
                title="Placement & System Alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Tactical Dropdown Drawer */}
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-[0_12px_32px_rgba(109,59,86,0.12),0_4px_0_#EAD7E2] p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-on-surface">Campus Activity Feed</span>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">
                          {unreadCount} unread
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                          All caught up
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-outline hover:text-on-surface text-xs font-bold cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl text-outline mb-1 block">notifications_none</span>
                        <p className="text-xs font-bold text-on-surface">No alerts right now</p>
                        <p className="text-[11px] text-outline mt-0.5">
                          You will receive real-time notifications when new placement drives or skill assessments land.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !n.is_read
                        return (
                          <Link
                            key={n.id}
                            href={n.link || n.href || roleHome}
                            onClick={() => {
                              if (isUnread) handleMarkAsRead(n.id)
                              setNotificationsOpen(false)
                            }}
                            className={`block p-3 rounded-xl border transition-all hover:translate-x-1 ${
                              isUnread
                                ? 'bg-surface-container-low border-primary/40 shadow-[0_2px_0_#EAD7E2]'
                                : 'bg-surface border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.tagColor || 'bg-primary-container text-on-primary-container'}`}>
                                {n.tag || 'Job Drive'}
                              </span>
                              <span className="text-[10px] font-bold text-outline">
                                {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (n.time || 'Recent')}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-xs text-on-surface flex items-center justify-between">
                              <span>{n.title}</span>
                              {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">{n.message || n.description}</p>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Injection */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
