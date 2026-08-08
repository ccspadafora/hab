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
    default:  'HAB — Portal Propietarios',
    template: '%s · HAB',
  },
  description: 'Publica tu inmueble y descubre la alternativa al mercado inmobiliario tradicional.',
  metadataBase: new URL('https://portal.hab.com.co'),
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
