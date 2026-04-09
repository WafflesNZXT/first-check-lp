'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, LogOut } from 'lucide-react'

type DashboardHeaderActionsProps = {
  className?: string
  showBackHome?: boolean
}

export default function DashboardHeaderActions({ className = '', showBackHome = true }: DashboardHeaderActionsProps) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBackHome && (
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Back to home
        </Link>
      )}

      <form
        action="/auth/signout"
        method="post"
      >
        <button
          type="button"
          onClick={() => setShowSignOutConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-black/15 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-black dark:hover:text-white hover:border-black/25 dark:hover:border-slate-500 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>

        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-[0_20px_55px_rgba(0,0,0,0.25)]">
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">Sign out?</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">You&apos;ll need to log back in to access the dashboard again.</p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="rounded-full border border-black/15 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
