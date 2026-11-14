'use client'

import { X, FileText } from 'lucide-react'
import type { SourceDocument } from '@/lib/types'

/* ------------------------------------------------------------------ */
/*  SourceDrawer — Right slide-over contextual panel (420px)           */
/*  §4.1 of DESIGN.md — opens on provenance pill click                 */
/* ------------------------------------------------------------------ */

interface SourceDrawerProps {
  isOpen: boolean
  onClose: () => void
  sourceDocument: SourceDocument | null
  highlightSpan?: string
}

export default function SourceDrawer({
  isOpen,
  onClose,
  sourceDocument,
  highlightSpan,
}: SourceDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l border-border-hairline bg-surface shadow-lg transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Source document viewer"
        aria-hidden={!isOpen}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            <div>
              <h2 className="font-display text-sm font-semibold text-ink-primary">
                {sourceDocument?.fileName ?? 'Document'}
              </h2>
              {sourceDocument && (
                <p className="text-xs text-ink-muted">
                  Page {sourceDocument.pageNumber}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-subtle hover:text-ink-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxford"
            aria-label="Close source viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sourceDocument ? (
            <div className="space-y-4">
              {/* Document metadata */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-border-hairline bg-subtle px-2 py-0.5 font-mono text-provenance text-ink-muted">
                  {sourceDocument.id}
                </span>
              </div>

              {/* Full text with highlighted span */}
              <div className="max-w-prose text-body leading-relaxed text-ink-primary">
                {sourceDocument.fullText ? (
                  <div className="whitespace-pre-wrap font-sans text-xs p-4 bg-surface-container-low rounded-2xl border border-outline-variant/60 leading-relaxed max-h-[68vh] overflow-y-auto shadow-inner">
                    {sourceDocument.highlightedText ? (
                      sourceDocument.fullText.split(sourceDocument.highlightedText).map(
                        (part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <mark className="rounded bg-yellow-200 text-on-surface px-1 py-0.5 font-bold shadow-xs">
                                {sourceDocument.highlightedText}
                              </mark>
                            )}
                          </span>
                        ),
                      )
                    ) : (
                      <span>{sourceDocument.fullText}</span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-border bg-amber-surface p-3">
                    <mark className="rounded bg-yellow-100 px-0.5 py-0.5 text-ink-primary">
                      {sourceDocument.highlightedText}
                    </mark>
                  </div>
                )}
              </div>

              {/* Span reference */}
              {highlightSpan && (
                <div className="rounded-md border border-border-hairline bg-subtle px-3 py-2">
                  <span className="text-xs text-ink-muted">Source span: </span>
                  <span className="font-mono text-provenance text-ink-secondary">
                    {highlightSpan}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-ink-muted">
                Click a provenance pill to view the source document.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
