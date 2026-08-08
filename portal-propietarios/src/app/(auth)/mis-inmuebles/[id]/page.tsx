import type { Metadata } from 'next'
import { InmuebleDetailClient } from './InmuebleDetailClient'

export const metadata: Metadata = {
  title: 'Detalle del inmueble',
}

export default function InmuebleDetailPage() {
  return <InmuebleDetailClient />
}
