"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from './ProgressBar'

export default function AuditStatus({ audit }: { audit: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const cancelAudit = async () => {
    if (!confirm('Cancel this audit run?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/audit/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: audit.id }),
      })
      if (!res.ok) throw new Error('Cancel failed')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to cancel audit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {audit.status === 'processing' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="w-full sm:w-3/4">
              <ProgressBar status={audit.status} />
            </div>
            <div className="sm:pl-4">
              <button
                onClick={cancelAudit}
                disabled={loading}
                className="w-full sm:w-auto bg-red-50 text-red-600 px-4 py-2 rounded-2xl font-bold hover:bg-red-100 disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel run'}
              </button>
            </div>
          </div>
        </div>
      )}

      {audit.status === 'cancelled' && (
        <div className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl font-bold">Run cancelled</div>
      )}

      {/* don't show the green 'Audit complete' pill; audit result is visible below */}
    </div>
  )
}
