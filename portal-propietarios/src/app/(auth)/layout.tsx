import { SidebarNav } from '@/components/layout/SidebarNav'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <SidebarNav />
      <main className="auth-main">{children}</main>
    </div>
  )
}
