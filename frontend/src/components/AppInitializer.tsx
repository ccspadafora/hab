import { useEffect, useRef } from 'react'
import { apiClient } from '../api/client'
import { useAuthStore } from '../features/auth/authStore'
import { usePermissionsStore } from '../features/auth/permissionsStore'

/**
 * Carga el usuario y sus permisos al iniciar la app si hay un token guardado.
 * Resuelve el problema de que al recargar la página el store queda vacío
 * aunque el usuario ya había iniciado sesión.
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuth, user, setUser, logout } = useAuthStore()
  const setPermisos = usePermissionsStore(s => s.setPermisos)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Si hay token pero no hay usuario cargado, recuperarlo del backend
    if (isAuth && !user) {
      apiClient.get('/auth/me/')
        .then(({ data }) => {
          setUser(data)
          if (data.permisos) {
            setPermisos(data.role, data.permisos)
          }
        })
        .catch(() => {
          // Token inválido o expirado → forzar logout
          logout()
        })
    }
  }, [isAuth, user, setUser, setPermisos, logout])

  return <>{children}</>
}
