'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type TopbarAudit = {
  id: string
  website_url: string
  created_at: string
  status: string
}

function domainFromUrl(value: string) {
  return String(value || '').replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export default function DashboardTopbar({
  audits,
  userId,
  email,
}: {
  audits: TopbarAudit[]
  userId: string
  email: string | null
}) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [finishedAudits, setFinishedAudits] = useState<TopbarAudit[]>([])
  const router = useRouter()

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return audits.slice(0, 5)

    return audits
      .filter((audit) => domainFromUrl(audit.website_url).toLowerCase().includes(normalized))
      .slice(0, 5)
  }, [audits, query])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-finished-audits')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits', filter: `user_id=eq.${userId}` }, (payload) => {
        const next = payload.new as TopbarAudit | null
        const previous = payload.old as Partial<TopbarAudit> | null
        if (!next || next.status !== 'completed' || previous?.status === 'completed') return

        setFinishedAudits((current) => [next, ...current].slice(0, 6))

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Audo audit finished', {
            body: `${domainFromUrl(next.website_url)} is ready to review.`,
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const goToFirstSuggestion = () => {
    const first = suggestions[0]
    if (!first) return
    router.push(`/dashboard/audit/${first.id}`)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative hidden md:block">
        <label className="flex h-11 w-72 items-center gap-2 rounded-xl audo-panel border px-3 text-sm text-gray-500 shadow-sm">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                goToFirstSuggestion()
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-black outline-none placeholder:text-gray-400"
            placeholder="Search audits"
          />
        </label>

        {isFocused && suggestions.length > 0 && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 overflow-hidden rounded-2xl audo-panel border p-1.5 shadow-xl">
            {suggestions.map((audit) => (
              <Link
                key={audit.id}
                href={`/dashboard/audit/${audit.id}`}
                className="block rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50"
              >
                <span className="block truncate font-bold text-black">{domainFromUrl(audit.website_url)}</span>
                <span className="mt-0.5 block text-xs text-gray-400">{new Date(audit.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={requestNotifications}
        className="relative grid h-11 w-11 place-items-center rounded-xl audo-panel border text-black shadow-sm"
        aria-label="Enable audit notifications"
        title={finishedAudits[0] ? `${domainFromUrl(finishedAudits[0].website_url)} finished` : 'Enable audit notifications'}
      >
        <Bell className="h-4 w-4" />
        {finishedAudits.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
      </button>

      <Link
        href="/dashboard/settings"
        className="grid h-11 w-11 place-items-center rounded-full bg-black text-sm font-black text-white"
        title="Open settings"
      >
        {String(email || 'A').slice(0, 1).toUpperCase()}
      </Link>
    </div>
  )
}
