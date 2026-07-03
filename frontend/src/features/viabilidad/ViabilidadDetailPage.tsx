import { useParams, Link } from 'react-router-dom'
import { useAnalisis } from '../../api/hooks'
import styles from './ViabilidadDetailPage.module.css'

const f  = (n: number | null | undefined) => n != null ? `$${(n / 1_000_000).toFixed(1)}M` : '—'
const fp = (n: number | null | undefined) => n != null ? `${Number(n).toFixed(1)}%` : '—'

export default function ViabilidadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: a, isLoading } = useAnalisis(Number(id))

  if (isLoading) return <p className={styles.loading}>Cargando análisis…</p>
  if (!a) return <p className={styles.loading}>Análisis no encontrado.</p>

  const scoreColor = !a.score_viabilidad ? '#aaa'
    : a.score_viabilidad >= 70 ? 'var(--positivo)'
    : a.score_viabilidad >= 50 ? 'var(--amarillo)'
    : 'var(--negativo)'

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/predios">← Predios</Link>
        <span>/</span>
        <span>Análisis #{a.id}</span>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div>
          <div className="section-label"><span className="line" />📐 Viabilidad normativa</div>
          <h1 className="h-med" style={{ marginBottom: 8 }}>Análisis de Viabilidad</h1>
          <p className="body-sm">Predio #{a.predio} · {a.zona_pot || 'Zona POT pendiente'}</p>
        </div>
        <div className={styles.verdict} style={{ borderColor: scoreColor }}>
          <div className={styles.verdictScore} style={{ color: scoreColor }}>
            {a.score_viabilidad ?? '—'}
          </div>
          <div className={styles.verdictLabel}>Score IA</div>
          <div className={styles.verdictTag} style={{ color: scoreColor }}>
            {a.es_viable === true ? '✅ VIABLE'
              : a.es_viable === false ? '❌ NO VIABLE'
              : '⏳ PENDIENTE'}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Datos POT */}
        <div className="card">
          <h3 className={styles.secTitle}>🏛️ Normativa POT</h3>
          <div className={styles.dataGrid}>
            {[
              ['Zona POT',             a.zona_pot || '—'],
              ['Índice construcción',  a.indice_construccion ?? '—'],
              ['Índice ocupación',     a.indice_ocupacion ?? '—'],
              ['Altura máx. pisos',    a.altura_max_pisos ?? '—'],
              ['Uso suelo',            a.uso_suelo || '—'],
              ['Densidad máx. uds',    a.densidad_max_uds ?? '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.row}>
                <span className={styles.dk}>{k}</span>
                <span className={styles.dv}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Proyección financiera */}
        <div className="card">
          <h3 className={styles.secTitle}>💰 Proyección financiera</h3>
          <div className={styles.dataGrid}>
            {[
              ['Área edificable',      a.area_edificable ? `${a.area_edificable} m²` : '—'],
              ['Unidades proyectadas', a.unidades_proyectadas ?? '—'],
              ['Precio m² nuevo',      a.precio_m2_nuevo ? `$${Number(a.precio_m2_nuevo).toLocaleString('es-CO')}` : '—'],
              ['Valor bruto proyecto', f(a.valor_bruto_proyecto)],
              ['Costo construcción',   f(a.costo_construccion)],
              ['Valor máx. predio',    f(a.valor_max_predio)],
              ['Utilidad estimada',    f(a.utilidad_estimada)],
              ['Margen estimado',      fp(a.margen_estimado)],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.row}>
                <span className={styles.dk}>{k}</span>
                <span className={styles.dv}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Justificación IA */}
        {a.justificacion_ia && (
          <div className={styles.iaCard}>
            <div className="section-label" style={{ marginBottom: 14 }}>
              <span className="line" />🤖 Justificación IA
            </div>
            <div className={styles.bullets}>
              {a.justificacion_ia.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className="body-sm" style={{ marginBottom: 6 }}>→ {line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="card">
          <h3 className={styles.secTitle}>⏱️ Tiempos</h3>
          <div className={styles.dataGrid}>
            <div className={styles.row}>
              <span className={styles.dk}>Solicitado</span>
              <span className={styles.dv}>{new Date(a.solicitado_en).toLocaleString('es-CO')}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.dk}>Completado</span>
              <span className={styles.dv}>{a.completado_en ? new Date(a.completado_en).toLocaleString('es-CO') : 'Pendiente'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
