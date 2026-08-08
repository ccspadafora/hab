import { ConstructoraSidebar } from '@/components/layout/ConstructoraSidebar'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <ConstructoraSidebar />
      <main className="auth-shell__main">{children}</main>
    </div>
  )
}
