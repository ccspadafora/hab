import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/como-funciona',
  '/preguntas-frecuentes',
  '/testimonios',
  '/contacto',
  '/login',
  '/registro',
  '/privacidad',
  '/terminos',
  '/recuperar-contrasena',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and Next.js internals
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith('/registro/')
  )
  if (isPublic) return NextResponse.next()

  // Check for JWT cookie
  const cookieName = process.env.COOKIE_NAME ?? 'hab_access_token'
  const token = request.cookies.get(cookieName)?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static files and api routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)'],
}
