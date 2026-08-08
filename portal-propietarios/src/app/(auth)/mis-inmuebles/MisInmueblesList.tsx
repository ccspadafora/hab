'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { apiListPublicaciones } from '@/lib/api/publicaciones'
import type { EstadoPublicacion } from '@/types/publicacion'

export function MisInmueblesList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['propietario', 'publicaciones'],
    queryFn: apiListPublicaciones,
  })

  if (isLoading) return <p className="hab-form__hint">Cargando inmuebles…</p>
  if (isError) return <div className="hab-form__error">No se pudieron cargar tus inmuebles.</div>

  const pubs = data ?? []

  if (pubs.length === 0) {
    return (
      <div className="card empty-state">
        <h2>Sin publicaciones</h2>
        <p>Aún no tienes inmuebles publicados en HAB.</p>
        <Link href="/publicar/inmueble" className="btn-primary">
          Publicar mi inmueble
        </Link>
      </div>
    )
  }

  return (
    <div className="pub-list">
      {pubs.map((pub) => (
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
          <StatusBadge estado={pub.estado as EstadoPublicacion} />
        </Link>
      ))}
    </div>
  )
}
