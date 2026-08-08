import Link from 'next/link'

export function Footer() {
  return (
    <footer className="hab-footer">
      <div className="hab-footer__grid">
        <div>
          <div className="hab-footer__brand">HAB</div>
          <p style={{ fontSize: '13px', maxWidth: 280, lineHeight: 1.7 }}>
            Alternativa al mercado inmobiliario tradicional para propietarios en Bogotá.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/como-funciona">Cómo funciona</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/contacto">Contacto</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
          <Link href="/login">Ingresar</Link>
        </div>
      </div>
      <div className="hab-footer__copy">
        © {new Date().getFullYear()} HAB Desarrolladores Inmobiliarios · Colombia
      </div>
    </footer>
  )
}
