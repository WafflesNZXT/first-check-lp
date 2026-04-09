'use client'

import { useEffect, useRef, useState } from 'react'

export default function StripeCheckoutConfirm({ sessionId }: { sessionId?: string }) {
  const [error, setError] = useState<string | null>(null)
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (!sessionId || hasAttempted.current) return

    hasAttempted.current = true

    ;(async () => {
      try {
        const response = await fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(String(payload?.error || 'Could not confirm upgrade yet'))
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not confirm upgrade yet')
      }
    })()
  }, [sessionId])

  if (!sessionId || !error) return null

  return (
    <section className="mb-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs font-semibold text-amber-800">
          Upgrade confirmation is still syncing. Refresh in a moment, or contact support if this persists.
        </p>
      </div>
    </section>
  )
}
