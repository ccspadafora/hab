import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'HAB Constructoras — Proyectos de aporte inmobiliario',
  description: 'Accede a proyectos certificados, expresa interés y negocia con acompañamiento HAB.',
}

export default function LandingPage() {
  return (
    <main>
      <section style={{
        background: 'var(--hab-verde)',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'calc(72px + var(--pad-v)) var(--pad-h) var(--pad-v)',
      }}>
        <div className="section-label" style={{ color: 'var(--hab-amarillo)' }}>
          Portal Constructoras
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(42px, 6vw, 72px)',
          color: 'var(--hab-blanco)',
          textTransform: 'uppercase',
          lineHeight: 0.92,
          maxWidth: 820,
          marginBottom: 24,
        }}>
          Proyectos listos<br />
          para <span style={{ color: 'var(--hab-amarillo)' }}>aportar</span>
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.7)',
          maxWidth: 480,
          lineHeight: 1.8,
          marginBottom: 36,
        }}>
          Catálogo anonimizado de inmuebles con potencial de desarrollo.
          Certificación HAB, filtros por zona y flujo de interés formal.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/solicitar-acceso" className="btn-primary">Solicitar acceso</Link>
          <Link href="/login" className="btn-secondary" style={{
            color: 'var(--hab-amarillo)',
            borderColor: 'var(--hab-amarillo)',
          }}>
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section style={{ background: 'var(--hab-crema)', padding: 'var(--pad-v) var(--pad-h)' }}>
        <div className="section-label">Qué incluye</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(28px, 4vw, 48px)',
          textTransform: 'uppercase',
          color: 'var(--hab-gris)',
          marginBottom: 32,
        }}>
          Base del marketplace
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {[
            ['Catálogo filtrable', 'Explora proyectos por barrio, área y score de prefactibilidad.'],
            ['Detalle anonimizado', 'Información técnica sin datos personales del propietario.'],
            ['Interés formal', 'Expresa interés y abre negociación con acompañamiento HAB.'],
          ].map(([title, text]) => (
            <div key={title} className="card" style={{ padding: 28 }}>
              <h3 style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 8,
                color: 'var(--hab-gris)',
              }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#666' }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
