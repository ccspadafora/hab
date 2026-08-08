import type { Metadata } from 'next'
import { ContentPage } from '@/components/layout/ContentPage'
import { ContactoForm } from './ContactoForm'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Habla con el equipo HAB sobre tu inmueble, el modelo de aporte o el estado de tu publicación.',
}

export default function ContactoPage() {
  return (
    <ContentPage
      label="Contacto"
      title="Hablemos de tu inmueble"
      subtitle="Escríbenos por el formulario o WhatsApp. Respondemos en horario hábil de Bogotá."
    >
      <div className="content-grid" style={{ alignItems: 'start' }}>
        <div className="content-card">
          <h3>Formulario</h3>
          <ContactoForm />
        </div>
        <div className="content-card">
          <h3>Otros canales</h3>
          <p style={{ marginBottom: 16 }}>
            WhatsApp comercial:{' '}
            <a
              href="https://wa.me/573001234567"
              style={{ color: 'var(--hab-verde)', fontWeight: 600 }}
              target="_blank"
              rel="noreferrer"
            >
              +57 300 123 4567
            </a>
          </p>
          <p style={{ marginBottom: 16 }}>
            Correo:{' '}
            <a href="mailto:hola@hab.com.co" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
              hola@hab.com.co
            </a>
          </p>
          <p>
            Horario: lunes a viernes, 8:00 a.m. – 6:00 p.m. (hora Colombia).
          </p>
        </div>
      </div>
    </ContentPage>
  )
}
