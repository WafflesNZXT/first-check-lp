'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuditLoading from '@/components/AuditLoading'

export default function AuditInput() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [processingNotice, setProcessingNotice] = useState<string | null>(null)
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null)
  const router = useRouter()

  const showAuditError = (message: string) => {
    setActiveAuditId(null)
    setActiveStatus(null)
    setProcessingNotice(null)
    setErrorModalMessage(message)
  }

  const getFriendlyAuditError = (message: unknown) => {
    const raw = String(message || 'Audit API failed — please try again later')
    const normalized = raw.toLowerCase()

    if (normalized.includes('high demand') || normalized.includes('failed after 3 attempts')) {
      return 'The audit model is experiencing high demand right now. Please wait a moment and try again.'
    }

    return raw
  }

  useEffect(() => {
    if (!activeAuditId || activeStatus !== 'processing') return

    const timer = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/audit/status?id=${encodeURIComponent(activeAuditId)}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (!statusRes.ok) return

        const statusJson = await statusRes.json().catch(() => ({}))
        const nextStatus = statusJson?.status
        if (!nextStatus || typeof nextStatus !== 'string') return

        if (nextStatus === 'completed') {
          setActiveStatus(nextStatus)
          clearInterval(timer)
          setActiveAuditId(null)
          setActiveStatus(null)
          setProcessingNotice(null)
          router.refresh()
          return
        }

        if (nextStatus === 'failed' || nextStatus === 'cancelled') {
          clearInterval(timer)
          showAuditError(
            getFriendlyAuditError(statusJson?.error || (nextStatus === 'cancelled'
              ? 'Audit was cancelled.'
              : 'Audit failed. Please try again.'))
          )
          router.refresh()
          return
        }

        if (typeof statusJson?.error === 'string' && statusJson.error.toLowerCase().includes('falling back to lighter version')) {
          setProcessingNotice(statusJson.error)
        } else {
          setProcessingNotice(null)
        }

        setActiveStatus(nextStatus)
      } catch {
      }
    }, 1500)

    return () => clearInterval(timer)
  }, [activeAuditId, activeStatus, router])

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Ask the server to create the pending audit row (authenticated via cookies)
      const initRes = await fetch('/api/audit/init', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' },
      })

      const initJson = await initRes.json().catch(() => ({}))
      if (!initRes.ok || !initJson.id) {
        console.error('Failed to init audit', initRes.status, initJson)
        showAuditError(getFriendlyAuditError(initJson?.error || 'Failed to start audit. Please try again.'))
        return
      }

      const auditId = initJson.id
      setActiveAuditId(auditId)
      setActiveStatus('processing')
      setProcessingNotice(null)
      setUrl('')

      // 2. Trigger the audit processor in the background; UI progress is driven by realtime status updates.
      void (async () => {
        try {
          const res = await fetch('/api/audit', {
            method: 'POST',
            body: JSON.stringify({ url, auditId }),
            headers: { 'Content-Type': 'application/json' },
          })

          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            console.error('Audit API failed', res.status, json)
            showAuditError(getFriendlyAuditError(json?.error || 'Audit API failed — please try again later'))
          }
        } catch (err) {
          console.error('Error calling audit API', err)
          showAuditError('Audit API failed — please try again later')
        }
      })()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={startAudit}>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          <input
            type="url"
            required
            placeholder="https://yourstartup.com"
            className="w-full p-4 sm:p-6 sm:pr-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-base sm:text-lg text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            disabled={loading || activeStatus === 'processing'}
            className="w-full sm:w-auto sm:absolute sm:right-3 bg-black dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Starting...' : activeStatus === 'processing' ? 'Running...' : 'Run Audit'}
          </button>
        </div>
      </form>

      {activeStatus === 'processing' && (
        <AuditLoading processingNotice={processingNotice} />
      )}

      {errorModalMessage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="audit-error-title">
          <div className="absolute inset-0 bg-black/55" onClick={() => setErrorModalMessage(null)} />

          <div className="relative w-full max-w-md rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Audit Error</p>
            <h3 id="audit-error-title" className="text-xl font-black text-black dark:text-white tracking-tight">Couldn&apos;t Complete Audit</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{errorModalMessage}</p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModalMessage(null)}
                className="inline-flex items-center rounded-2xl bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}