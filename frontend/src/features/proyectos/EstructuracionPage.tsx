import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProyecto, useGenerarEstructuracion } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import styles from './EstructuracionPage.module.css'

type Estructuracion = Record<string, string | number | boolean | null> & {
  id: number
  version?: number | string | null
  generada_por_ia?: boolean | null
  creada_en?: string | null
  resumen_ejecutivo?: string | null
  fortalezas?: string[] | null
  riesgos?: string[] | null
}

const COP = (n: number | string | boolean | null | undefined) => {
  if (!n && n !== 0) return '—'
  return `$ ${Number(n).toLocaleString('es-CO')}`
}
const pct = (valor: number, total: number) =>
  total ? `${((valor / total) * 100).toFixed(1)}%` : '—'

export default function EstructuracionPage() {
  const { id }  = useParams<{ id: string }>()
  const qc      = useQueryClient()
  const { data: p, isLoading } = useProyecto(Number(id))
  const generar   = useGenerarEstructuracion()
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')
  const [form,    setForm]    = useState<Record<string, string>>({})

  const ext = p as typeof p & { estructuraciones?: Estructuracion[] }
  const est = ext?.estructuraciones?.[0]

  useEffect(() => {
    if (est) {
      const f: Record<string, string> = {}
      Object.entries(est).forEach(([k, v]) => { f[k] = String(v ?? '') })
      setForm(f)
    }
  }, [est])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!est) return
    setSaving(true); setMsg('')
    try {
      // Recalcular totales antes de guardar
      const cd  = Number(form.costo_construccion || 0)
      const ci  = Number(form.costo_terreno || 0) + Number(form.costo_diseno || 0)
               + Number(form.costo_gerencia || 0) + Number(form.costo_urbanismo || 0)
               + Number(form.costo_legales || 0) + Number(form.costo_ventas || 0)
               + Number(form.costos_imprevistos || 0)
      const ct  = cd + ci
      const ing = Number(form.ingresos_brutos || 0)
      const ub  = ing - ct
      const mb  = ing ? (ub / ing * 100) : 0
      await apiClient.patch(`/estructuraciones/${est.id}/`, {
        ...form,
        costo_total:    ct,
        utilidad_bruta: ub,
        utilidad_neta:  ub,
        margen_bruto:   mb.toFixed(2),
        margen_neto:    mb.toFixed(2),
        roi:            ct ? (ub / ct * 100).toFixed(2) : 0,
      })
      qc.invalidateQueries({ queryKey: ['proyecto', Number(id)] })
      setEditing(false); setMsg('✅ Estructuración actualizada')
    } catch { setMsg('❌ Error al guardar') }
    finally { setSaving(false) }
  }

  if (isLoading) return <p className={styles.loading}>Cargando…</p>
  if (!p) return <p className={styles.loading}>Proyecto no encontrado.</p>

  const ventas    = Number(est?.ingresos_brutos || form.ingresos_brutos || 0)
  const costoDir  = Number(est?.costo_construccion || form.costo_construccion || 0)
  const gasAporte = Number(est?.costo_terreno || form.costo_terreno || 0)
  const estudios  = Number(est?.costo_diseno || form.costo_diseno || 0)
  const honorarios = Number(est?.costo_gerencia || form.costo_gerencia || 0)
  const interventoria = Number(est?.costo_urbanismo || form.costo_urbanismo || 0)
  const tributarios = Number(est?.costo_legales || form.costo_legales || 0)
  const gastosVentas = Number(est?.costo_ventas || form.costo_ventas || 0)
  const gastosFinancieros = Number(est?.costos_imprevistos || form.costos_imprevistos || 0)
  const totalCI   = gasAporte + estudios + honorarios + interventoria + tributarios + gastosVentas + gastosFinancieros
  const totalC    = costoDir + totalCI
  const utilidad  = ventas - totalC

  const asStringList = (value: Estructuracion[keyof Estructuracion] | string[] | undefined) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/proyectos">← Proyectos</Link><span>/</span>
        <Link to={`/proyectos/${p.id}`}>{p.codigo}</Link>
        <span>/</span><span>Estructuración</span>
      </div>

      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />📊 Estado de resultados</div>
          <h1 className="h-med">{p.nombre}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 12, color: 'var(--positivo)' }}>{msg}</span>}
          {est && !editing && (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏️ Editar</button>
          )}
          {editing && (
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                {saving ? 'Guardando…' : '💾 Guardar'}
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => generar.mutate(p.id)} disabled={generar.isPending}>
            🤖 {generar.isPending ? 'Generando…' : 'Nueva versión IA'}
          </button>
        </div>
      </div>

      {!est ? (
        <div className={styles.noEst}>
          <p>Sin estructuración. Genera una con IA.</p>
        </div>
      ) : (
        <>
          {/* Meta */}
          <div className={styles.metaRow}>
            <span className="badge badge-verde">v{String(est.version)}</span>
            {est.generada_por_ia && <span className="badge badge-amarillo">🤖 Generada por IA</span>}
            <span className={styles.metaFecha}>
              Creada: {new Date(String(est.creada_en)).toLocaleDateString('es-CO')}
            </span>
          </div>

          {/* Datos del predio */}
          {editing && (
            <div className={styles.ingresoCard}>
              <p className={styles.pGTitle}>Ingresos</p>
              <div className={styles.ingresoGrid}>
                {[
                  { l: 'Área lote (m²)', k: 'area_lote' },
                  { l: 'Área construida (m²)', k: 'area_construida' },
                  { l: 'Área vendible (m²)', k: 'area_vendible' },
                  { l: 'Unidades totales', k: 'unidades_totales' },
                  { l: 'Precio m² promedio', k: 'precio_m2_promedio' },
                  { l: 'INGRESOS BRUTOS', k: 'ingresos_brutos' },
                ].map(({ l, k }) => (
                  <div key={k} className={styles.field}>
                    <label className={styles.fl}>{l}</label>
                    <input className="input" type="number" value={form[k] ?? ''}
                      onChange={e => set(k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla P&G al estilo de la imagen */}
          <div className={styles.tableWrap}>
            <table className={styles.pgTable}>
              <thead>
                <tr>
                  <th className={styles.thItem}>Ítems</th>
                  <th className={styles.thTotal} colSpan={2}>Totales</th>
                  <th className={styles.thPct}>% Sobre Ventas</th>
                </tr>
              </thead>
              <tbody>
                {/* Ventas */}
                <tr className={styles.rowTitle}>
                  <td>VENTAS BRUTAS</td>
                  <td className={styles.tdSym}>$</td>
                  <td className={styles.tdVal}>{editing ? <input className={styles.editInput} value={form.ingresos_brutos ?? ''} onChange={e => set('ingresos_brutos', e.target.value)} type="number" /> : Number(ventas).toLocaleString('es-CO')}</td>
                  <td>100.0%</td>
                </tr>
                <tr className={styles.rowTotalVerde}>
                  <td>TOTAL VENTAS NETAS</td>
                  <td className={styles.tdSym}>$</td>
                  <td className={styles.tdVal}>{Number(ventas).toLocaleString('es-CO')}</td>
                  <td>100.0%</td>
                </tr>

                {/* Costos Directos */}
                <tr className={styles.rowAmarillo}>
                  <td><em>Total Costos Directos</em></td>
                  <td className={styles.tdSym}>$</td>
                  <td className={styles.tdVal}>{editing ? <input className={styles.editInput} value={form.costo_construccion ?? ''} onChange={e => set('costo_construccion', e.target.value)} type="number" /> : Number(costoDir).toLocaleString('es-CO')}</td>
                  <td>{pct(costoDir, ventas)}</td>
                </tr>

                {/* Encabezado Costos Indirectos */}
                <tr className={styles.rowSubheader}><td colSpan={4}><strong>COSTOS INDIRECTOS</strong></td></tr>

                {/* Líneas de costos indirectos */}
                {[
                  { label: 'Gastos Asociados al Aporte del Inmueble', k: 'costo_terreno',      val: gasAporte },
                  { label: 'Estudios y Diseños',                       k: 'costo_diseno',        val: estudios },
                  { label: 'Honorarios Profesionales',                 k: 'costo_gerencia',      val: honorarios },
                  { label: 'Interventoría y Supervisión Técnica',      k: 'costo_urbanismo',     val: interventoria },
                  { label: 'Tributarios, Legales y Hon. Fiduciarios',  k: 'costo_legales',       val: tributarios },
                  { label: 'Licencia, Derechos, Impuestos y Seguros',  k: 'costo_ventas',        val: gastosVentas },
                  { label: 'Gastos de Ventas',                         k: 'costos_imprevistos',  val: gastosFinancieros },
                ].map(({ label, k, val }) => (
                  <tr key={k} className={styles.rowNormal}>
                    <td>{label}</td>
                    <td className={styles.tdSym}>$</td>
                    <td className={styles.tdVal}>
                      {editing
                        ? <input className={styles.editInput} value={form[k] ?? ''} onChange={e => set(k, e.target.value)} type="number" />
                        : Number(val).toLocaleString('es-CO')
                      }
                    </td>
                    <td>{pct(val, ventas)}</td>
                  </tr>
                ))}

                <tr className={styles.rowAmarillo}>
                  <td><em>Total Costos Indirectos</em></td>
                  <td className={styles.tdSym}>$</td>
                  <td className={styles.tdVal}>{Number(totalCI).toLocaleString('es-CO')}</td>
                  <td>{pct(totalCI, ventas)}</td>
                </tr>

                <tr className={styles.rowTotalNegro}>
                  <td><strong>TOTAL COSTOS</strong></td>
                  <td className={styles.tdSym}>$</td>
                  <td className={styles.tdVal}>{Number(totalC).toLocaleString('es-CO')}</td>
                  <td>{pct(totalC, ventas)}</td>
                </tr>

                <tr className={`${styles.rowUtilidad} ${utilidad >= 0 ? styles.utilPos : styles.utilNeg}`}>
                  <td><strong>UTILIDAD ANTES DE IMPUESTOS</strong></td>
                  <td className={styles.tdSym}>$</td>
                  <td className={styles.tdVal}>{Number(utilidad).toLocaleString('es-CO')}</td>
                  <td>{pct(utilidad, ventas)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ingresos HAB */}
          <div className={styles.habCard}>
            <p className={styles.pGTitle}>Ingresos HAB</p>
            <div className={styles.habGrid}>
              {[
                { l: 'Fee estructuración', k: 'hab_fee_estructuracion' },
                { l: 'Fee gerencia',       k: 'hab_fee_gerencia' },
                { l: 'Fee ventas',         k: 'hab_fee_ventas' },
                { l: 'INGRESO TOTAL HAB',  k: 'hab_ingreso_total', accent: true },
              ].map(({ l, k, accent }) => (
                <div key={k} className={styles.habItem}>
                  {editing && k !== 'hab_ingreso_total'
                    ? <input className={styles.editInput} value={form[k] ?? ''} onChange={e => set(k, e.target.value)} type="number" />
                    : <span className={styles.habVal} style={{ color: accent ? 'var(--amarillo)' : 'var(--blanco)' }}>
                        {COP(est[k])}
                      </span>
                  }
                  <span className={styles.habLabel}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Narrativa IA */}
          {est.resumen_ejecutivo && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}><span className="line" />🤖 Narrativa IA</div>
              <p className="body-text">{String(est.resumen_ejecutivo)}</p>
              {asStringList(est.fortalezas).length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--verde)', marginBottom: 6, textTransform: 'uppercase' }}>Fortalezas</p>
                  {asStringList(est.fortalezas).map((f, i) => <p key={i} className="body-sm" style={{ marginBottom: 4 }}>→ {f}</p>)}
                </div>
              )}
              {asStringList(est.riesgos).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--negativo)', marginBottom: 6, textTransform: 'uppercase' }}>Riesgos</p>
                  {asStringList(est.riesgos).map((r, i) => <p key={i} className="body-sm" style={{ marginBottom: 4 }}>→ {r}</p>)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
