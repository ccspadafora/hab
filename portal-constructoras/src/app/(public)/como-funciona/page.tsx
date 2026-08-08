import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Cómo funciona',
  description: 'Certificación HAB, catálogo anonimizado y flujo de interés para constructoras.',
}

const STEPS = [
  {
    n: '01',
    title: 'Solicita acceso',
    text: 'Envías NIT, contacto, experiencia y zonas de interés. HAB revisa la solicitud de certificación.',
  },
  {
    n: '02',
    title: 'Certificación',
    text: 'Tras validar documentación y capacidad, tu perfil queda certificado y puedes ingresar al portal.',
  },
  {
    n: '03',
    title: 'Explora el catálogo',
    text: 'Proyectos con barrio, métricas y score orientativo. Sin dirección exacta ni datos del propietario.',
  },
  {
    n: '04',
    title: 'Expresa interés',
    text: 'Con un clic abres el flujo formal. HAB media la negociación y la documentación con el propietario.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <ContentPage
      label="Constructoras"
      title="Cómo funciona el marketplace"
      subtitle="Acceso solo para constructoras certificadas. Proyectos filtrados, anonimizados y con acompañamiento HAB."
      ctaHref="/solicitar-acceso"
      ctaLabel="Solicitar acceso"
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
        <h2>Reglas del catálogo</h2>
        <ul>
          <li>Un interés activo por proyecto por constructora.</li>
          <li>Scores se muestran como potencial (alto/medio/bajo), no como cifra exacta en el listado.</li>
          <li>Fotos reales del inmueble no se exponen en catálogo; solo referencias de zona cuando aplica.</li>
        </ul>
        <p style={{ marginTop: 28 }}>
          ¿Ya estás certificada?{' '}
          <Link href="/login" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>Ingresa aquí</Link>.
        </p>
      </div>
    </ContentPage>
  )
}
