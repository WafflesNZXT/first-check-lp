'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecentAuditsRefreshButton() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    router.refresh()
    window.setTimeout(() => setIsRefreshing(false), 900)
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
    >
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}
