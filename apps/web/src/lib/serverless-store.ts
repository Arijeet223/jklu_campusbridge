/**
 * CampusBridge AI — Serverless In-Memory Data & Notification Store for Vercel.
 * Provides resilient job listings, in-app notifications, and Telegram bot dispatch
 * when running serverless without a direct local backend connection.
 */

export interface ServerlessJob {
  job_id: string
  company: string
  company_name: string
  title: string
  role_title: string
  ctc_band: string
  ctc_lpa?: number
  deadline_hours: number
  min_cgpa: number
  max_backlogs: number
  allowed_branches: string[]
  mandatory_skills: string[]
  preferred_skills: string[]
  status: string
  announcement_text?: string
  external_link?: string
  created_at: string
}

export interface ServerlessNotification {
  id: string
  user_id: string
  title: string
  message: string
  tag: string
  link: string
  is_read: boolean
  created_at: string
}

// Global serverless cache (persists across warm lambda invocations)
const g = global as any

if (!g.__cb_jobs) {
  g.__cb_jobs = [
    {
      job_id: 'JOB-2026-01',
      company: 'RazorpayX Labs',
      company_name: 'RazorpayX Labs',
      title: 'SDE-1 (Backend & Distributed Systems)',
      role_title: 'SDE-1 (Backend & Distributed Systems)',
      ctc_band: '24 LPA',
      ctc_lpa: 24,
      deadline_hours: 48,
      min_cgpa: 7.5,
      max_backlogs: 0,
      allowed_branches: ['CSE', 'IT', 'ECE'],
      mandatory_skills: ['Python', 'FastAPI', 'SQL', 'PostgreSQL'],
      preferred_skills: ['Redis', 'Docker', 'Distributed Transactions'],
      status: 'Active',
      announcement_text: 'Online code assessment and 120s architecture defense closing in 48 hours.',
      external_link: 'https://razorpay.com/jobs/sde1-2026',
      created_at: new Date().toISOString(),
    },
    {
      job_id: 'JOB-2026-02',
      company: 'Atlassian Systems',
      company_name: 'Atlassian Systems',
      title: 'Cloud Core Infrastructure Engineer',
      role_title: 'Cloud Core Infrastructure Engineer',
      ctc_band: '32 LPA',
      ctc_lpa: 32,
      deadline_hours: 72,
      min_cgpa: 8.0,
      max_backlogs: 0,
      allowed_branches: ['CSE', 'IT'],
      mandatory_skills: ['Java', 'Distributed Systems', 'SQL', 'Concurrency'],
      preferred_skills: ['Kafka', 'Docker', 'Kubernetes'],
      status: 'Active',
      announcement_text: 'Jira Cloud Core Distributed Log defense window active for verified 1.0x solid proofs.',
      external_link: 'https://atlassian.com/careers/cloud-infra',
      created_at: new Date().toISOString(),
    },
    {
      job_id: 'JOB-2026-03',
      company: 'TechCorp India',
      company_name: 'TechCorp India',
      title: 'Backend Platform Engineer',
      role_title: 'Backend Platform Engineer',
      ctc_band: '18 LPA',
      ctc_lpa: 18,
      deadline_hours: 36,
      min_cgpa: 7.0,
      max_backlogs: 1,
      allowed_branches: ['CSE', 'IT', 'ECE', 'EE'],
      mandatory_skills: ['Python', 'SQL', 'FastAPI', 'Docker'],
      preferred_skills: ['Redis', 'System Design'],
      status: 'Active',
      announcement_text: 'Priority drive for 2026 batch. High weight on relational database indexing.',
      external_link: 'https://techcorp.in/careers',
      created_at: new Date().toISOString(),
    },
  ]
}

