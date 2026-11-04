'use client'

import { ShieldCheck, ChevronRight, Lock } from 'lucide-react'

interface PrivacyShieldBarProps {
  onOpenPrivacyCenter?: () => void
  activeRecruitersCount?: number
}

export default function PrivacyShieldBar({
  onOpenPrivacyCenter,
  activeRecruitersCount = 2,
}: PrivacyShieldBarProps) {
  return (
    <div
      className="sticky top-0 z-30 flex h-9 items-center justify-between border-b border-oxford-border/60 bg-oxford-surface/95 px-4 text-xs backdrop-blur-sm transition-all"
      role="status"
      aria-label="Privacy Shield Status"
    >
      {/* Left: Friendly Shield Badge */}
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-oxford text-white">
          <ShieldCheck className="h-3 w-3" />
        </span>
        <span className="font-semibold text-oxford">
          Verified Privacy Active
        </span>
        <span className="hidden sm:inline text-ink-muted">
          • 100% Secure &amp; Private by Default
        </span>
      </div>

      {/* Center: Friendly Plain English Recruiter Status */}
      <div className="hidden md:flex items-center gap-2 text-ink-secondary text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
        <span>
          Only <strong className="text-ink-primary font-semibold">{activeRecruitersCount} campus companies</strong> you approved can see your confirmed skills.
        </span>
      </div>

      {/* Right: Friendly Action Pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPrivacyCenter}
          className="inline-flex items-center gap-1 font-mono text-provenance text-oxford hover:underline cursor-pointer"
        >
          <Lock className="h-3 w-3" />
          <span>Manage Privacy Settings</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
