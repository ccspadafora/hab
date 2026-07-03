import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePropietarios, type PropietariosFilter } from '../../api/hooks'
import { TemperaturaBadge, ContactoBadge } from '../../components/ui/Badges'
import { Modal } from '../../components/ui/Modal'
import PropietarioForm from './PropietarioForm'
import styles from './PropietariosPage.module.css'

type View = 'cards' | 'tabla'

const ESTADOS = ['sin_contactar','contactado','interesado','calificado','en_negociacion','firmado','descartado']

export default function PropietariosPage() {
  const [estadoContacto, setEstadoContacto] = useState('')
  const [temperatura,    setTemperatura]    = useState('')
  const [search,         setSearch]         = useState('')
  const [view,           setView]           = useState<View>('cards')
  const [showForm,       setShowForm]       = useState(false)

  const filters: PropietariosFilter = {
    estado_contacto: estadoContacto || undefined,
    temperatura:     temperatura    || undefined,
    search:          search         || undefined,
    ordering:        '-created_at',
  }
  const { data, isLoading } = usePropietarios(filters)

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🏠 CRM</div>
          <h1 className="h-med">Propietarios</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={styles.total}>{isLoading ? '…' : `${data?.count ?? 0} propietarios`}</span>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo propietario</button>
          <div className={styles.viewToggle}>
            <button className={`${styles.vBtn} ${view === 'cards' ? styles.vActive : ''}`} onClick={() => setView('cards')}>⬛ Cards</button>
            <button className={`${styles.vBtn} ${view === 'tabla' ? styles.vActive : ''}`} onClick={() => setView('tabla')}>📋 Tabla</button>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={`input ${styles.search}`}
          placeholder="Buscar nombre, teléfono, cédula…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`input ${styles.sel}`}
          value={estadoContacto}
          onChange={(e) => setEstadoContacto(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          className={`input ${styles.sel}`}
          value={temperatura}
          onChange={(e) => setTemperatura(e.target.value)}
        >
          <option value="">Toda temperatura</option>
          <option value="frio">🧊 Frío</option>
          <option value="tibio">🌤️ Tibio</option>
          <option value="caliente">🔥 Caliente</option>
        </select>
        {(estadoContacto || temperatura || search) && (
          <button
            className="btn btn-ghost"
            onClick={() => { setEstadoContacto(''); setTemperatura(''); setSearch(''); }}
            style={{ fontSize: 11 }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {showForm && (
        <Modal title="🏠 Nuevo Propietario" onClose={() => setShowForm(false)} wide>
          <PropietarioForm onClose={() => setShowForm(false)} onSaved={() => setShowForm(false)} />
        </Modal>
      )}

      {isLoading ? (
        <p className={styles.loading}>Cargando propietarios…</p>
      ) : view === 'tabla' ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>
              <th>Nombre</th><th>Tipo</th><th>Teléfono</th><th>WhatsApp</th>
              <th>Estado</th><th>Temperatura</th><th></th>
            </tr></thead>
            <tbody>
              {data?.results.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                  <td><span className="badge badge-verde">{p.tipo.replace('_',' ')}</span></td>
                  <td>{p.telefono_principal}</td>
                  <td>{p.whatsapp_phone || '—'}</td>
                  <td><ContactoBadge estado={p.estado_contacto} /></td>
                  <td><TemperaturaBadge temp={p.temperatura} /></td>
                  <td>
                    <Link to={`/propietarios/${p.id}`} className="btn btn-secondary"
                      style={{ fontSize: 10, padding: '4px 10px' }}>Ver →</Link>
                  </td>
                </tr>
              ))}
              {!data?.results.length && (
                <tr><td colSpan={7} className={styles.tableEmpty}>Sin propietarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.grid}>
          {data?.results.map((p) => (
            <div key={p.id} className={`card ${styles.card}`}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{p.nombre[0]}</div>
                <div className={styles.cardInfo}>
                  <p className={styles.nombre}>{p.nombre}</p>
                  <p className={styles.tipo}>{p.tipo.replace('_', ' ')}</p>
                </div>
                <TemperaturaBadge temp={p.temperatura} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <span className={styles.fk}>📞</span>
                  <span>{p.telefono_principal}</span>
                </div>
                {p.whatsapp_phone && (
                  <div className={styles.field}>
                    <span className={styles.fk}>💬</span>
                    <span>{p.whatsapp_phone}</span>
                  </div>
                )}
                {p.email && (
                  <div className={styles.field}>
                    <span className={styles.fk}>✉️</span>
                    <span className={styles.email}>{p.email}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardFoot}>
                <ContactoBadge estado={p.estado_contacto} />
                <Link
                  to={`/propietarios/${p.id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: 10, padding: '5px 12px' }}
                >
                  Ver perfil →
                </Link>
              </div>
            </div>
          ))}
          {!data?.results.length && (
            <p className={styles.empty}>No hay propietarios con estos filtros.</p>
          )}
        </div>
      )}
    </div>
  )
}
