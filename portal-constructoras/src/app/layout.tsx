import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { RootProviders } from '@/components/layout/RootProviders'
import './globals.css'

const barlow = Barlow({
  subsets:  ['latin'],
  weight:   ['100', '200', '300', '400', '600', '700', '900'],
  variable: '--font-barlow',
  display:  'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets:  ['latin'],
  weight:   ['700', '900'],
  variable: '--font-barlow-condensed',
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'HAB — Portal Constructoras',
    template: '%s · HAB Constructoras',
  },
  description: 'Accede a proyectos inmobiliarios certificados y expresa interés en oportunidades de aporte.',
  metadataBase: new URL('https://constructoras.hab.com.co'),
  openGraph: {
    siteName: 'HAB Desarrolladores Inmobiliarios',
    locale:   'es_CO',
    type:     'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
