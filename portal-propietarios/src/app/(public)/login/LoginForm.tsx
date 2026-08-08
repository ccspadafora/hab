'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { OTPInput } from '@/components/ui/OTPInput'
import { useAuth } from '@/hooks/useAuth'
import { axiosErrorMessage } from '@/lib/draft'

const passwordSchema = z.object({
  telefono: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Usa formato E.164, ej. +573001234567'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

const otpPhoneSchema = z.object({
  telefono: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Usa formato E.164, ej. +573001234567'),
})

type PasswordForm = z.infer<typeof passwordSchema>
type OtpPhoneForm = z.infer<typeof otpPhoneSchema>

export function LoginForm() {
  const { login, loginWithOtp, solicitarOtp } = useAuth()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/inicio'

  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone')
  const [otpPhone, setOtpPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { telefono: '', password: '' },
  })

  const otpForm = useForm<OtpPhoneForm>({
    resolver: zodResolver(otpPhoneSchema),
    defaultValues: { telefono: '' },
  })

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    setError(null)
    setLoading(true)
    try {
      await login(values.telefono, values.password, redirectTo)
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo iniciar sesión'))
    } finally {
      setLoading(false)
    }
  })

  const onOtpPhoneSubmit = otpForm.handleSubmit(async (values) => {
    setError(null)
    setLoading(true)
    try {
      const res = await solicitarOtp(values.telefono)
      setOtpPhone(values.telefono)
      setDebugOtp(res.debug_otp ?? null)
      setOtpStep('code')
      setOtpCode('')
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo enviar el código'))
    } finally {
      setLoading(false)
    }
  })

  const onVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await loginWithOtp(otpPhone, otpCode, redirectTo)
    } catch (err) {
      setError(axiosErrorMessage(err, 'Código inválido'))
    } finally {
      setLoading(false)
    }
  }

  const onResendOtp = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await solicitarOtp(otpPhone)
      setDebugOtp(res.debug_otp ?? null)
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo reenviar el código'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="hab-form__actions" style={{ marginBottom: 20, marginTop: 0 }}>
        <button
          type="button"
          className={mode === 'password' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => {
            setMode('password')
            setError(null)
          }}
        >
          Contraseña
        </button>
        <button
          type="button"
          className={mode === 'otp' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => {
            setMode('otp')
            setError(null)
          }}
        >
          Código OTP
        </button>
      </div>

      {error && <div className="hab-form__error" style={{ marginBottom: 16 }}>{error}</div>}

      {mode === 'password' && (
        <form className="hab-form" onSubmit={onPasswordSubmit} noValidate>
          <div className="hab-field">
            <label htmlFor="login-telefono">Teléfono</label>
            <input
              id="login-telefono"
              type="tel"
              placeholder="+573001234567"
              autoComplete="tel"
              {...passwordForm.register('telefono')}
            />
            {passwordForm.formState.errors.telefono && (
              <span className="hab-field__error">
                {passwordForm.formState.errors.telefono.message}
              </span>
            )}
          </div>
          <div className="hab-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              {...passwordForm.register('password')}
            />
            {passwordForm.formState.errors.password && (
              <span className="hab-field__error">
                {passwordForm.formState.errors.password.message}
              </span>
            )}
          </div>
          <div className="hab-form__actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
            <Link href="/recuperar-contrasena" className="hab-form__hint">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      )}

      {mode === 'otp' && otpStep === 'phone' && (
        <form className="hab-form" onSubmit={onOtpPhoneSubmit} noValidate>
          <div className="hab-field">
            <label htmlFor="otp-telefono">Teléfono</label>
            <input
              id="otp-telefono"
              type="tel"
              placeholder="+573001234567"
              autoComplete="tel"
              {...otpForm.register('telefono')}
            />
            {otpForm.formState.errors.telefono && (
              <span className="hab-field__error">{otpForm.formState.errors.telefono.message}</span>
            )}
          </div>
          <div className="hab-form__actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
          </div>
        </form>
      )}

      {mode === 'otp' && otpStep === 'code' && (
        <div className="hab-form">
          <p className="hab-form__hint">
            Enviamos un código a <strong>{otpPhone}</strong>
          </p>
          {debugOtp && (
            <p className="hab-form__hint">Código de prueba: <strong>{debugOtp}</strong></p>
          )}
          <OTPInput length={6} value={otpCode} onChange={setOtpCode} error={error ?? undefined} />
          <div className="hab-form__actions">
            <button type="button" className="btn-primary" onClick={onVerifyOtp} disabled={loading}>
              {loading ? 'Verificando…' : 'Verificar'}
            </button>
            <button type="button" className="btn-secondary" onClick={onResendOtp} disabled={loading}>
              Reenviar
            </button>
          </div>
        </div>
      )}

      <p className="hab-form__hint" style={{ marginTop: 28 }}>
        ¿Aún no tienes cuenta?{' '}
        <Link href="/registro/paso-1" style={{ color: 'var(--hab-verde)', fontWeight: 600 }}>
          Regístrate
        </Link>
      </p>
    </div>
  )
}
