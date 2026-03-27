'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  websiteUrl: string
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function AuditDetailActions({ websiteUrl }: Props) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)

  const handleReaudit = async () => {
    if (isRunning) return

    setIsRunning(true)
    try {
      const initRes = await fetch('/api/audit/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      })

      const initJson = await initRes.json().catch(() => ({}))
      const auditId = initJson?.id
      if (!initRes.ok || !auditId) {
        throw new Error(initJson?.error || 'Failed to initialize re-audit')
      }

      const runPromise = fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, auditId }),
      })

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await wait(1500)
        const statusRes = await fetch(`/api/audit/status?id=${encodeURIComponent(auditId)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (!statusRes.ok) continue

        const statusJson = await statusRes.json().catch(() => ({}))
        const status = statusJson?.status

        if (status === 'completed') {
          await runPromise.catch(() => null)
          router.push(`/dashboard/audit/${auditId}`)
          return
        }

        if (status === 'failed' || status === 'cancelled') {
          throw new Error(`Re-audit ${status}`)
        }
      }

      throw new Error('Re-audit timed out')
    } catch (error) {
      console.error(error)
      alert('Re-audit failed. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  const handleDownloadPdf = () => {
    if (typeof window === 'undefined') return
    window.print()
  }

  return (
    <div className="print-hide flex flex-wrap items-center gap-3 justify-end">
      <button
        type="button"
        onClick={handleReaudit}
        disabled={isRunning}
        className="rounded-xl border border-black dark:border-slate-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-black dark:hover:bg-slate-200 hover:text-white dark:hover:text-slate-900 transition-colors disabled:opacity-50"
      >
        {isRunning ? 'Running Re-Audit...' : 'Run Re-Audit'}
      </button>

      <button
        type="button"
        onClick={handleDownloadPdf}
        className="rounded-xl border border-green-300 dark:border-green-700 bg-green-300 dark:bg-green-900/45 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-950 dark:text-green-200 hover:bg-green-400 dark:hover:bg-green-900/65 transition-colors"
      >
        Download PDF
      </button>
    </div>
  )
}
