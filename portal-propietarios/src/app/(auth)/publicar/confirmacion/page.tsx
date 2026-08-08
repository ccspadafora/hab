import type { Metadata } from 'next'
import { ConfirmacionForm } from './ConfirmacionForm'

export const metadata: Metadata = {
  title: 'Publicar · Confirmación',
}

export default function PublicarConfirmacionPage() {
  return <ConfirmacionForm />
}
