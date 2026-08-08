import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Ingresar',
}

export default function LoginPage() {
  return (
    <section className="hab-auth-page">
      <div className="card hab-auth-card">
        <div className="section-label">Portal propietarios</div>
        <h1>Ingresar</h1>
        <p className="hab-auth-lead">
          Accede con tu teléfono y contraseña, o verifica con un código OTP.
        </p>
        <Suspense fallback={<p className="hab-form__hint">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  )
}
