'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    store.hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    user: store.user,
    token: store.token,
    isAuth: store.isAuth,
    login: store.login,
    logout: store.logout,
    setSession: store.setSession,
    perfilId: store.user?.perfil_id ?? null,
  }
}
