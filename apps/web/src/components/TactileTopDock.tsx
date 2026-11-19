'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEMO_PERSONAS, DemoPersona } from './TopNavBar'

interface TactileTopDockProps {
  currentPersona?: DemoPersona
  onSelectPersona?: (persona: DemoPersona) => void
  onOpenSyncExcelModal?: () => void
  onOpenRegisterModal?: () => void
}

export default function TactileTopDock({
  currentPersona = DEMO_PERSONAS[0],
  onSelectPersona,
  onOpenSyncExcelModal,
  onOpenRegisterModal,
}: TactileTopDockProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDownloadExcel = () => {
    window.open('/api/backend/v1/admin/export-excel', '_blank')
  }

  const navLinks = [
    { label: 'Studio', href: '/student/dashboard', icon: 'dashboard' },
    { label: 'Settings & Ingest', href: '/student/settings', icon: 'settings' },
    { label: 'What-If Sandbox', href: '/student/what-if-sandbox', icon: 'science' },
    { label: 'Practice Arena', href: '/student/arena', icon: 'swords' },
    { label: 'Applications', href: '/student/applications', icon: 'view_kanban' },
    { label: 'AI Coach', href: '/student/chat', icon: 'smart_toy' },
    { label: 'MCP Health', href: '/admin/diagnostics', icon: 'memory' },
  ]

  const isCurrentTab = (href: string) => {
    if (href === '/student/dashboard') {
      return pathname === '/' || pathname === '/student/dashboard' || pathname === '/student/home'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-3 z-50 px-4 md:px-8 mb-6">
      <nav className="bg-surface-container-lowest border border-outline-variant shadow-[0_4px_0_#EAD7E2] rounded-full mx-auto max-w-7xl flex justify-between items-center px-4 sm:px-6 py-2.5 transition-all">
        {/* Left: Brand Logo & Navigation Cluster */}
        <div className="flex items-center gap-3 lg:gap-5">
          <Link href="/student/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center border border-outline-variant shadow-[0_2px_0_#DE95BE] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl text-primary font-bold">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight leading-none">
                CampusBridge AI
              </span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider hidden sm:block">
                Tactile Studio • JKLU
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/60">
            {navLinks.map((link) => {
              const active = isCurrentTab(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    active
                      ? 'bg-primary text-on-primary shadow-[0_2px_0_#643953]'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Center: Search input */}
        <div className="hidden xl:flex items-center w-64 relative">
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drives, skills, proof..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-full pl-9 pr-4 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all"
          />
        </div>

        {/* Right: Privacy Shield, Persona Switcher & Excel Sync */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Shield Pill */}
          <Link
            href="/student/privacy-shield"
            className="hidden sm:flex items-center gap-1.5 bg-tertiary-container/40 text-on-tertiary-container border border-tertiary-fixed-dim px-3 py-1 rounded-full text-xs font-bold shadow-[0_2px_0_#a8cfbb] hover:brightness-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
            <span className="whitespace-nowrap">Privacy Shield: Active</span>
          </Link>

          {/* Live Excel Sync Pill */}
          <button
            type="button"
            onClick={onOpenSyncExcelModal || handleDownloadExcel}
            title="campusbridge_db.xlsx Synced (Click to Export/Sync)"
            className="hidden md:flex items-center gap-1.5 bg-secondary-container/40 text-on-secondary-container border border-secondary-fixed-dim px-2.5 py-1 rounded-full text-[11px] font-bold shadow-[0_2px_0_#85B5CE] hover:brightness-95 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span>Excel DB Synced</span>
          </button>

          {/* Persona Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-surface-container-low border border-outline-variant px-2.5 py-1 rounded-full shadow-[0_2px_0_#d3c2c9] hover:bg-surface-container transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[11px] border border-outline-variant">
                {currentPersona.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left pr-1">
                <span className="text-xs font-bold text-on-surface leading-none truncate max-w-[110px]">
                  {currentPersona.name}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium leading-tight">
                  {currentPersona.role}
                </span>
              </div>
              <span className="material-symbols-outlined text-sm text-outline">expand_more</span>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-outline-variant/60 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Switch Persona / Role
                  </span>
                  <Link href="/login" className="text-[10px] text-primary font-bold hover:underline">
                    SSO Login
                  </Link>
                </div>

                {DEMO_PERSONAS.map((p) => {
                  const isSelected = p.id === currentPersona.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (onSelectPersona) onSelectPersona(p)
                        setDropdownOpen(false)
                      }}
                      className={`w-full text-left rounded-xl p-2.5 flex items-start gap-2.5 transition-colors ${
                        isSelected
                          ? 'bg-primary-container/30 text-on-surface font-semibold border border-primary/30'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {p.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{p.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container font-bold text-on-surface-variant">
                            {p.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-outline truncate mt-0.5">{p.subtext}</p>
                      </div>
                    </button>
                  )
                })}

                <div className="mt-2 pt-2 border-t border-outline-variant/60 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="text-[11px] text-tertiary font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export Excel
                  </button>
                  {onOpenRegisterModal && (
                    <button
                      type="button"
                      onClick={onOpenRegisterModal}
                      className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      New Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Pill Button */}
          <Link
            href="/student/arena"
            className="bg-primary text-on-primary font-bold text-xs px-3.5 py-2 rounded-full border border-outline-variant shadow-[0_3px_0_#643953] active:translate-y-[2px] active:shadow-[0_1px_0_#643953] transition-all flex items-center gap-1 hover:brightness-105"
          >
            <span>Play Quest</span>
            <span className="material-symbols-outlined text-sm">bolt</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}

