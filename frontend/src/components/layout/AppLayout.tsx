import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/authStore'
import { usePermissionsStore, type ModuloKey } from '../../features/auth/permissionsStore'
import { NotificationBell } from '../../features/notifications/NotificationBell'
import { WhatsAppToast }    from '../../features/notifications/WhatsAppToast'
import styles from './AppLayout.module.css'

interface NavItem { to: string; icon: string; label: string; modulo: ModuloKey }

const NAV_ITEMS: NavItem[] = [
  { to: '/',                       icon: '📊', label: 'Dashboard',       modulo: 'dashboard' },
  { to: '/predios',                icon: '🏘️', label: 'Predios',         modulo: 'predios' },
  { to: '/propietarios',           icon: '🏠', label: 'Propietarios',    modulo: 'propietarios' },
  { to: '/leads',                  icon: '🤝', label: 'Leads / CRM',     modulo: 'leads' },
  { to: '/calendario',             icon: '📅', label: 'Calendario',      modulo: 'calendario' },
  { to: '/chat',                   icon: '💬', label: 'WhatsApp Bot',    modulo: 'bot' },
  { to: '/proyectos',              icon: '🏗️', label: 'Proyectos',       modulo: 'proyectos' },
  { to: '/financiero',             icon: '📈', label: 'Financiero',      modulo: 'financiero' },
  { to: '/ia/conocimiento',        icon: '🤖', label: 'Documentos IA',   modulo: 'ia' },
  { to: '/ia/prompts',             icon: '💡', label: 'Prompts IA',      modulo: 'ia' },
  { to: '/configuracion/ia',       icon: '🧠', label: 'Config IA',       modulo: 'configuracion' },
  { to: '/configuracion/scraping', icon: '⚙️', label: 'Configuración',   modulo: 'configuracion' },
  { to: '/usuarios',               icon: '👥', label: 'Usuarios',        modulo: 'usuarios' },
]

// Títulos de página por ruta
const PAGE_TITLES: Record<string, string> = {
  '/':                       'Dashboard',
  '/predios':                'Predios',
  '/propietarios':           'Propietarios',
  '/leads':                  'Leads — CRM',
  '/calendario':             'Calendario',
  '/chat':                   'WhatsApp Bot',
  '/proyectos':              'Pipeline de Proyectos',
  '/financiero':             'Dashboard Financiero',
  '/ia/conocimiento':        'Base de Conocimiento IA',
  '/ia/prompts':             'Prompts IA',
  '/configuracion/ia':       'Configuración IA',
  '/configuracion/scraping': 'Configuración Scraping',
  '/usuarios':               'Usuarios y Roles',
  '/usuarios/permisos':      'Permisos por Rol',
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin', admin: 'Admin', administrativo: 'Administrativo',
  finanzas: 'Finanzas', estructuracion: 'Estructuración', comercial: 'Comercial',
  analista: 'Analista', asesor: 'Asesor', gerente: 'Gerente',
}

export default function AppLayout() {
  const { user, logout }  = useAuthStore()
  const { canView }       = usePermissionsStore()
  const navigate          = useNavigate()
  const location          = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  const visibleItems = NAV_ITEMS.filter(item => canView(item.modulo))

  // Título de la página actual
  const pageTitle = Object.entries(PAGE_TITLES)
    .find(([path]) => location.pathname === path || location.pathname.startsWith(path + '/'))
    ?.[1] ?? 'HAB Platform'

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>HAB</span>
          <span className={styles.logoSub}>Platform</span>
        </div>

        <nav className={styles.nav}>
          {visibleItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.userBlock}>
          <div className={styles.userAvatar}>
            {user?.first_name?.[0] ?? user?.username?.[0] ?? 'U'}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </p>
            <p className={styles.userRole}>
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'}
            </p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">↩</button>
        </div>
      </aside>

      {/* ── Área principal ── */}
      <div className={styles.mainWrap}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h2 className={styles.pageTitle}>{pageTitle}</h2>
          </div>
          <div className={styles.topBarRight}>
            {/* Indicador de IA */}
            <span className={styles.iaIndicator}>
              <span className={styles.iaDot} />
              IA activa
            </span>
            {/* Campana */}
            <NotificationBell />
            {/* Avatar compacto */}
            <div className={styles.topAvatar} title={user?.username}>
              {user?.first_name?.[0] ?? user?.username?.[0] ?? 'U'}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* ── Toast WhatsApp (flotante en toda la app) ── */}
      <WhatsAppToast />
    </div>
  )
}
