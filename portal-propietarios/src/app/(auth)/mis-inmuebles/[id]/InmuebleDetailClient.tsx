'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScoreMeter } from '@/components/ui/ScoreMeter'
import { apiGetPublicacion } from '@/lib/api/publicaciones'
import { toScoreNumber } from '@/lib/utils'
import type { EstadoPublicacion } from '@/types/publicacion'

export function InmuebleDetailClient() {
  const params = useParams()
  const id = Number(params.id)

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ['propietario', 'publicaciones', id],
    queryFn: () => apiGetPublicacion(id),
    enabled: Number.isFinite(id),
  })

  if (!Number.isFinite(id)) {
    return <div className="hab-form__error">ID inválido</div>
  }

  if (isLoading) return <p className="hab-form__hint">Cargando detalle…</p>
  if (isError || !pub) {
    return <div className="hab-form__error">No se pudo cargar la publicación.</div>
  }

  const score = toScoreNumber(pub.score_prefactibilidad)

  return (
    <div className="card" style={{ padding: 28, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div className="section-label">Detalle</div>
          <h1 style={{ fontSize: 32, color: 'var(--hab-gris)' }}>
            {pub.titulo || `${pub.tipo} · ${pub.barrio}`}
          </h1>
        </div>
        <StatusBadge estado={pub.estado as EstadoPublicacion} size="lg" />
      </div>

      <dl className="review-grid">
        <div>
          <dt>Tipo</dt>
          <dd>{pub.tipo}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>
            {pub.barrio}
            {pub.localidad ? `, ${pub.localidad}` : ''}
          </dd>
        </div>
        <div>
          <dt>Área lote</dt>
          <dd>{pub.area_lote} m²</dd>
        </div>
        <div>
          <dt>Estrato</dt>
          <dd>{pub.estrato}</dd>
        </div>
        <div>
          <dt>Fotos</dt>
          <dd>{pub.fotos?.length ? `${pub.fotos.length} foto(s)` : 'Sin fotos'}</dd>
        </div>
      </dl>

      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <div className="section-label">Prefactibilidad</div>
        <ScoreMeter score={score} size="lg" />
        {score != null && (
          <p className="hab-form__hint" style={{ marginTop: 8 }}>
            Score interno: {score}/100
          </p>
        )}
        {pub.tags_prefact?.length > 0 && (
          <p className="hab-form__hint" style={{ marginTop: 8 }}>
            Tags: {pub.tags_prefact.join(', ')}
          </p>
        )}
      </div>

      <div className="hab-form__actions">
        <Link href="/mis-inmuebles" className="btn-secondary">
          ← Volver
        </Link>
        {pub.estado === 'borrador' && (
          <Link href="/publicar/inmueble" className="btn-primary">
            Continuar edición
          </Link>
        )}
      </div>
    </div>
  )
}
