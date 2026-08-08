import type { Metadata } from 'next'
import { DashboardClient } from './DashboardClient'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default function InicioPage() {
  return (
    <section>
      <div className="section-label">Dashboard</div>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--hab-gris)', marginBottom: 8 }}>
        Inicio
      </h1>
      <p style={{ color: '#666', marginBottom: 8, maxWidth: 520 }}>
        Resumen de tus publicaciones y actividad en HAB.
      </p>
      <DashboardClient />
    </section>
  )
}
