'use client'

import { useEffect, useState } from 'react'
import AuditWorkflowPanel from '@/components/AuditWorkflowPanel'
import BenchmarkCompare from '@/components/BenchmarkCompare'

type Props = {
  auditId: string
  canManageWorkflow: boolean
  viewerUserId: string
  viewerEmail?: string
  invitedDeveloperEmails: string[]
  currentSiteUrl: string
  currentScores: {
    performance: number
    ux: number
    seo: number
  }
}

export default function AuditDetailModals({
  auditId,
  canManageWorkflow,
  viewerUserId,
  viewerEmail,
  invitedDeveloperEmails,
  currentSiteUrl,
  currentScores,
}: Props) {
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [benchmarkOpen, setBenchmarkOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isTypingContext =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        !!target?.isContentEditable

      if (event.key === 'Escape') {
        if (workflowOpen) {
          event.preventDefault()
          setWorkflowOpen(false)
          return
        }
        if (benchmarkOpen) {
          event.preventDefault()
          setBenchmarkOpen(false)
        }
        return
      }

      if (isTypingContext || event.ctrlKey || event.metaKey || event.altKey) return

      if (!workflowOpen && !benchmarkOpen && event.key.toLowerCase() === 'w') {
        event.preventDefault()
        setWorkflowOpen(true)
        return
      }

      if (!workflowOpen && !benchmarkOpen && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setBenchmarkOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [workflowOpen, benchmarkOpen])

  useEffect(() => {
    const shouldLockScroll = workflowOpen || benchmarkOpen
    const previousOverflow = document.body.style.overflow

    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [workflowOpen, benchmarkOpen])

  return (
    <div className="space-y-3">
      <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Tools</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWorkflowOpen(true)}
            className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Open Team Workflow
          </button>
          <button
            type="button"
            onClick={() => setBenchmarkOpen(true)}
            className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Open Benchmark Compare
          </button>
        </div>
        <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
          Shortcuts: <span className="font-black text-black dark:text-white">W</span> Team Workflow · <span className="font-black text-black dark:text-white">B</span> Benchmark · <span className="font-black text-black dark:text-white">Esc</span> Close modal
        </p>
      </div>

      {workflowOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            onClick={() => setWorkflowOpen(false)}
            className="absolute inset-0 bg-black/45"
            aria-label="Close team workflow"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-slate-700 bg-[#fcfcfc] dark:bg-slate-950 p-3 sm:p-4"
          >
            <div className="mb-3 flex justify-end">
              <p className="mr-auto self-center text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">Press Esc to close</p>
              <button
                type="button"
                onClick={() => setWorkflowOpen(false)}
                className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white"
              >
                Close
              </button>
            </div>
            <AuditWorkflowPanel
              auditId={auditId}
              canManage={canManageWorkflow}
              viewerUserId={viewerUserId}
              viewerEmail={viewerEmail}
              assigneeEmails={invitedDeveloperEmails}
            />
          </div>
        </div>
      )}

      {benchmarkOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            onClick={() => setBenchmarkOpen(false)}
            className="absolute inset-0 bg-black/45"
            aria-label="Close benchmark compare"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-slate-700 bg-[#fcfcfc] dark:bg-slate-950 p-3 sm:p-4"
          >
            <div className="mb-3 flex justify-end">
              <p className="mr-auto self-center text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">Press Esc to close</p>
              <button
                type="button"
                onClick={() => setBenchmarkOpen(false)}
                className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white"
              >
                Close
              </button>
            </div>
            <BenchmarkCompare
              auditId={auditId}
              currentSiteUrl={currentSiteUrl}
              currentScores={currentScores}
            />
          </div>
        </div>
      )}
    </div>
  )
}
