import { useProyectos } from '../../api/hooks'
import type { Proyecto } from '../../types/models'
import styles from './DashboardFinancieroPage.module.css'

const f  = (n: string | null) => n ? `$${(Number(n) / 1_000_000_000).toFixed(2)}B` : '—'
const fm = (n: string | null) => n ? `$${(Number(n) / 1_000_000).toFixed(0)}M` : '—'

export default function DashboardFinancieroPage() {
  const { data } = useProyectos()
  const proyectos: Proyecto[] = data?.results ?? []

  const totalValor = proyectos.reduce((s, p) => s + Number(p.valor_total_estimado ?? 0), 0)
  const totalFee   = proyectos.reduce((s, p) => s + Number(p.fee_estructuracion ?? 0), 0)
  const activos    = proyectos.filter(p => !['descartado','entregado'].includes(p.fase)).length
  const entregados = proyectos.filter(p => p.fase === 'entregado').length

  const FASES_LABEL: Record<string, string> = {
    estructuracion: 'Estructuración', presentado: 'Presentado',
    en_negociacion: 'En negociación', promesa: 'Promesa',
    en_obra: 'En obra', entregado: 'Entregado', descartado: 'Descartado',
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />📈 Gerencia</div>
          <h1 className="h-med">Dashboard Financiero</h1>
        </div>
      </div>

      {/* KPIs principales */}
      <div className={styles.kpiGrid}>
        {[
          { icon: '🏗️', n: activos,                       l: 'Proyectos activos',       s: 'en pipeline' },
          { icon: '💰', n: f(String(totalValor)),          l: 'Valor total del portafolio', s: 'proyectos activos' },
          { icon: '🏠', n: fm(String(totalFee)),           l: 'Fees estructuración',     s: 'acumulados' },
          { icon: '✅', n: entregados,                     l: 'Proyectos entregados',    s: 'historial' },
        ].map(({ icon, n, l, s }) => (
          <div key={l} className="kpi-card">
            <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
            <div className="kpi-n">{String(n)}</div>
            <div className="kpi-l">{l}</div>
            <div className="kpi-s">{s}</div>
          </div>
        ))}
      </div>

      {/* Tabla de proyectos */}
      <div className={styles.section}>
        <div className="section-label" style={{ marginBottom: 14 }}>
          <span className="line" />Portafolio de proyectos
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Proyecto</th>
                <th>Fase</th>
                <th>Valor estimado</th>
                <th>Fee estructuración</th>
                <th>Gerente</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map(p => (
                <tr key={p.id}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 900,
                      fontSize: 11, color: 'var(--amarillo)',
                      background: 'var(--verde)', padding: '2px 8px', borderRadius: 100
                    }}>
                      {p.codigo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--blanco)' }}>{p.nombre}</td>
                  <td>
                    <span className="badge badge-amarillo">
                      {FASES_LABEL[p.fase] ?? p.fase}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--positivo)' }}>
                    {fm(p.valor_total_estimado)}
                  </td>
                  <td style={{ color: 'var(--amarillo)', fontWeight: 600 }}>
                    {fm(p.fee_estructuracion)}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                    {p.gerente_nombre}
                  </td>
                </tr>
              ))}
              {!proyectos.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '32px' }}>
                    Sin proyectos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Por fase */}
      <div className={styles.faseSection}>
        <div className="section-label" style={{ marginBottom: 14 }}>
          <span className="line" />Proyectos por fase
        </div>
        <div className={styles.faseGrid}>
          {Object.entries(FASES_LABEL).map(([key, label]) => {
            const count = proyectos.filter(p => p.fase === key).length
            return (
              <div key={key} className={styles.faseItem}>
                <span className={styles.faseN}>{count}</span>
                <span className={styles.faseL}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
