import type { Metadata } from 'next'
import { CatalogoClient } from '@/components/catalogo/CatalogoClient'

export const metadata: Metadata = {
  title: 'Catálogo de proyectos',
  description: 'Explora proyectos anonimizados listos para aporte inmobiliario.',
}

export default function CatalogoPage() {
  return <CatalogoClient />
}
