'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginForm } from '@/lib/validations'
import { useAuth } from '@/hooks/useAuth'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginForm) => {
    setApiError(null)
    try {
      await login(values.email, values.password)
      const redirect = searchParams.get('redirect') || '/inicio'
      router.push(redirect)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Credenciales inválidas'
      setApiError(msg)
    }
  }

  return (
    <form className="hab-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="form-field">
        <span>Correo corporativo</span>
        <input type="email" autoComplete="email" {...register('email')} />
        {errors.email && <em className="form-error">{errors.email.message}</em>}
      </label>
      <label className="form-field">
        <span>Contraseña</span>
        <input type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <em className="form-error">{errors.password.message}</em>}
      </label>
      {apiError && (
        <p className="form-error" role="alert">
          {apiError}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
