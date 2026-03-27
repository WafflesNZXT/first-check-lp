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
      className="fixed z-40 bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:bottom-8 bg-black text-white px-5 sm:px-6 py-3 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <MailIcon className="w-4 h-4" />
      {loading ? 'Sending...' : 'Email Me This Audit'}
    </button>
  )
}
