import type { Metadata } from 'next'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Términos y condiciones del portal de propietarios HAB.',
}

export default function TerminosPage() {
  return (
    <ContentPage
      label="Legal"
      title="Términos de uso"
      subtitle="Condiciones para usar el portal de propietarios y publicar inmuebles en HAB."
    >
      <div className="content-prose">
        <p>
          Al registrarte o publicar en el portal aceptas estos términos. Si no estás de acuerdo,
          no utilices el servicio.
        </p>
        <h2>El servicio</h2>
        <p>
          HAB opera un marketplace de aporte inmobiliario. Publicar no garantiza venta, aporte ni
          interés de constructoras. HAB puede rechazar o retirar publicaciones que no cumplan
          criterios de viabilidad, verificación o seguridad.
        </p>
        <h2>Tu responsabilidad</h2>
        <ul>
          <li>Declaras ser titular o estar autorizado para disponer del inmueble.</li>
          <li>La información y documentos que cargas deben ser veraces y actualizados.</li>
          <li>No usarás el portal para fraude, spam o actividades ilícitas.</li>
        </ul>
        <h2>Rol de HAB</h2>
        <p>
          HAB facilita análisis, matching y acompañamiento. No es parte compradora ni garante
          automático de resultados económicos. Los acuerdos finales se formalizan entre las partes
          con la documentación que corresponda.
        </p>
        <h2>Propiedad intelectual</h2>
        <p>
          Marca, diseño y software del portal son de HAB. No puedes copiarlos ni explotarlos sin
          autorización.
        </p>
        <h2>Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de la República de Colombia. Controversias se
          tramitarán ante jueces de Bogotá D.C., salvo norma imperativa en contrario.
        </p>
      </div>
    </ContentPage>
  )
}
