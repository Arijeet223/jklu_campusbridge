'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
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
  Ghost,
  Check,
  Zap,
} from 'lucide-react'
import GradeSheetUploader, { GhostGradeCard } from '@/components/GradeSheetUploader'

interface ExtractedSkill {
  id: string
  name: string
  category: string
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  evidenceStatus: string
  sourceSpan: string
  sourcePage?: number
  snippet?: string
  confidence?: number
  confirmed?: boolean
}

export default function StudentOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
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
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TECHNICAL' | 'SOFT' | 'CLAIMED'>('ALL')
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false)

  // Academic Grade Sheet State
  const [ingestionTab, setIngestionTab] = useState<'RESUME' | 'GRADES'>('RESUME')
  const [academicRecords, setAcademicRecords] = useState<GhostGradeCard[]>([])
  const [academicPerformance, setAcademicPerformance] = useState<any>(null)
  const [showGradeSheetInStep3, setShowGradeSheetInStep3] = useState(false)

  // Immutability Notice State
  const [setupImmutabilityNotice, setSetupImmutabilityNotice] = useState<string | null>(null)
  const noticeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerImmutabilityNotice = () => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    setSetupImmutabilityNotice(
      'After setting up, you can change your level with evidence in the profile section.'
    )
    noticeTimeoutRef.current = setTimeout(() => {
      setSetupImmutabilityNotice(null)
    }, 4500)
  }

  // Dynamic user name from NextAuth session with fallback
  const studentDisplayName =
    session?.user?.name || studentProfile.name || 'Student'
  const studentInitials =
    studentDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST'

  // Sync session user
  useEffect(() => {
    if (session?.user?.name) {
      setStudentProfile((prev: any) => ({
        ...prev,
        name: session.user.name,
        email: session.user.email || prev.email,
        id: (session.user as any)?.id || prev.id,
      }))
    }
    try {
      const stored = localStorage.getItem('cb_active_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setStudentProfile((prev: any) => ({
          ...prev,
          ...parsed,
          name: session?.user?.name || parsed.name || prev.name,
          program: parsed.program || prev.program,
          cgpa: parsed.cgpa || prev.cgpa,
          id: (session?.user as any)?.id || parsed.id || prev.id,
        }))
      }
    } catch {}
  }, [session])

  const handleProcessFile = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const isDocx = file.name.toLowerCase().endsWith('.docx')
    if (!isPdf && !isDocx) {
      setUploadError('Please upload an authentic PDF (.pdf) or Word document (.docx) for resume ingestion.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit. Please upload a smaller document.')
      return
    }

    setSelectedFile(file)
    setIsUploading(true)
    setUploadError(null)
    setUploadProgressMsg('Extracting high-fidelity text blocks in memory (PyMuPDF / pdfplumber)...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('student_id', studentProfile.id || 'STU-101')

    try {
      setTimeout(() => {
        setUploadProgressMsg('Running hybrid extraction: Qwen 2.5 + comprehensive skill dictionary...')
      }, 700)

      const backendBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      const endpoints = [
        '/api/v1/documents/upload',
        ...(backendBase ? [`${backendBase}/v1/documents/upload`, `${backendBase}/api/v1/documents/upload`] : []),
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
        throw new Error(lastErr || 'Failed to parse resume document.')
      }

      const data = await res.json()
      setParsedDocInfo(data)

      if (data.candidate_metadata) {
        setStudentProfile((prev: any) => ({
          ...prev,
          name: data.candidate_metadata.name || prev.name,
          email: data.candidate_metadata.email || prev.email,
          program: data.candidate_metadata.program || prev.program,
          cgpa: data.candidate_metadata.cgpa || prev.cgpa,
        }))
      }

      // Step 4: Render extracted skills as unconfirmed Ghost Cards (confirmed: false)
      const rawSkills: ExtractedSkill[] = (data.extracted_skills || []).map((sk: any, idx: number) => ({
        id: sk.id || `sk_ghost_${Date.now()}_${idx}`,
        name: sk.name,
        category: sk.category || 'Technical',
        proficiency: (sk.proficiency as any) || 'Intermediate',
        evidenceStatus: 'EXTRACTED',
        sourceSpan: sk.sourceSpan || `${file.name} • L${idx + 1}`,
        sourcePage: sk.sourcePage || 1,
        snippet: sk.snippet || sk.provenance_snippet || '',
        confidence: sk.confidence || 0.94,
        confirmed: false, // Unconfirmed Ghost Card by default
      }))

      // Persist uploaded document and resume version for immediate provenance inspection
      if (typeof window !== 'undefined') {
        try {
          const docRecordId = data.document_id || `doc_resume_${Date.now()}`
          const storedDocs = JSON.parse(localStorage.getItem('cb_uploaded_documents') || '{}')
          storedDocs[docRecordId] = {
            id: docRecordId,
            fileName: file.name,
            pageNumber: 1,
            uploadedAt: new Date().toISOString(),
            fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            fullText: data.raw_text || `Resume text for ${file.name}\n\nExtracted Skills:\n${rawSkills.map((s) => `• ${s.name} (${s.proficiency})`).join('\n')}`,
            highlightedText: rawSkills[0]?.name || 'SQL',
          }
          localStorage.setItem('cb_uploaded_documents', JSON.stringify(storedDocs))

          const existingVersions = JSON.parse(localStorage.getItem('cb_resume_versions') || '[]')
          const newVersion = {
            id: `rv_${Date.now()}`,
            versionNumber: existingVersions.length + 1,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            extractedSkillsCount: rawSkills.length,
            sourceDocumentId: docRecordId,
            isCurrent: true,
          }
          localStorage.setItem('cb_resume_versions', JSON.stringify([newVersion, ...existingVersions.map((v: any) => ({ ...v, isCurrent: false }))]))
        } catch {}
      }

      setExtractedSkills(rawSkills)
      setActiveStep(3) // Transition to Stage 3 Ghost Card review
    } catch (err: any) {
      setUploadError(err.message || 'Error parsing resume. Please check file format.')
    } finally {
      setIsUploading(false)
      setUploadProgressMsg(null)
    }
  }

  const handleGradeSheetComplete = (result: any) => {
    setAcademicRecords(result.confirmedGrades || [])
    setAcademicPerformance(result)
    setStudentProfile((prev: any) => ({
      ...prev,
      cgpa: result.gpa || prev.cgpa,
    }))
  }

  const handleToggleClaimSkill = (skillId: string) => {
    setExtractedSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, confirmed: !s.confirmed } : s))
    )
  }

  const handleChangeProficiency = (
    skillId: string,
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  ) => {
    setExtractedSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, proficiency } : s))
    )
  }

  const handleClaimAll = () => {
    setExtractedSkills((prev) => prev.map((s) => ({ ...s, confirmed: true })))
  }

  const handleUnclaimAll = () => {
    setExtractedSkills((prev) => prev.map((s) => ({ ...s, confirmed: false })))
  }

  const handleCompleteOnboarding = async () => {
    const claimedSkills = extractedSkills.filter((s) => s.confirmed)

    if (claimedSkills.length === 0) {
      setUploadError('Please review and claim at least one verified skill card before activating your profile.')
      return
    }

    if (academicRecords.length === 0) {
      setUploadError('Please upload and confirm your academic grade sheet before completing onboarding.')
      return
    }

    setIsSubmittingCompletion(true)
    setUploadError(null)

    const completionPayload = {
      student_id: studentProfile.id || 'STU-101',
      confirmed_skills: claimedSkills.map((s, idx) => ({
        id: s.id || `sk_${Date.now()}_${idx}`,
        name: s.name,
        category: s.category,
        proficiency: s.proficiency,
        evidenceStatus: 'STUDENT_CONFIRMED',
        sourceDocumentId: parsedDocInfo?.document_id || 'doc_resume',
        sourceSpan: s.sourceSpan || `${parsedDocInfo?.file_name || 'Resume'} • ${s.category}`,
        confidence: s.confidence || 0.95,
      })),
      candidate_metadata: parsedDocInfo?.candidate_metadata || {
        name: studentProfile.name,
        email: studentProfile.email,
        program: studentProfile.program,
        cgpa: studentProfile.cgpa,
      },
      academic_records: academicRecords,
      calculated_academic_score: academicPerformance?.gpa ? Number((academicPerformance.gpa * 10).toFixed(1)) : 84.2,
    }

    try {
      // 1. Submit final claimed list to /api/onboarding/complete
      const endpoints = [
        '/api/onboarding/complete',
        '/api/v1/onboarding/complete',
      ]

      let completionData: any = null
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completionPayload),
          })
          if (res.ok) {
            completionData = await res.json()
            break
          }
        } catch {}
      }

      // Update LocalStorage Session
      const stored = localStorage.getItem('cb_active_user')
      const parsed = stored ? JSON.parse(stored) : {}
      parsed.needs_onboarding = false
      parsed.resume_uploaded = true
      parsed.account_status = 'ACTIVE'

      if (completionData?.readiness_index !== undefined) {
        parsed.readiness_index = completionData.readiness_index
        parsed.radar_scores = completionData.radar_scores
        parsed.radar_polygon = completionData.radar_polygon
      } else if (completionData?.student?.readiness_index !== undefined) {
        parsed.name = completionData.student.name || parsed.name
        parsed.cgpa = completionData.student.cgpa || parsed.cgpa
        parsed.program = completionData.student.program || parsed.program
        parsed.readiness_index = completionData.student.readiness_index ?? 82
        parsed.radar_dimensions = completionData.radar_dimensions
      } else {
        if (parsedDocInfo?.candidate_metadata?.name) parsed.name = parsedDocInfo.candidate_metadata.name
        if (parsedDocInfo?.candidate_metadata?.cgpa) parsed.cgpa = parsedDocInfo.candidate_metadata.cgpa
        if (parsedDocInfo?.candidate_metadata?.program) parsed.program = parsedDocInfo.candidate_metadata.program
        parsed.readiness_index = 82
      }

      if (academicRecords.length > 0) {
        localStorage.setItem('cb_academic_records', JSON.stringify(academicRecords))
        parsed.cgpa = academicPerformance?.gpa || studentProfile.cgpa
        parsed.academic_score = academicPerformance?.gpa ? Number((academicPerformance.gpa * 10).toFixed(1)) : 84.2
        parsed.academic_standing = academicPerformance?.academicStanding || 'EXCELLENT'
      }

      localStorage.setItem('cb_active_user', JSON.stringify(parsed))
      localStorage.setItem('cb_user_skills', JSON.stringify(completionPayload.confirmed_skills))

      // Trigger custom events so dashboards refresh instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cb_skills_updated', { detail: completionPayload.confirmed_skills }))
        if (academicRecords.length > 0) {
          window.dispatchEvent(
            new CustomEvent('cb_academics_updated', {
              detail: {
                cgpa: parsed.cgpa,
                academicScore: parsed.academic_score,
                records: academicRecords,
              },
            })
          )
        }
      }

      router.push('/student/dashboard')
    } catch {
      // Offline fallback
      router.push('/student/dashboard')
    } finally {
      setIsSubmittingCompletion(false)
    }
  }

  // Filtered skills list
  const filteredSkills = extractedSkills.filter((sk) => {
    if (categoryFilter === 'CLAIMED') return sk.confirmed
    if (categoryFilter === 'SOFT') return sk.category.toLowerCase().includes('soft')
    if (categoryFilter === 'TECHNICAL') return !sk.category.toLowerCase().includes('soft')
    return true
  })

  const claimedCount = extractedSkills.filter((s) => s.confirmed).length
  const softCount = extractedSkills.filter((s) => s.category.toLowerCase().includes('soft')).length
  const techCount = extractedSkills.length - softCount

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-ink-primary font-sans flex flex-col selection:bg-[#F0B6D5] selection:text-[#6D3B56]">
      {/* Sleek, Minimalist Integrated Header */}
      <header className="h-14 px-4 sm:px-8 border-b border-[#E6E3DC] bg-white/95 backdrop-blur-xs flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Link href="/student/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#6D3B56] text-white shadow-2xs">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-extrabold text-ink-primary tracking-tight group-hover:text-[#6D3B56] transition-colors">
              CampusBridge
            </span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">Student Onboarding</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-3 border-l border-[#E6E3DC]">
            <div className="h-7 w-7 rounded-full bg-[#6D3B56]/10 text-[#6D3B56] font-bold text-xs flex items-center justify-center border border-[#6D3B56]/20">
              {studentInitials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-ink-primary leading-tight">
                {studentDisplayName}
              </span>
              <span className="text-[10px] text-ink-muted leading-tight">
                {studentProfile.program || 'Student'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Setup Phase
            </span>
          </div>
        </div>
      </header>

      {/* Floating Immutability Notice Toast */}
      {setupImmutabilityNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-w-md w-full px-4">
          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-700 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-medium">{setupImmutabilityNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSetupImmutabilityNotice(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-[960px] w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Hero */}
        <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F0B6D5]/40 text-[#6D3B56] border border-[#F0B6D5]">
            <Sparkles className="h-4 w-4" />
            Mandatory Profile Ingestion Guard
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-ink-primary tracking-tight">
            Welcome to CampusBridge, {studentDisplayName}!
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            To unlock your Placement Dashboard, What-If Fit Sandbox, and AI Career Companion, please upload your real PDF or DOCX resume. Our hybrid pipeline combines <strong className="text-ink-primary">PyMuPDF / python-docx</strong> in-memory parsing, <strong className="text-ink-primary">Qwen 2.5 LLM extraction</strong>, and a <strong className="text-ink-primary">comprehensive hardcoded skill taxonomy</strong> to extract both technical and soft competencies.
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
              2. Ingest Documents ({selectedFile ? 'Resume ✓' : 'Resume'}{academicRecords.length > 0 ? ` • GPA ${studentProfile.cgpa} ✓` : ''})
            </div>
            <div
              className={`p-2.5 rounded-2xl border font-bold ${
                activeStep === 3
                  ? 'bg-[#6D3B56] text-white border-[#552940]'
                  : 'bg-[#F1EFEA] text-ink-muted border-[#E2DFD9]'
              }`}
            >
              3. Claim Ghost Cards ({claimedCount}/{extractedSkills.length})
            </div>
          </div>
        </div>

        {/* STEP 2: REAL-TIME RESUME & GRADE SHEET INGESTION */}
        {activeStep === 2 && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Tab Bar: Resume vs Grade Sheet */}
            <div className="flex items-center gap-3 border-b border-[#F1EFEA] pb-4 flex-wrap">
              <button
                type="button"
                onClick={() => setIngestionTab('RESUME')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  ingestionTab === 'RESUME'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'bg-[#FAF8F6] text-ink-secondary hover:bg-[#F1EFEA]'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>1. Technical Resume (PDF / DOCX)</span>
                {extractedSkills.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    ✓ {extractedSkills.length} Skills
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIngestionTab('GRADES')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  ingestionTab === 'GRADES'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'bg-[#FAF8F6] text-ink-secondary hover:bg-[#F1EFEA]'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>2. Academic Grade Sheet (PDF / Screenshot)</span>
                {academicRecords.length > 0 ? (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    ✓ GPA {studentProfile.cgpa}
                  </span>
                ) : (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-[#DE95BE]/20 text-[#6D3B56] text-[10px] font-mono font-bold">
                    Deterministic Scoring
                  </span>
                )}
              </button>
            </div>

            {ingestionTab === 'RESUME' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-4">
                  <div>
                    <h2 className="text-lg font-display font-extrabold text-ink-primary">
                      Upload Your Technical Resume (PDF or DOCX)
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Parsed in-memory with zero local disk reliance. Serverless-ready for Vercel deployment.
                    </p>
                  </div>
                  <span className="font-mono text-3xs font-extrabold px-2.5 py-1 rounded-full bg-[#B6DEC9]/40 text-[#255C45] border border-[#B6DEC9]">
                    Hybrid Qwen + Dictionary
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
                    accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                        ? 'Processing Document In-Memory...'
                        : 'Click to select or drag & drop your resume'}
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Supports PDF (.pdf) and Word (.docx) resumes (Max 10MB). High-fidelity extraction &amp; vector indexing.
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
                    Zero-Leak Guarantee: Resume parsed entirely in RAM. No temporary files written to disk.
                  </span>
                </div>
              </div>
            ) : (
              <GradeSheetUploader
                studentId={studentProfile.id}
                onComplete={handleGradeSheetComplete}
                isSetupStage={true}
              />
            )}

            {extractedSkills.length > 0 && (
              <div className="pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Resume processed ({extractedSkills.length} skills). {academicRecords.length > 0 ? `Grade sheet confirmed (GPA: ${studentProfile.cgpa}).` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Continue to Review Ghost Cards</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: STAGE 3 GHOST CARDS CONFIRMATION & ACTIVATION */}
        {activeStep === 3 && (
          <div className="rounded-3xl border-2 border-[#E6E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Academic records status in Step 3 */}
            {academicRecords.length > 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold flex items-center gap-2">
                      <span>Verified Academic Standing: GPA {studentProfile.cgpa} / 10.0</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-mono font-bold">
                        {academicPerformance?.academicStanding || 'EXCELLENT'}
                      </span>
                    </div>
                    <div className="text-2xs text-emerald-700 mt-0.5">
                      {academicRecords.length} courses certified via Qwen 2.5 &amp; deterministic Python scoring shell.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGradeSheetInStep3(!showGradeSheetInStep3)}
                  className="self-start sm:self-auto text-2xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 transition-colors cursor-pointer"
                >
                  {showGradeSheetInStep3 ? 'Hide Grade Sheet' : 'Update Grades'}
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300/80 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="h-4 w-4 text-amber-700 shrink-0" />
                  <div className="text-2xs">
                    <strong>Certify your CGPA:</strong> Upload an official grade sheet PDF or portal screenshot to unlock priority campus placements.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGradeSheetInStep3(!showGradeSheetInStep3)}
                  className="self-start sm:self-auto text-2xs font-bold px-3 py-1 rounded-xl bg-amber-200/80 text-amber-900 border border-amber-300 hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
                >
                  {showGradeSheetInStep3 ? 'Close' : 'Upload Grade Sheet'}
                </button>
              </div>
            )}

            {/* Expandable Grade Sheet Uploader in Step 3 */}
            {showGradeSheetInStep3 && (
              <div className="p-4 rounded-2xl border-2 border-[#E6E3DC] bg-[#FAF8F6]">
                <GradeSheetUploader
                  studentId={studentProfile.id}
                  onComplete={(res) => {
                    handleGradeSheetComplete(res)
                    setShowGradeSheetInStep3(false)
                  }}
                  isSetupStage={true}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1EFEA] pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0">
                    <Ghost className="h-3 w-3" />
                    STAGE 3 • UNCONFIRMED GHOST CARDS
                  </span>
                  <h2 className="text-lg font-display font-extrabold text-ink-primary">
                    Review &amp; Claim Extracted Skills
                  </h2>
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  Found <strong className="text-ink-primary">{extractedSkills.length} skills</strong> (Technical &amp; Soft) in{' '}
                  <code className="text-[#6D3B56] font-bold">{selectedFile?.name || 'Resume'}</code>.
                  Click Ghost Cards to claim them (converts 0.5x Ghost to 1.0x Solid) and select your proficiency level.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClaimAll}
                  className="px-3 py-1.5 rounded-xl border border-[#E2DFD9] bg-[#FAF8F6] hover:bg-white text-xs font-bold text-[#6D3B56] transition-all cursor-pointer shadow-2xs"
                >
                  Claim All ({extractedSkills.length})
                </button>
                <button
                  type="button"
                  onClick={handleUnclaimAll}
                  className="px-3 py-1.5 rounded-xl border border-[#E2DFD9] bg-[#FAF8F6] hover:bg-white text-xs font-bold text-ink-muted transition-all cursor-pointer shadow-2xs"
                >
                  Unclaim All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="text-xs font-bold text-ink-muted hover:text-[#6D3B56] underline cursor-pointer ml-1"
                >
                  Re-upload
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold border-b border-[#F1EFEA] pb-3">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'bg-[#FAF8F6] text-ink-secondary hover:bg-[#F1EFEA]'
                }`}
              >
                All Skills ({extractedSkills.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('TECHNICAL')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  categoryFilter === 'TECHNICAL'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'bg-[#FAF8F6] text-ink-secondary hover:bg-[#F1EFEA]'
                }`}
              >
                Technical ({techCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('SOFT')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  categoryFilter === 'SOFT'
                    ? 'bg-[#6D3B56] text-white shadow-xs'
                    : 'bg-[#FAF8F6] text-ink-secondary hover:bg-[#F1EFEA]'
                }`}
              >
                Soft Skills ({softCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('CLAIMED')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  categoryFilter === 'CLAIMED'
                    ? 'bg-[#255C45] text-white shadow-xs'
                    : 'bg-[#FAF8F6] text-ink-secondary hover:bg-[#F1EFEA]'
                }`}
              >
                Claimed ({claimedCount})
              </button>
            </div>

            {/* Stage 3 Ghost Cards Grid */}
            {filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 pb-2">
                {filteredSkills.map((sk) => {
                  const isClaimed = !!sk.confirmed
                  return (
                    <div
                      key={sk.id}
                      className={`p-3 rounded-xl border border-solid transition-all relative flex flex-col justify-between gap-2.5 w-full min-w-0 ${
                        isClaimed
                          ? 'border-[#6D3B56] bg-white shadow-xs ring-1 ring-[#6D3B56]/15'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                              onClick={triggerImmutabilityNotice}
                              className="font-display font-bold text-xs text-gray-900 truncate cursor-default hover:text-[#6D3B56]"
                              title={sk.name}
                            >
                              {sk.name}
                            </h4>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {sk.category}
                            </span>
                          </div>

                          {/* Provenance Badge */}
                          <p className="text-[10px] text-gray-400 font-mono truncate" title={sk.sourceSpan}>
                            Provenance: {sk.sourceSpan}
                          </p>
                        </div>

                        {/* Claim Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleClaimSkill(sk.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 border ${
                            isClaimed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80'
                          }`}
                          title={isClaimed ? 'Click to unclaim' : 'Click to claim skill'}
                        >
                          {isClaimed ? (
                            <>
                              <Check className="h-3 w-3 stroke-[2.5] text-emerald-600" />
                              <span>1.0x Claimed</span>
                            </>
                          ) : (
                            <>
                              <Ghost className="h-3 w-3 text-slate-400" />
                              <span>0.5x Ghost (Claim)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Snippet / Context */}
                      {sk.snippet && (
                        <p className="text-[10px] text-gray-500 italic bg-gray-50/80 p-1.5 rounded-lg border border-gray-100 line-clamp-2 leading-relaxed">
                          &ldquo;{sk.snippet}&rdquo;
                        </p>
                      )}

                      {/* Bottom Controls: Proficiency Selector */}
                      <div className="pt-2 border-t border-gray-100 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400 font-medium uppercase tracking-wider text-[9px]">
                            Proficiency
                          </span>
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                              isClaimed ? 'text-[#6D3B56] bg-[#6D3B56]/10' : 'text-slate-600 bg-slate-100'
                            }`}
                          >
                            {sk.proficiency}
                          </span>
                        </div>

                        {/* 4-Segmented Button Bar that never wraps or collides */}
                        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-gray-100/80 border border-gray-200/70">
                          {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const).map((level) => {
                            const isSelected = sk.proficiency === level
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleChangeProficiency(sk.id, level)
                                  if (!isClaimed) handleToggleClaimSkill(sk.id)
                                }}
                                className={`py-0.5 px-1 rounded text-[10px] font-semibold text-center transition-all cursor-pointer truncate ${
                                  isSelected
                                    ? 'bg-[#6D3B56] text-white shadow-2xs font-bold'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                                }`}
                                title={`Set proficiency to ${level}`}
                              >
                                {level}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#FAF8F6] border border-[#E2DFD9] text-xs text-gray-500">
                {categoryFilter === 'SOFT'
                  ? 'No soft skills detected in this document. Please complete or provide info.'
                  : categoryFilter === 'TECHNICAL'
                  ? 'No technical skills detected in this document. Please complete or provide info.'
                  : categoryFilter === 'CLAIMED'
                  ? 'No skills claimed yet. Click Ghost Cards above to claim them.'
                  : 'No skills found. Please complete or provide info.'}
              </div>
            )}

            {/* Complete & Activate Button */}
            <div className="pt-4 border-t border-[#F1EFEA] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-2xs text-ink-secondary font-medium">
                <strong>{claimedCount} of {extractedSkills.length} skills claimed</strong>
                {academicRecords.length > 0 ? (
                  <span className="text-emerald-700 font-semibold ml-1">
                    • Grade sheet verified (GPA: {studentProfile.cgpa})
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold ml-1">
                    • Grade sheet pending upload
                  </span>
                )}
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Campus Readiness Score &amp; Radar Graph calculate strictly after both submissions are confirmed.
                </div>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={isSubmittingCompletion || claimedCount === 0 || academicRecords.length === 0}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:translate-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    claimedCount > 0 && academicRecords.length > 0
                      ? 'bg-[#6D3B56] text-white hover:bg-[#582e44] border-b-4 border-[#AD1457]'
                      : 'bg-gray-300 text-gray-500 border-b-4 border-gray-400'
                  }`}
                >
                  {isSubmittingCompletion ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Calculating Radar Scores &amp; Activating...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Claimed Skills &amp; Activate Profile</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                {!(claimedCount > 0 && academicRecords.length > 0) && (
                  <span className="text-[10px] text-amber-700 font-medium text-center sm:text-right">
                    {claimedCount === 0 && academicRecords.length === 0
                      ? 'Claim at least 1 skill and confirm your grade sheet to activate.'
                      : claimedCount === 0
                      ? 'Please claim at least 1 verified skill card above.'
                      : 'Please upload and confirm your academic grade sheet above.'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
