import { Roboto } from 'next/font/google'
import DashboardThemeShell from '@/components/DashboardThemeShell'
import DashboardSidebar from '@/components/DashboardSidebar'
import DashboardTutorial from '@/components/DashboardTutorial'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeShell fontClassName={roboto.className}>
      <div className="flex xl:block">
        <DashboardSidebar />
        <DashboardTutorial />
        <div className="min-w-0 flex-1 xl:pl-[64px]">{children}</div>
      </div>
    </DashboardThemeShell>
  )
}
