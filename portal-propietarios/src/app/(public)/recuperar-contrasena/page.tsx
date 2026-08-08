import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentPage } from '@/components/layout/ContentPage'
import { RecuperarForm } from './RecuperarForm'

export const metadata: Metadata = {
  title: 'Recuperar acceso',
  description: 'Recupera el acceso a tu cuenta del portal de propietarios HAB con tu teléfono.',
}

export default function RecuperarPage() {
  return (
    <ContentPage
      label="Cuenta"
      title="Recuperar acceso"
      subtitle="El acceso al portal se valida con tu teléfono. Solicita un código OTP para ingresar de nuevo."
    >
      <div className="content-card" style={{ maxWidth: 480 }}>
        <h3>Teléfono registrado</h3>
        <p style={{ marginBottom: 16 }}>
          Usa el mismo número con el que te registraste (formato internacional, ej. +57…).
        </p>
        <RecuperarForm />
        <p style={{ marginTop: 20, fontSize: 13 }}>
          ¿No tienes cuenta?{' '}
          <Link href="/registro/paso-1" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
            Regístrate
          </Link>
          {' · '}
          <Link href="/login" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
            Volver al login
          </Link>
        </p>
      </div>
    </ContentPage>
  )
}
