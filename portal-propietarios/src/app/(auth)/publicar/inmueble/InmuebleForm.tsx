'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiCreatePublicacion, apiUpdatePublicacion } from '@/lib/api/publicaciones'
import { axiosErrorMessage, getDraftId, mergeDraftData, setDraftId } from '@/lib/draft'

const schema = z.object({
  tipo: z.enum(['casa', 'lote', 'apartamento', 'local', 'bodega']),
  area_lote: z.number().positive('Área requerida'),
  estrato: z.number().int().min(1).max(6),
  habitaciones: z.number().int().min(0).nullable().optional(),
  banos: z.number().int().min(0).nullable().optional(),
  pisos: z.number().int().min(0).nullable().optional(),
  estado_inmueble: z.enum(['muy_bueno', 'bueno', 'regular', 'demolicion']),
  descripcion: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function emptyToNull(value: unknown): number | null {
  if (value === '' || value == null || Number.isNaN(value)) return null
  return Number(value)
}

export function InmuebleForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'casa',
      area_lote: undefined,
      estrato: 3,
      habitaciones: null,
      banos: null,
      pisos: null,
      estado_inmueble: 'bueno',
      descripcion: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        tipo: values.tipo,
        area_lote: values.area_lote,
        estrato: values.estrato,
        habitaciones: values.habitaciones ?? null,
        banos: values.banos ?? null,
        pisos: values.pisos ?? null,
        estado_inmueble: values.estado_inmueble,
        descripcion: values.descripcion || '',
        direccion: 'Por definir',
        barrio: 'Por definir',
        localidad: 'Por definir',
        ciudad: 'Bogotá',
      }

      const existingId = getDraftId()
      const pub = existingId
        ? await apiUpdatePublicacion(existingId, payload)
        : await apiCreatePublicacion(payload)

      setDraftId(pub.id)
      mergeDraftData({ ...payload, id: pub.id })
      router.push('/publicar/ubicacion')
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo guardar el inmueble'))
    } finally {
      setLoading(false)
    }
  })

  return (
    <form className="hab-form hab-form--wide card" style={{ padding: 28 }} onSubmit={onSubmit} noValidate>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>Datos del inmueble</h1>
      <p className="hab-form__hint" style={{ marginBottom: 8 }}>
        Cuéntanos las características básicas de tu propiedad.
      </p>
      {error && <div className="hab-form__error">{error}</div>}

      <div className="hab-field">
        <label htmlFor="tipo">Tipo</label>
        <select id="tipo" {...form.register('tipo')}>
          <option value="casa">Casa</option>
          <option value="lote">Lote</option>
          <option value="apartamento">Apartamento</option>
          <option value="local">Local</option>
          <option value="bodega">Bodega</option>
        </select>
      </div>

      <div className="hab-field">
        <label htmlFor="area_lote">Área del lote (m²)</label>
        <input
          id="area_lote"
          type="number"
          step="0.01"
          min="1"
          {...form.register('area_lote', { valueAsNumber: true })}
        />
        {form.formState.errors.area_lote && (
          <span className="hab-field__error">{form.formState.errors.area_lote.message}</span>
        )}
      </div>

      <div className="hab-field">
        <label htmlFor="estrato">Estrato</label>
        <select id="estrato" {...form.register('estrato', { valueAsNumber: true })}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="hab-field">
        <label htmlFor="habitaciones">Habitaciones</label>
        <input
          id="habitaciones"
          type="number"
          min="0"
          {...form.register('habitaciones', { setValueAs: emptyToNull })}
        />
      </div>

      <div className="hab-field">
        <label htmlFor="banos">Baños</label>
        <input
          id="banos"
          type="number"
          min="0"
          {...form.register('banos', { setValueAs: emptyToNull })}
        />
      </div>

      <div className="hab-field">
        <label htmlFor="pisos">Pisos</label>
        <input
          id="pisos"
          type="number"
          min="0"
          {...form.register('pisos', { setValueAs: emptyToNull })}
        />
      </div>

      <div className="hab-field">
        <label htmlFor="estado_inmueble">Estado del inmueble</label>
        <select id="estado_inmueble" {...form.register('estado_inmueble')}>
          <option value="muy_bueno">Muy bueno</option>
          <option value="bueno">Bueno</option>
          <option value="regular">Regular</option>
          <option value="demolicion">Para demolición</option>
        </select>
      </div>

      <div className="hab-field">
        <label htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" {...form.register('descripcion')} placeholder="Detalles relevantes…" />
      </div>

      <div className="hab-form__actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Continuar →'}
        </button>
      </div>
    </form>
  )
}
