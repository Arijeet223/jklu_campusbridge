'use client'

import React, { useState } from 'react'
import {
  FileText,
  ExternalLink,
  Printer,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  X,
  ShieldCheck,
  Code,
  Layers,
  GraduationCap,
} from 'lucide-react'
import { normalizeExternalUrl, getCandidateGithubUrl } from '@/lib/url-utils'

export interface ResumeProject {
  title: string
  repoUrl?: string
  techStack?: string[]
  bullets: string[]
}

export interface WordResumePreviewProps {
  candidateName?: string
  program?: string
  cgpa?: number
  email?: string
  phone?: string
  githubUrl?: string
  institution?: string
  skills?: string[]
  projects?: ResumeProject[]
  readinessScore?: number
  isModalOpen?: boolean
  onCloseModal?: () => void
  onExpandModal?: () => void
}

export default function WordResumePreview({
  candidateName = 'Aarav Sharma',
  program = 'B.Tech in Computer Science & Engineering',
  cgpa = 8.42,
  email = 'aarav.sharma@university.edu.in',
  phone = '+91 98765 43210',
  githubUrl,
  institution = 'National Institute of Technology, Surathkal',
  skills = [
    'Python',
    'SQL',
    'JavaScript',
    'TypeScript',
    'FastAPI',
    'PyTorch',
    'Docker',
    'PostgreSQL',
    'Redis',
    'RAG Systems',
    'Git & GitHub',
  ],
  projects,
  readinessScore = 94,
  isModalOpen = false,
  onCloseModal,
  onExpandModal,
}: WordResumePreviewProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false)
  const isExpanded = isModalOpen || internalModalOpen

  const resolvedGithubUrl = getCandidateGithubUrl(githubUrl, candidateName)

  const defaultProjects: ResumeProject[] = [
    {
      title: 'Veritas — AI Fact Verification Engine & Microservices',
      repoUrl: `${resolvedGithubUrl}/veritas-ai-engine`,
      techStack: ['Python', 'FastAPI', 'Redis Streams', 'PyTorch', 'Docker'],
      bullets: [
        'Architected an asynchronous order-matching & claim-verification microservice processing 12,000 requests/sec with Redis caching.',
        'Engineered grounded RAG verification pipeline reducing retrieval hallucinations to zero under strict deterministic guardrails.',
        'Containerized multi-service deployment with Docker Compose and automated GitHub Actions CI/CD workflows.',
      ],
    },
    {
      title: 'Distributed Consensus & Order-Matching Pipeline',
      repoUrl: `${resolvedGithubUrl}/distributed-order-service`,
      techStack: ['Go', 'PostgreSQL', 'Kafka', 'pgvector'],
      bullets: [
        'Implemented Raft consensus log replication for high-availability distributed state machines.',
        'Designed normalized Medallion schema in PostgreSQL with b-tree and trigram indexes for sub-10ms query execution.',
        'Authored comprehensive unit & integration test suites achieving 96% coverage across edge cases.',
      ],
    },
  ]

  const activeProjects = projects && projects.length > 0 ? projects : defaultProjects

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Word-style Sheet Document markup
  const renderSheetContent = (fullWidth: boolean = false) => (
    <div
      className={`bg-white border border-stone-200 shadow-md rounded-xl p-6 sm:p-8 text-slate-900 font-sans transition-all print:border-none print:shadow-none print:p-0 ${
        fullWidth ? 'max-w-4xl mx-auto' : 'w-full'
      }`}
    >
      {/* ── DOCUMENT HEADER ── */}
      <div className="border-b-2 border-slate-900 pb-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900 uppercase">
              {candidateName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1">
              {program} • {institution}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Verified Institutional Record • CGPA {cgpa.toFixed(2)} / 10.0
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span>{email}</span>
              <span>•</span>
              <span>{phone}</span>
            </div>
          </div>
        </div>

        {/* Clickable GitHub & Portfolio Links Row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <a
            href={resolvedGithubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs group cursor-pointer"
            title={`Open ${candidateName}'s GitHub profile in a new tab`}
          >
            <Code className="h-3.5 w-3.5 text-cyan-400 group-hover:rotate-6 transition-transform" />
            <span>{resolvedGithubUrl.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100" />
          </a>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 font-mono text-3xs font-semibold text-slate-700">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Readiness Index: {readinessScore}% (Deterministic Gates Passed)
          </span>
        </div>
      </div>

      {/* ── SECTION 1: PROFESSIONAL SUMMARY ── */}
      <div className="mb-5">
        <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-stone-300 pb-1 mb-2">
          Professional Summary
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          Results-oriented software and AI engineering student with verified project ownership in distributed backend architectures,
          machine learning systems, and grounded RAG pipelines. Demonstrated proficiency in Python, SQL, and FastAPI with a proven track record
          of deploying low-latency microservices and high-throughput databases. Cleared all institutional placement policy cutoffs.
        </p>
      </div>

      {/* ── SECTION 2: EDUCATION ── */}
      <div className="mb-5">
        <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-stone-300 pb-1 mb-2">
          Education
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs">
          <div>
            <strong className="font-semibold text-slate-900">{institution}</strong>
            <p className="text-slate-700">{program}</p>
          </div>
          <div className="sm:text-right mt-1 sm:mt-0 font-mono text-[11px] text-slate-700">
            <span className="font-bold text-slate-900">Cumulative GPA: {cgpa.toFixed(2)} / 10.0</span>
            <p className="text-slate-500">Cohort 2024 – 2028 • Active Backlogs: 0</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: VERIFIED TECHNICAL SKILLS ── */}
      <div className="mb-5">
        <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-stone-300 pb-1 mb-2">
          Verified Technical Skills
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-medium text-slate-800"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: PROJECTS & EVIDENCE ARTIFACTS ── */}
      <div className="mb-5">
        <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 border-b border-stone-300 pb-1 mb-3">
          Projects &amp; Evidence Artifacts
        </h2>

        <div className="space-y-4">
          {activeProjects.map((proj, pIdx) => (
            <div key={pIdx} className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 font-serif">
                  {proj.title}
                </span>

                {proj.repoUrl && (
                  <a
                    href={normalizeExternalUrl(proj.repoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
                    title="Open project repository on GitHub"
                  >
                    <span>View Repository</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {proj.techStack && proj.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {proj.techStack.map((tech, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <ul className="list-disc list-outside ml-4 text-xs text-slate-700 space-y-1">
                {proj.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="leading-relaxed">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: INSTITUTIONAL COMPLIANCE & DPDP VERIFICATION ── */}
      <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-slate-500 font-mono gap-1">
        <span>Verified by T.E.R.R.A. • DPDP Small-Cell Protected</span>
        <span>Certified CampusBridge AI Institutional Copy • Ref: {candidateName.toLowerCase().replace(/\s+/g, '-')}-v3</span>
      </div>
    </div>
  )

  return (
    <div className="w-full my-3">
      {/* ── WORD-STYLE TOOLBAR RIBBON ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-t-xl bg-slate-900 text-white shadow-sm border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
            W
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate flex items-center gap-1.5">
              <span>{candidateName.replace(/\s+/g, '_')}_Resume.docx</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Word Document Sheet
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Verified Institutional Copy • Grounded in Excel DB &amp; Vector Vault
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5">
          <a
            href={resolvedGithubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors shadow-2xs border border-slate-700"
            title="Open GitHub Profile in new tab"
          >
            <Code className="h-3 w-3" />
            <span className="hidden sm:inline">GitHub</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-2xs border border-slate-700 cursor-pointer"
            title="Print or export as PDF"
          >
            <Printer className="h-3 w-3" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onExpandModal) {
                onExpandModal()
              } else {
                setInternalModalOpen(true)
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-2xs cursor-pointer"
            title="Expand full-screen resume modal"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Expand Full Preview</span>
          </button>
        </div>
      </div>

      {/* ── EMBEDDED SHEET PREVIEW (CONTAINED) ── */}
      <div className="border border-t-0 border-stone-300 bg-stone-100 p-3 sm:p-5 rounded-b-xl overflow-hidden shadow-inner max-h-[520px] overflow-y-auto">
        {renderSheetContent(false)}
      </div>

      {/* ── FULL-SCREEN MODAL PREVIEW (WHEN EXPANDED) ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-stone-100 rounded-2xl shadow-2xl border border-stone-300 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-sm">
                  W
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {candidateName.replace(/\s+/g, '_')}_Resume.docx — Word Document Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Full-Page Institutional Inspection Sheet • Verified Evidence Linked
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={resolvedGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors border border-slate-700"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Open GitHub</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onCloseModal) {
                      onCloseModal()
                    } else {
                      setInternalModalOpen(false)
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-white transition-colors cursor-pointer ml-2"
                  title="Close preview modal (ESC)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {renderSheetContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

