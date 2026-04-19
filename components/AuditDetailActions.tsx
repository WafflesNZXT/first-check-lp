'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  auditId: string
  websiteUrl: string
  canManage?: boolean
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function AuditDetailActions({ auditId, websiteUrl, canManage = true }: Props) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [isDownloadingSocial, setIsDownloadingSocial] = useState(false)

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

  const handleDownloadSocialImage = async () => {
    if (isDownloadingSocial) return
    setIsDownloadingSocial(true)

    try {
      const response = await fetch(`/api/og/${encodeURIComponent(auditId)}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to generate social image')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `audo-share-${auditId}.png`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error(error)
      alert('Could not download social share image. Please try again.')
    } finally {
      setIsDownloadingSocial(false)
    }
  }

  return (
    <div className="print-hide flex flex-col gap-2">
      {canManage && (
        <button
          type="button"
          onClick={handleReaudit}
          disabled={isRunning}
          className="w-full rounded-xl border border-black dark:border-slate-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-black dark:hover:bg-slate-200 hover:text-white dark:hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Re-run'}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full rounded-xl border border-green-300 dark:border-green-700 bg-green-300 dark:bg-green-900/45 px-4 py-2 text-xs font-black uppercase tracking-widest text-green-950 dark:text-green-200 hover:bg-green-400 dark:hover:bg-green-900/65 transition-colors"
        >
          PDF
        </button>

        <button
          type="button"
          onClick={handleDownloadSocialImage}
          disabled={isDownloadingSocial}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          {isDownloadingSocial ? 'Preparing...' : 'Share Image'}
        </button>
      </div>
    </div>
  )
}
