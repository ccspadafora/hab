import type { Metadata } from 'next'
import { RegistroPaso2Form } from './RegistroPaso2Form'

export const metadata: Metadata = {
  title: 'Registro · Verificar',
}

export default function RegistroPaso2Page() {
  return (
    <section className="hab-auth-page">
      <div className="card hab-auth-card">
        <div className="section-label">Paso 2 de 3</div>
        <h1>Verifica tu teléfono</h1>
        <p className="hab-auth-lead">
          Ingresa el código de 6 dígitos que enviamos por WhatsApp.
        </p>
        <RegistroPaso2Form />
      </div>
    </section>
  )
}
