import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePredio, useRecalcularPrefact, useCrearAnalisis } from '../../api/hooks'
import { ScoreBadge, EstadoBadge } from '../../components/ui/Badges'
import { Modal } from '../../components/ui/Modal'
import PredioForm from './PredioForm'
import { apiClient } from '../../api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import styles from './PredioDetailPage.module.css'

const fmt  = (n: number | null | undefined) => n != null ? `$${(n / 1_000_000).toFixed(1)}M` : '—'
const fmtN = (n: number | null | undefined) => n != null ? n.toLocaleString('es-CO') : '—'

export default function PredioDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const qc         = useQueryClient()
  const { data: p, isLoading } = usePredio(Number(id))
  const recalc     = useRecalcularPrefact()
  const crearAnal  = useCrearAnalisis()

  const [showEdit,     setShowEdit]     = useState(false)
  const [showAddProp,  setShowAddProp]  = useState(false)
  const [propSearch,   setPropSearch]   = useState('')
  const [selectedProp, setSelectedProp] = useState('')

  const { data: propietarios } = useQuery({
    queryKey: ['predio', id, 'propietarios'],
    queryFn: () => apiClient.get(`/predios/${id}/propietarios/`).then(r => r.data),
    enabled: !!id,
  })
  const { data: proyectos } = useQuery({
    queryKey: ['predio', id, 'proyectos'],
    queryFn: () => apiClient.get(`/predios/${id}/proyectos/`).then(r => r.data),
    enabled: !!id,
  })
  const { data: todosPropietarios } = useQuery({
    queryKey: ['propietarios', 'search', propSearch],
    queryFn: () => apiClient.get(`/propietarios/?search=${propSearch}&page_size=20`).then(r => r.data.results),
    enabled: showAddProp,
  })

  const vincularPropietario = async () => {
    if (!selectedProp) return
    await apiClient.post(`/predios/${id}/agregar_propietario/`, { propietario: selectedProp })
    qc.invalidateQueries({ queryKey: ['predio', id, 'propietarios'] })
    setShowAddProp(false); setSelectedProp('')
  }

  if (isLoading) return <div className={styles.loading}>Cargando predio…</div>
  if (!p) return <div className={styles.loading}>Predio no encontrado.</div>

  const m = p.metricas_prefact

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/predios">← Predios</Link><span>/</span><span>{p.barrio}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />{p.tipo.toUpperCase()}</div>
          <h1 className="h-med" style={{ marginBottom: 8 }}>{p.direccion || p.barrio}</h1>
          <p className="body-sm">{p.barrio} · {p.localidad} · {p.ciudad}</p>
        </div>
        <div className={styles.headerRight}>
          <EstadoBadge estado={p.estado} />
          <div className={styles.scoreBox}>
            <ScoreBadge score={p.score_prefactibilidad} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Score</span>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>✏️ Editar</button>
        </div>
      </div>

      {/* Modal editar */}
      {showEdit && (
        <Modal title="✏️ Editar Predio" onClose={() => setShowEdit(false)} wide>
          <PredioForm predio={p} onClose={() => setShowEdit(false)}
            onSaved={() => qc.invalidateQueries({ queryKey: ['predio', Number(id)] })} />
        </Modal>
      )}

      <div className={styles.grid}>
        {/* Datos básicos */}
        <div className="card">
          <h3 className={styles.secTitle}>📋 Datos del predio</h3>
          <div className={styles.dataGrid}>
            {[
              ['URL origen', <a href={p.url_origen} target="_blank" rel="noreferrer" style={{ color: 'var(--verde)' }}>Ver fuente ↗</a>],
              ['Área lote',       p.area_lote ? `${p.area_lote} m²` : '—'],
              ['Área construida', p.area_construida ? `${p.area_construida} m²` : '—'],
              ['Estrato',         p.estrato ? `Estrato ${p.estrato}` : '—'],
              ['Año construcción', (p as any).anio_construccion ?? '—'],
              ['Precio publicado', fmt(p.precio_publicado)],
              ['Precio m²',        p.precio_m2 ? `$${Number(p.precio_m2).toLocaleString('es-CO')}/m²` : '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.dataRow}>
                <span className={styles.dataKey}>{k}</span>
                <span className={styles.dataVal}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Propietarios */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 className={styles.secTitle} style={{ margin: 0 }}>🏠 Propietarios vinculados</h3>
            <button className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 10px' }}
              onClick={() => setShowAddProp(true)}>+ Vincular</button>
          </div>
          {(propietarios ?? []).length === 0 ? (
            <p className="body-sm">Sin propietarios vinculados.</p>
          ) : (
            <div className={styles.propList}>
              {(propietarios ?? []).map((prop: any) => (
                <Link key={prop.id} to={`/propietarios/${prop.id}`} className={styles.propItem}>
                  <div className={styles.propAvatar}>{prop.nombre[0]}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13 }}>{prop.nombre}</p>
                    <p style={{ fontSize: 11, color: '#888' }}>{prop.telefono_principal}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Proyectos vinculados */}
        {(proyectos ?? []).length > 0 && (
          <div className="card">
            <h3 className={styles.secTitle}>🏗️ Proyectos vinculados</h3>
            {(proyectos ?? []).map((proy: any) => (
              <Link key={proy.id} to={`/proyectos/${proy.id}`} className={styles.proyItem}>
                <span className={styles.proycodigo}>{proy.codigo}</span>
                <span style={{ fontWeight: 700 }}>{proy.nombre}</span>
                <span className="badge badge-verde">{proy.fase}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="card">
          <h3 className={styles.secTitle}>🏷️ Tags + scores</h3>
          <div className={styles.tags}>
            {p.tags.map(t => <span key={t} className="badge badge-verde">{t.replace(/_/g,' ')}</span>)}
            {p.tags_manuales.map(t => <span key={t} className="badge badge-amarillo">{t.replace(/_/g,' ')}</span>)}
          </div>
          {p.detalle_scores && Object.keys(p.detalle_scores).length > 0 && (
            <div className={styles.dataGrid} style={{ marginTop: 12 }}>
              {Object.entries(p.detalle_scores).map(([k, v]) => (
                <div key={k} className={styles.dataRow}>
                  <span className={styles.dataKey}>{k.replace(/_/g,' ')}</span>
                  <div className={styles.scoreBar}>
                    <div className={styles.scoreBarFill} style={{ width: `${Number(v)*100}%` }} />
                    <span>{(Number(v)*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Métricas */}
        {m && (
          <div className={styles.metricasCard}>
            <div className="section-label" style={{ marginBottom: 16 }}><span className="line" />Métricas estimadas</div>
            <div className={styles.metricasGrid}>
              {[
                { l: 'Área edificable', v: `${fmtN(m.area_edificable_est)} m²` },
                { l: 'Ingresos brutos', v: fmt(m.ingresos_brutos_est) },
                { l: 'Costo total',     v: fmt(m.costo_total_est) },
                { l: 'Utilidad bruta',  v: fmt(m.utilidad_bruta_est), pos: m.utilidad_bruta_est > 0 },
                { l: 'Margen bruto',    v: `${m.margen_bruto_est}%`, pos: m.margen_bruto_est > 0 },
                { l: 'ROI est.',        v: `${m.roi_est}%`, pos: m.roi_est > 15 },
                { l: 'Valor máx.',      v: fmt(m.valor_max_predio_est) },
              ].map(({ l, v, pos }) => (
                <div key={l} className={styles.metricItem}>
                  <span className={styles.metricLabel}>{l}</span>
                  <span className={styles.metricValue} style={{ color: pos === false ? 'var(--negativo)' : pos ? 'var(--positivo)' : 'var(--amarillo)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="card">
          <h3 className={styles.secTitle}>⚡ Acciones</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => recalc.mutate(p.id)} disabled={recalc.isPending}>
              🔄 {recalc.isPending ? 'Calculando…' : 'Recalcular prefactibilidad'}
            </button>
            <button className="btn btn-primary" onClick={() => crearAnal.mutate(p.id)} disabled={crearAnal.isPending}>
              📐 {crearAnal.isPending ? 'Creando…' : 'Iniciar análisis de viabilidad'}
            </button>
          </div>
          {(recalc.isSuccess || crearAnal.isSuccess) && <p style={{ color: 'var(--positivo)', fontSize: 12, marginTop: 8 }}>✅ Tarea encolada</p>}
        </div>
      </div>

      {/* Modal vincular propietario */}
      {showAddProp && (
        <Modal title="🏠 Vincular Propietario al Predio" onClose={() => setShowAddProp(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className={styles.fl}>Buscar propietario</label>
              <input className="input" value={propSearch} onChange={e => setPropSearch(e.target.value)}
                placeholder="Nombre, teléfono o cédula…" style={{ marginTop: 6 }} />
            </div>
            <div>
              <label className={styles.fl}>Seleccionar</label>
              <select className="input" value={selectedProp} onChange={e => setSelectedProp(e.target.value)} style={{ marginTop: 6 }}>
                <option value="">Selecciona…</option>
                {(todosPropietarios ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre} — {p.telefono_principal}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowAddProp(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={vincularPropietario} disabled={!selectedProp}>
                ✅ Vincular propietario
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
