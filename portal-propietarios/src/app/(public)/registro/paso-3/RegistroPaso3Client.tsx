'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { REGISTRO_NOMBRE_KEY, REGISTRO_TELEFONO_KEY } from '@/lib/draft'

export function RegistroPaso3Client() {
  const { isAuthenticated, hydrated, accessToken, setSession, propietarioId, portalUserId } =
    useAuth()
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    setNombre(sessionStorage.getItem(REGISTRO_NOMBRE_KEY) ?? '')
    // Ensure cookies/session are hydrated if token already set in paso-2
    if (accessToken && !isAuthenticated) {
      setSession({
        accessToken,
        propietarioId,
        portalUserId,
      })
    }
  }, [accessToken, isAuthenticated, propietarioId, portalUserId, setSession])

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(REGISTRO_TELEFONO_KEY)
      sessionStorage.removeItem(REGISTRO_NOMBRE_KEY)
    }
  }, [])

  return (
    <>
      <h1>¡Bienvenido{nombre ? `, ${nombre.split(' ')[0]}` : ''}!</h1>
      <p className="hab-auth-lead">
        Tu cuenta está lista. Publica tu inmueble y recibe propuestas de
        constructoras verificadas.
      </p>
      {!hydrated ? (
        <p className="hab-form__hint">Preparando tu sesión…</p>
      ) : (
        <div className="hab-form__actions">
          <Link href="/inicio" className="btn-primary">
            Ir al inicio
          </Link>
          <Link href="/publicar/inmueble" className="btn-secondary">
            Publicar mi inmueble
          </Link>
        </div>
      )}
    </>
  )
}
