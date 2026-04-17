'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuditLoading from '@/components/AuditLoading'

export default function AuditInput() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSitemapLoading, setIsSitemapLoading] = useState(false)
  const [scannedUrls, setScannedUrls] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [sitemapError, setSitemapError] = useState<string | null>(null)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ total: 0, completed: 0, failed: 0, currentUrl: '' })
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [processingNotice, setProcessingNotice] = useState<string | null>(null)
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null)
  const router = useRouter()

  const bulkPercent = bulkProgress.total > 0
    ? Math.min(100, Math.round((bulkProgress.completed / bulkProgress.total) * 100))
    : 0

  const normalizeWebsiteUrl = (rawUrl: string) => {
    const trimmed = String(rawUrl || '').trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

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

    let attempts = 0
    const maxAttempts = 240

    const timer = setInterval(async () => {
      attempts += 1

      if (attempts >= maxAttempts) {
        clearInterval(timer)
        showAuditError('Audit is taking longer than expected. Please refresh to check final status.')
        router.refresh()
        return
      }

      try {
        const statusRes = await fetch(`/api/audit/status?id=${encodeURIComponent(activeAuditId)}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (!statusRes.ok) {
          if (statusRes.status === 404) {
            setProcessingNotice('Finalizing audit...')
          }
          return
        }

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
          window.setTimeout(() => {
            router.refresh()
          }, 900)
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

    const normalizedUrl = normalizeWebsiteUrl(url)
    if (!normalizedUrl) {
      setLoading(false)
      showAuditError('Please enter a valid website URL.')
      return
    }

    try {
      // 1. Ask the server to create the pending audit row (authenticated via cookies)
      const initRes = await fetch('/api/audit/init', {
        method: 'POST',
        body: JSON.stringify({ url: normalizedUrl }),
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
            body: JSON.stringify({ url: normalizedUrl, auditId }),
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

  const waitForAuditCompletion = async (auditId: string) => {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const statusRes = await fetch(`/api/audit/status?id=${encodeURIComponent(auditId)}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!statusRes.ok) continue

      const statusJson = await statusRes.json().catch(() => ({}))
      const status = String(statusJson?.status || '')
      if (status === 'completed') return { success: true }
      if (status === 'failed' || status === 'cancelled') return { success: false }
    }

    return { success: false }
  }

  const handleScanEntireSite = async () => {
    const baseUrl = normalizeWebsiteUrl(url)
    if (!baseUrl) {
      setSitemapError('Enter a URL first to scan its sitemap.')
      return
    }

    setIsSitemapLoading(true)
    setSitemapError(null)

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setSitemapError(String(payload?.error || 'Could not scan sitemap.xml'))
        setScannedUrls([])
        setSelectedUrls([])
        return
      }

      const urlsFromSitemap = Array.isArray(payload?.urls) ? payload.urls.map((entry: unknown) => String(entry)).filter(Boolean) : []
      setScannedUrls(urlsFromSitemap)
      setSelectedUrls(urlsFromSitemap)
    } catch {
      setSitemapError('Could not scan sitemap.xml right now. Try again in a moment.')
      setScannedUrls([])
      setSelectedUrls([])
    } finally {
      setIsSitemapLoading(false)
    }
  }

  const handleRunBulkAudits = async () => {
    const urlsToProcess = [...selectedUrls]
    if (urlsToProcess.length === 0 || bulkRunning) return

    setBulkRunning(true)
    setBulkProgress({ total: urlsToProcess.length, completed: 0, failed: 0, currentUrl: '' })

    let completed = 0
    let failed = 0

    for (const pageUrl of urlsToProcess) {
      setBulkProgress({ total: urlsToProcess.length, completed, failed, currentUrl: pageUrl })

      try {
        const initRes = await fetch('/api/audit/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: pageUrl }),
        })

        const initJson = await initRes.json().catch(() => ({}))
        const auditId = String(initJson?.id || '')

        if (!initRes.ok || !auditId) {
          failed += 1
          setBulkProgress({ total: urlsToProcess.length, completed, failed, currentUrl: pageUrl })
          continue
        }

        await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: pageUrl, auditId }),
        }).catch(() => null)

        const result = await waitForAuditCompletion(auditId)
        if (result.success) {
          completed += 1
        } else {
          failed += 1
        }
      } catch {
        failed += 1
      }

      setBulkProgress({ total: urlsToProcess.length, completed, failed, currentUrl: pageUrl })
    }

    setBulkRunning(false)
    setBulkProgress({ total: urlsToProcess.length, completed, failed, currentUrl: '' })
    router.refresh()
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={startAudit}>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          <input
            type="text"
            required
            placeholder="yourstartup.com or https://yourstartup.com"
            className="w-full p-4 sm:p-6 sm:pr-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-base sm:text-lg text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            disabled={loading || activeStatus === 'processing' || bulkRunning || isSitemapLoading}
            className="w-full sm:w-auto sm:absolute sm:right-3 bg-black dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Starting...' : activeStatus === 'processing' ? 'Running...' : 'Run Audit'}
          </button>
        </div>
      </form>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">Tip: enter just a domain like useaudo.com — we auto-add https://</p>

      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Bulk Scan</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">Scan sitemap.xml and run audits for multiple pages.</p>
          </div>
          <button
            type="button"
            onClick={handleScanEntireSite}
            disabled={isSitemapLoading || bulkRunning}
            className="rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {isSitemapLoading ? 'Scanning...' : 'Scan Entire Site'}
          </button>
        </div>

        {sitemapError && (
          <p className="text-xs text-red-500">{sitemapError}</p>
        )}

        {scannedUrls.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-300">{selectedUrls.length} of {scannedUrls.length} pages selected</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUrls(scannedUrls)}
                  className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUrls([])}
                  className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800">
              {scannedUrls.map((pageUrl) => {
                const checked = selectedUrls.includes(pageUrl)
                return (
                  <label key={pageUrl} className="flex items-start gap-2 p-2.5 sm:p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const shouldSelect = event.target.checked
                        setSelectedUrls((prev) => {
                          if (shouldSelect) return prev.includes(pageUrl) ? prev : [...prev, pageUrl]
                          return prev.filter((value) => value !== pageUrl)
                        })
                      }}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300 break-all">{pageUrl}</span>
                  </label>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleRunBulkAudits}
              disabled={selectedUrls.length === 0 || bulkRunning || activeStatus === 'processing'}
              className="w-full rounded-xl bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-60"
            >
              {bulkRunning ? 'Running Bulk Scan...' : 'Run Audits for Selected Pages'}
            </button>
          </>
        )}

        {bulkRunning && (
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white transition-all duration-300"
                style={{ width: `${bulkPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {bulkProgress.completed}/{bulkProgress.total} completed • {bulkProgress.failed} failed
            </p>
            {bulkProgress.currentUrl && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 break-all">
                Currently scanning: {bulkProgress.currentUrl}
              </p>
            )}
          </div>
        )}
      </div>

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