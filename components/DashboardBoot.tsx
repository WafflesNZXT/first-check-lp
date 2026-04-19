'use client'

import { useEffect, useRef } from 'react'

export default function DashboardBoot({ userId }: { userId: string }) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (typeof window !== 'undefined') {
      const storageKey = `welcome-email-attempted:${userId}`
      const alreadyAttempted = window.sessionStorage.getItem(storageKey)
      if (alreadyAttempted === '1') return
      window.sessionStorage.setItem(storageKey, '1')
    }

    const controller = new AbortController()

    void (async () => {
      try {
        const response = await fetch('/api/send-welcome', {
          method: 'POST',
          signal: controller.signal,
          keepalive: true,
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          console.error('Welcome email request failed', payload)
        }
      } catch {
        // non-blocking best-effort task
      }
    })()

    return () => controller.abort()
  }, [userId])

  return null
}
