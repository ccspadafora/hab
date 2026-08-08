import type { Metadata } from 'next'
import { FotosForm } from './FotosForm'

export const metadata: Metadata = {
  title: 'Publicar · Fotos',
}

export default function PublicarFotosPage() {
  return <FotosForm />
}
