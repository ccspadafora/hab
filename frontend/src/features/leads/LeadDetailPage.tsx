import { useParams, Link } from 'react-router-dom'
import { useLead } from '../../api/hooks'
import { LeadEstadoBadge, TemperaturaBadge } from '../../components/ui/Badges'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './LeadDetailPage.module.css'

const ESTADOS_LEAD = [
  'nuevo','contactado','interesado','calificado',
  'cita_agendada','propuesta_enviada','en_negociacion','promesa_firmada','descartado',
]

const timeAgo = (d: string) =>
  formatDistanceToNow(new Date(d), { addSuffix: true, locale: es })

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: lead, isLoading } = useLead(Number(id))

  if (isLoading) return <p className={styles.loading}>Cargando lead…</p>
  if (!lead) return <p className={styles.loading}>Lead no encontrado.</p>

  const ext = lead as typeof lead & {
    interacciones?: Array<{ id: number; tipo: string; descripcion: string; resultado: string; usuario_nombre: string; creado_en: string }>
    citas?: Array<{ id: number; fecha_hora: string; modalidad: string; estado: string; notas: string; asesor: number }>
    asesor_nombre?: string
  }

  const idxEstado = ESTADOS_LEAD.indexOf(lead.estado)

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/leads">← Leads</Link>
        <span>/</span>
        <span>{lead.nombre}</span>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroAvatar}>{lead.nombre[0]}</div>
        <div className={styles.heroInfo}>
          <h1 className="h-med" style={{ marginBottom: 8 }}>{lead.nombre}</h1>
          <div className={styles.heroBadges}>
            <LeadEstadoBadge estado={lead.estado} />
            <TemperaturaBadge temp={lead.temperatura} />
            {ext.asesor_nombre && (
              <span className={styles.asesor}>👤 {ext.asesor_nombre}</span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline de progreso */}
      <div className={styles.pipeline}>
        {ESTADOS_LEAD.filter(e => e !== 'descartado').map((e, i) => (
          <div
            key={e}
            className={`${styles.pStep} ${i <= idxEstado ? styles.pActive : ''} ${e === lead.estado ? styles.pCurrent : ''}`}
          >
            <div className={styles.pDot} />
            <span className={styles.pLabel}>{e.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Datos de contacto */}
        <div className="card">
          <h3 className={styles.secTitle}>📞 Contacto</h3>
          <div className={styles.dataGrid}>
            {[
              ['Teléfono', lead.telefono],
              ['Email',    lead.email || '—'],
              ['Cédula',   lead.cedula || '—'],
              ['Fuente',   lead.fuente_origen || '—'],
              ['Registrado', new Date(lead.created_at).toLocaleDateString('es-CO')],
              ['Último contacto', lead.ultimo_contacto ? timeAgo(lead.ultimo_contacto) : '—'],
              ['Próxima acción', lead.proxima_accion ? new Date(lead.proxima_accion).toLocaleString('es-CO') : '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.row}>
                <span className={styles.dk}>{k}</span>
                <span className={styles.dv}>{String(v)}</span>
              </div>
            ))}
          </div>
          {lead.nota_proxima_accion && (
            <div className={styles.notaProxima}>
              <span>📌</span>
              <p>{lead.nota_proxima_accion}</p>
            </div>
          )}
        </div>

        {/* Interacciones */}
        <div className="card">
          <h3 className={styles.secTitle}>📋 Historial de interacciones</h3>
          <div className={styles.interacciones}>
            {ext.interacciones?.map(inter => (
              <div key={inter.id} className={styles.interItem}>
                <div className={styles.interTop}>
                  <span className="badge badge-verde">{inter.tipo}</span>
                  <span className={styles.interTime}>{timeAgo(inter.creado_en)}</span>
                </div>
                <p className={styles.interDesc}>{inter.descripcion}</p>
                {inter.resultado && (
                  <p className={styles.interRes}>→ {inter.resultado}</p>
                )}
              </div>
            ))}
            {!ext.interacciones?.length && (
              <p className={styles.empty}>Sin interacciones registradas.</p>
            )}
          </div>
        </div>

        {/* Citas */}
        {(ext.citas?.length ?? 0) > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.secTitle}>📅 Citas agendadas</h3>
            <div className={styles.citas}>
              {ext.citas?.map(cita => (
                <div key={cita.id} className={styles.citaItem}>
                  <div className={styles.citaDate}>
                    <span className={styles.citaDay}>
                      {new Date(cita.fecha_hora).getDate()}
                    </span>
                    <span className={styles.citaMes}>
                      {new Date(cita.fecha_hora).toLocaleString('es-CO', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <p className={styles.citaHora}>
                      {new Date(cita.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className={styles.citaMod}>{cita.modalidad}</p>
                    {cita.notas && <p className={styles.citaNota}>{cita.notas}</p>}
                  </div>
                  <span className={`badge ${cita.estado === 'realizada' ? 'badge-verde' : 'badge-amarillo'}`}>
                    {cita.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        {lead.notas && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.secTitle}>📝 Notas</h3>
            <p className="body-text">{lead.notas}</p>
          </div>
        )}
      </div>
    </div>
  )
}
