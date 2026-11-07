/**
 * Normalizes external URLs to guarantee they have an explicit "https://" protocol scheme.
 * Prevents Next.js / browser from treating "github.com/username" as a relative broken path like
 * "localhost:3001/student/github.com/username".
 */
export function normalizeExternalUrl(rawUrl?: string): string {
  if (!rawUrl) return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''

  // If already absolute protocol (http or https), return directly
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  // If starts with "//", prepend "https:"
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  // Prepend https://
  return `https://${trimmed}`
}

/**
 * Returns a valid clickable GitHub URL for a student or advisee.
 * If no custom link has been set yet, falls back to a clean candidate demo URL.
 */
export function getCandidateGithubUrl(githubUrl?: string, candidateName?: string): string {
  if (githubUrl && githubUrl.trim()) {
    return normalizeExternalUrl(githubUrl)
  }
  if (!candidateName) return 'https://github.com/aaravsharma-dev'
  const handle = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `https://github.com/${handle}`
}

