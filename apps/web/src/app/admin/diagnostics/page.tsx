'use client'

import AppLayout from '@/components/layout/AppLayout'
import DiagnosticsPanel from '@/components/DiagnosticsPanel'

export default function AdminDiagnosticsPage() {
  return (
    <AppLayout
      pageTitle="AI Pantheon Orbital Diagnostics"
      breadcrumb="System Administration"
      activeRole="ADMIN"
      userName="System Admin"
      userSubtitle="Security & AI Infrastructure Observability"
    >
      <div className="space-y-6">
        <DiagnosticsPanel />
      </div>
    </AppLayout>
  )
}
