'use client'

import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const FLOW_VERSION = 'v1'

type Props = {
  userId: string
  shouldShow: boolean
}

export default function DashboardGuidedFlow({ userId, shouldShow }: Props) {
  const dismissKey = useMemo(() => `dashboard-guided-flow-dismissed:${FLOW_VERSION}:${userId}`, [userId])
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissed(window.localStorage.getItem(dismissKey) === '1')
    setReady(true)
  }, [dismissKey])

  function dismissFlow() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(dismissKey, '1')
    }
    setDismissed(true)
  }

  if (!shouldShow || !ready || dismissed) return null

  return (
    <section className="mb-8 sm:mb-10">
      <div className="rounded-[1.4rem] border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-blue-700">Start Here</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-black">Your 3-step guided flow</h2>
            <p className="mt-2 text-sm text-gray-600">Run your first audit, review the top fixes, then re-run to measure improvement.</p>
          </div>
          <button
            type="button"
            onClick={dismissFlow}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white p-2 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
            aria-label="Dismiss guided flow"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">Step 1</p>
            <p className="mt-1 text-sm font-bold text-black">Run your first audit</p>
            <p className="mt-1 text-xs text-gray-600">Paste your landing page URL and launch an audit.</p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700">Step 2</p>
            <p className="mt-1 text-sm font-bold text-black">Fix the top 3 issues</p>
            <p className="mt-1 text-xs text-gray-600">Start with highest-impact items to move conversions first.</p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-700">Step 3</p>
            <p className="mt-1 text-sm font-bold text-black">Re-run and compare</p>
            <p className="mt-1 text-xs text-gray-600">Track score movement and keep improving weekly.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Audo is designed to be user-friendly.
          </span>
          <button
            type="button"
            onClick={() => {
              const element = document.getElementById('audit-input')
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              element?.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
              setTimeout(() => {
                element?.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
              }, 2000)
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-700 hover:text-black hover:border-black/20 transition-colors"
          >
            Run an audit now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('dashboard:tutorial:start'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-600 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Tutorial
          </button>
        </div>
      </div>
    </section>
  )
}
