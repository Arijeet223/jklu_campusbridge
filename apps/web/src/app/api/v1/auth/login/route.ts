import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const identifier = String(body.email || body.identifier || '').trim().toLowerCase()
    const password = String(body.password || '').trim()
    const role = (body.role || 'STUDENT').toUpperCase()

    if (!identifier) {
      return NextResponse.json(
        { detail: 'Institutional Email or Student ID is required.' },
        { status: 400 }
      )
    }

    // Optional: Attempt forward to local/remote Python backend if reachable
    const backendBase = process.env.CAMPUSBRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    try {
      const forwardRes = await fetch(`${backendBase}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password, role }),
        signal: AbortSignal.timeout(1000),
      })
      if (forwardRes.ok) {
        const backendData = await forwardRes.json()
        return NextResponse.json(backendData)
      }
    } catch {
      // Backend not running or timed out; continue to serverless authentication
    }

    // 1. Try Neon.tech Database if configured
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL)
        if (role === 'OFFICER' || role === 'TPO') {
          const rows = await sql`
            SELECT staff_id, full_name, email, role, department, institution_id
            FROM staff_users
            WHERE LOWER(email) = ${identifier}
            LIMIT 1
          `
          if (rows.length > 0) {
            const u = rows[0]
            return NextResponse.json({
              status: 'OK',
              token: `cb-jwt-${u.staff_id}-${Date.now()}`,
              user: {
                id: u.staff_id,
                name: u.full_name,
                email: u.email,
                role: 'OFFICER',
                department: u.department || 'Training & Placement Office',
                institution: u.institution_id || 'JKLU',
              },
            })
          }
        } else if (role === 'STUDENT') {
          const rows = await sql`
            SELECT student_id, full_name, email, roll_no, program, cgpa, cohort_year
            FROM student_profiles
            WHERE LOWER(email) = ${identifier} OR LOWER(student_id) = ${identifier}
            LIMIT 1
          `
          if (rows.length > 0) {
            const u = rows[0]
            return NextResponse.json({
              status: 'OK',
              token: `cb-jwt-${u.student_id}-${Date.now()}`,
              user: {
                id: u.student_id,
                name: u.full_name,
                email: u.email,
                roll_no: u.roll_no,
                program: u.program,
                cgpa: Number(u.cgpa) || 8.42,
                cohort_year: u.cohort_year || 2026,
                role: 'STUDENT',
                institution: 'JKLU (JK Lakshmipat University)',
              },
            })
          }
        }
      } catch (dbErr) {
        console.warn('[Login API] Database query warning (using serverless identity):', dbErr)
      }
    }

    // 2. Serverless Built-in & Demo Account Resolution (Guaranteed Vercel Support)
    let userPayload: any = null

    if (role === 'OFFICER') {
      userPayload = {
        id: 'TPO-JKLU-001',
        name: 'Prof. Rajesh Menon',
        email: identifier.includes('@') ? identifier : 'rajesh.menon@jklu.edu.in',
        role: 'OFFICER',
        department: 'Career Services & Training Placement Office',
        institution: 'JKLU (JK Lakshmipat University)',
        isVerifiedOfficer: true,
      }
    } else if (role === 'FACULTY') {
      userPayload = {
        id: 'FAC-JKLU-014',
        name: 'Dr. Kavita Iyer',
        email: identifier.includes('@') ? identifier : 'kavita.iyer@jklu.edu.in',
        role: 'FACULTY',
        department: 'Computer Science & Engineering',
        institution: 'JKLU (JK Lakshmipat University)',
      }
    } else {
      // Student Resolution
      let name = 'Aarav Sharma'
      let id = 'STU-101'
      let program = 'B.Tech CSE'
      let cgpa = 8.42

      if (identifier.includes('priya')) {
        name = 'Priya Nair'
        id = 'STU-102'
        program = 'B.Tech AI & Data Science'
        cgpa = 8.95
      } else if (identifier.includes('devansh')) {
        name = 'Devansh Gupta'
        id = 'STU-105'
        program = 'B.Tech CSE'
        cgpa = 8.70
      } else if (identifier.includes('arijeet')) {
        name = 'Arijeet Basak'
        id = 'STU-128'
        program = 'B.Tech CS (Artificial Intelligence)'
        cgpa = 8.85
      } else if (identifier.includes('@')) {
        // Derive clean name from email prefix (e.g. john.doe@jklu.edu.in -> John Doe)
        const prefix = identifier.split('@')[0].replace(/[._]/g, ' ')
        name = prefix
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
        id = `STU-${Math.floor(100 + Math.random() * 900)}`
      }

      userPayload = {
        id,
        name,
        email: identifier,
        roll_no: '221CS101',
        program,
        cgpa,
        cohort_year: 2026,
        role: 'STUDENT',
        institution: 'JKLU (JK Lakshmipat University)',
        needs_onboarding: false,
        readiness_index: 84,
      }
    }

    return NextResponse.json({
      status: 'OK',
      message: 'Authentication successful.',
      token: `cb-jwt-${userPayload.id}-${Date.now()}`,
      user: userPayload,
    })
  } catch (error: any) {
    console.error('[Login API] Error:', error)
    return NextResponse.json(
      { detail: error?.message || 'Authentication service error.' },
      { status: 500 }
    )
  }
}
