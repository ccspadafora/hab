import type { Metadata } from 'next'
import Link from 'next/link'
import { MisInmueblesList } from './MisInmueblesList'

export const metadata: Metadata = {
  title: 'Mis inmuebles',
}

export default function MisInmueblesPage() {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div className="section-label">Portfolio</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--hab-gris)' }}>
            Mis inmuebles
          </h1>
        </div>
        <Link href="/publicar/inmueble" className="btn-primary">
          Nueva publicación
        </Link>
      </div>
      <MisInmueblesList />
    </section>
  )
}
