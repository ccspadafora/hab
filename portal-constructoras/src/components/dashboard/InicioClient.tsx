'use client'

import Link from 'next/link'
import { useMatches } from '@/hooks/useMatches'
import { formatDate } from '@/lib/utils'

export function InicioClient() {
  const { data, isLoading } = useMatches()
  const matches = data?.results ?? []
  const count = data?.count ?? 0

  return (
    <section>
      <p className="section-label">Dashboard</p>
      <h1 style={{ marginBottom: 8 }}>Inicio</h1>
      <p style={{ color: '#666', marginBottom: 32, maxWidth: 520 }}>
        Explora proyectos anonimizados, expresa interés y sigue tus negociaciones con HAB.
      </p>

      <div className="kpi-grid">
        <div className="kpi-card card">
          <span className="kpi-card__label">Intereses activos</span>
          <strong className="kpi-card__value">{isLoading ? '—' : count}</strong>
        </div>
        <div className="kpi-card card">
          <span className="kpi-card__label">Negociaciones</span>
          <strong className="kpi-card__value">—</strong>
          <span className="kpi-card__hint">Próximamente</span>
        </div>
        <div className="kpi-card card">
          <span className="kpi-card__label">Catálogo</span>
          <strong className="kpi-card__value">Ver</strong>
          <Link href="/catalogo" className="btn-primary" style={{ marginTop: 12, padding: '10px 18px' }}>
            Ir al catálogo
          </Link>
        </div>
      </div>

      {matches.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Matches recientes</h2>
          <ul className="matches-list">
            {matches.slice(0, 5).map((m) => (
              <li key={m.id} className="matches-list__item card">
                <div>
                  <h3>{m.barrio}</h3>
                  <p>
                    {m.estado} · {formatDate(m.created_at)}
                  </p>
                </div>
                <Link href={`/catalogo/${m.publicacion_id}`} className="btn-secondary">
                  Ver
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/mis-intereses" style={{ display: 'inline-block', marginTop: 16, color: 'var(--hab-verde)', fontWeight: 600 }}>
            Ver todos los intereses →
          </Link>
        </div>
      )}
    </section>
  )
}
