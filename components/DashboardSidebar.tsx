'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, LayoutGrid, PlugZap, Settings } from 'lucide-react'
import { LogoMark } from '@/components/Logo'

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
    label: 'Audits',
    icon: FileText,
    isActive: (pathname) => pathname.startsWith('/dashboard/history'),
  },
  {
    href: '/dashboard/predict',
    label: 'Analytics',
    icon: BarChart3,
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
      className="print-hide group fixed bottom-0 left-0 right-0 z-[65] border-t border-black/10 bg-white/95 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:bottom-auto lg:right-auto lg:top-[var(--announcement-offset,0px)] lg:h-[calc(100vh-var(--announcement-offset,0px))] lg:w-16 lg:overflow-hidden lg:border-r lg:border-t-0 lg:shadow-none lg:transition-[width] lg:duration-200 lg:ease-out lg:hover:w-56"
      aria-label="Dashboard navigation"
    >
      <div className="hidden h-full flex-col px-2 py-3 lg:flex">
        <Link href="/dashboard" className="flex h-12 items-center gap-3 rounded-2xl px-1.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/10 dark:bg-slate-900 dark:ring-slate-700">
            <LogoMark size={25} />
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-xl font-black tracking-tight text-black opacity-0 transition-all duration-200 group-hover:max-w-32 group-hover:opacity-100 dark:text-white">
            audo
          </span>
        </Link>

        <p className="mt-8 max-w-0 overflow-hidden px-3 text-[9px] font-black uppercase tracking-[0.28em] text-gray-400 opacity-0 transition-all duration-200 group-hover:max-w-44 group-hover:opacity-100">
          Workspace
        </p>

        <nav className="mt-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = item.isActive(pathname)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-all ${
                  active
                    ? 'bg-[#f4f4f2] text-black shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-gray-500 hover:bg-[#f4f4f2] hover:text-black dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-36 group-hover:opacity-100">{item.label}</span>
              </Link>
            )
          })}
          <div className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-gray-400 dark:text-slate-500" title="Integrations">
            <PlugZap className="h-5 w-5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-36 group-hover:opacity-100">Integrations</span>
          </div>
        </nav>

        <div className="mt-auto overflow-hidden rounded-2xl border border-black/5 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white ring-1 ring-black/10 dark:bg-slate-950 dark:ring-slate-700">
            <LogoMark size={22} />
          </span>
          <div className="max-h-0 w-[184px] opacity-0 transition-all duration-200 group-hover:max-h-44 group-hover:opacity-100">
            <h2 className="mt-5 text-lg font-black tracking-tight text-black dark:text-white">Upgrade to Pro</h2>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">Unlimited audits, agents, and history.</p>
            <Link href="/pricing" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#151515] text-xs font-black text-white dark:bg-white dark:text-slate-950">
              Upgrade
            </Link>
          </div>
        </div>
      </div>

      <nav className="grid grid-cols-4 gap-1 p-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-12 flex-col items-center justify-center rounded-2xl px-2 text-[10px] font-black transition-colors ${
                active
                  ? 'bg-black text-white dark:bg-white dark:text-slate-950'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="mt-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
