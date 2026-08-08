import type { Metadata } from 'next'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Política de privacidad del portal de constructoras HAB.',
}

export default function PrivacidadPage() {
  return (
    <ContentPage label="Legal" title="Política de privacidad" subtitle="Tratamiento de datos del portal constructoras HAB.">
      <div className="content-prose">
        <p>
          HAB trata los datos de la empresa y de sus contactos conforme a la Ley 1581 de 2012 para
          gestionar certificación, acceso al catálogo y negociaciones.
        </p>
        <h2>Datos</h2>
        <ul>
          <li>Razón social, NIT, contacto comercial y documentos de certificación.</li>
          <li>Preferencias de zona, tipología e inversión.</li>
          <li>Intereses expresados y eventos de negociación.</li>
        </ul>
        <h2>Finalidades</h2>
        <ul>
          <li>Evaluar y mantener la certificación en el marketplace.</li>
          <li>Mostrar proyectos compatibles y gestionar intereses.</li>
          <li>Comunicaciones operativas y de cumplimiento.</li>
        </ul>
        <h2>Contacto</h2>
        <p>hola@hab.com.co · Bogotá, Colombia</p>
      </div>
    </ContentPage>
  )
}
