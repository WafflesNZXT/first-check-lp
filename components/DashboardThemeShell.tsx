'use client'

import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

type Theme = 'light' | 'dark'

const SESSION_THEME_KEY = 'dashboard-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = sessionStorage.getItem(SESSION_THEME_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export default function DashboardThemeShell({ children, fontClassName }: { children: React.ReactNode, fontClassName: string }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    sessionStorage.setItem(SESSION_THEME_KEY, theme)
  }, [theme])

  return (
    <div className={`${fontClassName} ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="print-hide fixed right-4 md:right-6 z-[70]" style={{ top: 'calc(var(--announcement-offset, 0px) + 12px)' }}>
        <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))} />
      </div>
      {children}
    </div>
  )
}
