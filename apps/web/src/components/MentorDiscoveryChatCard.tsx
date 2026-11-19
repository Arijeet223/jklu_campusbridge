'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Mail,
  Send,
  Phone,
  Github,
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react'

export interface SeniorMentor {
  student_id: string
  name: string
  program: string
  cohort_year: number
  cgpa: number
  top_skills: string[]
  email: string
  phone_number: string
  telegram_id: string
  github_url?: string
  bio?: string
  share_info_with_juniors: boolean
}

export default function MentorDiscoveryChatCard({
  initialMentors,
}: {
  initialMentors?: SeniorMentor[]
}) {
  const [mentors, setMentors] = useState<SeniorMentor[]>(initialMentors || [])
  const [loading, setLoading] = useState<boolean>(!initialMentors || initialMentors.length === 0)
  const [filterSkill, setFilterSkill] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mentors/available', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data.mentors) ? data.mentors : []
        setMentors(list)
      }
    } catch (err) {
      console.warn('Failed to fetch available mentors:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMentors = mentors.filter((m) => {
    // DPDP Guard: strictly require share_info_with_juniors === true
    if (m.share_info_with_juniors !== true) return false

    if (filterSkill !== 'all') {
      const hasSkill = m.top_skills.some((sk) =>
        sk.toLowerCase().includes(filterSkill.toLowerCase())
      )
      const matchesProgram = m.program.toLowerCase().includes(filterSkill.toLowerCase())
      if (!hasSkill && !matchesProgram) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = m.name.toLowerCase().includes(q)
      const matchSkill = m.top_skills.some((sk) => sk.toLowerCase().includes(q))
      const matchProgram = m.program.toLowerCase().includes(q)
      if (!matchName && !matchSkill && !matchProgram) return false
    }

    return true
  })

  return (
    <div className="w-full rounded-2xl border-2 border-[#DE95BE]/40 bg-white shadow-sm overflow-hidden animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#6D3B56] to-[#4A2639] px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 font-bold border border-white/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm tracking-tight text-white">
                  Enrolled Senior Mentors Directory
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  DPDP Opt-In Verified
                </span>
              </div>
              <p className="text-2xs text-[#DE95BE] mt-0.5">
                Real enrolled seniors available for technical interview prep, coursework guidance, and referral tips.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMentors}
            disabled={loading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh live mentors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70 mr-1">
            Focus:
          </span>
          {[
            { label: 'All Seniors', val: 'all' },
            { label: 'AI & ML', val: 'ai' },
            { label: 'Distributed Systems', val: 'distributed' },
            { label: 'Python / Backend', val: 'python' },
            { label: 'SQL / Databases', val: 'sql' },
          ].map((chip) => (
            <button
              key={chip.val}
              type="button"
              onClick={() => setFilterSkill(chip.val)}
              className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                filterSkill === chip.val
                  ? 'bg-white text-[#6D3B56] shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white/90'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body Area */}
      <div className="p-4 sm:p-5 space-y-4 bg-[#FAF8F5]/60">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-xs text-[#817379]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#6D3B56]" />
            <span>Querying enrolled seniors from Neon PostgreSQL...</span>
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-[#DE95BE]/60 bg-white text-center space-y-2.5">
            <Users className="h-8 w-8 text-[#6D3B56] mx-auto opacity-70" />
            <div className="font-display font-bold text-xs text-[#1B1C1B]">
              No Senior Mentors Found for This Filter
            </div>
            <p className="text-2xs text-[#817379] max-w-md mx-auto leading-relaxed">
              Under DPDP Privacy-by-Default regulations, student profiles and contact channels are strictly shielded until seniors explicitly enable <strong>&ldquo;Share your info with juniors&rdquo;</strong> in their Settings.
            </p>
            <div className="pt-2">
              <Link
                href="/student/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6D3B56] text-white hover:bg-[#582e44] text-xs font-bold transition-all shadow-xs"
              >
                <span>Manage Your Mentorship Opt-In</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMentors.map((mentor) => {
              const tgClean = (mentor.telegram_id || '').replace(/^@/, '').trim()
              const initials = mentor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <div
                  key={mentor.student_id}
                  className="p-4 rounded-xl border border-[#E6E3DC] bg-white hover:border-[#6D3B56] transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header: Name + GPA Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-[#6D3B56]/10 text-[#6D3B56] border border-[#6D3B56]/20 flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-[#1B1C1B] leading-tight">
                            {mentor.name}
                          </h4>
                          <p className="text-[11px] text-[#4F4449] mt-0.5 leading-tight">
                            {mentor.program}
                          </p>
                          <span className="text-[10px] font-mono text-[#817379]">
                            Batch {mentor.cohort_year || 2026}
                          </span>
                        </div>
                      </div>

                      {/* Verified GPA Pill */}
                      <span className="font-mono text-2xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1 shadow-2xs">
                        <Award className="h-3 w-3 text-emerald-600" />
                        <span>{Number(mentor.cgpa).toFixed(2)} CGPA</span>
                      </span>
                    </div>

                    {/* Bio */}
                    {mentor.bio && (
                      <p className="text-[11px] text-[#4F4449] line-clamp-2 italic leading-relaxed">
                        &ldquo;{mentor.bio}&rdquo;
                      </p>
                    )}

                    {/* Top Skills Pills */}
                    {Array.isArray(mentor.top_skills) && mentor.top_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mentor.top_skills.slice(0, 4).map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E3DC] text-[10px] font-bold text-[#1B1C1B]"
                          >
                            {sk}
                          </span>
                        ))}
                        {mentor.top_skills.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-mono text-gray-600">
                            +{mentor.top_skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Direct Contact Links */}
                  <div className="pt-2.5 border-t border-[#F1EFEA] flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {mentor.email && (
                        <a
                          href={`mailto:${mentor.email}?subject=CampusBridge%20Peer%20Mentorship%20Inquiry`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-[#6D3B56] hover:text-white border border-gray-200 text-[11px] font-semibold text-gray-700 transition-colors cursor-pointer"
                          title={`Email ${mentor.name}`}
                        >
                          <Mail className="h-3 w-3" />
                          <span>Email</span>
                        </a>
                      )}

                      {mentor.phone_number && (
                        <a
                          href={`tel:${mentor.phone_number}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-emerald-600 hover:text-white border border-gray-200 text-[11px] font-semibold text-gray-700 transition-colors cursor-pointer font-mono"
                          title={`Call or SMS ${mentor.name}`}
                        >
                          <Phone className="h-3 w-3" />
                          <span>{mentor.phone_number}</span>
                        </a>
                      )}

                      {tgClean && (
                        <a
                          href={`https://t.me/${tgClean}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-[11px] font-semibold text-blue-700 transition-colors cursor-pointer"
                          title={`Message on Telegram @${tgClean}`}
                        >
                          <Send className="h-3 w-3" />
                          <span>@{tgClean}</span>
                        </a>
                      )}

                      {mentor.github_url && (
                        <a
                          href={mentor.github_url.startsWith('http') ? mentor.github_url : `https://${mentor.github_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-50 hover:bg-gray-800 hover:text-white border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                          title="View GitHub Profile"
                        >
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      DPDP OK
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="bg-[#FAF8F5] border-t border-[#E6E3DC] px-4 py-2.5 text-[10px] text-[#817379] flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Zero Mock Data • Verified Institutional Records Only
        </span>
        <Link
          href="/student/settings"
          className="text-[#6D3B56] hover:underline font-bold"
        >
          Want to become a mentor? Opt in here →
        </Link>
      </div>
    </div>
  )
}
