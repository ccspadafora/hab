import type { Metadata } from 'next'
import { UbicacionForm } from './UbicacionForm'

export const metadata: Metadata = {
  title: 'Publicar · Ubicación',
}

export default function PublicarUbicacionPage() {
  return <UbicacionForm />
}
