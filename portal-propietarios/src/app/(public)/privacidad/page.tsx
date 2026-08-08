import type { Metadata } from 'next'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Política de privacidad del portal de propietarios HAB.',
}

export default function PrivacidadPage() {
  return (
    <ContentPage
      label="Legal"
      title="Política de privacidad"
      subtitle="Cómo tratamos tus datos personales en el portal de propietarios HAB."
    >
      <div className="content-prose">
        <p>
          HAB Desarrolladores Inmobiliarios (“HAB”) trata los datos que suministras en este portal
          conforme a la Ley 1581 de 2012 y normas colombianas de protección de datos personales.
        </p>
        <h2>Datos que recopilamos</h2>
        <ul>
          <li>Identificación y contacto: nombre, teléfono, correo.</li>
          <li>Datos del inmueble: ubicación, áreas, características y documentos de soporte.</li>
          <li>Datos de uso: acceso al portal, mensajes y estado de publicaciones.</li>
        </ul>
        <h2>Finalidades</h2>
        <ul>
          <li>Crear y administrar tu cuenta en el marketplace.</li>
          <li>Evaluar prefactibilidad y conectar con constructoras certificadas.</li>
          <li>Comunicaciones operativas por WhatsApp, SMS o correo.</li>
          <li>Cumplir obligaciones legales y de seguridad.</li>
        </ul>
        <h2>Anonimato frente a constructoras</h2>
        <p>
          Mientras tu publicación está en catálogo, las constructoras no reciben dirección exacta,
          teléfono ni documentos personales. Esa información se comparte solo en etapas de
          negociación autorizadas.
        </p>
        <h2>Tus derechos</h2>
        <p>
          Puedes conocer, actualizar, rectificar o solicitar la eliminación de tus datos escribiendo
          a <strong>hola@hab.com.co</strong>. Responderemos en los plazos legales aplicables.
        </p>
        <h2>Contacto</h2>
        <p>
          Responsable del tratamiento: HAB · Bogotá, Colombia · hola@hab.com.co
        </p>
      </div>
    </ContentPage>
  )
}
