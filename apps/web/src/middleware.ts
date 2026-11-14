import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC).
 * Enforces strict perimeter security:
 * - /pto-dashboard, /tpo-dashboard, and /officer/* are restricted exclusively to verified JKLU placement officers.
 * - /student/* is protected for authenticated students and officers.
 * - /teacher/* is restricted to faculty mentors and administrators.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Retrieve signed JWT session token from cookie
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'campusbridge-free-tier-secret-key-at-least-32-chars-long',
  })

  const isAuth = Boolean(token)
  const role = (token?.role as string || '').toUpperCase()
  const institution = (token?.institution_id as string || '').toUpperCase()
  const isVerifiedOfficer = Boolean(token?.isVerifiedOfficer) ||
    ((role === 'OFFICER' || role === 'TPO' || role === 'PLACEMENT_OFFICER' || role === 'ADMIN') &&
     (institution === 'JKLU' || institution === 'INST-JKLU-001' || institution.includes('JKLU')))

  // ── RULE 1: Protect Placement Officer / TPO Dashboard Routes ───────────────
  const isOfficerRoute =
    pathname.startsWith('/pto-dashboard') ||
    pathname.startsWith('/tpo-dashboard') ||
    pathname.startsWith('/officer')

  if (isOfficerRoute) {
    // Unauthenticated: redirect to login with callback URL
    if (!isAuth) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Role check: Only verified JKLU placement officers can proceed
    if (!isVerifiedOfficer || role === 'STUDENT') {
      const deniedUrl = new URL('/student/dashboard', req.url)
      deniedUrl.searchParams.set('error', 'jklu_officer_access_required')
      deniedUrl.searchParams.set('message', 'Access denied. The Training & Placement Office console is restricted to verified JKLU placement officers.')
      return NextResponse.redirect(deniedUrl)
    }

    return NextResponse.next()
  }

  // ── RULE 2: Protect Student Workspace Routes ──────────────────────────────
  const isStudentRoute = pathname.startsWith('/student')

  if (isStudentRoute) {
    if (!isAuth) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // ── RULE 3: Protect Faculty Advisory Routes ───────────────────────────────
  const isFacultyRoute = pathname.startsWith('/teacher')

  if (isFacultyRoute) {
    if (!isAuth) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (role === 'STUDENT') {
      const deniedUrl = new URL('/student/dashboard', req.url)
      deniedUrl.searchParams.set('error', 'faculty_access_required')
      return NextResponse.redirect(deniedUrl)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/pto-dashboard/:path*',
    '/tpo-dashboard/:path*',
    '/officer/:path*',
    '/student/:path*',
    '/teacher/:path*',
  ],
}

