'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import {
  REGISTRO_DEBUG_OTP_KEY,
  REGISTRO_NOMBRE_KEY,
  REGISTRO_TELEFONO_KEY,
  axiosErrorMessage,
} from '@/lib/draft'

const schema = z.object({
  nombre: z.string().min(2, 'Ingresa tu nombre'),
  telefono: z
    .string()
    .regex(/^\+\d{7,15}$/, 'Usa formato E.164, ej. +573001234567'),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function RegistroPaso1Form() {
  const router = useRouter()
  const { registro } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', telefono: '', email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    setLoading(true)
    try {
      const res = await registro({
        nombre: values.nombre,
        telefono: values.telefono,
        email: values.email || undefined,
        password: values.password,
      })
      sessionStorage.setItem(REGISTRO_TELEFONO_KEY, values.telefono)
      sessionStorage.setItem(REGISTRO_NOMBRE_KEY, values.nombre)
      if (res.debug_otp) {
        sessionStorage.setItem(REGISTRO_DEBUG_OTP_KEY, res.debug_otp)
      } else {
        sessionStorage.removeItem(REGISTRO_DEBUG_OTP_KEY)
      }
      router.push('/registro/paso-2')
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo completar el registro'))
    } finally {
      setLoading(false)
    }
  })

  return (
    <form className="hab-form" onSubmit={onSubmit} noValidate>
      {error && <div className="hab-form__error">{error}</div>}

      <div className="hab-field">
        <label htmlFor="reg-nombre">Nombre completo</label>
        <input id="reg-nombre" autoComplete="name" {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <span className="hab-field__error">{form.formState.errors.nombre.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="reg-telefono">Teléfono (WhatsApp)</label>
        <input
          id="reg-telefono"
          type="tel"
          placeholder="+573001234567"
          autoComplete="tel"
          {...form.register('telefono')}
        />
        <span className="hab-form__hint">Formato internacional E.164</span>
        {form.formState.errors.telefono && (
          <span className="hab-field__error">{form.formState.errors.telefono.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="reg-email">Email (opcional)</label>
        <input id="reg-email" type="email" autoComplete="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <span className="hab-field__error">{form.formState.errors.email.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="reg-password">Contraseña</label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <span className="hab-field__error">{form.formState.errors.password.message}</span>
        )}
      </div>

      <div className="hab-form__actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Registrando…' : 'Continuar'}
        </button>
        <Link href="/login" className="hab-form__hint">
          Ya tengo cuenta
        </Link>
      </div>
    </form>
  )
}
