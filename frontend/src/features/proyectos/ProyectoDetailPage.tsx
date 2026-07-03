import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProyecto, useGenerarEstructuracion } from '../../api/hooks'
import { Modal } from '../../components/ui/Modal'
import ProyectoForm from './ProyectoForm'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import styles from './ProyectoDetailPage.module.css'

const fmt    = (n: string | null | undefined) => n ? `$${(Number(n)/1_000_000).toFixed(1)}M` : '—'
const fmtPct = (n: string | null | undefined) => n ? `${Number(n).toFixed(1)}%` : '—'

const FASE_LABELS: Record<string, string> = {
  estructuracion: 'Estructuración', presentado: 'Presentado',
  en_negociacion: 'En negociación', promesa: 'Promesa',
  en_obra: 'En obra', entregado: 'Entregado', descartado: 'Descartado',
}

export default function ProyectoDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const qc      = useQueryClient()
  const { data: p, isLoading } = useProyecto(Number(id))
  const generar   = useGenerarEstructuracion()
  const [showEdit, setShowEdit] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
  const [addHitoOpen, setAddHitoOpen] = useState(false)
  const [newHito, setNewHito] = useState({ tipo: '', descripcion: '', fecha_planeada: '' })

  if (isLoading) return <p className={styles.loading}>Cargando proyecto…</p>
  if (!p) return <p className={styles.loading}>Proyecto no encontrado.</p>

  const ext = p as typeof p & {
    estructuracion_vigente?: { id: number; version: number; margen_neto: string; roi: string; ingresos_brutos: string; costo_total: string; generada_por_ia: boolean; creada_en: string }
    hitos?: Array<{ id: number; tipo: string; descripcion: string; fecha_planeada: string; fecha_real: string | null; completado: boolean }>
    propietarios_detalle?: Array<{ id: number; propietario: number; propietario_nombre: string; porcentaje_aporte: string; firmado: boolean }>
    progreso?: number
  }

  const hitos     = ext.hitos ?? []
  const progreso  = ext.progreso ?? 0
  const completados = hitos.filter(h => h.completado).length

  const toggleHito = async (hitoId: number) => {
    setToggling(hitoId)
    try {
      await apiClient.patch(`/proyectos/${id}/hito/${hitoId}/toggle/`)
      qc.invalidateQueries({ queryKey: ['proyecto', Number(id)] })
    } finally { setToggling(null) }
  }

  const crearHito = async () => {
    if (!newHito.tipo || !newHito.fecha_planeada) return
    await apiClient.post(`/proyectos/${id}/hito/`, newHito)
    qc.invalidateQueries({ queryKey: ['proyecto', Number(id)] })
    setAddHitoOpen(false)
    setNewHito({ tipo: '', descripcion: '', fecha_planeada: '' })
  }

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/proyectos">← Proyectos</Link><span>/</span><span>{p.codigo}</span>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.codigo}>{p.codigo}</span>
          <h1 className="h-med" style={{ marginBottom: 8 }}>{p.nombre}</h1>
          <div className={styles.heroBadges}>
            <span className="badge badge-verde">{FASE_LABELS[p.fase] ?? p.fase}</span>
            <span className={styles.gerente}>👤 {p.gerente_nombre}</span>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroKpis}>
            {[
              { l: 'Valor total', v: fmt(p.valor_total_estimado) },
              { l: 'Fee estructuración', v: fmt(p.fee_estructuracion) },
            ].map(({ l, v }) => (
              <div key={l} className={styles.heroKpi}>
                <span className={styles.heroKpiV}>{v}</span>
                <span className={styles.heroKpiL}>{l}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>✏️ Editar proyecto</button>
        </div>
      </div>

      {/* Modal editar */}
      {showEdit && (
        <Modal title="✏️ Editar Proyecto" onClose={() => setShowEdit(false)} wide>
          <ProyectoForm proyecto={p} onClose={() => setShowEdit(false)}
            onSaved={() => qc.invalidateQueries({ queryKey: ['proyecto', Number(id)] })} />
        </Modal>
      )}

      {/* Barra de progreso */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Progreso del proyecto</span>
          <span className={styles.progressPct}>{progreso}%</span>
          <span className={styles.progressMeta}>{completados} de {hitos.length} hitos completados</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progreso}%` }} />
        </div>
      </div>

      <div className={styles.grid}>
        {/* Estructuración vigente */}
        {ext.estructuracion_vigente ? (
          <div className={styles.estCard}>
            <div className={styles.estHeader}>
              <div>
                <p className={styles.estLabel}>ESTRUCTURACIÓN VIGENTE</p>
                <p className={styles.estVersion}>v{ext.estructuracion_vigente.version}{ext.estructuracion_vigente.generada_por_ia && ' · 🤖 IA'}</p>
              </div>
              <Link to={`/proyectos/${p.id}/estructuracion`} className="btn btn-primary"
                style={{ fontSize: 11, padding: '8px 16px' }}>Ver completa →</Link>
            </div>
            <div className={styles.estMetrics}>
              {[
                { l: 'Ingresos brutos', v: fmt(ext.estructuracion_vigente.ingresos_brutos) },
                { l: 'Costo total',     v: fmt(ext.estructuracion_vigente.costo_total) },
                { l: 'Margen neto',     v: fmtPct(ext.estructuracion_vigente.margen_neto), pos: Number(ext.estructuracion_vigente.margen_neto) > 15 },
                { l: 'ROI',             v: fmtPct(ext.estructuracion_vigente.roi), pos: Number(ext.estructuracion_vigente.roi) > 20 },
              ].map(({ l, v, pos }) => (
                <div key={l} className={styles.estMetric}>
                  <span className={styles.estMetricV} style={{ color: pos === false ? 'var(--negativo)' : pos ? 'var(--positivo)' : 'var(--amarillo)' }}>{v}</span>
                  <span className={styles.estMetricL}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`card ${styles.noEst}`}>
            <p style={{ color: '#aaa' }}>Sin estructuración financiera aún.</p>
            <button className="btn btn-primary" onClick={() => generar.mutate(p.id)} disabled={generar.isPending}>
              🤖 {generar.isPending ? 'Generando con IA…' : 'Generar estructuración con IA'}
            </button>
          </div>
        )}

        {/* Hitos */}
        <div className="card">
          <div className={styles.secHeaderRow}>
            <h3 className={styles.secTitle}>🏁 Hitos del proyecto</h3>
            <button className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 10px' }}
              onClick={() => setAddHitoOpen(true)}>+ Agregar hito</button>
          </div>
          <div className={styles.hitos}>
            {hitos.length === 0 && <p className="body-sm">Sin hitos. Agrega el primero.</p>}
            {hitos.map(h => (
              <div key={h.id} className={`${styles.hito} ${h.completado ? styles.hitoOk : ''}`}>
                <button
                  className={styles.hitoCheck}
                  onClick={() => toggleHito(h.id)}
                  disabled={toggling === h.id}
                  title={h.completado ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                  {toggling === h.id ? '⏳' : h.completado ? '✅' : '⬜'}
                </button>
                <div style={{ flex: 1 }}>
                  <p className={styles.hitoTipo}>{h.tipo}</p>
                  <p className={styles.hitoDesc}>{h.descripcion}</p>
                  <p className={styles.hitoFecha}>
                    📅 Planeado: {h.fecha_planeada}
                    {h.fecha_real && <span style={{ marginLeft: 8, color: 'var(--positivo)' }}>✅ Real: {h.fecha_real}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Propietarios del proyecto */}
        {(ext.propietarios_detalle ?? []).length > 0 && (
          <div className="card">
            <h3 className={styles.secTitle}>🏠 Propietarios</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ext.propietarios_detalle ?? []).map(pp => (
                <div key={pp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--crema)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{pp.propietario_nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-verde">{pp.porcentaje_aporte}%</span>
                    {pp.firmado && <span className="badge badge-amarillo">✍️ Firmado</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="card">
          <h3 className={styles.secTitle}>📅 Fechas clave</h3>
          <div className={styles.dataGrid}>
            {[
              ['Estructuración', (p as any).fecha_estructuracion],
              ['Presentación',   (p as any).fecha_presentacion],
              ['Inicio obra',    (p as any).fecha_inicio_obra],
              ['Entrega est.',   (p as any).fecha_entrega_estimada],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.dataRow}>
                <span className={styles.dk}>{k}</span>
                <span className={styles.dv}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal agregar hito */}
      {addHitoOpen && (
        <Modal title="🏁 Nuevo Hito" onClose={() => setAddHitoOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Tipo de hito', k: 'tipo', placeholder: 'Ej: Análisis normativo' },
              { label: 'Descripción', k: 'descripcion', placeholder: 'Descripción del hito' },
            ].map(({ label, k, placeholder }) => (
              <div key={k}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--texto)', display: 'block', marginBottom: 5 }}>{label}</label>
                <input className="input" value={(newHito as any)[k]} placeholder={placeholder}
                  onChange={e => setNewHito(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--texto)', display: 'block', marginBottom: 5 }}>Fecha planeada</label>
              <input className="input" type="date" value={newHito.fecha_planeada}
                onChange={e => setNewHito(f => ({ ...f, fecha_planeada: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setAddHitoOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearHito}
                disabled={!newHito.tipo || !newHito.fecha_planeada}>✅ Crear hito</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
