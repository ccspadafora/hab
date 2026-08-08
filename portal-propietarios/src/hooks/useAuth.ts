'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  apiLogin,
  apiRegistro,
  apiSolicitarOtp,
  apiVerificarOtp,
} from '@/lib/api/auth'
import { useAuthStore, type AuthSession } from '@/stores/authStore'

function sessionFromTokenResponse(data: {
  access: string
  portal_user_id: number
  propietario_id: number
}): AuthSession {
  return {
    accessToken: data.access,
    portalUserId: data.portal_user_id,
    propietarioId: data.propietario_id,
  }
}

export function useAuth() {
  const router = useRouter()
  const {
    accessToken,
    propietarioId,
    portalUserId,
    hydrated,
    setSession,
    clearSession,
    hydrate,
  } = useAuthStore()

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  const isAuthenticated = Boolean(accessToken)

  const login = useCallback(
    async (telefono: string, password: string, redirectTo = '/inicio') => {
      const data = await apiLogin({ telefono, password })
      setSession(sessionFromTokenResponse(data))
      router.push(redirectTo)
      return data
    },
    [router, setSession],
  )

  const loginWithOtp = useCallback(
    async (telefono: string, code: string, redirectTo = '/inicio') => {
      const data = await apiVerificarOtp({ telefono, code })
      setSession(sessionFromTokenResponse(data))
      router.push(redirectTo)
      return data
    },
    [router, setSession],
  )

  const registro = useCallback(
    async (payload: {
      nombre: string
      telefono: string
      email?: string
      password: string
    }) => {
      return apiRegistro(payload)
    },
    [],
  )

  const solicitarOtp = useCallback(async (telefono: string) => {
    return apiSolicitarOtp(telefono)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    router.push('/login')
  }, [clearSession, router])

  return {
    accessToken,
    propietarioId,
    portalUserId,
    hydrated,
    isAuthenticated,
    setSession,
    clearSession,
    login,
    loginWithOtp,
    registro,
    solicitarOtp,
    logout,
  }
}
