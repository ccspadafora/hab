import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import type { Proyecto } from '../../types/models'
import styles from './ProyectoForm.module.css'

const FASES = ['estructuracion','presentado','en_negociacion','promesa','en_obra','entregado','descartado']

interface Props { proyecto?: Proyecto | null; onClose: () => void; onSaved?: (p: Proyecto) => void }

export default function ProyectoForm({ proyecto, onClose, onSaved }: Props) {
  const qc     = useQueryClient()
  const isEdit = !!proyecto
  const norm   = (d: any): any[] => Array.isArray(d) ? d : (d?.results ?? [])

  const { data: prediosRaw }  = useQuery({ queryKey: ['predios','form'],  queryFn: () => apiClient.get('/predios/?page_size=100').then(r => r.data) })
  const { data: analisisRaw } = useQuery({ queryKey: ['analisis','form'], queryFn: () => apiClient.get('/viabilidad/?page_size=100').then(r => r.data) })
  const { data: usuariosRaw } = useQuery({ queryKey: ['usuarios','form'], queryFn: () => apiClient.get('/users/?page_size=100').then(r => r.data) })

  const predios  = norm(prediosRaw)
  const analisis = norm(analisisRaw)
  const usuarios = norm(usuariosRaw)

  const [form, setForm] = useState({
    nombre: '', codigo: '', fase: 'estructuracion', predio: '',
    analisis: '', gerente: '', fee_estructuracion: '',
    pct_gerencia: '5.0', pct_ventas: '3.0', valor_total_estimado: '',
    presentacion_url: '', doc_estructuracion_url: '',
    fecha_estructuracion: '', fecha_presentacion: '',
    fecha_inicio_obra: '', fecha_entrega_estimada: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  useEffect(() => {
    if (proyecto) {
      setForm({
        nombre:                String(proyecto.nombre ?? ''),
        codigo:                String(proyecto.codigo ?? ''),
        fase:                  String(proyecto.fase ?? 'estructuracion'),
        predio:                String(proyecto.predio ?? ''),
        analisis:              String(proyecto.analisis ?? ''),
        gerente:               String(proyecto.gerente ?? ''),
        fee_estructuracion:    String((proyecto as any).fee_estructuracion ?? ''),
        pct_gerencia:          String((proyecto as any).pct_gerencia ?? '5.0'),
        pct_ventas:            String((proyecto as any).pct_ventas ?? '3.0'),
        valor_total_estimado:  String(proyecto.valor_total_estimado ?? ''),
        presentacion_url:      String((proyecto as any).presentacion_url ?? ''),
        doc_estructuracion_url:String((proyecto as any).doc_estructuracion_url ?? ''),
        fecha_estructuracion:  String((proyecto as any).fecha_estructuracion ?? ''),
        fecha_presentacion:    String((proyecto as any).fecha_presentacion ?? ''),
        fecha_inicio_obra:     String((proyecto as any).fecha_inicio_obra ?? ''),
        fecha_entrega_estimada:String((proyecto as any).fecha_entrega_estimada ?? ''),
      })
    }
  }, [proyecto])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const guardar = async () => {
    if (!form.nombre || !form.codigo || !form.predio || !form.analisis || !form.gerente) {
      setMsg('Nombre, código, predio, análisis y gerente son requeridos'); return
    }
    setSaving(true); setMsg('')
    try {
      const body: Record<string, unknown> = { ...form }
      Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null })
      let saved: Proyecto
      if (isEdit) saved = (await apiClient.patch(`/proyectos/${proyecto!.id}/`, body)).data
      else        saved = (await apiClient.post('/proyectos/', body)).data
      qc.invalidateQueries({ queryKey: ['proyectos'] })
      onSaved?.(saved); onClose()
    } catch (e: any) {
      const detail = e?.response?.data
      setMsg('❌ ' + (typeof detail === 'object' ? JSON.stringify(detail) : String(detail)))
    } finally { setSaving(false) }
  }

  return (
    <div>
      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Nombre del proyecto *</label>
          <input name="nombre" className="input" value={form.nombre} onChange={handleChange} placeholder="Ej: Proyecto Chapinero Central" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Código *</label>
          <input name="codigo" className="input" value={form.codigo} onChange={handleChange} placeholder="Ej: HAB-2025-001" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fase</label>
          <select name="fase" className="input" value={form.fase} onChange={handleChange}>
            {FASES.map(f => <option key={f} value={f}>{f.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Predio *</label>
          <select name="predio" className="input" value={form.predio} onChange={handleChange}>
            <option value="">Selecciona un predio…</option>
            {predios.map((p: any) => <option key={p.id} value={p.id}>{p.direccion || p.barrio} — {p.tipo}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Análisis de viabilidad *</label>
          <select name="analisis" className="input" value={form.analisis} onChange={handleChange}>
            <option value="">Selecciona análisis…</option>
            {analisis.map((a: any) => <option key={a.id} value={a.id}>#{a.id} — Score: {a.score_viabilidad ?? 'pendiente'}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Gerente *</label>
          <select name="gerente" className="input" value={form.gerente} onChange={handleChange}>
            <option value="">Selecciona gerente…</option>
            {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
          </select>
        </div>
      </div>

      <div className={styles.sectionTitle}>💰 Parámetros financieros</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Fee estructuración (COP)</label>
          <input name="fee_estructuracion" type="number" className="input" value={form.fee_estructuracion} onChange={handleChange} placeholder="120000000" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>% Gerencia</label>
          <input name="pct_gerencia" type="number" className="input" value={form.pct_gerencia} onChange={handleChange} placeholder="5.0" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>% Ventas</label>
          <input name="pct_ventas" type="number" className="input" value={form.pct_ventas} onChange={handleChange} placeholder="3.0" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Valor total estimado (COP)</label>
          <input name="valor_total_estimado" type="number" className="input" value={form.valor_total_estimado} onChange={handleChange} />
        </div>
      </div>

      <div className={styles.sectionTitle}>📅 Fechas clave</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha estructuración</label>
          <input name="fecha_estructuracion" type="date" className="input" value={form.fecha_estructuracion} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha presentación</label>
          <input name="fecha_presentacion" type="date" className="input" value={form.fecha_presentacion} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha inicio obra</label>
          <input name="fecha_inicio_obra" type="date" className="input" value={form.fecha_inicio_obra} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha entrega estimada</label>
          <input name="fecha_entrega_estimada" type="date" className="input" value={form.fecha_entrega_estimada} onChange={handleChange} />
        </div>
      </div>

      <div className={styles.sectionTitle}>🔗 Documentos</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>URL presentación</label>
          <input name="presentacion_url" className="input" value={form.presentacion_url} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>URL documento estructuración</label>
          <input name="doc_estructuracion_url" className="input" value={form.doc_estructuracion_url} onChange={handleChange} placeholder="https://..." />
        </div>
      </div>

      <div className={styles.actions}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? '💾 Actualizar proyecto' : '✅ Crear proyecto'}
        </button>
      </div>
    </div>
  )
}
