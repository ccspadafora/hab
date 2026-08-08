import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: 'noindex',
}

export default function NotFound() {
  return (
    <main style={{
      minHeight:      '100vh',
      background:     'var(--hab-crema)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        'var(--pad-h)',
      textAlign:      'center',
    }}>
      <span style={{
        fontFamily:  'var(--font-display)',
        fontSize:    'clamp(80px, 15vw, 160px)',
        fontWeight:  900,
        color:       'rgba(43,77,46,0.1)',
        lineHeight:  1,
        display:     'block',
        marginBottom: '24px',
      }}>
        404
      </span>
      <h1 style={{
        fontFamily:   'var(--font-display)',
        fontSize:     'clamp(28px, 5vw, 48px)',
        fontWeight:   900,
        textTransform:'uppercase',
        color:         'var(--hab-gris)',
        marginBottom: '16px',
      }}>
        Página no encontrada
      </h1>
      <p style={{
        fontFamily:   'var(--font-body)',
        fontSize:     '15px',
        fontWeight:   300,
        color:        '#666',
        maxWidth:     '420px',
        lineHeight:   1.8,
        marginBottom: '36px',
      }}>
        La página que buscas no existe o fue movida.
        Vuelve al inicio para continuar.
      </p>
      <Link href="/" className="btn-primary">
        Volver al inicio
      </Link>
    </main>
  )
}
