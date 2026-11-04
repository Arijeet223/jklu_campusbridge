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
} from 'lucide-react'

type LoginRole = 'STUDENT' | 'FACULTY' | 'OFFICER'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<LoginRole>('STUDENT')
  const [identifier, setIdentifier] = useState('aarav.sharma@nitk.edu')
  const [password, setPassword] = useState('student@nitk2026')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/backend/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
          role: role,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (typeof window !== 'undefined') {
          localStorage.setItem('cb_active_user', JSON.stringify(data.user || {}))
          localStorage.setItem('cb_auth_token', data.token || 'demo-token')
        }

        // Redirect based on role and onboarding requirement
        if (role === 'STUDENT') {
          if (data.needs_onboarding || data.user?.needs_onboarding) {
            router.push('/student/onboarding')
          } else {
            router.push('/student/dashboard')
          }
        } else if (role === 'FACULTY') {
          router.push('/teacher/panel')
        } else {
          router.push('/officer/panel')
        }
      } else {
        const err = await res.json().catch(() => ({ detail: 'Authentication failed' }))
        setErrorMsg(err.detail || 'Invalid credentials. Please verify your institutional email.')
      }
    } catch {
      // Offline fallback for smooth demo experience
      const fallbackUser =
        role === 'STUDENT'
          ? {
              id: 'STU-101',
              name: 'Aarav Sharma',
              email: identifier,
              program: 'B.Tech CSE',
              cgpa: 8.42,
            }
          : role === 'FACULTY'
          ? {
              id: 'STF-014',
              name: 'Dr. Kavita Iyer',
              email: identifier,
              role: 'FACULTY_MENTOR',
              department: 'Computer Science',
            }
          : {
              id: 'TPO-001',
              name: 'Prof. Rajesh Menon',
              email: identifier,
              role: 'PLACEMENT_OFFICER',
              department: 'Career Development Centre',
            }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cb_active_user', JSON.stringify(fallbackUser))
        localStorage.setItem('cb_auth_token', 'demo-session-token')
      }

      if (role === 'STUDENT') {
        router.push('/student/dashboard')
      } else if (role === 'FACULTY') {
        router.push('/teacher/panel')
      } else {
        router.push('/officer/panel')
      }
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
        <div className="w-full lg:w-[460px] flex items-center">
          <div className="w-full rounded-3xl bg-white border-2 border-[#E6E3DC] shadow-xl p-6 sm:p-8 space-y-6">
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
            <div className="pt-4 border-t border-[#E6E3DC] space-y-2.5">
              <span className="text-3xs font-mono font-bold text-ink-muted uppercase tracking-wider block text-center">
                1-Click Quick Demo Accounts
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 text-2xs">
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('STUDENT')
                    setIdentifier('aarav.sharma@nitk.edu')
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-colors cursor-pointer"
                >
                  Aarav (Student)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('STUDENT')
                    setIdentifier('priya.nair@nitk.edu')
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-colors cursor-pointer"
                >
                  Priya (AI/DS)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('FACULTY')
                    setIdentifier('kavita.iyer@nitk.edu')
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-colors cursor-pointer"
                >
                  Dr. Iyer (Faculty)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange('OFFICER')
                    setIdentifier('rajesh.menon@nitk.edu')
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#F1EFEA] hover:bg-[#E6E3DC] text-ink-primary font-medium transition-colors cursor-pointer"
                >
                  Prof. Menon (TPO)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
