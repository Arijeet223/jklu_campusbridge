'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNavBar, { DEMO_PERSONAS, DemoPersona } from '@/components/TopNavBar'
import ExplainerModal from '@/components/ExplainerModal'
import {
  GraduationCap,
  Briefcase,
  Activity,
  ArrowRight,
  Shield,
  KeyRound,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0])
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT')
  const [explainerOpen, setExplainerOpen] = useState(false)

  // Form states
  const [identifier, setIdentifier] = useState('aarav.sharma@nitk.edu')
  const [password, setPassword] = useState('••••••••••••')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRoleSelect = (role: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    setSelectedRole(role)
    if (role === 'STUDENT') {
      setIdentifier('aarav.sharma@nitk.edu')
    } else if (role === 'FACULTY') {
      setIdentifier('kavita.iyer@nitk.edu')
    } else {
      setIdentifier('admin@nitk.edu')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      if (selectedRole === 'STUDENT') {
        router.push('/student/dashboard')
      } else if (selectedRole === 'FACULTY') {
        router.push('/teacher/panel')
      } else {
        router.push('/admin/diagnostics')
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary flex flex-col font-sans">
      <TopNavBar
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onOpenRegisterModal={() => {}}
        onOpenSyncExcelModal={() => {}}
        onOpenPrivacyModal={() => {}}
        onOpenExplainerModal={() => setExplainerOpen(true)}
      />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl bg-white border-2 border-[#E6E3DC] shadow-xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-[#F0B6D5]/20 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
              <Lock className="h-3.5 w-3.5" />
              Role-Based Authentication Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-primary tracking-tight">
              Sign In to CampusBridge AI
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted">
              Choose your role to access your dedicated placement &amp; career workspace.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#F1EFEA] border border-[#E6E3DC] mb-6">
            <button
              type="button"
              onClick={() => handleRoleSelect('STUDENT')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                selectedRole === 'STUDENT'
                  ? 'bg-white text-oxford shadow-xs border border-[#E6E3DC]'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('FACULTY')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                selectedRole === 'FACULTY'
                  ? 'bg-white text-[#255C45] shadow-xs border border-[#E6E3DC]'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Faculty / TPO</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-amber shadow-xs border border-[#E6E3DC]'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-primary mb-1">
                {selectedRole === 'STUDENT'
                  ? 'Institutional Email or Roll No.'
                  : 'Faculty / Staff Email ID'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full rounded-2xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-4 py-2.5 text-xs text-ink-primary focus:border-[#6D3B56] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-ink-primary">
                  Password
                </label>
                <span className="text-2xs text-[#6D3B56] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border-2 border-[#E6E3DC] bg-[#FAF8F6] px-4 py-2.5 text-xs text-ink-primary focus:border-[#6D3B56] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#6D3B56] hover:bg-[#582e44] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md border-b-4 border-[#AD1457] active:translate-y-0.5 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Shortcuts */}
          <div className="mt-8 pt-6 border-t border-[#E6E3DC] space-y-3">
            <span className="text-2xs font-bold text-ink-muted uppercase tracking-wider block text-center">
              1-Click Instant Demo Portals
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/student/dashboard"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] border border-[#E6E3DC] text-2xs font-bold text-oxford transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Student Hub</span>
              </Link>

              <Link
                href="/officer/panel"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#FAF8F6] hover:bg-[#F1EFEA] border border-[#E6E3DC] text-2xs font-bold text-[#255C45] transition-colors"
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Placement Officer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}

