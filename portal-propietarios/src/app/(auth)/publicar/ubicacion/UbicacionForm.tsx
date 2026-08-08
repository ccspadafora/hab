'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiUpdatePublicacion } from '@/lib/api/publicaciones'
import { axiosErrorMessage, getDraftData, getDraftId, mergeDraftData } from '@/lib/draft'

const schema = z.object({
  direccion: z.string().min(5, 'Ingresa la dirección'),
  barrio: z.string().min(2, 'Ingresa el barrio'),
  localidad: z.string().min(2, 'Ingresa la localidad'),
  ciudad: z.string().min(2, 'Ingresa la ciudad'),
  latitud: z.string().optional(),
  longitud: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function UbicacionForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      direccion: '',
      barrio: '',
      localidad: '',
      ciudad: 'Bogotá',
      latitud: '',
      longitud: '',
    },
  })

  useEffect(() => {
    const id = getDraftId()
    if (!id) {
      router.replace('/publicar/inmueble')
      return
    }
    const draft = getDraftData()
    form.reset({
      direccion: typeof draft.direccion === 'string' && draft.direccion !== 'Por definir' ? draft.direccion : '',
      barrio: typeof draft.barrio === 'string' && draft.barrio !== 'Por definir' ? draft.barrio : '',
      localidad: typeof draft.localidad === 'string' && draft.localidad !== 'Por definir' ? draft.localidad : '',
      ciudad: typeof draft.ciudad === 'string' ? draft.ciudad : 'Bogotá',
      latitud: draft.latitud != null ? String(draft.latitud) : '',
      longitud: draft.longitud != null ? String(draft.longitud) : '',
    })
  }, [form, router])

  const onSubmit = form.handleSubmit(async (values) => {
    const id = getDraftId()
    if (!id) {
      router.replace('/publicar/inmueble')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const lat = values.latitud?.trim() ? Number(values.latitud) : null
      const lng = values.longitud?.trim() ? Number(values.longitud) : null
      const payload = {
        direccion: values.direccion,
        barrio: values.barrio,
        localidad: values.localidad,
        ciudad: values.ciudad,
        latitud: lat != null && Number.isFinite(lat) ? lat : null,
        longitud: lng != null && Number.isFinite(lng) ? lng : null,
      }
      await apiUpdatePublicacion(id, payload)
      mergeDraftData(payload)
      router.push('/publicar/fotos')
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo guardar la ubicación'))
    } finally {
      setLoading(false)
    }
  })

  return (
    <form className="hab-form hab-form--wide card" style={{ padding: 28 }} onSubmit={onSubmit} noValidate>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>Ubicación</h1>
      <p className="hab-form__hint" style={{ marginBottom: 8 }}>
        La dirección exacta solo es visible para HAB y en negociación.
      </p>
      {error && <div className="hab-form__error">{error}</div>}

      <div className="hab-field">
        <label htmlFor="direccion">Dirección</label>
        <input id="direccion" {...form.register('direccion')} placeholder="Calle 100 # 15-20" />
        {form.formState.errors.direccion && (
          <span className="hab-field__error">{form.formState.errors.direccion.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="barrio">Barrio</label>
        <input id="barrio" {...form.register('barrio')} />
        {form.formState.errors.barrio && (
          <span className="hab-field__error">{form.formState.errors.barrio.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="localidad">Localidad</label>
        <input id="localidad" {...form.register('localidad')} />
        {form.formState.errors.localidad && (
          <span className="hab-field__error">{form.formState.errors.localidad.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="ciudad">Ciudad</label>
        <input id="ciudad" {...form.register('ciudad')} />
      </div>

      <div className="hab-field">
        <label htmlFor="latitud">Latitud (opcional)</label>
        <input id="latitud" {...form.register('latitud')} placeholder="4.710989" />
      </div>

      <div className="hab-field">
        <label htmlFor="longitud">Longitud (opcional)</label>
        <input id="longitud" {...form.register('longitud')} placeholder="-74.072092" />
      </div>

      <div className="hab-form__actions">
        <button type="button" className="btn-secondary" onClick={() => router.push('/publicar/inmueble')}>
          ← Atrás
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Continuar →'}
        </button>
      </div>
    </form>
  )
}
