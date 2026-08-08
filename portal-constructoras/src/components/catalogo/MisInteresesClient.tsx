'use client'

import Link from 'next/link'
import { useMatches } from '@/hooks/useMatches'
import { formatDate } from '@/lib/utils'

const ESTADO_LABEL: Record<string, string> = {
  sugerido: 'Sugerido',
  notificado: 'Notificado',
  interesada: 'Interesada',
  rechazado_const: 'Rechazado',
  rechazado_hab: 'No aplica',
  en_negociacion: 'En negociación',
}

export function MisInteresesClient() {
  const { data, isLoading, isError, refetch } = useMatches()
  const matches = data?.results ?? []

  return (
    <section>
      <p className="section-label">Actividad</p>
      <h1 style={{ marginBottom: 24 }}>Mis intereses</h1>

      {isLoading && <p>Cargando intereses…</p>}

      {isError && (
        <div className="catalogo-empty">
          <p>No pudimos cargar tus intereses.</p>
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && matches.length === 0 && (
        <div className="catalogo-empty card" style={{ padding: 32 }}>
          <p>Aún no has expresado interés en ningún proyecto.</p>
          <Link href="/catalogo" className="btn-primary" style={{ marginTop: 16 }}>
            Ir al catálogo
          </Link>
        </div>
      )}

      {matches.length > 0 && (
        <ul className="matches-list">
          {matches.map((m) => (
            <li key={m.id} className="matches-list__item card">
              <div>
                <h3>{m.barrio}</h3>
                <p>
                  {ESTADO_LABEL[m.estado] ?? m.estado} · {formatDate(m.created_at)}
                </p>
              </div>
              <Link href={`/catalogo/${m.publicacion_id}`} className="btn-secondary">
                Ver proyecto
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
