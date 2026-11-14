/**
 * CampusBridge AI — Centralized Production API Client
 *
 * Enforces NEXT_PUBLIC_API_BASE_URL (defaulting to http://localhost:8000),
 * provides unified error extraction for Pydantic 422 validation errors & 500s,
 * and passes the active candidate session headers across all student/mentor queries.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  data?: any
  validationErrors?: Array<{ loc: string[]; msg: string; type: string }>

  constructor(
    message: string,
    status: number,
    data?: any,
    validationErrors?: Array<{ loc: string[]; msg: string; type: string }>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.validationErrors = validationErrors
  }
}

/**
 * Format Pydantic 422 error details into human-readable message.
 */
export function formatValidationDetail(detail: any): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        const field = err.loc ? err.loc.join('.') : 'field'
        return `${field}: ${err.msg}`
      })
      .join('; ')
  }
  return 'Validation failed'
}

/**
 * Retrieve active authenticated student/faculty session from localStorage.
 */
export function getActiveUser(): {
  id?: string
  name?: string
  email?: string
  roll_no?: string
  program?: string
  cgpa?: number
  role?: string
  needs_onboarding?: boolean
  readiness_index?: number
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('cb_active_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Core resilient fetch wrapper with proxy fallbacks and 422/500 parsing.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // Build endpoint candidate list (prefer direct v1 or Next.js proxy)
  const candidateUrls: string[] = []

  if (typeof window !== 'undefined') {
    // Relative routes first for browser (leveraging Next.js rewrites)
    candidateUrls.push(`/api/v1/${cleanPath}`)
    candidateUrls.push(`/v1/${cleanPath}`)
  }

  // Absolute backend URLs
  candidateUrls.push(`${API_BASE_URL}/v1/${cleanPath}`)
  candidateUrls.push(`${API_BASE_URL}/api/v1/${cleanPath}`)
  candidateUrls.push(`${API_BASE_URL}/${cleanPath}`)

  let lastError: Error | null = null
  let token: string | null = null

  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('cb_auth_token')
    } catch {}
  }

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // If body is an object and not FormData, stringify it
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData
  if (!isFormData && options.body && typeof options.body === 'object') {
    defaultHeaders['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  } else if (!isFormData && !options.body && options.method && options.method !== 'GET') {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...((options.headers as Record<string, string>) || {}),
  }

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: mergedHeaders,
      })

      if (response.ok) {
        return (await response.json()) as T
      }

      // Handle specific HTTP error codes
      let errorData: any = null
      try {
        errorData = await response.json()
      } catch {
        errorData = { detail: response.statusText }
      }

      if (response.status === 422) {
        const detailMsg = formatValidationDetail(errorData.detail)
        throw new ApiError(
          `Validation Error (422): ${detailMsg}`,
          422,
          errorData,
          Array.isArray(errorData.detail) ? errorData.detail : undefined
        )
      }

      if (response.status === 500) {
        const msg = errorData.detail || 'Internal server error on AI backend'
        lastError = new ApiError(`Server Error (500): ${msg}`, 500, errorData)
        continue
      }

      if (response.status === 404) {
        lastError = new ApiError(
          errorData.detail || `Endpoint not found: ${url}`,
          404,
          errorData
        )
        continue // Try next candidate URL
      }

      throw new ApiError(
        errorData.detail || `Request failed with status ${response.status}`,
        response.status,
        errorData
      )
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 422) {
        throw err // Do not retry fatal 422 validation errors
      }
      lastError = err
    }
  }

  throw lastError || new Error(`Failed to communicate with API service at ${endpoint}`)
}

// ── Specialized Domain Queries ──────────────────────────────────────────────

export async function fetchLiveStudentProfile(studentId: string) {
  return apiFetch<{
    status: string
    student: any
    evidence_count: number
    needs_onboarding: boolean
    readiness_index: number
  }>(`students/${studentId}/profile`)
}

export async function fetchLiveStudentEvidence(studentId: string) {
  return apiFetch<any[]>(`students/${studentId}/evidence`)
}

export async function confirmStudentEvidence(
  studentId: string,
  evidenceId: string
) {
  return apiFetch<{ status: string; evidence_id: string }>(
    `students/${studentId}/evidence/${evidenceId}/confirm`,
    { method: 'POST' }
  )
}

export async function fetchLiveJobMatches(studentId: string) {
  return apiFetch<any[]>(`matching/live-jobs?student_id=${encodeURIComponent(studentId)}`)
}

export async function checkStudentOnboarding(studentId: string) {
  return apiFetch<{
    student_id: string
    needs_onboarding: boolean
    evidence_count: number
    chunks_indexed: number
    can_access_dashboard: boolean
  }>(`auth/check-onboarding/${encodeURIComponent(studentId)}`)
}

export async function runRonenGate(studentId: string, jobId?: string) {
  return apiFetch<any>(`gates/ronen/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, job_id: jobId }),
  })
}

export async function runAthenaGate(
  studentId: string,
  problemId: string,
  code: string,
  problemType = 'dsa'
) {
  return apiFetch<any>(`gates/athena/evaluate`, {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      problem_id: problemId,
      code,
      problem_type: problemType,
    }),
  })
}

export async function runGapAnalysis(studentId: string, jobId?: string) {
  return apiFetch<any>(`agents/gap-analysis`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, job_id: jobId }),
  })
}

export async function runTrajectoryPlan(
  studentId: string,
  jobId?: string,
  timelineMode: '72h_sprint' | 'semester_marathon' = '72h_sprint'
) {
  return apiFetch<any>(`agents/trajectory-plan`, {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      job_id: jobId,
      timeline_mode: timelineMode,
    }),
  })
}
