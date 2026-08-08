import type { Metadata } from 'next'
import { MisInteresesClient } from '@/components/catalogo/MisInteresesClient'

export const metadata: Metadata = {
  title: 'Mis intereses',
}

export default function MisInteresesPage() {
  return <MisInteresesClient />
}
