'use client'

import { useEffect } from 'react'

export default function DashboardBoot() {
  useEffect(() => {
    const controller = new AbortController()

    void fetch('/api/send-welcome', {
      method: 'POST',
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // non-blocking best-effort task
    })

    return () => controller.abort()
  }, [])

  return null
}
