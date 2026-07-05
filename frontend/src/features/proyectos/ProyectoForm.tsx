import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import type { Proyecto } from '../../types/models'
import styles from './ProyectoForm.module.css'

const FASES = ['estructuracion','presentado','en_negociacion','promesa','en_obra','entregado','descartado']

interface Props { proyecto?: Proyecto | null; onClose: () => void; onSaved?: (p: Proyecto) => void }

type FormState = {
  nombre: string
  codigo: string
  fase: string
  predio: string
  analisis: string
  gerente: string
  fee_estructuracion: string
  pct_gerencia: string
  pct_ventas: string
  valor_total_estimado: string
  presentacion_url: string
  doc_estructuracion_url: string
  fecha_estructuracion: string
  fecha_presentacion: string
  fecha_inicio_obra: string
  fecha_entrega_estimada: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const REQUIRED_FIELDS: Array<keyof FormState> = ['nombre', 'codigo', 'predio', 'analisis', 'gerente']

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

  const [form, setForm] = useState<FormState>({
    nombre: '', codigo: '', fase: 'estructuracion', predio: '',
    analisis: '', gerente: '', fee_estructuracion: '',
    pct_gerencia: '5.0', pct_ventas: '3.0', valor_total_estimado: '',
    presentacion_url: '', doc_estructuracion_url: '',
    fecha_estructuracion: '', fecha_presentacion: '',
    fecha_inicio_obra: '', fecha_entrega_estimada: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

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
    if (submitted) {
      setErrors(validateForm({ ...form, [name]: value }))
    } else if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (values: FormState): FormErrors => {
    const next: FormErrors = {}
    for (const field of REQUIRED_FIELDS) {
      if (!String(values[field] ?? '').trim()) next[field] = 'Este campo es obligatorio.'
    }
    return next
  }

  const getInputClass = (field: keyof FormState) =>
    `${styles.control} ${errors[field] ? styles.controlError : ''}`

  const normalizeApiErrors = (detail: any): FormErrors => {
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return {}
    const next: FormErrors = {}
    for (const key of Object.keys(detail)) {
      if (key in form) {
        const raw = detail[key]
        next[key as keyof FormState] = Array.isArray(raw) ? String(raw[0]) : String(raw)
      }
    }
    return next
  }

  const guardar = async () => {
    setSubmitted(true)
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setMsg('❌ Completa los campos obligatorios marcados en rojo.')
      return
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
      const fieldErrors = normalizeApiErrors(detail)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...fieldErrors }))
        setMsg('❌ Revisa los campos marcados en rojo.')
      } else {
        setMsg('❌ ' + (typeof detail === 'object' ? JSON.stringify(detail) : String(detail)))
      }
    } finally { setSaving(false) }
  }

  return (
    <div>
      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Nombre del proyecto *</label>
          <input name="nombre" className={getInputClass('nombre')} value={form.nombre} onChange={handleChange} placeholder="Ej: Proyecto Chapinero Central" />
          {errors.nombre && <span className={styles.errorText}>{errors.nombre}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Código *</label>
          <input name="codigo" className={getInputClass('codigo')} value={form.codigo} onChange={handleChange} placeholder="Ej: HAB-2025-001" />
          {errors.codigo && <span className={styles.errorText}>{errors.codigo}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fase <span className={styles.optional}>(opcional)</span></label>
          <select name="fase" className={getInputClass('fase')} value={form.fase} onChange={handleChange}>
            {FASES.map(f => <option key={f} value={f}>{f.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Predio *</label>
          <select name="predio" className={getInputClass('predio')} value={form.predio} onChange={handleChange}>
            <option value="">Selecciona un predio…</option>
            {predios.map((p: any) => <option key={p.id} value={p.id}>{p.direccion || p.barrio} — {p.tipo}</option>)}
          </select>
          {errors.predio && <span className={styles.errorText}>{errors.predio}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Análisis de viabilidad *</label>
          <select name="analisis" className={getInputClass('analisis')} value={form.analisis} onChange={handleChange}>
            <option value="">Selecciona análisis…</option>
            {analisis.map((a: any) => <option key={a.id} value={a.id}>#{a.id} — Score: {a.score_viabilidad ?? 'pendiente'}</option>)}
          </select>
          {errors.analisis && <span className={styles.errorText}>{errors.analisis}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Gerente *</label>
          <select name="gerente" className={getInputClass('gerente')} value={form.gerente} onChange={handleChange}>
            <option value="">Selecciona gerente…</option>
            {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
          </select>
          {errors.gerente && <span className={styles.errorText}>{errors.gerente}</span>}
        </div>
      </div>

      <div className={styles.sectionTitle}>💰 Parámetros financieros</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Fee estructuración (COP) <span className={styles.optional}>(opcional)</span></label>
          <input name="fee_estructuracion" type="number" className={getInputClass('fee_estructuracion')} value={form.fee_estructuracion} onChange={handleChange} placeholder="120000000" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>% Gerencia <span className={styles.optional}>(opcional)</span></label>
          <input name="pct_gerencia" type="number" className={getInputClass('pct_gerencia')} value={form.pct_gerencia} onChange={handleChange} placeholder="5.0" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>% Ventas <span className={styles.optional}>(opcional)</span></label>
          <input name="pct_ventas" type="number" className={getInputClass('pct_ventas')} value={form.pct_ventas} onChange={handleChange} placeholder="3.0" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Valor total estimado (COP) <span className={styles.optional}>(opcional)</span></label>
          <input name="valor_total_estimado" type="number" className={getInputClass('valor_total_estimado')} value={form.valor_total_estimado} onChange={handleChange} />
        </div>
      </div>

      <div className={styles.sectionTitle}>📅 Fechas clave</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha estructuración <span className={styles.optional}>(opcional)</span></label>
          <input name="fecha_estructuracion" type="date" className={getInputClass('fecha_estructuracion')} value={form.fecha_estructuracion} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha presentación <span className={styles.optional}>(opcional)</span></label>
          <input name="fecha_presentacion" type="date" className={getInputClass('fecha_presentacion')} value={form.fecha_presentacion} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha inicio obra <span className={styles.optional}>(opcional)</span></label>
          <input name="fecha_inicio_obra" type="date" className={getInputClass('fecha_inicio_obra')} value={form.fecha_inicio_obra} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fecha entrega estimada <span className={styles.optional}>(opcional)</span></label>
          <input name="fecha_entrega_estimada" type="date" className={getInputClass('fecha_entrega_estimada')} value={form.fecha_entrega_estimada} onChange={handleChange} />
        </div>
      </div>

      <div className={styles.sectionTitle}>🔗 Documentos</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>URL presentación <span className={styles.optional}>(opcional)</span></label>
          <input name="presentacion_url" className={getInputClass('presentacion_url')} value={form.presentacion_url} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>URL documento estructuración <span className={styles.optional}>(opcional)</span></label>
          <input name="doc_estructuracion_url" className={getInputClass('doc_estructuracion_url')} value={form.doc_estructuracion_url} onChange={handleChange} placeholder="https://..." />
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
