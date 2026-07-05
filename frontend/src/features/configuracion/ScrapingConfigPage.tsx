import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import styles from './ScrapingConfigPage.module.css'

interface Fuente {
  id: number; nombre: string; url_base: string; activo: boolean; ultima_ejecucion: string | null
  configuracion: Record<string, unknown>
}
interface ConfigScraping {
  id: number; fuente: number; ciudades: string[]; barrios_objetivo: string[]; localidades: string[]
  tipos_predio: string[]; estrato_min: number; estrato_max: number
  precio_min: string | null; precio_max: string | null; area_lote_min: string | null
  frecuencia_cron: string; max_paginas: number; delay_entre_paginas: number
  umbral_score_auto_viable: number; umbral_score_auto_noviable: number
}
interface EjecucionScraping {
  id: number
  fuente: number
  inicio: string
  fin: string | null
  predios_encontrados: number
  predios_nuevos: number
  errores: number
  log: string
  estado: 'pendiente' | 'corriendo' | 'exitoso' | 'fallido'
}

const TIPOS_PREDIO = ['casa','lote','apartamento','local']
const CIUDADES = ['Bogotá', 'Chía', 'Cajicá', 'La Calera', 'Sopó', 'Cota', 'Mosquera', 'Funza', 'Madrid', 'Zipaquirá']
const LOCALIDADES  = ['Chapinero','Usaquén','Suba','Kennedy','Fontibón','Engativá',
                      'Teusaquillo','Barrios Unidos','Santa Fe','La Candelaria','Rafael Uribe','Bosa']

