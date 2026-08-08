'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const STEPS = [
  { href: '/publicar/inmueble', label: '1. Inmueble', key: 'inmueble' },
  { href: '/publicar/ubicacion', label: '2. Ubicación', key: 'ubicacion' },
  { href: '/publicar/fotos', label: '3. Fotos', key: 'fotos' },
  { href: '/publicar/confirmacion', label: '4. Confirmar', key: 'confirmacion' },
]

const ORDER = ['inmueble', 'ubicacion', 'fotos', 'confirmacion']

export function PublishSteps() {
  const pathname = usePathname()
  const currentKey = ORDER.find((k) => pathname.includes(k)) ?? 'inmueble'
  const currentIdx = ORDER.indexOf(currentKey)

  return (
    <nav className="publish-steps" aria-label="Pasos de publicación">
      {STEPS.map((step, idx) => (
        <Link
          key={step.href}
          href={step.href}
          className={cn(
            'publish-steps__item',
            idx === currentIdx && 'publish-steps__item--active',
            idx < currentIdx && 'publish-steps__item--done',
          )}
        >
          {step.label}
        </Link>
      ))}
    </nav>
  )
}
