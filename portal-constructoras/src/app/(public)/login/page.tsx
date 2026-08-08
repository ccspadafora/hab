import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/forms/LoginForm'

export const metadata: Metadata = {
  title: 'Ingresar',
  description: 'Accede al portal de constructoras certificadas HAB.',
}

export default function LoginPage() {
  return (
    <section className="auth-page auth-page--narrow">
      <div className="auth-page__intro">
        <p className="section-label">Portal Constructoras</p>
        <h1>Ingresar</h1>
        <p>Usa el correo corporativo asociado a tu cuenta certificada.</p>
      </div>
      <Suspense fallback={<p>Cargando…</p>}>
        <LoginForm />
      </Suspense>
      <p className="auth-page__footer">
        ¿Aún no estás certificada?{' '}
        <Link href="/solicitar-acceso">Solicita acceso</Link>
      </p>
    </section>
  )
}
