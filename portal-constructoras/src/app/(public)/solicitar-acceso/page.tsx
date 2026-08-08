import type { Metadata } from 'next'
import { SolicitarAccesoForm } from '@/components/forms/SolicitarAccesoForm'

export const metadata: Metadata = {
  title: 'Solicitar acceso',
  description: 'Solicita la certificación HAB para acceder al catálogo de proyectos.',
}

export default function SolicitarAccesoPage() {
  return (
    <section className="auth-page">
      <div className="auth-page__intro">
        <p className="section-label">Certificación</p>
        <h1>Solicitar acceso</h1>
        <p>
          Completa el formulario para que el equipo HAB evalúe tu constructora. Solo empresas
          certificadas pueden ver el catálogo y expresar interés.
        </p>
      </div>
      <SolicitarAccesoForm />
    </section>
  )
}
