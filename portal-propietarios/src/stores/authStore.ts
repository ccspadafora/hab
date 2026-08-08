import { create } from 'zustand'
import Cookies from 'js-cookie'

const ACCESS_COOKIE = process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'hab_access_token'
const PROPIETARIO_COOKIE = 'hab_propietario_id'
const PORTAL_USER_COOKIE = 'hab_portal_user_id'

export interface AuthSession {
  accessToken: string
  propietarioId: number | null
  portalUserId: number | null
}

interface AuthState extends AuthSession {
  hydrated: boolean
  setSession: (session: AuthSession) => void
  clearSession: () => void
  hydrate: () => void
}

function persistCookies(session: AuthSession) {
  Cookies.set(ACCESS_COOKIE, session.accessToken, {
    expires: 7,
    sameSite: 'lax',
    path: '/',
  })
  if (session.propietarioId != null) {
    Cookies.set(PROPIETARIO_COOKIE, String(session.propietarioId), {
      expires: 7,
      sameSite: 'lax',
      path: '/',
    })
  }
  if (session.portalUserId != null) {
    Cookies.set(PORTAL_USER_COOKIE, String(session.portalUserId), {
      expires: 7,
      sameSite: 'lax',
      path: '/',
    })
  }
}

function clearCookies() {
  Cookies.remove(ACCESS_COOKIE, { path: '/' })
  Cookies.remove(PROPIETARIO_COOKIE, { path: '/' })
  Cookies.remove(PORTAL_USER_COOKIE, { path: '/' })
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: '',
  propietarioId: null,
  portalUserId: null,
  hydrated: false,

  setSession: (session) => {
    persistCookies(session)
    set({
      accessToken: session.accessToken,
      propietarioId: session.propietarioId,
      portalUserId: session.portalUserId,
      hydrated: true,
    })
  },

  clearSession: () => {
    clearCookies()
    set({
      accessToken: '',
      propietarioId: null,
      portalUserId: null,
      hydrated: true,
    })
  },

  hydrate: () => {
    const accessToken = Cookies.get(ACCESS_COOKIE) ?? ''
    const propietarioRaw = Cookies.get(PROPIETARIO_COOKIE)
    const portalRaw = Cookies.get(PORTAL_USER_COOKIE)
    set({
      accessToken,
      propietarioId: propietarioRaw ? Number(propietarioRaw) : null,
      portalUserId: portalRaw ? Number(portalRaw) : null,
      hydrated: true,
    })
  },
}))
