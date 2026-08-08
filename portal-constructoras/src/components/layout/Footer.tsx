import Link from 'next/link'

export function Footer() {
  return (
    <footer className="hab-footer">
      <div className="hab-footer__grid">
        <div>
          <div className="hab-footer__brand">HAB</div>
          <p style={{ fontSize: '13px', maxWidth: 280, lineHeight: 1.7 }}>
            Marketplace de proyectos de aporte para constructoras certificadas.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/como-funciona">Cómo funciona</Link>
          <Link href="/solicitar-acceso">Solicitar acceso</Link>
          <Link href="/login">Ingresar</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </div>
      </div>
      <div className="hab-footer__copy">
        © {new Date().getFullYear()} HAB Desarrolladores Inmobiliarios · Constructoras
      </div>
    </footer>
  )
}
