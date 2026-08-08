'use client'

import { useState } from 'react'
import { CatalogoFilters } from '@/components/catalogo/CatalogoFilters'
import { ProyectoCard } from '@/components/catalogo/ProyectoCard'
import { InteresModal } from '@/components/catalogo/InteresModal'
import { useProyectos } from '@/hooks/useProyectos'
import type { ProyectoFilters } from '@/types/proyecto'

export function CatalogoClient() {
  const [filters, setFilters] = useState<ProyectoFilters>({})
  const [interesId, setInteresId] = useState<number | null>(null)
  const [interesBarrio, setInteresBarrio] = useState('')
  const [registered, setRegistered] = useState<Set<number>>(new Set())

  const { data, isLoading, isError, refetch } = useProyectos(filters)
  const proyectos = data?.results ?? []

  const openInteres = (id: number) => {
    const p = proyectos.find((x) => x.id === id)
    setInteresId(id)
    setInteresBarrio(p?.barrio ?? 'este proyecto')
  }

  return (
    <div className="catalogo-layout">
      <CatalogoFilters filters={filters} onChange={setFilters} />

      <div className="catalogo-main">
        <header className="catalogo-main__header">
          <div>
            <p className="section-label">Marketplace</p>
            <h1>Catálogo de proyectos</h1>
          </div>
          <p className="catalogo-main__count">
            {data ? `${data.count} proyecto${data.count === 1 ? '' : 's'}` : '—'}
          </p>
        </header>

        {isLoading && (
          <div className="catalogo-empty">
            <p>Cargando proyectos…</p>
          </div>
        )}

        {isError && (
          <div className="catalogo-empty">
            <p>No pudimos cargar el catálogo.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !isError && proyectos.length === 0 && (
          <div className="catalogo-empty">
            <p>No hay proyectos con estos filtros.</p>
            <button type="button" className="btn-secondary" onClick={() => setFilters({})}>
              Ver todos
            </button>
          </div>
        )}

        <div className="catalogo-grid">
          {proyectos.map((proyecto) => (
            <ProyectoCard
              key={proyecto.id}
              proyecto={proyecto}
              onInterest={openInteres}
              interested={registered.has(proyecto.id)}
            />
          ))}
        </div>
      </div>

      {interesId != null && (
        <InteresModal
          proyectoId={interesId}
          barrio={interesBarrio}
          open
          onClose={() => setInteresId(null)}
          onSuccess={() => {
            setRegistered((prev) => new Set(prev).add(interesId))
          }}
        />
      )}
    </div>
  )
}
