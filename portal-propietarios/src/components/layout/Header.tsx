import Link from 'next/link'

const NAV = [
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/preguntas-frecuentes', label: 'FAQ' },
  { href: '/testimonios', label: 'Testimonios' },
  { href: '/contacto', label: 'Contacto' },
]

export function Header() {
  return (
    <header className="hab-header">
      <Link href="/" className="hab-header__brand">HAB</Link>
      <nav className="hab-header__nav" aria-label="Principal">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
        <Link href="/login" className="btn-secondary" style={{ padding: '10px 18px' }}>
          Ingresar
        </Link>
        <Link href="/registro/paso-1" className="btn-primary" style={{ padding: '10px 18px' }}>
          Publicar
        </Link>
      </nav>
    </header>
  )
}
