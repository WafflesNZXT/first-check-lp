'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RetryAuditButton({ websiteUrl, compact = false }: { websiteUrl: string; compact?: boolean }) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)

  const handleRetry = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (isRunning) return

    const normalizedUrl = String(websiteUrl || '').trim()
    if (!normalizedUrl) return

    setIsRunning(true)
    try {
      const initRes = await fetch('/api/audit/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      })

      const initJson = await initRes.json().catch(() => ({}))
      const nextAuditId = String(initJson?.id || '')

      if (!initRes.ok || !nextAuditId) {
        throw new Error(String(initJson?.error || 'Failed to initialize retry'))
      }

      void fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, auditId: nextAuditId }),
      })

      router.push(`/dashboard/audit/${nextAuditId}`)
    } catch {
      setIsRunning(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={isRunning}
      className={`inline-flex items-center rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-60 ${compact ? 'h-7 px-2.5 text-[10px] font-black uppercase tracking-widest' : 'h-8 px-3 text-[10px] font-black uppercase tracking-widest'}`}
    >
      {isRunning ? 'Retrying...' : 'Retry'}
    </button>
  )
}