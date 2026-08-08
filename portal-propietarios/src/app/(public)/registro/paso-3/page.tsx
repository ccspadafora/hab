import type { Metadata } from 'next'
import { RegistroPaso3Client } from './RegistroPaso3Client'

export const metadata: Metadata = {
  title: 'Registro · Bienvenida',
}

export default function RegistroPaso3Page() {
  return (
    <section className="hab-auth-page">
      <div className="card hab-auth-card">
        <div className="section-label">Paso 3 de 3</div>
        <RegistroPaso3Client />
      </div>
    </section>
  )
}
