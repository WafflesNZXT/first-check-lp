import { Roboto } from 'next/font/google'
import DashboardThemeShell from '@/components/DashboardThemeShell'
import DashboardSidebar from '@/components/DashboardSidebar'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeShell fontClassName={roboto.className}>
      <DashboardSidebar />
      <div className="pl-[84px] sm:pl-[92px]">{children}</div>
    </DashboardThemeShell>
  )
}
