import { create } from 'zustand'
import type { User } from '../../types/models'
import { usePermissionsStore } from './permissionsStore'

interface AuthState {
  user:    User | null
  isAuth:  boolean
  setUser: (user: User & { permisos?: Record<string, { ver: boolean; editar: boolean }> }) => void
  logout:  () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:   null,
  isAuth: !!localStorage.getItem('access_token'),

  setUser: (user) => {
    // Cargar permisos en el permissionsStore
    if (user.permisos) {
      usePermissionsStore.getState().setPermisos(user.role, user.permisos as any)
    }
    set({ user, isAuth: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    usePermissionsStore.getState().setPermisos('', {})
    set({ user: null, isAuth: false })
  },
}))
