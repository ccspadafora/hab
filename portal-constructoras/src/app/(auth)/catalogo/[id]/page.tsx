import type { Metadata } from 'next'
import { ProyectoDetalleClient } from '@/components/catalogo/ProyectoDetalleClient'

export const metadata: Metadata = {
  title: 'Detalle del proyecto',
}

export default function ProyectoDetallePage({
  params,
}: {
  params: { id: string }
}) {
  return <ProyectoDetalleClient id={params.id} />
}
