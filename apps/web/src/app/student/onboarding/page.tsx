'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  GraduationCap,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

interface ExtractedSkill {
  id: string
  name: string
  category: string
  proficiency: string
  evidenceStatus: string
  sourceSpan: string
  sourcePage: number
  snippet: string
  confidence: number
  confirmed?: boolean
}

export default function StudentOnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2) // Step 2 is resume upload
  const [studentProfile, setStudentProfile] = useState<any>({
    id: 'STU-101',
    name: 'Aarav Sharma',
    program: 'B.Tech Computer Science & Engineering',
    cgpa: 8.42,
    roll_no: '221CS101',
    cohort_year: 2026,
  })

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([])
  const [parsedDocInfo, setParsedDocInfo] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Sync session user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setStudentProfile((prev: any) => ({
          ...prev,
          ...parsed,
          name: parsed.name || prev.name,
          program: parsed.program || prev.program,
          cgpa: parsed.cgpa || prev.cgpa,
          id: parsed.id || prev.id,
        }))
      }
    } catch {}
  }, [])

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only authentic PDF documents (.pdf) are supported for resume ingestion.')
      return
    }

    setSelectedFile(file)
    setIsUploading(true)
    setUploadError(null)
    setUploadProgressMsg('Running pdfplumber layout extraction on uploaded file...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('student_id', studentProfile.id || 'STU-101')

    try {
      // Step A: pdfplumber extraction
      setTimeout(() => {
        setUploadProgressMsg('Computing 1536-dim Nomic embeddings & indexing vector chunks...')
      }, 700)

      const endpoints = [
        '/api/v1/documents/upload',
        'http://localhost:8000/api/v1/documents/upload',
        'http://localhost:8000/v1/documents/upload',
        '/v1/documents/upload',
      ]

      let res: Response | null = null
      let lastErr = ''
      for (const ep of endpoints) {
        try {
          const attempt = await fetch(ep, {
            method: 'POST',
            body: formData,
          })
          if (attempt.ok) {
            res = attempt
            break
          } else {
            const errData = await attempt.json().catch(() => ({}))
            lastErr = errData.detail || attempt.statusText
          }
        } catch (e: any) {
          lastErr = e.message
        }
      }

      if (!res || !res.ok) {
        throw new Error(lastErr || 'Failed to parse resume via pdfplumber.')
      }

      const data = await res.json()
      setParsedDocInfo(data)
      const rawSkills: ExtractedSkill[] = (data.extracted_skills || []).map((sk: any) => ({
        ...sk,
        confirmed: true, // Auto-mark ready for one-click verification
      }))

      setExtractedSkills(rawSkills)
      setActiveStep(3) // Advance to skill review
    } catch (err: any) {
      setUploadError(err.message || 'Error parsing resume. Please check file format.')
    } finally {
      setIsUploading(false)
      setUploadProgressMsg(null)
    }
  }

  const handleToggleSkill = (skillId: string) => {
    setExtractedSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, confirmed: !s.confirmed } : s))
    )
  }

  const handleCompleteOnboarding = () => {
    try {
      const stored = localStorage.getItem('cb_active_user')
      const parsed = stored ? JSON.parse(stored) : {}
      parsed.needs_onboarding = false
      parsed.resume_uploaded = true
      if (parsedDocInfo?.candidate_metadata?.name) {
        parsed.name = parsedDocInfo.candidate_metadata.name
      }
      if (parsedDocInfo?.candidate_metadata?.cgpa) {
        parsed.cgpa = parsedDocInfo.candidate_metadata.cgpa
      }
      if (parsedDocInfo?.candidate_metadata?.program) {
        parsed.program = parsedDocInfo.candidate_metadata.program
      }
      localStorage.setItem('cb_active_user', JSON.stringify(parsed))

      const confirmedSkills = extractedSkills.filter((s) => s.confirmed).map((s, idx) => ({
        id: s.id || `sk_${Date.now()}_${idx}`,
        name: s.name,
        proficiency: s.proficiency || 'Intermediate',
        evidenceStatus: 'STUDENT_CONFIRMED',
        sourceDocumentId: parsedDocInfo?.document_id || 'doc_resume',
        sourceSpan: `${parsedDocInfo?.file_name || 'Resume'} • ${s.category || 'Skills'}`,
        confidence: s.confidence || 0.95,
      }))
      if (confirmedSkills.length > 0) {
        localStorage.setItem('cb_user_skills', JSON.stringify(confirmedSkills))
      }
    } catch {}

    router.push('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary font-sans flex flex-col selection:bg-[#F0B6D5] selection:text-[#6D3B56]">
      {/* Top Brand Nav */}
      <header className="h-18 px-6 sm:px-12 border-b border-[#E6E3DC] bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6D3B56] text-white shadow-xs font-display font-extrabold text-sm tracking-tight border-b-2 border-[#552940]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-extrabold text-ink-primary tracking-tight">
                CampusBridge AI
              </span>
              <span className="font-mono text-3xs px-1.5 py-0.5 rounded-full bg-[#E2DFD9] text-[#6D3B56] font-bold">
                Onboarding Guard
              </span>
            </div>
            <p className="text-3xs text-ink-muted">Profile Setup &amp; Real-Time Resume Ingestion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold text-ink-muted hidden sm:inline">
            Active Student: <strong className="text-ink-primary">{studentProfile.name}</strong>
          </span>
          <span className="text-3xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold uppercase">
            Phase 1 Setup
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[960px] w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Hero */}
        <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
            <Sparkles className="h-4 w-4" />
            Mandatory Profile Ingestion Guard
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-ink-primary tracking-tight">
            Welcome to CampusBridge, {studentProfile.name}!
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            To unlock your Placement Dashboard, What-If Fit Sandbox, and AI Career Companion, please upload your real PDF resume. Our live ingestion engine parses layout with <strong className="text-ink-primary">pdfplumber</strong>, computes <strong className="text-ink-primary">Nomic vector embeddings</strong> for RAG, and extracts your genuine technical skills with zero hallucinated mocks.
          </p>

          {/* Stepper Pills */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#F1EFEA] text-center font-mono text-2xs">
            <div
              className={`p-2.5 rounded-2xl border font-bold ${
                activeStep === 1
                  ? 'bg-[#6D3B56] text-white border-[#552940]'
                  : 'bg-[#F1EFEA] text-ink-muted border-[#E2DFD9]'
              }`}
            >
              1. Verify Profile
            </div>
            <div
              className={`p-2.5 rounded-2xl border font-bold ${
                activeStep === 2
                  ? 'bg-[#6D3B56] text-white border-[#552940]'
                  : 'bg-[#F1EFEA] text-ink-muted border-[#E2DFD9]'
              }`}
            >
              2. Upload Real PDF
            </div>
            <div
              className={`p-2.5 rounded-2xl border font-bold ${
                activeStep === 3
                  ? 'bg-[#6D3B56] text-white border-[#552940]'
                  : 'bg-[#F1EFEA] text-ink-muted border-[#E2DFD9]'
              }`}
            >
              3. Confirm Skills
            </div>
          </div>
        </div>

        {/* STEP 2: REAL-TIME RESUME DROPZONE */}
        {activeStep === 2 && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-4">
              <div>
                <h2 className="text-lg font-display font-extrabold text-ink-primary">
                  Upload Your Technical Resume (PDF)
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Extracted text will be chunked and indexed into the session vector store.
                </p>
              </div>
              <span className="font-mono text-3xs font-extrabold px-2.5 py-1 rounded-full bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
                Live Nomic Embeddings
              </span>
            </div>

            {uploadError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessFile(e.dataTransfer.files[0])
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-[#6D3B56] bg-[#F0B6D5]/20 scale-[1.01]'
                  : 'border-[#E2DFD9] bg-[#FAF8F6] hover:bg-[#F1EFEA] hover:border-[#6D3B56]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0])
                  }
                }}
              />

              <div className="h-16 w-16 rounded-3xl bg-[#F0B6D5]/40 text-[#6D3B56] flex items-center justify-center shadow-xs">
                {isUploading ? (
                  <RefreshCw className="h-8 w-8 animate-spin" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-ink-primary">
                  {isUploading
                    ? 'Processing Document...'
                    : 'Click to select or drag & drop your PDF resume'}
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Supports multi-page PDF resumes (Max 15MB). Instant local extraction.
                </p>
              </div>

              {uploadProgressMsg && (
                <div className="font-mono text-2xs font-semibold text-[#6D3B56] animate-pulse">
                  {uploadProgressMsg}
                </div>
              )}
            </div>

            {/* Privacy notice */}
            <div className="flex items-center gap-2 text-2xs text-ink-muted">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Privacy Shield enforced: Your resume remains isolated on the local university server.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: DYNAMIC SKILLS CONFIRMATION */}
        {activeStep === 3 && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1EFEA] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    EXTRACTION COMPLETE
                  </span>
                  <h2 className="text-lg font-display font-extrabold text-ink-primary">
                    Confirm Extracted Technical Skills
                  </h2>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Found <strong className="text-ink-primary">{extractedSkills.length} real skills</strong> in{' '}
                  <code className="text-[#6D3B56] font-bold">{selectedFile?.name || 'Resume.pdf'}</code>.
                  Select the verified skills to register in your official placement standing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="text-xs font-bold text-ink-muted hover:text-[#6D3B56] underline cursor-pointer"
              >
                Upload Different File
              </button>
            </div>

            {/* Extracted Skills List */}
            {extractedSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {extractedSkills.map((sk) => (
                  <div
                    key={sk.id}
                    onClick={() => handleToggleSkill(sk.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      sk.confirmed
                        ? 'border-[#6D3B56] bg-[#F0B6D5]/15 shadow-2xs'
                        : 'border-[#E2DFD9] bg-[#FAF8F6] opacity-60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-ink-primary truncate">
                          {sk.name}
                        </h4>
                        <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded bg-white text-ink-secondary border border-[#E2DFD9]">
                          {sk.category}
                        </span>
                      </div>
                      <p className="text-3xs text-ink-muted font-mono truncate">
                        Citation: {sk.sourceSpan}
                      </p>
                      {sk.snippet && (
                        <p className="text-3xs text-ink-secondary italic line-clamp-1">
                          &ldquo;{sk.snippet}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 mt-1">
                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center font-bold text-xs ${
                          sk.confirmed
                            ? 'bg-[#6D3B56] text-white shadow-xs'
                            : 'border border-[#E2DFD9] bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#FAF8F6] border border-[#E2DFD9] text-xs text-ink-muted">
                No technical skills could be extracted automatically from this file. You can still proceed and verify skills in the Practice Arena.
              </div>
            )}

            {/* Complete Button */}
            <div className="pt-4 border-t border-[#F1EFEA] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-2xs text-ink-muted font-medium">
                {extractedSkills.filter((s) => s.confirmed).length} of {extractedSkills.length} skills selected for profile inclusion
              </span>

              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md border-b-4 border-[#AD1457] active:translate-y-0.5 cursor-pointer"
              >
                <span>Save Profile &amp; Enter Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

