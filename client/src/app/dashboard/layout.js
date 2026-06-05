import { Sidebar } from '@/components/shared/Sidebar'
import { BottomNav } from '@/components/shared/BottomNav'

export default function DashboardLayout({ children }) {
  return (
    <div
      style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}
      className="flex"
    >
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        style={{ background: 'var(--color-page-bg)' }}
        className="flex-1 overflow-y-auto pb-20 lg:pb-0"
      >
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
