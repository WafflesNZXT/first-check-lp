"use client"

import { useState } from 'react'
import { MailIcon } from 'lucide-react'

export default function EmailAuditButton({ email, auditData, hostname }: { email: string, auditData: any, hostname: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/send-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, auditData, hostname }),
      })

      if (res.ok) {
        alert('Audit sent to your inbox!')
      } else {
        const text = await res.text()
        alert('Failed to send audit: ' + text)
      }
    } catch (err: any) {
      alert('Error sending audit: ' + String(err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-[360px] sm:w-auto sm:max-w-none sm:left-auto sm:translate-x-0 sm:right-8 sm:bottom-8 bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-base sm:text-sm font-bold shadow-2xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-60"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      <MailIcon className="w-4 h-4 shrink-0" />
      {loading ? 'Sending...' : 'Email Me This Audit'}
    </button>
  )
}
