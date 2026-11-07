'use client'

import React, { useEffect, useState } from 'react'

/**
 * Deterministic date/time formatters enforcing 'en-GB' and UTC timezone.
 * Guarantees identical output across Node.js SSR and Browser hydration (DD/MM/YYYY).
 */
const deterministicDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const deterministicDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

const deterministicTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

/**
 * Deterministic Date Formatter: Always outputs DD/MM/YYYY in UTC
 */
export function formatAppDate(date: string | number | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return '—'
    return deterministicDateFormatter.format(d)
  } catch {
    return '—'
  }
}

/**
 * Deterministic DateTime Formatter: Outputs DD/MM/YYYY, HH:MM:SS in UTC
 */
export function formatAppDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return '—'
    return deterministicDateTimeFormatter.format(d)
  } catch {
    return '—'
  }
}

/**
 * Deterministic Time Formatter: Outputs HH:MM in UTC
 */
export function formatAppTime(date: string | number | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return '—'
    return deterministicTimeFormatter.format(d)
  } catch {
    return '—'
  }
}

export interface ClientOnlyDateProps {
  date: string | number | Date | null | undefined
  format?: 'date' | 'datetime' | 'time'
  fallback?: string
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * Reusable ClientOnlyDate Component:
 * Employs isMounted guard with suppressHydrationWarning to eliminate SSR/hydration mismatches.
 */
export function ClientOnlyDate({
  date,
  format = 'date',
  fallback = '—',
  className = '',
  prefix = '',
  suffix = '',
}: ClientOnlyDateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatted =
    format === 'datetime'
      ? formatAppDateTime(date)
      : format === 'time'
      ? formatAppTime(date)
      : formatAppDate(date)

  const displayText = formatted && formatted !== '—' ? `${prefix}${formatted}${suffix}` : fallback

  return (
    <span className={className} suppressHydrationWarning>
      {displayText}
    </span>
  )
}

export default ClientOnlyDate

