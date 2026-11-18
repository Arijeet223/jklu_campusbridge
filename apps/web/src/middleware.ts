import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Next.js Edge Middleware for Strict 2-Way Role-Based Access Control (RBAC).
 *
 * Enforces airtight 2-way boundaries between:
 * 1. STUDENT -> Restricted to Student Workspace (/student/*).
 *               Forbidden from Faculty/Teacher and Institutional consoles.
 * 2. FACULTY -> Restricted to Faculty Advisory & Placement Consoles (/teacher/*, /faculty/*).
 *               Forbidden from Student Workspace.
 *
 * Legacy PTO / Placement Officer routes (/pto-dashboard, /tpo-dashboard, /officer/*)
 * are consolidated and seamlessly merged into the Faculty route namespace (/teacher/panel).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Retrieve session token from NextAuth JWT or fallback cookie
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'campusbridge-free-tier-secret-key-at-least-32-chars-long',
  })

  const cookieRole = req.cookies.get('cb_role')?.value || ''
  const isAuth = Boolean(token || cookieRole)
  const rawRole = ((token?.role as string) || cookieRole).toUpperCase()

  const isStudent = rawRole === 'STUDENT'
  const isFaculty =
    rawRole === 'FACULTY' ||
    rawRole === 'TEACHER' ||
    rawRole === 'FACULTY_MENTOR' ||
    rawRole === 'PLACEMENT_OFFICER' ||
    rawRole === 'OFFICER' ||
    rawRole === 'TPO' ||
    rawRole === 'PTO' ||
    rawRole === 'ADMIN'

  // Route classifications
  const isStudentRoute =
    pathname.startsWith('/student') ||
    pathname === '/student-dashboard' ||
    pathname.startsWith('/student-dashboard/') ||
    pathname === '/resume-upload' ||
    pathname.startsWith('/resume-upload/')

  const isFacultyRoute = pathname.startsWith('/teacher') || pathname.startsWith('/faculty')

  const isLegacyOfficerRoute =
    pathname.startsWith('/pto-dashboard') ||
    pathname.startsWith('/tpo-dashboard') ||
    pathname.startsWith('/officer')

  const isOrbitalRoute =
    pathname.startsWith('/admin/diagnostics') ||
    pathname.startsWith('/orbital')

  const isProtectedRoute = isStudentRoute || isFacultyRoute || isLegacyOfficerRoute || isOrbitalRoute

  if (isProtectedRoute) {
    if (!isAuth) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Legacy Officer Routes: Seamlessly merge into Faculty Console
    if (isLegacyOfficerRoute) {
      if (isStudent) {
        const redirectUrl = new URL('/student/dashboard', req.url)
        redirectUrl.searchParams.set('error', 'institutional_access_restricted')
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.redirect(new URL('/teacher/panel', req.url))
    }

    // ── STRICT 2-WAY RBAC ENFORCEMENT ────────────────────────────────────

    // 1. STUDENT ACCESS RULES
    if (isStudent) {
      if (isFacultyRoute || isOrbitalRoute) {
        const redirectUrl = new URL('/student/dashboard', req.url)
        redirectUrl.searchParams.set('error', 'institutional_access_restricted')
        return NextResponse.redirect(redirectUrl)
      }
      if (pathname === '/student-dashboard') {
        return NextResponse.redirect(new URL('/student/dashboard', req.url))
      }
      if (pathname === '/resume-upload') {
        return NextResponse.redirect(new URL('/student/onboarding', req.url))
      }
      return NextResponse.next()
    }

    // 2. FACULTY ACCESS RULES
    if (isFaculty) {
      if (isStudentRoute) {
        const redirectUrl = new URL('/teacher/panel', req.url)
        redirectUrl.searchParams.set('error', 'student_access_restricted')
        return NextResponse.redirect(redirectUrl)
      }
      if (pathname === '/orbital') {
        return NextResponse.redirect(new URL('/admin/diagnostics', req.url))
      }
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/pto-dashboard',
    '/pto-dashboard/:path*',
    '/tpo-dashboard',
    '/tpo-dashboard/:path*',
    '/officer',
    '/officer/:path*',
    '/student',
    '/student/:path*',
    '/teacher',
    '/teacher/:path*',
    '/faculty',
    '/faculty/:path*',
    '/admin/diagnostics',
    '/admin/diagnostics/:path*',
    '/orbital',
    '/orbital/:path*',
    '/student-dashboard',
    '/student-dashboard/:path*',
    '/resume-upload',
    '/resume-upload/:path*',
  ],
}
