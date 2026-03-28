'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { History, LayoutGrid, Sparkles } from 'lucide-react'
import { Settings } from 'lucide-react'

type DashboardNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: DashboardNavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    isActive: (pathname) => pathname === '/dashboard' || pathname.startsWith('/dashboard/audit/'),
  },
  {
    href: '/dashboard/history',
    label: 'History',
    icon: History,
    isActive: (pathname) => pathname.startsWith('/dashboard/history'),
  },
  {
    href: '/dashboard/predict',
    label: 'Predict',
    icon: Sparkles,
    isActive: (pathname) => pathname.startsWith('/dashboard/predict'),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="print-hide group/dashboard fixed left-0 z-[65] border-r border-black/10 dark:border-slate-700 bg-white/90 dark:bg-slate-900/92 backdrop-blur-xl shadow-sm w-14 sm:w-16 hover:w-44 transition-[width] duration-200 ease-out overflow-hidden"
      style={{ top: 'var(--announcement-offset, 0px)', height: 'calc(100vh - var(--announcement-offset, 0px))' }}
      aria-label="Dashboard navigation"
    >
      <nav className="p-1.5 sm:p-2 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center h-11 rounded-xl px-3 transition-colors ${
                active
                  ? 'bg-black text-white dark:bg-white dark:text-slate-900'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="ml-3 text-sm font-semibold whitespace-nowrap opacity-0 -translate-x-1 group-hover/dashboard:opacity-100 group-hover/dashboard:translate-x-0 transition-all duration-200">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
