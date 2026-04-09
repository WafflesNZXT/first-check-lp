'use client'

import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

type Theme = 'light' | 'dark'

const SESSION_THEME_KEY = 'dashboard-theme'

export default function DashboardThemeShell({ children, fontClassName }: { children: React.ReactNode, fontClassName: string }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_THEME_KEY)
    const initialTheme: Theme = stored === 'dark' ? 'dark' : 'light'

    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    setIsHydrated(true)

    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    sessionStorage.setItem(SESSION_THEME_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme, isHydrated])

  return (
    <div className={`${fontClassName} ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="print-hide fixed right-4 md:right-6 z-[70]" style={{ top: 'calc(var(--announcement-offset, 0px) + 12px)' }}>
        <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))} />
      </div>
      {children}
    </div>
  )
}
