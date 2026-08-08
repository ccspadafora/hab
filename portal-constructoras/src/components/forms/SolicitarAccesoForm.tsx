'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  solicitudCertificacionSchema,
  type SolicitudCertificacionForm,
} from '@/lib/validations'
import { crearSolicitud } from '@/lib/api/proyectos'

export function SolicitarAccesoForm() {
  const [solicitudId, setSolicitudId] = useState<number | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudCertificacionForm>({
    resolver: zodResolver(solicitudCertificacionSchema),
    defaultValues: {
      anios_experiencia: 0,
      proyectos_ejecutados: 0,
    },
  })

  const onSubmit = async (values: SolicitudCertificacionForm) => {
    setApiError(null)
    try {
      const zonas = values.zonas_interes
        ? values.zonas_interes.split(',').map((z) => z.trim()).filter(Boolean)
        : []
      const tipos = values.tipos_proyecto
        ? values.tipos_proyecto.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      const payload: Record<string, unknown> = {
        nombre_empresa: values.nombre_empresa,
        nit: values.nit,
        contacto_nombre: values.contacto_nombre,
        contacto_email: values.contacto_email,
        contacto_cargo: values.contacto_cargo,
        contacto_telefono: values.contacto_telefono,
        descripcion_empresa: values.descripcion_empresa,
        anios_experiencia: values.anios_experiencia,
        proyectos_ejecutados: values.proyectos_ejecutados,
        zonas_interes: zonas,
        tipos_proyecto: tipos,
        documentos: [],
      }

      if (values.inversion_disponible !== '' && values.inversion_disponible != null) {
        payload.inversion_disponible = values.inversion_disponible
      }

      const result = await crearSolicitud(payload)
      setSolicitudId(result.id)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; error?: string } } })?.response?.data
          ?.detail ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo enviar la solicitud. Intenta de nuevo.'
      setApiError(typeof msg === 'string' ? msg : 'Error al enviar la solicitud')
    }
  }

  if (solicitudId != null) {
    return (
      <div className="form-success card" role="status">
        <p className="section-label">Solicitud recibida</p>
        <h2>¡Gracias por postularte!</h2>
        <p>
          Tu solicitud de certificación fue registrada con el número{' '}
          <strong>#{solicitudId}</strong>. El equipo HAB la revisará y te contactará al correo
          indicado.
        </p>
      </div>
    )
  }

  return (
    <form className="hab-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset>
        <legend>Empresa</legend>
        <label className="form-field">
          <span>Nombre de la empresa</span>
          <input {...register('nombre_empresa')} />
          {errors.nombre_empresa && (
            <em className="form-error">{errors.nombre_empresa.message}</em>
          )}
        </label>
        <label className="form-field">
          <span>NIT</span>
          <input {...register('nit')} placeholder="900123456-1" />
          {errors.nit && <em className="form-error">{errors.nit.message}</em>}
        </label>
        <label className="form-field">
          <span>Descripción</span>
          <textarea {...register('descripcion_empresa')} rows={4} />
          {errors.descripcion_empresa && (
            <em className="form-error">{errors.descripcion_empresa.message}</em>
          )}
        </label>
        <div className="form-row">
          <label className="form-field">
            <span>Años de experiencia</span>
            <input type="number" min={0} {...register('anios_experiencia')} />
            {errors.anios_experiencia && (
              <em className="form-error">{errors.anios_experiencia.message}</em>
            )}
          </label>
          <label className="form-field">
            <span>Proyectos ejecutados</span>
            <input type="number" min={0} {...register('proyectos_ejecutados')} />
            {errors.proyectos_ejecutados && (
              <em className="form-error">{errors.proyectos_ejecutados.message}</em>
            )}
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Contacto</legend>
        <label className="form-field">
          <span>Nombre</span>
          <input {...register('contacto_nombre')} />
          {errors.contacto_nombre && (
            <em className="form-error">{errors.contacto_nombre.message}</em>
          )}
        </label>
        <div className="form-row">
          <label className="form-field">
            <span>Correo</span>
            <input type="email" {...register('contacto_email')} />
            {errors.contacto_email && (
              <em className="form-error">{errors.contacto_email.message}</em>
            )}
          </label>
          <label className="form-field">
            <span>Cargo</span>
            <input {...register('contacto_cargo')} />
            {errors.contacto_cargo && (
              <em className="form-error">{errors.contacto_cargo.message}</em>
            )}
          </label>
        </div>
        <label className="form-field">
          <span>Teléfono</span>
          <input {...register('contacto_telefono')} placeholder="+573001234567" />
          {errors.contacto_telefono && (
            <em className="form-error">{errors.contacto_telefono.message}</em>
          )}
        </label>
      </fieldset>

      <fieldset>
        <legend>Intereses (opcional)</legend>
        <label className="form-field">
          <span>Zonas de interés (separadas por coma)</span>
          <input {...register('zonas_interes')} placeholder="Chapinero, Usaquén, Teusaquillo" />
        </label>
        <label className="form-field">
          <span>Tipos de proyecto (separados por coma)</span>
          <input {...register('tipos_proyecto')} placeholder="VIS, multifamiliar, renovación" />
        </label>
        <label className="form-field">
          <span>Inversión disponible (COP)</span>
          <input type="number" min={0} step={1000000} {...register('inversion_disponible')} />
          {errors.inversion_disponible && (
            <em className="form-error">{errors.inversion_disponible.message}</em>
          )}
        </label>
      </fieldset>

      {apiError && (
        <p className="form-error" role="alert">
          {apiError}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Enviar solicitud'}
      </button>
    </form>
  )
}
