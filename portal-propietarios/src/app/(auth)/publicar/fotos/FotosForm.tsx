'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUpdatePublicacion } from '@/lib/api/publicaciones'
import { axiosErrorMessage, getDraftData, getDraftId, mergeDraftData } from '@/lib/draft'

export function FotosForm() {
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = getDraftId()
    if (!id) {
      router.replace('/publicar/inmueble')
      return
    }
    const draft = getDraftData()
    if (Array.isArray(draft.fotos) && draft.fotos.length > 0) {
      setUrls(draft.fotos.map(String))
    }
  }, [router])

  const updateUrl = (index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  const addUrl = () => setUrls((prev) => [...prev, ''])

  const removeUrl = (index: number) => {
    setUrls((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = getDraftId()
    if (!id) {
      router.replace('/publicar/inmueble')
      return
    }
    const fotos = urls.map((u) => u.trim()).filter(Boolean)
    setError(null)
    setLoading(true)
    try {
      await apiUpdatePublicacion(id, { fotos })
      mergeDraftData({ fotos })
      router.push('/publicar/confirmacion')
    } catch (err) {
      setError(axiosErrorMessage(err, 'No se pudieron guardar las fotos'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="hab-form hab-form--wide card" style={{ padding: 28 }} onSubmit={onSubmit}>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>Fotos</h1>
      <p className="hab-form__hint" style={{ marginBottom: 8 }}>
        Agrega URLs de fotos (placeholder). La carga S3 con Uppy llega en una oleada posterior.
      </p>
      {error && <div className="hab-form__error">{error}</div>}

      <div className="foto-list">
        {urls.map((url, i) => (
          <div key={i} className="foto-row">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder="https://cdn.hab.com.co/foto.jpg"
              aria-label={`URL foto ${i + 1}`}
            />
            <button type="button" className="btn-secondary" onClick={() => removeUrl(i)}>
              Quitar
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="btn-secondary" onClick={addUrl}>
        + Agregar URL
      </button>

      <div className="hab-form__actions">
        <button type="button" className="btn-secondary" onClick={() => router.push('/publicar/ubicacion')}>
          ← Atrás
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Continuar →'}
        </button>
      </div>
    </form>
  )
}
