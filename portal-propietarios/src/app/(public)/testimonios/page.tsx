import type { Metadata } from 'next'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Testimonios',
  description: 'Historias de propietarios en Bogotá que exploraron el modelo de aporte inmobiliario con HAB.',
}

const TESTIMONIOS = [
  {
    quote: 'Llevaba casi un año en portales tradicionales. Con HAB entendí el potencial de mi lote en Chapinero y recibí una propuesta seria en semanas.',
    name: 'Carolina M.',
    meta: 'Propietaria · Chapinero',
  },
  {
    quote: 'Me tranquilizó que mi dirección no se publicara. Solo avanzamos cuando yo quise, con acompañamiento claro en cada documento.',
    name: 'Andrés R.',
    meta: 'Propietario · Usaquén',
  },
  {
    quote: 'No buscaba vender al contado. El esquema de aporte me permitió proyectar unidades en un desarrollo nuevo cerca de donde vivo.',
    name: 'Familia Gómez',
    meta: 'Propietarios · Suba',
  },
  {
    quote: 'El análisis inicial fue rápido y honesto: nos dijeron qué sí y qué no era viable. Eso ya valió la pena.',
    name: 'Laura P.',
    meta: 'Propietaria · Teusaquillo',
  },
]

export default function TestimoniosPage() {
  return (
    <ContentPage
      label="Historias"
      title="Lo que dicen los propietarios"
      subtitle="Experiencias reales de quienes exploraron una alternativa a vender solo por clasificado."
      ctaHref="/registro/paso-1"
      ctaLabel="Quiero publicar"
    >
      <div className="content-grid">
        {TESTIMONIOS.map((t) => (
          <article key={t.name} className="content-card testimonio-card">
            <blockquote>“{t.quote}”</blockquote>
            <div className="testimonio-meta">
              {t.name}<br />
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#777' }}>
                {t.meta}
              </span>
            </div>
          </article>
        ))}
      </div>
    </ContentPage>
  )
}
