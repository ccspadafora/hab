'use client'

import { create } from 'zustand'
import Cookies from 'js-cookie'
import { COOKIE_NAME, PERFIL_COOKIE } from '@/lib/utils'
import { loginConstructora, type LoginResponse } from '@/lib/api/proyectos'

interface AuthUser {
  email: string
  portal_user_id: number
  constructora_id: number
  perfil_id: number | null
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuth: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  setSession: (payload: LoginResponse) => void
  logout: () => void
  hydrate: () => void
}

function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return Cookies.get(COOKIE_NAME) ?? null
}

function readPerfilId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = Cookies.get(PERFIL_COOKIE)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuth: false,

  hydrate: () => {
    const token = readToken()
    const perfil_id = readPerfilId()
    set({
      token,
      isAuth: !!token,
      user: token
        ? {
            email: '',
            portal_user_id: 0,
            constructora_id: 0,
            perfil_id,
          }
        : null,
    })
  },

  setSession: (payload) => {
    Cookies.set(COOKIE_NAME, payload.access, { expires: 7, sameSite: 'lax' })
    if (payload.perfil_id != null) {
      Cookies.set(PERFIL_COOKIE, String(payload.perfil_id), { expires: 7, sameSite: 'lax' })
    }
    set({
      token: payload.access,
      isAuth: true,
      user: {
        email: payload.email,
        portal_user_id: payload.portal_user_id,
        constructora_id: payload.constructora_id,
        perfil_id: payload.perfil_id ?? null,
      },
    })
  },

  login: async (email, password) => {
    const result = await loginConstructora(email, password)
    Cookies.set(COOKIE_NAME, result.access, { expires: 7, sameSite: 'lax' })
    if (result.perfil_id != null) {
      Cookies.set(PERFIL_COOKIE, String(result.perfil_id), { expires: 7, sameSite: 'lax' })
    }
    set({
      token: result.access,
      isAuth: true,
      user: {
        email: result.email,
        portal_user_id: result.portal_user_id,
        constructora_id: result.constructora_id,
        perfil_id: result.perfil_id ?? null,
      },
    })
    return result
  },

  logout: () => {
    Cookies.remove(COOKIE_NAME)
    Cookies.remove(PERFIL_COOKIE)
    set({ user: null, token: null, isAuth: false })
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },
}))
