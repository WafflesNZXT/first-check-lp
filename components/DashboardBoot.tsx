'use client'

import { useEffect } from 'react'

export default function DashboardBoot() {
  useEffect(() => {
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
  }, [])

  return null
}
