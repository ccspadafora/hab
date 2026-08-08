'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/inicio', label: 'Inicio' },
  { href: '/publicar/inmueble', label: 'Publicar' },
  { href: '/mis-inmuebles', label: 'Mis inmuebles' },
  { href: '/mensajes', label: 'Mensajes' },
  { href: '/notificaciones', label: 'Notificaciones' },
  { href: '/perfil/datos', label: 'Perfil' },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/inicio') return pathname === '/inicio'
    if (href === '/publicar/inmueble') return pathname.startsWith('/publicar')
    if (href === '/perfil/datos') return pathname.startsWith('/perfil')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <div className="auth-mobile-bar">
        <Link href="/inicio" className="auth-mobile-bar__brand">
          HAB
        </Link>
        <button
          type="button"
          className="auth-mobile-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      <aside className={cn('auth-sidebar', open && 'auth-sidebar--open')}>
        <Link href="/inicio" className="auth-sidebar__brand" onClick={() => setOpen(false)}>
          HAB
          <span>Portal propietarios</span>
        </Link>

        <nav className="auth-sidebar__nav" aria-label="Navegación principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'auth-sidebar__link',
                isActive(item.href) && 'auth-sidebar__link--active',
              )}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button type="button" className="auth-sidebar__logout" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>
    </>
  )
}
