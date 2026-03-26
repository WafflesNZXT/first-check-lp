'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuditInput({ userId }: { userId: string }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const startAudit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
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

      // 2. Trigger the audit processor (server-side) and wait for response so we can surface errors
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          body: JSON.stringify({ url, auditId }),
          headers: { 'Content-Type': 'application/json' },
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          console.error('Audit API failed', res.status, json)
          alert(json?.error || 'Audit API failed — please try again later')
        }
      } catch (err) {
        console.error('Error calling audit API', err)
      }

      setUrl('')
      router.refresh() // Shows the updated state in the list
    } finally {
      setLoading(false)
    }
};

  return (
    <form onSubmit={startAudit} className="w-full max-w-2xl mx-auto">
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
          disabled={loading}
          className="absolute right-3 bg-black text-white px-8 py-4 rounded-3xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Run Audit'}
        </button>
      </div>
    </form>
  )
}