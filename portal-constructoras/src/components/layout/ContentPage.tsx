import Link from 'next/link'

type Props = {
  label: string
  title: string
  subtitle?: string
  ctaHref?: string
  ctaLabel?: string
  children: React.ReactNode
}

export function ContentPage({ label, title, subtitle, ctaHref, ctaLabel, children }: Props) {
  return (
    <main className="content-page">
      <header className="content-page__hero">
        <div className="section-label" style={{ color: 'var(--hab-amarillo)' }}>{label}</div>
        <h1 className="content-page__title">{title}</h1>
        {subtitle ? <p className="content-page__subtitle">{subtitle}</p> : null}
        {ctaHref && ctaLabel ? (
          <Link href={ctaHref} className="btn-primary" style={{ marginTop: 28 }}>
            {ctaLabel}
          </Link>
        ) : null}
      </header>
      <div className="content-page__body">{children}</div>
    </main>
  )
}
