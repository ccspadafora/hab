import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentPage } from '@/components/layout/ContentPage'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Respuestas claras sobre publicación, anonimato, tiempos y el modelo de aporte inmobiliario HAB.',
}

const FAQS = [
  {
    q: '¿Cuánto cuesta publicar mi inmueble?',
    a: 'Publicar y recibir el análisis de prefactibilidad es gratuito. HAB no cobra comisión al propietario por listar el inmueble en el marketplace.',
  },
  {
    q: '¿Las constructoras ven mi dirección o teléfono?',
    a: 'No. En el catálogo solo ven barrio, localidad, métricas técnicas y score orientativo. Tus datos personales se revelan únicamente cuando avanzas a una negociación formal mediada por HAB.',
  },
  {
    q: '¿Qué es el modelo de aporte?',
    a: 'En lugar de vender solo por dinero al contado, puedes aportar el inmueble a un proyecto inmobiliario a cambio de unidades, dinero o un esquema mixto, según lo negociado con la constructora.',
  },
  {
    q: '¿Cuánto tarda el análisis?',
    a: 'En condiciones normales, el análisis inicial de prefactibilidad se completa en alrededor de 48 horas hábiles después de enviar tu publicación a revisión.',
  },
  {
    q: '¿Qué pasa si mi inmueble no califica?',
    a: 'Te lo informamos con claridad. Puedes mantener el borrador, actualizar datos o consultar con el equipo HAB. No hay obligación de continuar.',
  },
  {
    q: '¿Estoy obligado a aceptar una oferta?',
    a: 'No. Tú decides en cada etapa. HAB facilita el proceso y la documentación, pero la decisión final siempre es tuya.',
  },
  {
    q: '¿En qué ciudades opera HAB?',
    a: 'El foco actual es Bogotá y su área de influencia. Si tienes un inmueble en otra ciudad, contáctanos para evaluar viabilidad.',
  },
  {
    q: '¿Cómo verifican mi identidad?',
    a: 'Antes de activar una publicación, HAB valida identidad y titularidad con los documentos que cargues en el portal. Es un requisito de seguridad para todas las partes.',
  },
]

export default function FaqPage() {
  return (
    <ContentPage
      label="FAQ"
      title="Preguntas frecuentes"
      subtitle="Lo esencial sobre publicar, privacidad, tiempos y el rol de HAB en la negociación."
      ctaHref="/registro/paso-1"
      ctaLabel="Empezar a publicar"
    >
      <div className="faq-list">
        {FAQS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <p style={{ marginTop: 36, fontSize: 14, color: '#666' }}>
        ¿No encontraste tu respuesta?{' '}
        <Link href="/contacto" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
          Contáctanos
        </Link>
        .
      </p>
    </ContentPage>
  )
}
