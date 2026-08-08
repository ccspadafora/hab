'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OTPInput } from '@/components/ui/OTPInput'
import { useAuth } from '@/hooks/useAuth'
import {
  REGISTRO_DEBUG_OTP_KEY,
  REGISTRO_TELEFONO_KEY,
  axiosErrorMessage,
} from '@/lib/draft'

export function RegistroPaso2Form() {
  const router = useRouter()
  const { loginWithOtp, solicitarOtp } = useAuth()
  const [telefono, setTelefono] = useState('')
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(REGISTRO_TELEFONO_KEY)
    if (!stored) {
      router.replace('/registro/paso-1')
      return
    }
    setTelefono(stored)
    setDebugOtp(sessionStorage.getItem(REGISTRO_DEBUG_OTP_KEY))
  }, [router])

  const onVerify = async () => {
    if (code.length !== 6) {
      setError('Ingresa el código de 6 dígitos')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await loginWithOtp(telefono, code, '/registro/paso-3')
      sessionStorage.removeItem(REGISTRO_DEBUG_OTP_KEY)
    } catch (err) {
      setError(axiosErrorMessage(err, 'Código inválido o expirado'))
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (!telefono) return
    setError(null)
    setLoading(true)
    try {
      const res = await solicitarOtp(telefono)
      if (res.debug_otp) {
        sessionStorage.setItem(REGISTRO_DEBUG_OTP_KEY, res.debug_otp)
        setDebugOtp(res.debug_otp)
      }
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo reenviar el código'))
    } finally {
      setLoading(false)
    }
  }

  if (!telefono) {
    return <p className="hab-form__hint">Cargando…</p>
  }

  return (
    <div className="hab-form">
      <p className="hab-form__hint">
        Código enviado a <strong>{telefono}</strong>
      </p>
      {debugOtp && (
        <p className="hab-form__hint">
          Código de prueba: <strong>{debugOtp}</strong>
        </p>
      )}
      {error && <div className="hab-form__error">{error}</div>}
      <OTPInput length={6} value={code} onChange={setCode} />
      <div className="hab-form__actions">
        <button type="button" className="btn-primary" onClick={onVerify} disabled={loading}>
          {loading ? 'Verificando…' : 'Verificar'}
        </button>
        <button type="button" className="btn-secondary" onClick={onResend} disabled={loading}>
          Reenviar código
        </button>
      </div>
      <Link href="/registro/paso-1" className="hab-form__hint">
        ← Cambiar teléfono
      </Link>
    </div>
  )
}
