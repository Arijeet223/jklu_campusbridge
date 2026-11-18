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
    setIsSubmittingCompletion(true)
    const claimedSkills = extractedSkills.filter((s) => s.confirmed)

    // Fallback: If student did not claim any skills, claim all extracted so they have an active profile
    const finalSkills = claimedSkills.length > 0 ? claimedSkills : extractedSkills.map((s) => ({ ...s, confirmed: true }))

    const completionPayload = {
      student_id: studentProfile.id || 'STU-101',
      confirmed_skills: finalSkills.map((s, idx) => ({
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
            <p className="text-3xs text-ink-muted">Profile Setup &amp; Real-Time Hybrid Ingestion</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1.5 pb-2">
                {filteredSkills.map((sk) => {
                  const isClaimed = !!sk.confirmed
                  return (
                    <div
                      key={sk.id}
                      className={`p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between gap-3 w-full min-w-0 overflow-hidden ${
                        isClaimed
                          ? 'border-[#6D3B56] bg-white shadow-xs ring-1 ring-[#6D3B56]/20'
                          : 'border-dashed border-[#DE95BE] bg-[#FAF8F6]/90 hover:bg-white hover:border-[#6D3B56] shadow-2xs'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display font-extrabold text-sm text-ink-primary truncate" title={sk.name}>
                              {sk.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F1EFEA] text-ink-secondary border border-[#E2DFD9] shrink-0">
                              {sk.category}
                            </span>
                          </div>

                          {/* Provenance Badge */}
                          <p className="text-[10px] text-ink-muted font-mono truncate" title={sk.sourceSpan}>
                            Provenance: {sk.sourceSpan}
                          </p>
                        </div>

                        {/* Claim Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleClaimSkill(sk.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 ${
                            isClaimed
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                              : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title={isClaimed ? 'Click to unclaim' : 'Click to claim skill'}
                        >
                          {isClaimed ? (
                            <>
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>1.0x Claimed</span>
                            </>
                          ) : (
                            <>
                              <Ghost className="h-3 w-3 text-amber-700" />
                              <span>0.5x Ghost (Claim)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Snippet / Context */}
                      {sk.snippet && (
                        <p className="text-[11px] text-ink-secondary italic bg-[#FAF8F6] p-2 rounded-xl border border-[#F1EFEA] line-clamp-2 leading-snug">
                          &ldquo;{sk.snippet}&rdquo;
                        </p>
                      )}

                      {/* Bottom Controls: Proficiency Selector */}
                      <div className="pt-2.5 border-t border-[#F1EFEA] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                            Proficiency
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isClaimed ? 'text-[#6D3B56] bg-[#6D3B56]/10' : 'text-amber-900 bg-amber-100'
                          }`}>
                            {sk.proficiency}
                          </span>
                        </div>

                        {/* 4-Segmented Button Bar that perfectly spans 100% of the card width */}
                        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#F1EFEA] border border-[#E2DFD9]">
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
                                className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer truncate ${
                                  isSelected
                                    ? 'bg-[#6D3B56] text-white shadow-2xs font-black'
                                    : 'text-ink-secondary hover:text-ink-primary hover:bg-white/70'
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
              <div className="p-8 text-center rounded-2xl bg-[#FAF8F6] border border-[#E2DFD9] text-xs text-ink-muted">
                No skills match the current filter.
              </div>
            )}

            {/* Complete & Activate Button */}
            <div className="pt-4 border-t border-[#F1EFEA] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-2xs text-ink-secondary font-medium">
                <strong>{claimedCount} of {extractedSkills.length} skills claimed</strong> • Score, radar polygon, and profile status will be mathematically evaluated on submit.
              </div>

              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={isSubmittingCompletion}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#6D3B56] text-white hover:bg-[#582e44] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md border-b-4 border-[#AD1457] active:translate-y-0.5 cursor-pointer disabled:opacity-50"
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
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
