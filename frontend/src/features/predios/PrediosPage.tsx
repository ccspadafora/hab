import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePredios, type PrediosFilter } from '../../api/hooks'
import { ScoreBadge, EstadoBadge } from '../../components/ui/Badges'
import { Modal } from '../../components/ui/Modal'
import PredioForm from './PredioForm'
import styles from './PrediosPage.module.css'

const ESTADOS = ['nuevo','en_analisis','viable','no_viable','contactado','descartado']
const TIPOS   = ['casa','lote','apartamento','local']

export default function PrediosPage() {
  const [estado,    setEstado]    = useState('')
  const [tipo,      setTipo]      = useState('')
  const [search,    setSearch]    = useState('')
  const [ordering,  setOrdering]  = useState('-primera_deteccion')
  const [showForm,  setShowForm]  = useState(false)

  const filters: PrediosFilter = {
    estado:   estado   || undefined,
    tipo:     tipo     || undefined,
    search:   search   || undefined,
    ordering: ordering || undefined,
  }
  const { data, isLoading } = usePredios(filters)

  const fmt = (n: number | null) =>
    n ? `$${(n / 1_000_000).toFixed(1)}M` : '—'

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🏘️ Scraping</div>
          <h1 className="h-med">Predios</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={styles.total}>{isLoading ? '…' : `${data?.count ?? 0} predios`}</span>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo predio</button>
        </div>
      </div>
      {showForm && (
        <Modal title="📍 Nuevo Predio" onClose={() => setShowForm(false)} wide>
          <PredioForm onClose={() => setShowForm(false)} />
        </Modal>
      )}

      {/* Filtros controlados */}
      <div className={styles.filters}>
        <input
          className={`input ${styles.search}`}
          placeholder="Buscar barrio, dirección, código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`input ${styles.sel}`}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          className={`input ${styles.sel}`}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className={`input ${styles.sel}`}
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
        >
          <option value="-primera_deteccion">Más recientes</option>
          <option value="-score_prefactibilidad">Mayor score</option>
          <option value="precio_publicado">Menor precio</option>
          <option value="-precio_publicado">Mayor precio</option>
        </select>
        {(estado || tipo || search) && (
          <button
            className="btn btn-ghost"
            onClick={() => { setEstado(''); setTipo(''); setSearch(''); }}
            style={{ fontSize: 11 }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className={styles.loading}>Cargando predios…</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Predio</th>
                <th>Tipo</th>
                <th>Área lote</th>
                <th>Precio</th>
                <th>Estrato</th>
                <th>Score</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className={styles.direccion}>{p.direccion || '—'}</p>
                    <p className={styles.barrio}>{p.barrio} · {p.localidad}</p>
                  </td>
                  <td><span className="badge badge-verde">{p.tipo}</span></td>
                  <td>{p.area_lote ? `${p.area_lote} m²` : '—'}</td>
                  <td className={styles.precio}>{fmt(p.precio_publicado)}</td>
                  <td>{p.estrato ? `E${p.estrato}` : '—'}</td>
                  <td><ScoreBadge score={p.score_prefactibilidad} /></td>
                  <td><EstadoBadge estado={p.estado} /></td>
                  <td>
                    <Link
                      to={`/predios/${p.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: 11, padding: '6px 14px' }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
              {!data?.results.length && (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    No hay predios con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
