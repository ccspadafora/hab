import type { Metadata } from 'next'
import { RegistroPaso1Form } from './RegistroPaso1Form'

export const metadata: Metadata = {
  title: 'Registro · Datos',
}

export default function RegistroPaso1Page() {
  return (
    <section className="hab-auth-page">
      <div className="card hab-auth-card">
        <div className="section-label">Paso 1 de 3</div>
        <h1>Crea tu cuenta</h1>
        <p className="hab-auth-lead">
          Registra tus datos para publicar tu inmueble en HAB.
        </p>
        <RegistroPaso1Form />
      </div>
    </section>
  )
}
