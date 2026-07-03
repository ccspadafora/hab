import { useState } from 'react'
import { useLeads } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import styles from './CalendarioPage.module.css'

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay() }

const MESES     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEM  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function CalendarioPage() {
  const now = new Date()
  const [mes, setMes]   = useState(now.getMonth())
  const [anio, setAnio] = useState(now.getFullYear())

  const { data } = useLeads({})
  const qc = useQueryClient()
  const leads = data?.results ?? []

  // Modal para nueva cita
  const [modalOpen,  setModalOpen]  = useState(false)
  const [diaSelected, setDiaSelected] = useState<number | null>(null)
  const [citaForm, setCitaForm] = useState({
    lead: '', asesor: '', fecha_hora: '', modalidad: 'presencial',
    ubicacion: '', url_meet: '', notas: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  const navMes = (d: number) => {
    const f = new Date(anio, mes + d, 1)
    setMes(f.getMonth()); setAnio(f.getFullYear())
  }

  const abrirModal = (dia: number) => {
    setDiaSelected(dia)
    const fechaStr = `${anio}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}T09:00`
    setCitaForm(f => ({ ...f, fecha_hora: fechaStr }))
    setModalOpen(true)
  }

  const crearCita = async () => {
    if (!citaForm.lead || !citaForm.fecha_hora) { setMsg('Lead y fecha son requeridos'); return }
    setSaving(true); setMsg('')
    try {
      await apiClient.post(`/leads/${citaForm.lead}/cita/`, {
        fecha_hora: citaForm.fecha_hora,
        modalidad:  citaForm.modalidad,
        ubicacion:  citaForm.ubicacion,
        url_meet:   citaForm.url_meet,
        notas:      citaForm.notas,
        asesor:     citaForm.asesor || undefined,
      })
      qc.invalidateQueries({ queryKey: ['leads'] })
      setModalOpen(false)
      setMsg('✅ Cita agendada correctamente')
      setTimeout(() => setMsg(''), 4000)
    } catch { setMsg('❌ Error al agendar la cita') }
    finally { setSaving(false) }
  }

  const citasDelMes = leads.filter(l => {
    if (!l.proxima_accion) return false
    const f = new Date(l.proxima_accion)
    return f.getMonth() === mes && f.getFullYear() === anio
  })

  const citasPorDia: Record<number, typeof leads> = {}
  citasDelMes.forEach(l => {
    if (!l.proxima_accion) return
    const dia = new Date(l.proxima_accion).getDate()
    if (!citasPorDia[dia]) citasPorDia[dia] = []
    citasPorDia[dia].push(l)
  })

  const diasEnMes = getDaysInMonth(anio, mes)
  const primerDia = getFirstDayOfMonth(anio, mes)
  const celdas    = [...Array(primerDia).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />📅 CRM</div>
          <h1 className="h-med">Calendario de Citas</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.navMes}>
            <button className="btn btn-secondary" onClick={() => navMes(-1)}>‹</button>
            <span className={styles.mesLabel}>{MESES[mes]} {anio}</span>
            <button className="btn btn-secondary" onClick={() => navMes(1)}>›</button>
          </div>
          <button className="btn btn-primary" onClick={() => abrirModal(now.getDate())}>
            + Agendar cita
          </button>
        </div>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.resumen}>
        <div className={styles.resBadge}>
          <span className={styles.resN}>{citasDelMes.length}</span>
          <span className={styles.resL}>Citas este mes</span>
        </div>
        <div className={styles.resBadge}>
          <span className={styles.resN}>{leads.filter(l => l.estado === 'cita_agendada').length}</span>
          <span className={styles.resL}>Con cita agendada</span>
        </div>
        <p className={styles.calTip}>Haz clic en un día para agendar una cita</p>
      </div>

      {/* Calendario */}
      <div className={styles.cal}>
        {DIAS_SEM.map(d => <div key={d} className={styles.calHeader}>{d}</div>)}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`e-${i}`} className={styles.calEmpty} />
          const citas = citasPorDia[dia] ?? []
          const esHoy = dia === now.getDate() && mes === now.getMonth() && anio === now.getFullYear()
          return (
            <div key={dia}
              className={`${styles.calCell} ${esHoy ? styles.calHoy : ''} ${citas.length ? styles.calConCita : ''}`}
              onClick={() => abrirModal(dia)}
              title="Haz clic para agendar una cita"
            >
              <span className={styles.calDia}>{dia}</span>
              {citas.map(c => (
                <Link key={c.id} to={`/leads/${c.id}`} className={styles.citaChip}
                  onClick={e => e.stopPropagation()}>
                  🤝 {c.nombre.split(' ')[0]}
                </Link>
              ))}
            </div>
          )
        })}
      </div>

      {/* Lista de próximas citas */}
      {citasDelMes.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>
            <span className="line" />Próximas citas
          </div>
          <div className={styles.lista}>
            {citasDelMes
              .filter(l => l.proxima_accion)
              .sort((a,b) => new Date(a.proxima_accion!).getTime() - new Date(b.proxima_accion!).getTime())
              .map(l => (
                <Link key={l.id} to={`/leads/${l.id}`} className={styles.listaItem}>
                  <div className={styles.listaFecha}>
                    <span className={styles.listaDia}>{new Date(l.proxima_accion!).getDate()}</span>
                    <span className={styles.listaMes}>{new Date(l.proxima_accion!).toLocaleString('es-CO', { month: 'short' })}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.listaNombre}>{l.nombre}</p>
                    <p className={styles.listaNota}>{l.nota_proxima_accion || 'Sin notas'}</p>
                  </div>
                  <span className="badge badge-verde">{l.estado.replace(/_/g,' ')}</span>
                </Link>
              ))
            }
          </div>
        </div>
      )}

      {/* Modal para agendar cita */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📅 Agendar cita — {diaSelected} de {MESES[mes]} {anio}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>✕</button>
            </div>

            {msg && <p className={styles.modalMsg}>{msg}</p>}

            <div className={styles.modalForm}>
              <div className={styles.mField}>
                <label className={styles.fl}>Lead / Propietario *</label>
                <select className="input" value={citaForm.lead}
                  onChange={e => setCitaForm(f => ({ ...f, lead: e.target.value }))}>
                  <option value="">Selecciona un lead…</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.nombre} — {l.telefono}</option>
                  ))}
                </select>
              </div>
              <div className={styles.mField}>
                <label className={styles.fl}>Fecha y hora *</label>
                <input className="input" type="datetime-local" value={citaForm.fecha_hora}
                  onChange={e => setCitaForm(f => ({ ...f, fecha_hora: e.target.value }))} />
              </div>
              <div className={styles.mField}>
                <label className={styles.fl}>Modalidad</label>
                <select className="input" value={citaForm.modalidad}
                  onChange={e => setCitaForm(f => ({ ...f, modalidad: e.target.value }))}>
                  <option value="presencial">🏢 Presencial</option>
                  <option value="videollamada">📹 Videollamada</option>
                  <option value="telefonica">📞 Telefónica</option>
                </select>
              </div>
              {citaForm.modalidad === 'presencial' && (
                <div className={styles.mField}>
                  <label className={styles.fl}>Ubicación</label>
                  <input className="input" value={citaForm.ubicacion}
                    onChange={e => setCitaForm(f => ({ ...f, ubicacion: e.target.value }))}
                    placeholder="Dirección de la reunión" />
                </div>
              )}
              {citaForm.modalidad === 'videollamada' && (
                <div className={styles.mField}>
                  <label className={styles.fl}>URL de la reunión</label>
                  <input className="input" type="url" value={citaForm.url_meet}
                    onChange={e => setCitaForm(f => ({ ...f, url_meet: e.target.value }))}
                    placeholder="https://meet.google.com/..." />
                </div>
              )}
              <div className={styles.mField}>
                <label className={styles.fl}>Notas</label>
                <textarea className={styles.mTextarea} rows={3} value={citaForm.notas}
                  onChange={e => setCitaForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Objetivo de la cita, temas a tratar…" />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearCita} disabled={saving}>
                {saving ? 'Agendando…' : '📅 Confirmar cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
