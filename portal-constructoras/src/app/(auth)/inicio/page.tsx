import type { Metadata } from 'next'
import { InicioClient } from '@/components/dashboard/InicioClient'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default function InicioPage() {
  return <InicioClient />
}
