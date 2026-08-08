import type { Metadata } from 'next'
import { InmuebleForm } from './InmuebleForm'

export const metadata: Metadata = {
  title: 'Publicar · Inmueble',
}

export default function PublicarInmueblePage() {
  return <InmuebleForm />
}
