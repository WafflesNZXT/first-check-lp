'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'

export default function AuditInput() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const router = useRouter()

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

        setActiveStatus(nextStatus)

        if (nextStatus === 'completed' || nextStatus === 'failed' || nextStatus === 'cancelled') {
          clearInterval(timer)
          setActiveAuditId(null)
          setActiveStatus(null)
          router.refresh()
        }
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
        setLoading(false)
        return
      }

      const auditId = initJson.id
      setActiveAuditId(auditId)
      setActiveStatus('processing')
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
            setActiveAuditId(null)
            setActiveStatus(null)
            alert(json?.error || 'Audit API failed — please try again later')
          }
        } catch (err) {
          console.error('Error calling audit API', err)
          setActiveAuditId(null)
          setActiveStatus(null)
          alert('Audit API failed — please try again later')
        }
      })()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={startAudit}>
        <div className="relative flex items-center">
          <input
            type="url"
            required
            placeholder="https://yourstartup.com"
            className="w-full p-6 pr-40 bg-white border border-gray-200 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-black outline-none transition-all text-lg text-black"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            disabled={loading || activeStatus === 'processing'}
            className="absolute right-3 bg-black text-white px-8 py-4 rounded-3xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Starting...' : activeStatus === 'processing' ? 'Running...' : 'Run Audit'}
          </button>
        </div>
      </form>

      {activeStatus === 'processing' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <ProgressBar status="processing" />
        </div>
      )}
    </div>
  )
}