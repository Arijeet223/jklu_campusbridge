'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileSpreadsheet,
  Building2,
  Users,
  UserPlus,
} from 'lucide-react'

type LoginRole = 'STUDENT' | 'FACULTY' | 'OFFICER'
type AuthMode = 'SIGN_IN' | 'REGISTER'

export default function LoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<AuthMode>('SIGN_IN')
  const [role, setRole] = useState<LoginRole>('STUDENT')
  const [identifier, setIdentifier] = useState('aarav.sharma@nitk.edu')
  const [password, setPassword] = useState('student@nitk2026')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Registration Form State
  const [regFullName, setRegFullName] = useState('Devansh Gupta')
  const [regEmail, setRegEmail] = useState('devansh.gupta@nitk.edu')
  const [regRollNo, setRegRollNo] = useState('221CS150')
  const [regProgram, setRegProgram] = useState('B.Tech CSE')
  const [regCohortYear, setRegCohortYear] = useState('2026')
  const [regCgpa, setRegCgpa] = useState('8.70')
  const [regBacklogs, setRegBacklogs] = useState('0')
  const [regPassword, setRegPassword] = useState('student@nitk2026')

  const handleRoleChange = (newRole: LoginRole) => {
    setRole(newRole)
    setErrorMsg(null)
    if (newRole === 'STUDENT') {
      setIdentifier('aarav.sharma@nitk.edu')
      setPassword('student@nitk2026')
    } else if (newRole === 'FACULTY') {
      setIdentifier('kavita.iyer@nitk.edu')
      setPassword('faculty@nitk2026')
    } else {
      setIdentifier('rajesh.menon@nitk.edu')
      setPassword('tpo@nitk2026')
    }
  }

  const executeAuth = async (authRole: LoginRole, authIdentifier: string, authPassword: string) => {
    setIsLoading(true)
    setErrorMsg(null)

    const payload = {
      email: authIdentifier.trim(),
      identifier: authIdentifier.trim(),
      password: authPassword.trim(),
      role: authRole,
    }

    try {
      // Try endpoints: direct Next.js proxy, API route, and direct FastAPI host
      const endpoints = [
        '/api/v1/auth/login',
        'http://localhost:8000/api/v1/auth/login',
        '/api/backend/v1/auth/login',
        'http://localhost:8000/v1/auth/login',
      ]

      let res: Response | null = null
      for (const ep of endpoints) {
        try {
          const attempt = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (attempt.ok || attempt.status === 401 || attempt.status === 422) {
            res = attempt
            break
          }
        } catch {
          // continue to next endpoint
        }
      }

      if (res && res.ok) {
        const data = await res.json()
        if (typeof window !== 'undefined') {
          localStorage.setItem('cb_active_user', JSON.stringify(data.user || {}))
          localStorage.setItem('cb_auth_token', data.token || 'cb-session-token')
        }

        // Redirect based on role and onboarding requirement
        if (authRole === 'STUDENT') {
          if (data.needs_onboarding || data.user?.needs_onboarding) {
            router.push('/student/onboarding')
          } else {
            router.push('/student/dashboard')
          }
        } else if (authRole === 'FACULTY') {
          router.push('/teacher/panel')
        } else {
          router.push('/officer/dashboard')
        }
        return
      }

      if (res && !res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Authentication failed' }))
        setErrorMsg(err.detail || 'Invalid institutional credentials.')
        return
      }

      throw new Error('Backend offline')
    } catch {
      // Offline fallback for smooth demo experience
      const fallbackUser =
        authRole === 'STUDENT'
          ? {
              id: authIdentifier.includes('priya') ? 'STU-102' : 'STU-101',
              name: authIdentifier.includes('priya') ? 'Priya Nair' : 'Aarav Sharma',
              email: authIdentifier,
              program: authIdentifier.includes('priya') ? 'B.Tech AI & Data Science' : 'B.Tech CSE',
              cgpa: authIdentifier.includes('priya') ? 8.95 : 8.42,
            }
          : authRole === 'FACULTY'
          ? {
              id: 'STF-014',
              name: 'Dr. Kavita Iyer',
              email: authIdentifier,
              role: 'FACULTY_MENTOR',
              department: 'Computer Science',
            }
          : {
              id: 'TPO-001',
              name: 'Prof. Rajesh Menon',
              email: authIdentifier,
              role: 'PLACEMENT_OFFICER',
              department: 'Career Development Centre',
            }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cb_active_user', JSON.stringify(fallbackUser))
        localStorage.setItem('cb_auth_token', 'demo-session-token')
      }

      if (authRole === 'STUDENT') {
        router.push('/student/dashboard')
      } else if (authRole === 'FACULTY') {
        router.push('/teacher/panel')
      } else {
        router.push('/officer/dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await executeAuth(role, identifier, password)
  }

  const handleQuickDemoLogin = async (quickRole: LoginRole, quickIdent: string, quickPass: string) => {
    setRole(quickRole)
    setIdentifier(quickIdent)
    setPassword(quickPass)
    await executeAuth(quickRole, quickIdent, quickPass)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const payload = {
      full_name: regFullName.trim(),
      email: regEmail.trim().toLowerCase(),
      roll_no: regRollNo.trim().toUpperCase(),
      program: regProgram,
      cohort_year: parseInt(regCohortYear, 10) || 2026,
      cgpa: parseFloat(regCgpa) || 8.0,
      active_backlogs: parseInt(regBacklogs, 10) || 0,
      password: regPassword,
      privacy_shield_mode: 'OPT_IN_DRIVES',
      target_roles: ['Backend Engineer', 'Full-Stack Developer'],
    }

    try {
      const endpoints = [
        '/api/v1/auth/register-student',
        'http://localhost:8000/api/v1/auth/register-student',
        '/v1/auth/register-student',
        '/api/v1/auth/register',
        'http://localhost:8000/auth/register',
      ]

      let res: Response | null = null
      let errDetail = ''
      for (const ep of endpoints) {
        try {
          const attempt = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (attempt.ok) {
            res = attempt
            break
          } else {
            const errData = await attempt.json().catch(() => ({}))
            errDetail = errData.detail || attempt.statusText
          }
        } catch {
          // continue to next endpoint
        }
      }

      if (res && res.ok) {
        const data = await res.json()
        if (typeof window !== 'undefined') {
          localStorage.setItem('cb_active_user', JSON.stringify(data.user || {}))
          localStorage.setItem('cb_auth_token', data.token || 'cb-session-token')
        }
        setSuccessMsg(`Account registered in Excel ledger! Redirecting to Resume Onboarding...`)
        setTimeout(() => {
          router.push('/student/onboarding')
        }, 700)
        return
      }

      throw new Error(errDetail || 'Registration service offline. Please ensure backend is running.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check institutional details.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex flex-col font-sans selection:bg-[#F0B6D5] selection:text-[#6D3B56]">
      {/* Minimal Header */}
      <header className="h-18 px-6 sm:px-12 border-b border-[#E6E3DC] flex items-center justify-between bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6D3B56] text-white shadow-xs font-display font-extrabold text-sm tracking-tight border-b-2 border-[#552940]">
            CB
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-extrabold text-ink-primary tracking-tight">
                CampusBridge AI
              </span>
              <span className="font-mono text-3xs px-1.5 py-0.5 rounded-full bg-[#E2DFD9] text-[#6D3B56] font-bold">
                v1.1 PS-06
              </span>
            </div>
            <p className="text-3xs text-ink-muted">Warm Institutional Studio</p>
          </div>
        </div>
      </header>

      {/* Split-Screen Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-center max-w-[1360px] w-full mx-auto p-4 sm:p-8 lg:p-12 gap-8 lg:gap-12">
        {/* Left Column: Pro-Grade Institutional Value Proposition */}
        <div className="flex-1 flex flex-col justify-center space-y-6 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5] w-fit">
            <ShieldCheck className="h-4 w-4" />
            Institutional Career Intelligence Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-ink-primary tracking-tight leading-tight">
            Placement readiness with zero hallucinations.
          </h1>

          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-xl">
            CampusBridge AI combines a <strong className="text-ink-primary">100% Deterministic Policy Shell</strong> (pure code and mathematical rules for cutoffs and privacy) with a <strong className="text-ink-primary">Probabilistic Core</strong> (Qwen 2.5 + Hybrid RAG) to verify real skill evidence.
          </p>

          {/* 3 Architecture Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl bg-white border border-[#E6E3DC] p-4 shadow-2xs">
              <div className="h-8 w-8 rounded-xl bg-[#B6DEC9]/40 flex items-center justify-center text-[#255C45] mb-2 font-bold">
                ✓
              </div>
              <h3 className="font-display font-bold text-xs text-ink-primary">DPDP $k \ge 5$ Vault</h3>
              <p className="text-3xs text-ink-muted mt-1 leading-normal">
                Small-cell cohort suppression prevents recruiter deanonymization.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#E6E3DC] p-4 shadow-2xs">
              <div className="h-8 w-8 rounded-xl bg-[#B6D9EC]/40 flex items-center justify-center text-[#2B5B75] mb-2 font-bold">
                ⚡
              </div>
              <h3 className="font-display font-bold text-xs text-ink-primary">&lt;50ms What-If Fit</h3>
              <p className="text-3xs text-ink-muted mt-1 leading-normal">
                Instant counterfactual delta scoring with verified resume citations.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#E6E3DC] p-4 shadow-2xs">
              <div className="h-8 w-8 rounded-xl bg-[#F0B6D5]/40 flex items-center justify-center text-[#6D3B56] mb-2 font-bold">
                🛡️
              </div>
              <h3 className="font-display font-bold text-xs text-ink-primary">120s Micro-Defense</h3>
              <p className="text-3xs text-ink-muted mt-1 leading-normal">
                Interactive DSA &amp; SQLite sandbox proctors eliminate resume fluff.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Authentication Portal */}
        <div className="w-full lg:w-[480px] flex items-center">
          <div className="w-full rounded-3xl bg-white border-2 border-[#E6E3DC] shadow-xl p-6 sm:p-8 space-y-5">
            {/* Auth Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#F1EFEA] border border-[#E6E3DC]">
              <button
                type="button"
                onClick={() => { setAuthMode('SIGN_IN'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  authMode === 'SIGN_IN'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'REGISTER'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register Student</span>
              </button>
            </div>

            {authMode === 'SIGN_IN' ? (
              <>
                <div className="space-y-1 text-center">
                  <h2 className="font-display font-extrabold text-2xl text-ink-primary tracking-tight">
                    Institutional Sign In
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Access your personalized workspace securely
                  </p>
                </div>

                {/* Role Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#F1EFEA] border border-[#E6E3DC]">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('STUDENT')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold text-xs transition-all ${
                      role === 'STUDENT'
                        ? 'bg-[#6D3B56] text-white shadow-xs'
                        : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('FACULTY')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold text-xs transition-all ${
                      role === 'FACULTY'
                        ? 'bg-[#6D3B56] text-white shadow-xs'
                        : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('OFFICER')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold text-xs transition-all ${
                      role === 'OFFICER'
                        ? 'bg-[#6D3B56] text-white shadow-xs'
                        : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>TPO Cell</span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-[#BE123C] font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-[#065F46] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Credentials Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-primary mb-1.5">
                      {role === 'STUDENT'
                        ? 'College Email or Roll Number'
                        : role === 'FACULTY'
                        ? 'Faculty Department Email'
                        : 'Placement Officer Email'}
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. roll_no or email@nitk.edu"
                      required
                      className="w-full rounded-2xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-4 py-2.5 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-ink-primary">
                        Password
                      </label>
                      <span className="text-3xs text-[#6D3B56] font-semibold hover:underline cursor-pointer">
                        Forgot Password?
                      </span>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-2xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-4 py-2.5 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#6D3B56] hover:bg-[#582e44] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md border-b-4 border-[#AD1457] active:translate-y-0.5 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <span>Enter {role === 'STUDENT' ? 'Student Workspace' : role === 'FACULTY' ? 'Mentor Portal' : 'TPO Console'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick-Fill Demo Badges */}
                <div className="pt-3 border-t border-[#E6E3DC] space-y-2">
                  <span className="text-3xs font-mono font-bold text-ink-muted uppercase tracking-wider block text-center">
                    Instant 1-Click Demo Accounts
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('STUDENT', 'aarav.sharma@nitk.edu', 'student@nitk2026')}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="font-bold">Aarav Sharma</span>
                      <span className="text-3xs px-1.5 py-0.5 rounded bg-[#F0B6D5]/40 text-[#6D3B56] font-bold">Student</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('STUDENT', 'priya.nair@nitk.edu', 'student@nitk2026')}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="font-bold">Priya Nair</span>
                      <span className="text-3xs px-1.5 py-0.5 rounded bg-[#B6D9EC]/50 text-[#2B5B75] font-bold">AI/DS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('FACULTY', 'kavita.iyer@nitk.edu', 'faculty@nitk2026')}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="font-bold">Dr. Kavita Iyer</span>
                      <span className="text-3xs px-1.5 py-0.5 rounded bg-[#B6DEC9]/60 text-[#255C45] font-bold">Faculty</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('OFFICER', 'rajesh.menon@nitk.edu', 'tpo@nitk2026')}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                    >
                      <span className="font-bold">Prof. Rajesh Menon</span>
                      <span className="text-3xs px-1.5 py-0.5 rounded bg-[#F0B6D5]/40 text-[#6D3B56] font-bold">TPO</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* DYNAMIC CANDIDATE REGISTRATION */
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
                    Dynamic DB Registration
                  </div>
                  <h2 className="font-display font-extrabold text-xl text-ink-primary tracking-tight">
                    Register New Candidate
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Direct atomic ledger write to Accounts_Students
                  </p>
                </div>

                {errorMsg && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-[#BE123C] font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-[#065F46] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-2xs font-bold text-ink-primary mb-1">
                      Full Candidate Name
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Devansh Gupta"
                      required
                      className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-2xs font-bold text-ink-primary mb-1">
                        Institutional Email
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="devansh@nitk.edu"
                        required
                        className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold text-ink-primary mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={regRollNo}
                        onChange={(e) => setRegRollNo(e.target.value)}
                        placeholder="221CS150"
                        required
                        className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-2xs font-bold text-ink-primary mb-1">
                        Program
                      </label>
                      <select
                        value={regProgram}
                        onChange={(e) => setRegProgram(e.target.value)}
                        className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                      >
                        <option value="B.Tech CSE">B.Tech CSE</option>
                        <option value="B.Tech AI & Data Science">B.Tech AI &amp; DS</option>
                        <option value="B.Tech Information Technology">B.Tech IT</option>
                        <option value="B.Tech ECE">B.Tech ECE</option>
                        <option value="M.Tech Software Engineering">M.Tech SE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-2xs font-bold text-ink-primary mb-1">
                        Cohort Year
                      </label>
                      <input
                        type="number"
                        value={regCohortYear}
                        onChange={(e) => setRegCohortYear(e.target.value)}
                        required
                        className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-2xs font-bold text-ink-primary mb-1">
                        Current CGPA (0.00 - 10.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={regCgpa}
                        onChange={(e) => setRegCgpa(e.target.value)}
                        required
                        className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold text-ink-primary mb-1">
                        Active Backlogs
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={regBacklogs}
                        onChange={(e) => setRegBacklogs(e.target.value)}
                        required
                        className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-ink-primary mb-1">
                      Account Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-3 py-2 text-xs text-ink-primary font-medium focus:border-[#6D3B56] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 rounded-2xl bg-[#6D3B56] hover:bg-[#582e44] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md border-b-4 border-[#AD1457] active:translate-y-0.5 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span>Writing to Ledger...</span>
                    ) : (
                      <>
                        <span>Create Account &amp; Ingest Resume</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-3xs text-ink-muted text-center pt-1">
                    🛡️ Automatically triggers T.E.R.R.A. layout extractor &amp; 1536-dim Nomic embedding guard.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
