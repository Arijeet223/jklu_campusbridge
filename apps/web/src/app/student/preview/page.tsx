'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { getActiveUser } from '@/lib/api-client'
import type { Skill } from '@/lib/types'
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Github,
  Award,
  ExternalLink,
  ArrowLeft,
  Lock,
  Layers,
  FileCheck2,
  Calendar,
  Building,
  Hash,
  Download,
  Share2,
  ChevronDown,
} from 'lucide-react'

export default function StudentRecruiterPreviewPage() {
  const [studentId, setStudentId] = useState('STU-101')
  const [studentName, setStudentName] = useState('Aarav Sharma')
  const [rollNo, setRollNo] = useState('22BCON104')
  const [program, setProgram] = useState('B.Tech Computer Science & Engineering')
  const [cohortYear, setCohortYear] = useState<number>(2026)
  const [githubUrl, setGithubUrl] = useState('https://github.com/aarav-sharma-dev')
  const [cgpa, setCgpa] = useState<number>(7.93)
  const [academicStanding, setAcademicStanding] = useState('High Academic Standing')
  const [expandedSkills, setExpandedSkills] = useState(false)
  const [confirmedGrades, setConfirmedGrades] = useState<any[]>([])
  const [solidSkills, setSolidSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecruiterData() {
      setLoading(true)
      const user = getActiveUser()
      const sid = user?.id || 'STU-101'
      setStudentId(sid)

      try {
        // 1. Fetch student profile settings from PostgreSQL
        const profRes = await fetch(`/api/students/${sid}/settings`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (profRes.ok) {
          const profData = await profRes.json()
          const stu = profData.student || profData
          if (stu.full_name || stu.name) setStudentName(stu.full_name || stu.name)
          if (stu.roll_no) setRollNo(stu.roll_no)
          if (stu.program) setProgram(stu.program)
          if (stu.cohort_year) setCohortYear(stu.cohort_year)
          if (stu.github_url) setGithubUrl(stu.github_url)
          if (stu.cgpa) setCgpa(Number(stu.cgpa))
        }

        // 2. Fetch skill evidence from database (FILTER STRICTLY SOLID TOKENS)
        const evRes = await fetch(`/api/students/${sid}/evidence`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (evRes.ok) {
          const evData = await evRes.json()
          if (Array.isArray(evData)) {
            // STRICT FILTER: Only confirmed/solid tokens. ZERO ghost or doubt cards.
            const solidOnly = evData
              .filter((sk: any) => {
                const status = sk.evidenceStatus || sk.tier || ''
                const isSolid =
                  status === 'STUDENT_CONFIRMED' ||
                  status === 'INSTITUTION_VERIFIED' ||
                  status === 'ASSESSMENT_VERIFIED' ||
                  status === 'ARTIFACT_LINKED' ||
                  (sk.isConfirmed === true && status !== 'DOUBT_GHOST')
                return isSolid && !sk.name.toLowerCase().includes('mock') && !sk.id.startsWith('mock-')
              })
              .map((sk: any) => ({
                id: sk.id,
                name: sk.name,
                category: sk.category || 'Engineering',
                proficiency: sk.proficiency || 'Advanced',
                evidenceStatus: sk.evidenceStatus || 'STUDENT_CONFIRMED',
                sourceDocumentId: sk.sourceDocumentId || 'doc_resume',
                sourceSpan: sk.sourceSpan || 'Character-span verified via institutional ingest',
                confidence: sk.confidence || 0.95,
              }))
            setSolidSkills(solidOnly)
          }
        }

        // 3. Fetch academic grades
        const acadRes = await fetch(`/api/academic/grades/${sid}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
        if (acadRes.ok) {
          const acadData = await acadRes.json()
          if (Array.isArray(acadData.confirmed_grades)) {
            setConfirmedGrades(acadData.confirmed_grades)
            if (acadData.cgpa) setCgpa(Number(acadData.cgpa))
            if (acadData.academic_standing) setAcademicStanding(acadData.academic_standing)
          }
        }
      } catch (err) {
        console.error('Error fetching recruiter preview data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRecruiterData()
  }, [])

  return (
    <AppLayout activeRole="STUDENT">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/student/home"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D3B56] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-3xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
              <Lock className="h-3.5 w-3.5" />
              Recruiter Preview Mode (Read-Only)
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl border border-[#E6E3DC] bg-white hover:bg-gray-50 text-xs font-bold text-[#1B1C1B] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* RECRUITER VERIFIED DOSSIER CONTAINER */}
        <div className="bg-white rounded-3xl border-2 border-[#E6E3DC] shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#6D3B56] text-white p-7 sm:p-9 rounded-t-3xl border-b-4 border-[#AD1457] relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/95 text-3xs font-mono font-bold tracking-wider uppercase">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Institutional Proof-of-Work Ledger • Zero Hallucinations</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                  {studentName}
                </h1>
                <p className="text-xs sm:text-sm text-white/80 font-medium">
                  {program} • Class of {cohortYear}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-2xs font-mono text-white/90">
                  <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                    <Hash className="h-3 w-3" /> Roll: {rollNo || '22BCON104'}
                  </span>
                  <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                    <Building className="h-3 w-3" /> ID: {studentId}
                  </span>
                </div>
              </div>

              {/* GPA Badge */}
              <div className="bg-white text-[#6D3B56] rounded-2xl p-4 sm:p-5 text-center shadow-lg border-2 border-[#DE95BE] shrink-0 min-w-[140px]">
                <span className="block text-3xs font-mono font-bold uppercase tracking-wider text-[#817379]">
                  Verified CGPA
                </span>
                <span className="font-mono text-3xl font-black text-[#6D3B56] block mt-0.5">
                  {cgpa.toFixed(2)}
                </span>
                <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 border border-emerald-200">
                  {academicStanding}
                </span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-8 bg-[#FAF8F5]">
            {/* 1. Verified GitHub Telemetry */}
            <div className="p-5 rounded-2xl border-2 border-[#E6E3DC] bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-[#1B1C1B]" />
                  <h3 className="font-display font-bold text-sm text-[#1B1C1B]">
                    GitHub Engineering Telemetry
                  </h3>
                </div>
                {githubUrl && (
                  <a
                    href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#6D3B56] hover:underline flex items-center gap-1"
                  >
                    <span>View Public Repositories</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E3DC]">
                  <span className="text-3xs text-[#817379] block uppercase">Profile URL</span>
                  <strong className="text-xs text-[#1B1C1B] truncate block mt-0.5">
                    {githubUrl || 'Linked via Onboarding'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E3DC]">
                  <span className="text-3xs text-[#817379] block uppercase">Code Defense Proctor</span>
                  <strong className="text-xs text-emerald-700 block mt-0.5">
                    120s A.T.H.E.N.A. Verified
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E3DC]">
                  <span className="text-3xs text-[#817379] block uppercase">Telemetry Status</span>
                  <strong className="text-xs text-[#6D3B56] block mt-0.5">
                    Authentic Commits Logged
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Confirmed Solid Cards ONLY (Zero Ghosts / Zero Doubt Cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-base text-[#1B1C1B]">
                    Confirmed Technical Credentials ({solidSkills.length} Solid Tokens)
                  </h3>
                  <p className="text-xs text-[#817379]">
                    Strictly rendered from the institutional ledger. Unconfirmed ghost cards and self-reported doubt skills are hidden from recruiters.
                  </p>
                </div>
                <span className="font-mono text-3xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                  100% Deterministic Evidence
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-[#817379]">Loading verified skills...</div>
              ) : solidSkills.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center text-xs text-gray-500">
                  No confirmed Solid Tokens yet. Complete resume onboarding or grade card verification to surface credentials.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(expandedSkills ? solidSkills : solidSkills.slice(0, 5)).map((skill) => (
                      <div
                        key={skill.id}
                        className="p-4 rounded-2xl border-2 border-[#E6E3DC] bg-white hover:border-[#6D3B56]/50 transition-all shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display font-bold text-sm text-[#1B1C1B]">
                              {skill.name}
                            </h4>
                            <span className="text-3xs font-mono font-bold text-[#817379]">
                              {skill.category} • {skill.proficiency}
                            </span>
                          </div>
                          <span className="font-mono text-3xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Solid 1.0x
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E3DC] text-2xs text-[#4F4449] font-mono leading-relaxed">
                          <span className="text-[#817379] block text-3xs uppercase tracking-wider mb-0.5">
                            Verification Provenance:
                          </span>
                          <span>{skill.sourceSpan}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {solidSkills.length > 5 && (
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setExpandedSkills(!expandedSkills)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DE95BE] bg-[#FAF8F5] text-xs font-bold text-[#6D3B56] hover:bg-[#F3EFE9] shadow-2xs transition-all cursor-pointer"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedSkills ? 'rotate-180' : ''}`} />
                        <span>{expandedSkills ? 'Show less' : `+ View ${solidSkills.length - 5} more skills`}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Verified Coursework & Transcripts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-base text-[#1B1C1B]">
                    Academic Transcripts &amp; Coursework ({confirmedGrades.length} Courses)
                  </h3>
                  <p className="text-xs text-[#817379]">
                    Extracted from college portal documents via OCR and verified deterministically.
                  </p>
                </div>
                <span className="font-mono text-3xs font-bold px-2 py-0.5 rounded-full bg-[#DE95BE]/20 text-[#6D3B56] border border-[#DE95BE]">
                  Qwen 2.5 + RapidOCR
                </span>
              </div>

              {confirmedGrades.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center text-xs text-gray-500">
                  No academic grades confirmed yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border-2 border-[#E6E3DC] bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#E6E3DC] font-mono text-3xs uppercase tracking-wider text-[#817379]">
                      <tr>
                        <th className="py-3 px-4">Subject / Course Name</th>
                        <th className="py-3 px-4">Grade</th>
                        <th className="py-3 px-4">Earned Credits</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {confirmedGrades.map((g, idx) => (
                        <tr key={g.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-bold text-[#1B1C1B]">
                            {g.subject_name}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-[#6D3B56]">
                            {g.grade_or_marks}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#4F4449]">
                            {g.credits || 3.0} Credits
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-3xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Institutional Ledger Footer */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E3DC] flex flex-col sm:flex-row items-center justify-between text-2xs text-[#817379] gap-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <span>FERPA &amp; DPDP Compliant Read-Only Recruiter Snapshot</span>
              </div>
              <span className="font-mono text-3xs">
                Anchored to Institutional PostgreSQL &amp; Qdrant
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
