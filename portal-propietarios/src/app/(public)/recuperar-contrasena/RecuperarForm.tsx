'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getBrowserClient } from '@/lib/api/client'

const schema = z.object({
  telefono: z.string().regex(/^\+\d{10,15}$/, 'Usa formato E.164, ej. +573001112233'),
})

type FormData = z.infer<typeof schema>

export function RecuperarForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    setOk('')
    try {
      await getBrowserClient().post('/auth/propietario/otp/solicitar/', {
        telefono: data.telefono,
      })
      sessionStorage.setItem('hab_registro_telefono', data.telefono)
      setOk('Código enviado. Te llevamos a verificar.')
      setTimeout(() => router.push('/registro/paso-2'), 800)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'No pudimos enviar el código. Verifica el número.')
    }
  }

  return (
    <form className="hab-form" onSubmit={handleSubmit(onSubmit)}>
      <label className="hab-form__label">
        Teléfono
        <input className="hab-form__input" placeholder="+57300..." {...register('telefono')} />
        {errors.telefono && <span className="hab-form__error">{errors.telefono.message}</span>}
      </label>
      {error && <p className="hab-form__error">{error}</p>}
      {ok && <p className="hab-form__hint">{ok}</p>}
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Enviar código'}
      </button>
    </form>
  )
}
