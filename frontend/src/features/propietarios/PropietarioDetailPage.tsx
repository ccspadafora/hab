import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePropietario } from '../../api/hooks'
import { TemperaturaBadge, ContactoBadge } from '../../components/ui/Badges'
import { ScoreBadge, EstadoBadge } from '../../components/ui/Badges'
import { apiClient } from '../../api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import PropietarioForm from './PropietarioForm'
import styles from './PropietarioDetailPage.module.css'

export default function PropietarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc     = useQueryClient()
  const { data: p, isLoading } = usePropietario(Number(id))
  const [showEdit, setShowEdit] = useState(false)
  const { data: predios } = useQuery({
    queryKey: ['propietario', id, 'predios'],
    queryFn: () => apiClient.get(`/propietarios/${id}/predios/`).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) return <p className={styles.loading}>Cargando propietario…</p>
  if (!p) return <p className={styles.loading}>Propietario no encontrado.</p>

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/propietarios">← Propietarios</Link>
        <span>/</span>
        <span>{p.nombre}</span>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.avatar}>{p.nombre[0]}</div>
        <div className={styles.heroInfo}>
          <h1 className="h-med" style={{ marginBottom: 8 }}>{p.nombre}</h1>
          <div className={styles.heroBadges}>
            <span className="badge badge-verde">{p.tipo.replace('_', ' ')}</span>
            <ContactoBadge estado={p.estado_contacto} />
            <TemperaturaBadge temp={p.temperatura} />
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>✏️ Editar</button>
      </div>

      {showEdit && (
        <Modal title="✏️ Editar Propietario" onClose={() => setShowEdit(false)} wide>
          <PropietarioForm
            propietario={p}
            onClose={() => setShowEdit(false)}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['propietario', Number(id)] })
              setShowEdit(false)
            }}
          />
        </Modal>
      )}

      <div className={styles.grid}>
        {/* Contacto */}
        <div className="card">
          <h3 className={styles.secTitle}>📞 Datos de contacto</h3>
          <div className={styles.dataGrid}>
            {[
              ['Cédula / NIT',      p.cedula_nit || '—'],
              ['Teléfono principal', p.telefono_principal],
              ['Teléfono secundario', p.telefono_secundario || '—'],
              ['WhatsApp',           p.whatsapp_phone || '—'],
              ['Email',              p.email || '—'],
              ['Ciudad',             p.ciudad || '—'],
              ['Dirección',          p.direccion_residencia || '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.row}>
                <span className={styles.dk}>{k}</span>
                <span className={styles.dv}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CRM */}
        <div className="card">
          <h3 className={styles.secTitle}>📊 CRM</h3>
          <div className={styles.dataGrid}>
            {[
              ['Fuente origen',    p.fuente_origen || '—'],
              ['Primer contacto',  p.primer_contacto ? new Date(p.primer_contacto).toLocaleDateString('es-CO') : '—'],
              ['Último contacto',  p.ultimo_contacto ? new Date(p.ultimo_contacto).toLocaleDateString('es-CO') : '—'],
              ['Registrado',       new Date(p.created_at).toLocaleDateString('es-CO')],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.row}>
                <span className={styles.dk}>{k}</span>
                <span className={styles.dv}>{String(v)}</span>
              </div>
            ))}
          </div>
          {p.etiquetas?.length > 0 && (
            <div className={styles.tags}>
              {p.etiquetas.map((e: string) => (
                <span key={e} className="badge badge-verde">{e}</span>
              ))}
            </div>
          )}
        </div>

        {/* Predios asociados */}
        {(predios ?? []).length > 0 && (
          <div className="card">
            <h3 className={styles.secTitle}>🏘️ Predios asociados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(predios ?? []).map((predio: any) => (
                <Link key={predio.id} to={`/predios/${predio.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: 'var(--crema)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                  <EstadoBadge estado={predio.estado} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--texto)' }}>
                      {predio.direccion || predio.barrio}
                    </p>
                    <p style={{ fontSize: 11, color: '#888' }}>{predio.barrio} · {predio.tipo}</p>
                  </div>
                  <ScoreBadge score={predio.score_prefactibilidad} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.secTitle}>⚡ Acciones</h3>
          <div className={styles.actions}>
            {p.whatsapp_phone && (
              <a
                href={`https://wa.me/${p.whatsapp_phone.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                💬 Enviar WhatsApp
              </a>
            )}
            <Link to={`/leads?propietario=${p.id}`} className="btn btn-secondary">
              🤝 Ver leads asociados
            </Link>
            <Link to="/chat" className="btn btn-secondary">
              💬 Ver conversaciones
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
