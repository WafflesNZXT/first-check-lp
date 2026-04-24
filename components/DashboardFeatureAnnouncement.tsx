'use client'

import { Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const FEATURE_SHIP_VERSION = '2026-04-dashboard-tutorial-and-voting'

type Props = {
  userId: string
}

export default function DashboardFeatureAnnouncement({ userId }: Props) {
  const storageKey = useMemo(
    () => `dashboard-feature-announcement:${FEATURE_SHIP_VERSION}:${userId}`,
    [userId]
  )
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = window.localStorage.getItem(storageKey) === '1'
    if (!seen) {
      setOpen(true)
    }
    setReady(true)
  }, [storageKey])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function dismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, '1')
    }
    setOpen(false)
  }

  if (!ready || !open) return null

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm px-4 py-6 md:p-8" role="dialog" aria-modal="true" aria-label="What’s new">
      <div className="h-full w-full max-w-xl mx-auto flex items-center justify-center">
        <div className="w-full rounded-3xl border border-black/10 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-[0_35px_120px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 dark:border-slate-700 px-5 py-4 md:px-6">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-black text-blue-700 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5" /> What&apos;s new
              </p>
              <h3 className="mt-1 text-xl md:text-2xl font-black text-black dark:text-white">New dashboard features shipped</h3>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-black/10 dark:border-slate-700 p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              aria-label="Close updates"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-5 md:px-6 md:py-6 space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <p>• Added an interactive, click-to-start dashboard tutorial with step-by-step highlights.</p>
            <p>• Added a sample report walkthrough so users can learn checklist and collaboration flow safely.</p>
            <p>• Added in-dashboard feature voting so users can shape what we build next.</p>
          </div>

          <div className="border-t border-black/10 dark:border-slate-700 px-5 py-4 md:px-6 flex items-center justify-end">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
