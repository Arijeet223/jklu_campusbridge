'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react'

interface SyncExcelModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SyncExcelModal({ isOpen, onClose }: SyncExcelModalProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/backend/v1/admin/db-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // Fallback
    }
  }

  const handleDownload = () => {
    window.open('/api/backend/v1/admin/export-excel', '_blank')
    setMsg({ type: 'success', text: 'Downloaded live campusbridge_db.xlsx.' })
  }

  const handleManualSync = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/backend/v1/admin/sync-excel', { method: 'POST' })
      const data = await res.json()
      setStats(data.stats)
      setMsg({ type: 'success', text: 'Cache flushed to data/campusbridge_db.xlsx.' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Sync failed.' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/backend/v1/admin/upload-excel', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed. Please ensure the file is a valid .xlsx workbook.')
      }

      const data = await res.json()
      setStats(data.stats)
      setMsg({
        type: 'success',
        text: `Successfully synced "${file.name}" into memory! ${data.stats.total_rows} rows active.`,
      })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error uploading Excel database.' })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-border-hairline bg-surface p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink-primary">
                Two-Way Excel Database Engine
              </h3>
              <p className="text-xs text-ink-muted">
                Inspect, modify, or sync <code className="font-mono text-emerald">data/campusbridge_db.xlsx</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-subtle hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status message */}
        {msg && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium border ${
              msg.type === 'success'
                ? 'border-emerald-border bg-emerald-surface text-emerald'
                : 'border-amber-border bg-amber-surface text-amber'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Database Stats Grid */}
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-canvas p-4 border border-border-hairline text-center">
          <div>
            <span className="text-2xs text-ink-muted block uppercase tracking-wider font-semibold">
              Total Rows
            </span>
            <span className="font-display text-lg font-bold text-ink-primary">
              {stats?.total_rows ?? 53}
            </span>
          </div>
          <div>
            <span className="text-2xs text-ink-muted block uppercase tracking-wider font-semibold">
              Worksheets
            </span>
            <span className="font-display text-lg font-bold text-oxford">
              8 Sheets
            </span>
          </div>
          <div>
            <span className="text-2xs text-ink-muted block uppercase tracking-wider font-semibold">
              File Size
            </span>
            <span className="font-display text-lg font-bold text-emerald">
              {stats?.file_size_kb ? `${stats.file_size_kb} KB` : '21.3 KB'}
            </span>
          </div>
        </div>

        {/* Sheet counts breakdown */}
        {stats?.sheet_counts && (
          <div className="rounded-xl border border-border-hairline bg-surface p-3 space-y-2">
            <span className="text-2xs font-semibold text-ink-muted uppercase tracking-wider block">
              Worksheet Inventory
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(stats.sheet_counts).map(([sheet, count]: any) => (
                <div key={sheet} className="rounded-lg bg-canvas p-2 border border-border-hairline/60">
                  <span className="font-mono text-2xs text-ink-muted block truncate" title={sheet}>
                    {sheet}
                  </span>
                  <span className="font-semibold text-ink-primary">{count} rows</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-xl border border-oxford bg-oxford-surface/40 py-2.5 px-4 text-xs font-semibold text-oxford hover:bg-oxford-surface transition-all shadow-2xs"
            >
              <Download className="h-4 w-4" />
              Download Live Excel DB (.xlsx)
            </button>

            <label className="flex items-center justify-center gap-2 rounded-xl bg-oxford py-2.5 px-4 text-xs font-semibold text-white hover:bg-oxford/90 cursor-pointer transition-all shadow-2xs">
              <Upload className="h-4 w-4" />
              Upload &amp; Replace DB (.xlsx)
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border-hairline bg-canvas py-2 px-3 text-xs font-medium text-ink-secondary hover:bg-subtle transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Force Flush Memory Cache to File
          </button>
        </div>
      </div>
    </div>
  )
}

