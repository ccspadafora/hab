'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { href: '/inicio', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/mis-intereses', label: 'Mis intereses' },
  { href: '/negociaciones', label: 'Negociaciones' },
  { href: '/perfil/empresa', label: 'Perfil' },
]

export function ConstructoraSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <aside className="auth-sidebar">
      <div className="auth-sidebar__brand">
        <Link href="/inicio">HAB</Link>
        <span>Constructoras</span>
      </div>

      <nav className="auth-sidebar__nav" aria-label="Área autenticada">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/inicio' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'auth-sidebar__link is-active' : 'auth-sidebar__link'}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="auth-sidebar__footer">
        {user?.email ? <p className="auth-sidebar__email">{user.email}</p> : null}
        <button type="button" className="btn-secondary" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
