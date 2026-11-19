import DashboardThemeShell from '@/components/DashboardThemeShell'
import DashboardSidebar from '@/components/DashboardSidebar'
import DashboardTutorial from '@/components/DashboardTutorial'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeShell fontClassName="font-sans">
      <div className="min-h-screen audo-dashboard-surface lg:flex">
        <DashboardSidebar />
        <DashboardTutorial />
        <main className="min-w-0 flex-1 lg:pl-16">{children}</main>
      </div>
    </DashboardThemeShell>
  )
}
