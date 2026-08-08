'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiEnviarRevision, apiGetPublicacion } from '@/lib/api/publicaciones'
import { axiosErrorMessage, clearDraftId, getDraftData, getDraftId } from '@/lib/draft'
import type { Publicacion } from '@/types/publicacion'

const TIPO_LABEL: Record<string, string> = {
  casa: 'Casa',
  lote: 'Lote',
  apartamento: 'Apartamento',
  local: 'Local',
  bodega: 'Bodega',
}

export function ConfirmacionForm() {
  const router = useRouter()
  const [pub, setPub] = useState<Publicacion | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPub, setLoadingPub] = useState(true)

  useEffect(() => {
    const id = getDraftId()
    if (!id) {
      router.replace('/publicar/inmueble')
      return
    }
    setDraft(getDraftData())
    apiGetPublicacion(id)
      .then(setPub)
      .catch((err) => setError(axiosErrorMessage(err, 'No se pudo cargar el borrador')))
      .finally(() => setLoadingPub(false))
  }, [router])

  const onEnviar = async () => {
    const id = getDraftId()
    if (!id) return
    setError(null)
    setLoading(true)
    try {
      await apiEnviarRevision(id)
      clearDraftId()
      router.push('/mis-inmuebles')
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudo enviar a revisión'))
    } finally {
      setLoading(false)
    }
  }

  if (loadingPub) {
    return <p className="hab-form__hint">Cargando resumen…</p>
  }

  const tipo = String(draft.tipo ?? pub?.tipo ?? '')
  const fotos = (Array.isArray(draft.fotos) ? draft.fotos : pub?.fotos ?? []) as string[]

  return (
    <div className="card" style={{ padding: 28, maxWidth: 640 }}>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>Confirmar publicación</h1>
      <p className="hab-form__hint" style={{ marginBottom: 16 }}>
        Revisa los datos y envía tu inmueble a revisión por el equipo HAB.
      </p>
      {error && <div className="hab-form__error">{error}</div>}

      <dl className="review-grid">
        <div>
          <dt>Tipo</dt>
          <dd>{(TIPO_LABEL[tipo] ?? tipo) || '—'}</dd>
        </div>
        <div>
          <dt>Área lote</dt>
          <dd>{String(draft.area_lote ?? pub?.area_lote ?? '—')} m²</dd>
        </div>
        <div>
          <dt>Estrato</dt>
          <dd>{String(draft.estrato ?? pub?.estrato ?? '—')}</dd>
        </div>
        <div>
          <dt>Dirección</dt>
          <dd>{String(draft.direccion ?? '—')}</dd>
        </div>
        <div>
          <dt>Barrio / Localidad</dt>
          <dd>
            {String(draft.barrio ?? pub?.barrio ?? '—')}
            {', '}
            {String(draft.localidad ?? pub?.localidad ?? '—')}
          </dd>
        </div>
        <div>
          <dt>Ciudad</dt>
          <dd>{String(draft.ciudad ?? 'Bogotá')}</dd>
        </div>
        <div>
          <dt>Fotos</dt>
          <dd>{fotos.length > 0 ? `${fotos.length} URL(s)` : 'Ninguna'}</dd>
        </div>
        {draft.descripcion ? (
          <div>
            <dt>Descripción</dt>
            <dd>{String(draft.descripcion)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="hab-form__actions">
        <button type="button" className="btn-secondary" onClick={() => router.push('/publicar/fotos')}>
          ← Atrás
        </button>
        <button type="button" className="btn-primary" onClick={onEnviar} disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar a revisión'}
        </button>
      </div>
    </div>
  )
}
