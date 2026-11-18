'use client'

import { User, Compass, BookOpen, FileText, Shield, Briefcase, ArrowLeftRight } from 'lucide-react'

interface NavRailProps {
  currentRole?: 'STUDENT' | 'FACULTY'
  onRoleChange?: (role: 'STUDENT' | 'FACULTY') => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const studentNavItems = [
  {
    id: 'profile',
    icon: User,
    label: 'Profile & Evidence',
    badge: '2 to confirm',
  },
  {
    id: 'roles',
    icon: Compass,
    label: 'Role Explorer & Sandbox',
    badge: null,
  },
  {
    id: 'prep',
    icon: BookOpen,
    label: 'Prep Plan',
    badge: '72h Sprint',
  },
  {
    id: 'applications',
    icon: FileText,
    label: 'Applications',
    badge: null,
  },
]

const facultyNavItems = [
  {
    id: 'advisees',
    icon: User,
    label: 'Advisees & Capstones',
    badge: null,
  },
  {
    id: 'jd-ingestion',
    icon: Briefcase,
    label: 'JD Ingestion & Gates',
    badge: 'Active',
  },
  {
    id: 'liquidity',
    icon: Briefcase,
    label: 'Cohort Liquidity Simulator',
    badge: null,
  },
  {
    id: 'disputes',
    icon: FileText,
    label: 'Exception Queue',
    badge: 'Pending',
  },
]

export default function NavRail({
  currentRole = 'STUDENT',
  onRoleChange,
  activeTab = 'roles',
  onTabChange,
}: NavRailProps) {
  const isStudent = currentRole === 'STUDENT'
  const navItems = isStudent ? studentNavItems : facultyNavItems

  return (
    <nav
      className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-border-hairline bg-surface"
      aria-label="Primary navigation"
    >
      {/* Role switcher */}
      <div className="border-b border-border-hairline px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-oxford-surface px-2.5 py-1 text-xs font-semibold text-oxford">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            {isStudent ? 'Student Workspace' : 'Faculty Console'}
          </div>
          <button
            type="button"
            onClick={() => onRoleChange?.(isStudent ? 'FACULTY' : 'STUDENT')}
            className="flex items-center gap-1 rounded p-1 text-[11px] font-medium text-ink-muted hover:bg-subtle hover:text-ink-primary focus-visible:outline-oxford"
            title="Switch Persona"
          >
            <ArrowLeftRight className="h-3 w-3" />
            <span>Switch</span>
          </button>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-2 py-3">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const isActive = item.id === activeTab
            const Icon = item.icon
            return (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => onTabChange?.(item.id)}
                  className={`group flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-oxford-surface font-medium text-oxford'
                      : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 h-6 w-[3px] rounded-r-full bg-oxford"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${
                      isActive ? 'text-oxford' : 'text-ink-muted'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isActive
                          ? 'bg-oxford/10 text-oxford'
                          : 'bg-subtle text-ink-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Bottom: Privacy Shield mini-card */}
      <div className="border-t border-border-hairline px-3 py-3">
        <div className="rounded-lg border border-border-hairline bg-canvas p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-ink-primary">
            <span className="h-2 w-2 rounded-full bg-emerald" />
            DPDP Compliant State
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">
            {isStudent
              ? '2 Recruiter scopes active • Zero PII leak'
              : 'Institutional Tenant: JKLU (JK Lakshmipat University)'}
          </p>
        </div>
      </div>
    </nav>
  )
}
