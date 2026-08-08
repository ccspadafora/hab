'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScoreMeter } from '@/components/ui/ScoreMeter'
import { apiGetDashboard, apiListPublicaciones } from '@/lib/api/publicaciones'
import { toScoreNumber } from '@/lib/utils'
import type { EstadoPublicacion } from '@/types/publicacion'

export function DashboardClient() {
  const dashboardQuery = useQuery({
    queryKey: ['propietario', 'dashboard'],
    queryFn: apiGetDashboard,
  })

  const pubsQuery = useQuery({
    queryKey: ['propietario', 'publicaciones'],
    queryFn: apiListPublicaciones,
  })

  if (dashboardQuery.isLoading) {
    return <p className="hab-form__hint">Cargando dashboard…</p>
  }

  if (dashboardQuery.isError) {
    return (
      <div className="hab-form__error">
        No se pudo cargar el dashboard. Intenta de nuevo.
      </div>
    )
  }

  const dash = dashboardQuery.data!
  const pubs = pubsQuery.data ?? []
  const recent = pubs.slice(0, 5)
  const empty = dash.total_publicaciones === 0

  return (
    <>
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-card__value">{dash.total_publicaciones}</div>
          <div className="kpi-card__label">Publicaciones</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__value">{dash.activas}</div>
          <div className="kpi-card__label">Activas</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__value">{dash.en_revision}</div>
          <div className="kpi-card__label">En revisión</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__value">{dash.borradores}</div>
          <div className="kpi-card__label">Borradores</div>
        </div>
      </div>

      {dash.score_promedio != null && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Score promedio</div>
          <ScoreMeter score={toScoreNumber(dash.score_promedio)} size="md" />
        </div>
      )}

      {empty ? (
        <div className="card empty-state">
          <h2>Aún no has publicado</h2>
          <p>
            Publica tu inmueble en minutos y recibe propuestas de constructoras
            interesadas en tu zona.
          </p>
          <Link href="/publicar/inmueble" className="btn-primary">
            Publicar mi inmueble
          </Link>
        </div>
      ) : (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Recientes</div>
            <Link href="/publicar/inmueble" className="btn-secondary">
              Nueva publicación
            </Link>
          </div>
          <div className="pub-list">
            {recent.map((pub) => (
              <Link key={pub.id} href={`/mis-inmuebles/${pub.id}`} className="card pub-row">
                <div className="pub-row__meta">
                  <span className="pub-row__title">
                    {pub.titulo || `${pub.tipo} · ${pub.barrio || 'Sin barrio'}`}
                  </span>
                  <span className="pub-row__sub">
                    {pub.localidad ? `${pub.localidad} · ` : ''}
                    {pub.area_lote} m² · Estrato {pub.estrato}
                  </span>
                </div>
                <StatusBadge estado={pub.estado as EstadoPublicacion} size="sm" />
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            <Link href="/mis-inmuebles" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
              Ver todos →
            </Link>
          </p>
        </section>
      )}
    </>
  )
}
