'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProyectoDetail } from '@/components/catalogo/ProyectoDetail'
import { InteresModal } from '@/components/catalogo/InteresModal'
import { useProyecto } from '@/hooks/useProyectos'

export function ProyectoDetalleClient({ id }: { id: string }) {
  const { data, isLoading, isError } = useProyecto(id)
  const [open, setOpen] = useState(false)
  const [interested, setInterested] = useState(false)

  if (isLoading) {
    return (
      <div className="catalogo-empty">
        <p>Cargando proyecto…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="catalogo-empty">
        <p>No encontramos este proyecto.</p>
        <Link href="/catalogo" className="btn-secondary">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href="/catalogo" className="btn-secondary" style={{ padding: '8px 16px' }}>
          ← Catálogo
        </Link>
      </p>
      <ProyectoDetail
        proyecto={data}
        onInterest={() => setOpen(true)}
        interested={interested}
      />
      <InteresModal
        proyectoId={data.id}
        barrio={data.barrio}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => setInterested(true)}
      />
    </>
  )
}
