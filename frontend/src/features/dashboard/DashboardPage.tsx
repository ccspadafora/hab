import { useDashboardStats } from '../../api/hooks'
import styles from './DashboardPage.module.css'

const KPI_CONFIG = [
  { key: 'predios_total',      icon: '🏘️', label: 'Total predios',          sub: 'en seguimiento' },
  { key: 'predios_viables',    icon: '✅', label: 'Predios viables',         sub: 'listos para proyecto' },
  { key: 'predios_nuevos',     icon: '🔍', label: 'Predios nuevos',          sub: 'sin analizar' },
  { key: 'propietarios_total', icon: '🏠', label: 'Propietarios',            sub: 'en el CRM' },
  { key: 'leads_activos',      icon: '🤝', label: 'Leads activos',           sub: 'en pipeline' },
  { key: 'proyectos_activos',  icon: '🏗️', label: 'Proyectos activos',       sub: 'en gestión' },
  { key: 'conversaciones_hoy', icon: '💬', label: 'Conversaciones activas',  sub: 'WhatsApp bot' },
] as const

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats()

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />HAB Platform</div>
          <h1 className="h-med">Dashboard</h1>
        </div>
        <div className={styles.dateChip}>
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {KPI_CONFIG.map(({ key, icon, label, sub }) => (
          <div key={key} className="kpi-card">
            <div className={styles.kpiIcon}>{icon}</div>
            <div className="kpi-n">
              {isLoading ? '—' : isError ? '!' : stats?.[key] ?? 0}
            </div>
            <div className="kpi-l">{label}</div>
            <div className="kpi-s">{sub}</div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className={styles.quickSection}>
        <div className="section-label" style={{ marginBottom: 16 }}>
          <span className="line" />Accesos rápidos
        </div>
        <div className={styles.quickGrid}>
          {[
            { href: '/predios',      icon: '🔍', t: 'Ver predios nuevos',     d: 'Revisar pipeline de propiedades' },
            { href: '/leads',        icon: '🤝', t: 'Gestionar leads',        d: 'CRM y seguimiento de propietarios' },
            { href: '/chat',         icon: '💬', t: 'Inbox WhatsApp',         d: 'Conversaciones activas del bot' },
            { href: '/proyectos',    icon: '🏗️', t: 'Pipeline proyectos',     d: 'Estado de proyectos en gestión' },
          ].map(({ href, icon, t, d }) => (
            <a key={href} href={href} className={styles.quickCard}>
              <div className={styles.quickIcon}>{icon}</div>
              <div>
                <p className={styles.quickTitle}>{t}</p>
                <p className={styles.quickDesc}>{d}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
