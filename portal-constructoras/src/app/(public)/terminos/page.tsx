import type { Metadata } from 'next'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Términos del portal de constructoras HAB.',
}

export default function TerminosPage() {
  return (
    <ContentPage label="Legal" title="Términos de uso" subtitle="Condiciones de uso del portal constructoras.">
      <div className="content-prose">
        <p>
          El acceso al catálogo requiere certificación vigente. HAB puede suspender cuentas ante
          incumplimiento, uso indebido de datos o intentos de contactar propietarios fuera del flujo.
        </p>
        <h2>Uso del catálogo</h2>
        <ul>
          <li>La información es confidencial y solo para evaluación de proyectos.</li>
          <li>Prohibido scrapear, revender o redistribuir el catálogo.</li>
          <li>Expresar interés implica voluntad real de avanzar en negociación mediada por HAB.</li>
        </ul>
        <h2>Limitación</h2>
        <p>
          HAB no garantiza disponibilidad de proyectos ni cierre de negocios. Las métricas son
          orientativas.
        </p>
        <h2>Ley</h2>
        <p>Legislación colombiana · Jurisdicción Bogotá D.C.</p>
      </div>
    </ContentPage>
  )
}
