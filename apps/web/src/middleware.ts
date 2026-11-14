import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Next.js Edge Middleware for Strict 3-Way Role-Based Access Control (RBAC).
 *
 * Enforces airtight boundaries between:
 * 1. STUDENT -> Restricted to Student Workspace (/student/*).
 *               Forbidden from Teacher, PTO/Placement, and Orbital portals.
 * 2. TEACHER -> Restricted to Teacher Portal (/teacher/*) & Orbital Diagnostics.
 *               Forbidden from Student Workspace and PTO/Placement consoles.
 * 3. PLACEMENT_OFFICER -> Restricted to PTO Console (/officer/*, /pto-dashboard) & Orbital Diagnostics.
 *                         Forbidden from Student Workspace and Teacher portals.
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
  const isTeacher = rawRole === 'TEACHER' || rawRole === 'FACULTY' || rawRole === 'FACULTY_MENTOR'
  const isOfficer =
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

  const isTeacherRoute = pathname.startsWith('/teacher')

  const isOfficerRoute =
    pathname.startsWith('/pto-dashboard') ||
    pathname.startsWith('/tpo-dashboard') ||
    pathname.startsWith('/officer')

  const isOrbitalRoute =
    pathname.startsWith('/admin/diagnostics') ||
    pathname.startsWith('/orbital')

  // Check if route requires authentication
  const isProtectedRoute = isStudentRoute || isTeacherRoute || isOfficerRoute || isOrbitalRoute

  if (isProtectedRoute) {
    if (!isAuth) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ── 3-WAY RBAC ENFORCEMENT ──────────────────────────────────────────

    // 1. STUDENT ACCESS RULES
    if (isStudent) {
      if (isTeacherRoute || isOfficerRoute || isOrbitalRoute) {
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

    // 2. TEACHER ACCESS RULES
    if (isTeacher) {
      if (isStudentRoute || isOfficerRoute) {
        const redirectUrl = new URL('/teacher/panel', req.url)
        redirectUrl.searchParams.set('error', 'student_access_restricted')
        return NextResponse.redirect(redirectUrl)
      }
      if (pathname === '/orbital') {
        return NextResponse.redirect(new URL('/admin/diagnostics', req.url))
      }
      return NextResponse.next()
    }

    // 3. PLACEMENT OFFICER ACCESS RULES
    if (isOfficer) {
      if (isStudentRoute || isTeacherRoute) {
        const redirectUrl = new URL('/officer/dashboard', req.url)
        redirectUrl.searchParams.set('error', 'officer_workspace_restricted')
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