export default function ScrapingConfigPage() {
  const qc = useQueryClient()
  const [selectedFuente, setSelectedFuente] = useState<Fuente | null>(null)
  const [editFuente,     setEditFuente]     = useState<Partial<Fuente> | null>(null)
  const [config,         setConfig]         = useState<Partial<ConfigScraping> | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [running,        setRunning]        = useState(false)
  const [msg,            setMsg]            = useState('')

  const { data: fuentes }   = useQuery({ queryKey: ['scraping','fuentes'],   queryFn: () => apiClient.get('/scraping/fuentes/').then(r => r.data as { results: Fuente[] }) })
  const { data: configList } = useQuery({ queryKey: ['scraping','config'],   queryFn: () => apiClient.get('/config/scraping/').then(r => r.data as { results: ConfigScraping[] }) })
  const { data: ejecuciones, isFetching: fetchingEjecuciones } = useQuery({
    queryKey: ['scraping', 'ejecuciones', selectedFuente?.id],
    enabled: Boolean(selectedFuente?.id),
    queryFn: () => apiClient.get(`/scraping/fuentes/${selectedFuente!.id}/ejecuciones/`).then(r => r.data as EjecucionScraping[]),
    refetchInterval: (query) => {
      const rows = (query.state.data as EjecucionScraping[] | undefined) ?? []
      return rows.some(row => row.estado === 'pendiente' || row.estado === 'corriendo') ? 3000 : false
    },
  })

  const abrirFuente = (f: Fuente) => {
    setSelectedFuente(f)
    setEditFuente({ nombre: f.nombre, url_base: f.url_base, activo: f.activo, configuracion: { ...f.configuracion } })
    const cfg = configList?.results.find(c => c.fuente === f.id)
    setConfig(cfg ? { ...cfg } : {
      fuente: f.id, ciudades: [], barrios_objetivo: [], localidades: [], tipos_predio: [],
      estrato_min: 3, estrato_max: 6, precio_min: null, precio_max: null,
      area_lote_min: null, frecuencia_cron: '0 6 * * *', max_paginas: 20,
      delay_entre_paginas: 3, umbral_score_auto_viable: 65, umbral_score_auto_noviable: 30,
    })
  }

  const guardar = async () => {
    if (!selectedFuente || !editFuente || !config) return
    setSaving(true); setMsg('')
    try {
      await apiClient.patch(`/scraping/fuentes/${selectedFuente.id}/`, editFuente)
      const existente = configList?.results.find(c => c.fuente === selectedFuente.id)
      if (existente) {
        await apiClient.patch(`/config/scraping/${existente.id}/`, config)
      } else {
        await apiClient.post('/config/scraping/', { ...config, fuente: selectedFuente.id })
      }
      qc.invalidateQueries({ queryKey: ['scraping'] })
      setMsg('✅ Configuración guardada')
    } catch { setMsg('❌ Error al guardar') }
    finally { setSaving(false) }
  }

  const eliminarConfiguracion = async () => {
    if (!selectedFuente) return
    const existente = configList?.results.find(c => c.fuente === selectedFuente.id)
    if (!existente) {
      setMsg('ℹ️ Esta fuente no tiene una configuración avanzada guardada.')
      return
    }
    const ok = window.confirm(`¿Eliminar la configuración avanzada de "${selectedFuente.nombre}"?`)
    if (!ok) return

    setSaving(true)
    setMsg('')
    try {
      await apiClient.delete(`/config/scraping/${existente.id}/`)
      qc.invalidateQueries({ queryKey: ['scraping', 'config'] })
      setConfig({
        fuente: selectedFuente.id,
        ciudades: [],
        barrios_objetivo: [],
        localidades: [],
        tipos_predio: [],
        estrato_min: 3,
        estrato_max: 6,
        precio_min: null,
        precio_max: null,
        area_lote_min: null,
        frecuencia_cron: '0 6 * * *',
        max_paginas: 20,
        delay_entre_paginas: 3,
        umbral_score_auto_viable: 65,
        umbral_score_auto_noviable: 30,
      })
      setMsg('✅ Configuración eliminada')
    } catch {
      setMsg('❌ No se pudo eliminar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const eliminarFuente = async () => {
    if (!selectedFuente) return
    const ok = window.confirm(
      `¿Eliminar la fuente "${selectedFuente.nombre}"?\n\nEsto quitará la fuente del panel.`
    )
    if (!ok) return

    setSaving(true)
    setMsg('')
    try {
      await apiClient.delete(`/scraping/fuentes/${selectedFuente.id}/`)
      qc.invalidateQueries({ queryKey: ['scraping'] })
      setSelectedFuente(null)
      setEditFuente(null)
      setConfig(null)
      setMsg('✅ Fuente eliminada')
    } catch {
      setMsg('❌ No se pudo eliminar la fuente')
    } finally {
      setSaving(false)
    }
  }

  const ejecutar = async (fuenteId: number) => {
    setRunning(true)
    setMsg('')
    try {
      const { data } = await apiClient.post(`/scraping/fuentes/${fuenteId}/ejecutar/`)
      const ejecucionId = data?.ejecucion?.id
      setMsg(ejecucionId
        ? `⏳ Scraping encolado. Ejecución #${ejecucionId}`
        : '⏳ Scraping encolado')
      qc.invalidateQueries({ queryKey: ['scraping', 'ejecuciones', fuenteId] })
    } catch {
      setMsg('❌ No se pudo encolar el scraping')
    } finally {
      setRunning(false)
    }
  }

  const nuevaFuente = async () => {
    const nombre = prompt('Nombre de la fuente (ej: Metrocuadrado):')
    if (!nombre) return
    const url = prompt('URL base (ej: https://metrocuadrado.com):')
    if (!url) return
    await apiClient.post('/scraping/fuentes/', { nombre, url_base: url, activo: true })
    qc.invalidateQueries({ queryKey: ['scraping', 'fuentes'] })
  }

  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const setArr = (k: keyof ConfigScraping, val: string) =>
    setConfig(c => c ? { ...c, [k]: toggleArr(c[k] as string[], val) } : c)

  const ultimaEjecucion = ejecuciones?.[0] ?? null
  const estadoActivo = ultimaEjecucion?.estado === 'pendiente' || ultimaEjecucion?.estado === 'corriendo'
  const estadoClass = ultimaEjecucion ? styles[`estado_${ultimaEjecucion.estado}`] : ''
  const prettyDate = (value: string | null) => {
    if (!value) return 'Sin fecha'
    return new Date(value).toLocaleString('es-CO')
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🔍 Scraping</div>
          <h1 className="h-med">Configuración de Scraping</h1>
        </div>
        <button className="btn btn-primary" onClick={nuevaFuente}>+ Nueva fuente</button>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.layout}>
        {/* Lista de fuentes */}
        <div className={styles.fuenteList}>
          <p className={styles.sectionLabel}>FUENTES</p>
          {(fuentes?.results ?? []).map(f => (
            <button key={f.id}
              className={`${styles.fuenteItem} ${selectedFuente?.id === f.id ? styles.active : ''}`}
              onClick={() => abrirFuente(f)}>
              <div className={styles.fuenteInfo}>
                <p className={styles.fuenteNombre}>{f.nombre}</p>
                <p className={styles.fuenteUrl}>{f.url_base}</p>
              </div>
              <span className={`${styles.fuenteDot} ${f.activo ? styles.dotOn : styles.dotOff}`} />
            </button>
          ))}
          {!fuentes?.results.length && <p className={styles.empty}>Sin fuentes. Agrega una.</p>}
        </div>

        {/* Panel de configuración */}
        <div className={styles.panel}>
          {!selectedFuente ? (
            <div className={styles.placeholder}>
              <span style={{ fontSize: 40 }}>⚙️</span>
              <p>Selecciona una fuente para configurarla</p>
            </div>
          ) : editFuente && config ? (
            <>
              {/* Datos de la fuente */}
              <div className={styles.panelSection}>
                <h3 className={styles.secTitle}>🌐 Datos de la fuente</h3>
                <div className={styles.fuenteForm}>
                  <div className={styles.field}>
                    <label className={styles.fl}>Nombre</label>
                    <input className="input" value={editFuente.nombre ?? ''}
                      onChange={e => setEditFuente(f => ({ ...f!, nombre: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>URL base</label>
                    <input className="input" value={editFuente.url_base ?? ''}
                      onChange={e => setEditFuente(f => ({ ...f!, url_base: e.target.value }))}
                      placeholder="https://..." />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Estado</label>
                    <select className="input" value={String(editFuente.activo)}
                      onChange={e => setEditFuente(f => ({ ...f!, activo: e.target.value === 'true' }))}>
                      <option value="true">✅ Activa</option>
                      <option value="false">❌ Inactiva</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Ruta ciudad / slug</label>
                    <input
                      className="input"
                      value={String(editFuente.configuracion?.city_path ?? '')}
                      onChange={e => setEditFuente(f => ({
                        ...f!,
                        configuracion: {
                          ...(f?.configuracion ?? {}),
                          city_path: e.target.value,
                        },
                      }))}
                      placeholder="Ej: bogota/bogota-dc"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros geográficos */}
              <div className={styles.panelSection}>
                <h3 className={styles.secTitle}>📍 Zonas objetivo</h3>
                <div className={styles.field}>
                  <label className={styles.fl}>Ciudades (selecciona las que aplican)</label>
                  <div className={styles.checkGrid}>
                    {CIUDADES.map(city => (
                      <label key={city} className={styles.checkItem}>
                        <input type="checkbox"
                          checked={(config.ciudades ?? []).includes(city)}
                          onChange={() => setArr('ciudades', city)} />
                        {city}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fl}>Localidades (selecciona las que aplican)</label>
                  <div className={styles.checkGrid}>
                    {LOCALIDADES.map(loc => (
                      <label key={loc} className={styles.checkItem}>
                        <input type="checkbox"
                          checked={(config.localidades ?? []).includes(loc)}
                          onChange={() => setArr('localidades', loc)} />
                        {loc}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filtros de predio */}
              <div className={styles.panelSection}>
                <h3 className={styles.secTitle}>🏘️ Filtros de predio</h3>
                <div className={styles.filterGrid}>
                  <div className={styles.field}>
                    <label className={styles.fl}>Tipos de predio</label>
                    <div className={styles.checkRow}>
                      {TIPOS_PREDIO.map(t => (
                        <label key={t} className={styles.checkItem}>
                          <input type="checkbox"
                            checked={(config.tipos_predio ?? []).includes(t)}
                            onChange={() => setArr('tipos_predio', t)} />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Estrato mínimo</label>
                    <input className="input" type="number" min="1" max="6"
                      value={config.estrato_min ?? 3}
                      onChange={e => setConfig(c => ({ ...c!, estrato_min: Number(e.target.value) }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Estrato máximo</label>
                    <input className="input" type="number" min="1" max="6"
                      value={config.estrato_max ?? 6}
                      onChange={e => setConfig(c => ({ ...c!, estrato_max: Number(e.target.value) }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Precio mín. (COP)</label>
                    <input className="input" type="number"
                      value={config.precio_min ?? ''}
                      onChange={e => setConfig(c => ({ ...c!, precio_min: e.target.value || null }))}
                      placeholder="Ej: 200000000" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Precio máx. (COP)</label>
                    <input className="input" type="number"
                      value={config.precio_max ?? ''}
                      onChange={e => setConfig(c => ({ ...c!, precio_max: e.target.value || null }))}
                      placeholder="Ej: 3000000000" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Área lote mín. (m²)</label>
                    <input className="input" type="number"
                      value={config.area_lote_min ?? ''}
                      onChange={e => setConfig(c => ({ ...c!, area_lote_min: e.target.value || null }))}
                      placeholder="Ej: 80" />
                  </div>
                </div>
              </div>

              {/* Parámetros de ejecución */}
              <div className={styles.panelSection}>
                <h3 className={styles.secTitle}>⚙️ Parámetros de ejecución</h3>
                <div className={styles.filterGrid}>
                  <div className={styles.field}>
                    <label className={styles.fl}>Frecuencia (cron)</label>
                    <input className="input" value={config.frecuencia_cron ?? '0 6 * * *'}
                      onChange={e => setConfig(c => ({ ...c!, frecuencia_cron: e.target.value }))}
                      placeholder="0 6 * * *" />
                    <p style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>
                      Formato cron: min hora día mes día_sem (ej: "0 6 * * *" = diario a las 6am)
                    </p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Máx. páginas</label>
                    <input className="input" type="number"
                      value={config.max_paginas ?? 20}
                      onChange={e => setConfig(c => ({ ...c!, max_paginas: Number(e.target.value) }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Delay entre páginas (seg)</label>
                    <input className="input" type="number"
                      value={config.delay_entre_paginas ?? 3}
                      onChange={e => setConfig(c => ({ ...c!, delay_entre_paginas: Number(e.target.value) }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Umbral score → Viable</label>
                    <input className="input" type="number" min="0" max="100"
                      value={config.umbral_score_auto_viable ?? 65}
                      onChange={e => setConfig(c => ({ ...c!, umbral_score_auto_viable: Number(e.target.value) }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fl}>Umbral score → Archivo</label>
                    <input className="input" type="number" min="0" max="100"
                      value={config.umbral_score_auto_noviable ?? 30}
                      onChange={e => setConfig(c => ({ ...c!, umbral_score_auto_noviable: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              <div className={styles.panelSection}>
                <div className={styles.execHeader}>
                  <h3 className={styles.secTitle}>🛰️ Estado de ejecución</h3>
                  {fetchingEjecuciones && <span className={styles.execPolling}>Actualizando…</span>}
                </div>

                {ultimaEjecucion ? (
                  <div className={styles.execCard}>
                    <div className={styles.execTop}>
                      <span className={`${styles.estadoBadge} ${estadoClass}`}>
                        {ultimaEjecucion.estado === 'pendiente' && 'En cola'}
                        {ultimaEjecucion.estado === 'corriendo' && 'Corriendo'}
                        {ultimaEjecucion.estado === 'exitoso' && 'Finalizado'}
                        {ultimaEjecucion.estado === 'fallido' && 'Fallido'}
                      </span>
                      <span className={styles.execId}>Ejecución #{ultimaEjecucion.id}</span>
                    </div>

                    <div className={styles.execMetrics}>
                      <div><strong>{ultimaEjecucion.predios_encontrados}</strong><span>encontrados</span></div>
                      <div><strong>{ultimaEjecucion.predios_nuevos}</strong><span>nuevos</span></div>
                      <div><strong>{ultimaEjecucion.errores}</strong><span>errores</span></div>
                    </div>

                    <div className={styles.execMeta}>
                      <span>Inicio: {prettyDate(ultimaEjecucion.inicio)}</span>
                      <span>Fin: {prettyDate(ultimaEjecucion.fin)}</span>
                    </div>

                    <pre className={styles.execLog}>
                      {ultimaEjecucion.log || 'Sin log todavía.'}
                    </pre>
                  </div>
                ) : (
                  <div className={styles.execEmpty}>
                    Aún no hay ejecuciones registradas para esta fuente.
                  </div>
                )}

                {!!ejecuciones?.length && (
                  <div className={styles.execHistory}>
                    <p className={styles.execHistoryTitle}>Últimas ejecuciones</p>
                    {ejecuciones.slice(0, 5).map(row => (
                      <button
                        key={row.id}
                        type="button"
                        className={styles.execHistoryItem}
                        onClick={() => setMsg(`ℹ️ Viendo ejecución #${row.id}`)}
                      >
                        <span className={`${styles.estadoBadge} ${styles[`estado_${row.estado}`]}`}>
                          {row.estado}
                        </span>
                        <span className={styles.execHistoryMeta}>
                          #{row.id} · {row.predios_encontrados} encontrados · {row.predios_nuevos} nuevos
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.panelActions}>
                <button
                  className={styles.dangerGhost}
                  type="button"
                  onClick={eliminarConfiguracion}
                  disabled={saving || running || estadoActivo}
                >
                  Eliminar configuración
                </button>
                <button
                  className={styles.dangerSolid}
                  type="button"
                  onClick={eliminarFuente}
                  disabled={saving || running || estadoActivo}
                >
                  Eliminar fuente
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => ejecutar(selectedFuente.id)}
                  disabled={running || saving || estadoActivo}
                >
                  {running ? '⏳ Encolando…' : estadoActivo ? '🛰️ Scraping en curso' : '▶️ Ejecutar ahora'}
                </button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost" onClick={() => setSelectedFuente(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? 'Guardando…' : '💾 Guardar configuración'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
