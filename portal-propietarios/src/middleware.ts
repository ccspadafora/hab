import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith('/registro/')
  )
  if (isPublic) return NextResponse.next()

  const cookieName = process.env.COOKIE_NAME ?? 'hab_access_token'
  const token = request.cookies.get(cookieName)?.value

  if (!token) {
    // clone preserves basePath (/propietarios) — never use new URL('/login', ...)
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)'],
}