if (!g.__cb_notifications) {
  g.__cb_notifications = [
    {
      id: 'notif-init-01',
      user_id: 'STU-101',
      title: 'New Placement Drive: RazorpayX Labs',
      message: 'RazorpayX Labs has opened SDE-1 (Backend) applications for 2026 graduates (CTC: 24 LPA). Check eligibility!',
      tag: 'Placement Drive',
      link: '/student/matches',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'notif-init-02',
      user_id: 'STU-101',
      title: 'Faculty Announcement: Atlassian Systems',
      message: 'Placement Office has verified 82 candidates eligible for the Atlassian Systems Distributed Log screening.',
      tag: 'Faculty Notice',
      link: '/student/matches',
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ]
}

export function getServerlessJobs(): ServerlessJob[] {
  return (g.__cb_jobs as ServerlessJob[]) || []
}

export function addServerlessJob(job: Partial<ServerlessJob>): ServerlessJob {
  const newJob: ServerlessJob = {
    job_id: job.job_id || `jd-${Date.now().toString(36)}`,
    company: job.company || job.company_name || 'Campus Partner',
    company_name: job.company_name || job.company || 'Campus Partner',
    title: job.title || job.role_title || 'Software Engineer',
    role_title: job.role_title || job.title || 'Software Engineer',
    ctc_band: job.ctc_band || (job.ctc_lpa ? `${job.ctc_lpa} LPA` : '20 LPA'),
    ctc_lpa: job.ctc_lpa || 20,
    deadline_hours: job.deadline_hours || 48,
    min_cgpa: job.min_cgpa ?? 7.0,
    max_backlogs: job.max_backlogs ?? 0,
    allowed_branches: job.allowed_branches || ['CSE', 'IT', 'ECE'],
    mandatory_skills: job.mandatory_skills || ['Python', 'SQL'],
    preferred_skills: job.preferred_skills || ['Docker', 'FastAPI'],
    status: job.status || 'Active',
    announcement_text: job.announcement_text || 'Official Campus Recruitment Drive has been published by Faculty.',
    external_link: job.external_link || 'https://jklu.edu.in/placements',
    created_at: new Date().toISOString(),
  }

  const existing = (g.__cb_jobs as ServerlessJob[]) || []
  const idx = existing.findIndex((j) => j.job_id === newJob.job_id)
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...newJob }
  } else {
    existing.unshift(newJob)
  }
  g.__cb_jobs = existing

  // Broadcast in-app notification to students
  const notif: ServerlessNotification = {
    id: `notif-${Date.now().toString(36)}`,
    user_id: 'STU-101',
    title: `New Placement Drive: ${newJob.company_name}`,
    message: `${newJob.company_name} is hiring for ${newJob.role_title} (${newJob.ctc_band}). Min CGPA: ${newJob.min_cgpa}. Review your skill match now!`,
    tag: 'Placement Drive',
    link: '/student/matches',
    is_read: false,
    created_at: new Date().toISOString(),
  }
  const notifs = (g.__cb_notifications as ServerlessNotification[]) || []
  notifs.unshift(notif)
  g.__cb_notifications = notifs

  // Attempt live Telegram alert dispatch
  dispatchTelegramAlert(
    `🔔 *CampusBridge AI — New Placement Drive Alert*\n\n` +
    `🏢 *Company:* ${newJob.company_name}\n` +
    `💼 *Role:* ${newJob.role_title}\n` +
    `💰 *Package:* ${newJob.ctc_band}\n` +
    `📊 *Min CGPA:* ${newJob.min_cgpa}\n` +
    `⚡ *Required Skills:* ${newJob.mandatory_skills.join(', ')}\n\n` +
    `📢 *Notice:* ${newJob.announcement_text}\n\n` +
    `👉 View on Dashboard: https://campusbridge-web.vercel.app/student/matches`
  ).catch(() => {})

  return newJob
}

export function getServerlessNotifications(userId: string = 'STU-101'): ServerlessNotification[] {
  const notifs = (g.__cb_notifications as ServerlessNotification[]) || []
  return notifs.filter((n) => !n.user_id || n.user_id === userId || n.user_id === 'STU-101')
}

export function markNotificationRead(notifId: string): boolean {
  const notifs = (g.__cb_notifications as ServerlessNotification[]) || []
  const target = notifs.find((n) => n.id === notifId)
  if (target) {
    target.is_read = true
    return true
  }
  return false
}

export function markAllNotificationsRead(userId: string = 'STU-101'): number {
  const notifs = (g.__cb_notifications as ServerlessNotification[]) || []
  let count = 0
  for (const n of notifs) {
    if (!n.is_read) {
      n.is_read = true
      count++
    }
  }
  return count
}

export function saveServerlessStudentSettings(studentId: string, settings: any) {
  if (!g.__cb_student_settings) g.__cb_student_settings = {}
  g.__cb_student_settings[studentId] = {
    ...(g.__cb_student_settings[studentId] || {}),
    ...settings,
    student_id: studentId,
    updated_at: new Date().toISOString(),
  }
  return g.__cb_student_settings[studentId]
}

export function getServerlessStudentSettings(studentId: string) {
  if (!g.__cb_student_settings) g.__cb_student_settings = {}
  return (
    g.__cb_student_settings[studentId] || {
      student_id: studentId,
      phone_number: '+919358817045',
      sms_notifications_enabled: true,
      telegram_chat_id: '9358817045',
      telegram_notifications_enabled: true,
      github_handle: 'BasakArijeet',
    }
  )
}

/**
 * Dispatch alert directly to Telegram bot API.
 */
export async function dispatchTelegramAlert(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '9206892743:AAFUijN1IWruCy_pY3w5vjZ0ZZNWxgWqgu0'
  const chatId = process.env.TELEGRAM_DEFAULT_CHAT_ID || '9358817045'

  if (!token) return false

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    })
    return res.ok
  } catch (err) {
    console.warn('[Telegram Dispatch Notice]:', err)
    return false
  }
}
