'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  mensaje: z.string().min(10, 'Cuéntanos un poco más (mín. 10 caracteres)'),
})

type FormData = z.infer<typeof schema>

export function ContactoForm() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    const subject = encodeURIComponent(`Contacto portal — ${data.nombre}`)
    const body = encodeURIComponent(
      `Nombre: ${data.nombre}\nTeléfono: ${data.telefono}\nEmail: ${data.email}\n\n${data.mensaje}`
    )
    window.location.href = `mailto:hola@hab.com.co?subject=${subject}&body=${body}`
    setSent(true)
    reset()
  }

  return (
    <form className="hab-form" onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
      <label className="hab-form__label">
        Nombre
        <input className="hab-form__input" {...register('nombre')} />
        {errors.nombre && <span className="hab-form__error">{errors.nombre.message}</span>}
      </label>
      <label className="hab-form__label">
        Correo
        <input className="hab-form__input" type="email" {...register('email')} />
        {errors.email && <span className="hab-form__error">{errors.email.message}</span>}
      </label>
      <label className="hab-form__label">
        Teléfono / WhatsApp
        <input className="hab-form__input" {...register('telefono')} placeholder="+57..." />
        {errors.telefono && <span className="hab-form__error">{errors.telefono.message}</span>}
      </label>
      <label className="hab-form__label">
        Mensaje
        <textarea className="hab-form__input" rows={4} {...register('mensaje')} />
        {errors.mensaje && <span className="hab-form__error">{errors.mensaje.message}</span>}
      </label>
      <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
        Enviar mensaje
      </button>
      {sent && (
        <p className="hab-form__hint" style={{ marginTop: 12 }}>
          Se abrirá tu correo para completar el envío. También puedes escribirnos por WhatsApp.
        </p>
      )}
    </form>
  )
}
