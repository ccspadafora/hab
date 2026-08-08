import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Cómo funciona',
  description: 'Así opera el modelo de aporte inmobiliario de HAB: publica, analiza, propone y firma con acompañamiento.',
}

const STEPS = [
  {
    n: '01',
    title: 'Publica tu inmueble',
    text: 'Completas barrio, área, estrato y fotos. Es gratis y toma unos minutos. Tu publicación queda en borrador hasta que la envíes a revisión.',
  },
  {
    n: '02',
    title: 'HAB analiza el potencial',
    text: 'Nuestro equipo y modelos de prefactibilidad evalúan zona, área y viabilidad. En aproximadamente 48 horas tienes un resultado orientativo.',
  },
  {
    n: '03',
    title: 'Constructoras certificadas ven el proyecto',
    text: 'Si el inmueble califica, entra al catálogo anonimizado: sin dirección exacta ni datos personales. Solo constructoras certificadas por HAB.',
  },
  {
    n: '04',
    title: 'Negociación acompañada',
    text: 'Cuando una constructora expresa interés, HAB media la negociación, documentación y garantías. Tú decides; nosotros protegemos el proceso.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <ContentPage
      label="El modelo"
      title="Cómo funciona HAB"
      subtitle="No es un portal de clasificados. Es un marketplace de aporte inmobiliario con verificación, análisis y constructoras certificadas."
      ctaHref="/registro/paso-1"
      ctaLabel="Publicar mi inmueble"
    >
      <div className="content-grid">
        {STEPS.map((s) => (
          <article key={s.n} className="content-card">
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 900,
              color: 'rgba(43,77,46,0.15)',
              lineHeight: 1,
              marginBottom: 12,
            }}>{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </div>

      <div className="content-prose">
        <h2>Qué NO es HAB</h2>
        <ul>
          <li>No somos un banco ni intermediamos créditos hipotecarios.</li>
          <li>No publicamos tu dirección ni teléfono a constructoras.</li>
          <li>No cobramos por publicar ni por el análisis inicial.</li>
        </ul>
        <h2>Qué sí hacemos</h2>
        <ul>
          <li>Evaluamos el potencial de desarrollo de tu predio.</li>
          <li>Conectamos con constructoras ya certificadas por HAB.</li>
          <li>Acompañamos la negociación hasta el cierre documental.</li>
        </ul>
        <p style={{ marginTop: 32 }}>
          ¿Dudas? Revisa las{' '}
          <Link href="/preguntas-frecuentes" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
            preguntas frecuentes
          </Link>{' '}
          o{' '}
          <Link href="/contacto" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
            escríbenos
          </Link>.
        </p>
      </div>
    </ContentPage>
  )
}
