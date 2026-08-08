'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error:  Error & { digest?: string }
  reset:  () => void
}) {
  useEffect(() => {
    // Log to error tracking service (Sentry etc.)
    console.error('Portal error:', error)
  }, [error])

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
      <h1 style={{
        fontFamily:    'var(--font-display)',
        fontSize:      'clamp(28px, 5vw, 48px)',
        fontWeight:    900,
        textTransform: 'uppercase',
        color:         'var(--hab-gris)',
        marginBottom:  '16px',
      }}>
        Algo salió mal
      </h1>
      <p style={{
        fontFamily:   'var(--font-body)',
        fontWeight:   300,
        color:        '#666',
        maxWidth:     '380px',
        lineHeight:   1.8,
        marginBottom: '36px',
      }}>
        Ocurrió un error inesperado. Nuestro equipo fue notificado.
      </p>
      <button onClick={reset} className="btn-primary">
        Intentar de nuevo
      </button>
    </main>
  )
}
