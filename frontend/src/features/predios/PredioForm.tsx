import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import type { Predio } from '../../types/models'
import styles from './PredioForm.module.css'

const TIPOS   = ['casa','lote','apartamento','local']
const ESTADOS = ['nuevo','en_analisis','viable','no_viable','contactado','descartado']

interface Props { predio?: Predio | null; onClose: () => void; onSaved?: (p: Predio) => void }

export default function PredioForm({ predio, onClose, onSaved }: Props) {
  const qc     = useQueryClient()
  const isEdit = !!predio

  const { data: fuentesData } = useQuery({
    queryKey: ['scraping','fuentes','form'],
    queryFn: () => apiClient.get('/scraping/fuentes/?page_size=50').then(r => r.data),
  })
  const fuentes: any[] = Array.isArray(fuentesData) ? fuentesData : (fuentesData?.results ?? [])

  const [form, setForm] = useState({
    fuente: '', url_origen: '', codigo_externo: '',
    barrio: '', localidad: '', ciudad: 'Bogotá', direccion: '',
    tipo: 'casa', area_lote: '', area_construida: '',
    estrato: '', pisos: '', anio_construccion: '',
    precio_publicado: '', precio_m2: '', estado: 'nuevo',
    descripcion_raw: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  useEffect(() => {
    if (predio) {
      setForm({
        fuente:           String((predio as any).fuente ?? ''),
        url_origen:       String(predio.url_origen ?? ''),
        codigo_externo:   String((predio as any).codigo_externo ?? ''),
        barrio:           String(predio.barrio ?? ''),
        localidad:        String(predio.localidad ?? ''),
        ciudad:           String(predio.ciudad ?? 'Bogotá'),
        direccion:        String(predio.direccion ?? ''),
        tipo:             String(predio.tipo ?? 'casa'),
        area_lote:        String(predio.area_lote ?? ''),
        area_construida:  String(predio.area_construida ?? ''),
        estrato:          String(predio.estrato ?? ''),
        pisos:            String((predio as any).pisos ?? ''),
        anio_construccion:String((predio as any).anio_construccion ?? ''),
        precio_publicado: String(predio.precio_publicado ?? ''),
        precio_m2:        String(predio.precio_m2 ?? ''),
        estado:           String(predio.estado ?? 'nuevo'),
        descripcion_raw:  String((predio as any).descripcion_raw ?? ''),
      })
    }
  }, [predio])

  // Handler único — recalcula precio_m2 al cambiar precio o área
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => {
      const next = { ...f, [name]: value }
      // Recalcular precio_m2 automáticamente
      if (name === 'precio_publicado' || name === 'area_lote') {
        const precio = parseFloat(name === 'precio_publicado' ? value : f.precio_publicado)
        const area   = parseFloat(name === 'area_lote'        ? value : f.area_lote)
        if (precio > 0 && area > 0) {
          next.precio_m2 = Math.round(precio / area).toString()
        }
      }
      return next
    })
  }

  const guardar = async () => {
    if (!form.barrio || !form.tipo || !form.fuente) {
      setMsg('Fuente, barrio y tipo son requeridos'); return
    }
    if (!isEdit && !form.url_origen) { setMsg('URL origen es requerida'); return }
    setSaving(true); setMsg('')
    try {
      const body: Record<string,unknown> = { ...form }
      Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null })
      let saved: Predio
      if (isEdit) saved = (await apiClient.patch(`/predios/${predio!.id}/`, body)).data
      else        saved = (await apiClient.post('/predios/', body)).data
      qc.invalidateQueries({ queryKey: ['predios'] })
      onSaved?.(saved); onClose()
    } catch (e: any) {
      const d = e?.response?.data
      setMsg('❌ ' + (typeof d === 'object' ? JSON.stringify(d) : String(d)))
    } finally { setSaving(false) }
  }

  return (
    <div>
      {msg && <p className={styles.msg}>{msg}</p>}

      {/* ── Identificación y fuente ── */}
      <div className={styles.sectionTitle}>📍 Identificación y fuente</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Fuente de scraping *</label>
          <select name="fuente" className="input" value={form.fuente} onChange={handleChange}>
            <option value="">Selecciona fuente…</option>
            {fuentes.map((f: any) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>{isEdit ? 'URL origen' : 'URL origen *'}</label>
          <input name="url_origen" className="input" value={form.url_origen} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Código externo</label>
          <input name="codigo_externo" className="input" value={form.codigo_externo} onChange={handleChange} placeholder="Ej: MC-12345" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Estado</label>
          <select name="estado" className="input" value={form.estado} onChange={handleChange}>
            {ESTADOS.map(e => <option key={e} value={e}>{e.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      {/* ── Ubicación ── */}
      <div className={styles.sectionTitle}>🗺️ Ubicación</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Barrio *</label>
          <input name="barrio" className="input" value={form.barrio} onChange={handleChange} placeholder="Ej: Chapinero" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Localidad</label>
          <input name="localidad" className="input" value={form.localidad} onChange={handleChange} placeholder="Ej: Chapinero" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Ciudad</label>
          <input name="ciudad" className="input" value={form.ciudad} onChange={handleChange} placeholder="Bogotá" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Dirección</label>
          <input name="direccion" className="input" value={form.direccion} onChange={handleChange} placeholder="Ej: Cra 7 # 63-45" />
        </div>
      </div>

      {/* ── Características ── */}
      <div className={styles.sectionTitle}>🏘️ Características</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Tipo *</label>
          <select name="tipo" className="input" value={form.tipo} onChange={handleChange}>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Área lote (m²)</label>
          <input name="area_lote" type="number" className="input" value={form.area_lote} onChange={handleChange} placeholder="280" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Área construida (m²)</label>
          <input name="area_construida" type="number" className="input" value={form.area_construida} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Estrato</label>
          <input name="estrato" type="number" className="input" value={form.estrato} onChange={handleChange} placeholder="4" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Pisos</label>
          <input name="pisos" type="number" className="input" value={form.pisos} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Año construcción</label>
          <input name="anio_construccion" type="number" className="input" value={form.anio_construccion} onChange={handleChange} placeholder="1985" />
        </div>
      </div>

      {/* ── Precio ── */}
      <div className={styles.sectionTitle}>💰 Precio</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Precio publicado (COP)</label>
          <input name="precio_publicado" type="number" className="input" value={form.precio_publicado} onChange={handleChange} placeholder="950000000" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>
            Precio por m² (COP)
            <span style={{ fontWeight: 300, color: '#aaa', marginLeft: 6, fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
              — calculado automáticamente
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              name="precio_m2"
              type="number"
              className="input"
              value={form.precio_m2}
              onChange={handleChange}
              placeholder="Se calcula al ingresar precio y área"
              style={{ background: form.precio_m2 ? 'rgba(43,77,46,0.04)' : undefined }}
            />
            {form.precio_m2 && (
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, color: 'var(--verde)', fontWeight: 600,
              }}>
                ${Number(form.precio_m2).toLocaleString('es-CO')}/m²
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Descripción ── */}
      <div className={styles.sectionTitle}>📝 Descripción</div>
      <div className={styles.field}>
        <label className={styles.fl}>Descripción del predio</label>
        <textarea name="descripcion_raw" className={styles.textarea} rows={3}
          value={form.descripcion_raw} onChange={handleChange}
          placeholder="Descripción o notas adicionales…" />
      </div>

      <div className={styles.actions}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? '💾 Actualizar predio' : '✅ Crear predio'}
        </button>
      </div>
    </div>
  )
}
