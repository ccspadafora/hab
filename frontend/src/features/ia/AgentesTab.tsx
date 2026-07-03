import { useState } from 'react'
import { apiClient } from '../../api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import styles from './AgentesTab.module.css'

interface Agente {
  id: number; nombre: string; modulo: string; descripcion: string
  modelo_ia: string; temperatura: string; max_tokens: number
  activo: boolean; es_principal: boolean; instrucciones_extra: string
}

const MODULOS = ['bot_whatsapp','scoring','estructuracion','prefactibilidad']
const MODELOS  = ['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo']
const MODULO_ICON: Record<string, string> = {
  bot_whatsapp: '💬', scoring: '🎯', estructuracion: '📊', prefactibilidad: '🔍',
}
const EMPTY: Omit<Agente, 'id'> = {
  nombre: '', modulo: 'bot_whatsapp', descripcion: '',
  modelo_ia: 'gpt-4o', temperatura: '0.70', max_tokens: 500,
  activo: true, es_principal: false, instrucciones_extra: '',
}

export default function AgentesTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['ia', 'agentes'],
    queryFn: () => apiClient.get('/ia/agentes/').then(r => r.data as { results: Agente[] }),
  })

  const [form,    setForm]    = useState<Omit<Agente,'id'>>(EMPTY)
  const [editId,  setEditId]  = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  const agentes = data?.results ?? []
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const startEdit = (a: Agente) => {
    setEditId(a.id); setShowNew(true)
    setForm({ nombre: a.nombre, modulo: a.modulo, descripcion: a.descripcion,
      modelo_ia: a.modelo_ia, temperatura: a.temperatura, max_tokens: a.max_tokens,
      activo: a.activo, es_principal: a.es_principal, instrucciones_extra: a.instrucciones_extra })
  }

  const guardar = async () => {
    if (!form.nombre) { setMsg('Nombre requerido'); return }
    setSaving(true); setMsg('')
    try {
      if (editId) await apiClient.patch(`/ia/agentes/${editId}/`, form)
      else        await apiClient.post('/ia/agentes/', form)
      qc.invalidateQueries({ queryKey: ['ia', 'agentes'] })
      setShowNew(false); setEditId(null); setForm(EMPTY)
      setMsg(editId ? '✅ Agente actualizado' : '✅ Agente creado')
    } catch { setMsg('❌ Error al guardar') }
    finally { setSaving(false) }
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este agente?')) return
    await apiClient.delete(`/ia/agentes/${id}/`)
    qc.invalidateQueries({ queryKey: ['ia', 'agentes'] })
  }

  return (
    <div>
      <div className={styles.topBar}>
        <h1 className="h-med">Agentes IA</h1>
        <button className="btn btn-primary"
          onClick={() => { setShowNew(s => !s); setEditId(null); setForm(EMPTY) }}>
          {showNew && !editId ? '✕ Cancelar' : '+ Nuevo agente'}
        </button>
      </div>
      {msg && <p className={styles.msg}>{msg}</p>}

      {/* Formulario */}
      {showNew && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editId ? 'Editar agente' : 'Nuevo agente'}</h3>
          <div className={styles.grid}>
            <div className={styles.field}><label className={styles.fl}>Nombre *</label>
              <input className="input" value={form.nombre}
                onChange={e => set('nombre', e.target.value)} placeholder="Ej: Bot Captación Tier 1" /></div>
            <div className={styles.field}><label className={styles.fl}>Módulo</label>
              <select className="input" value={form.modulo} onChange={e => set('modulo', e.target.value)}>
                {MODULOS.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select></div>
            <div className={styles.field}><label className={styles.fl}>Modelo IA</label>
              <select className="input" value={form.modelo_ia} onChange={e => set('modelo_ia', e.target.value)}>
                {MODELOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select></div>
            <div className={styles.field}><label className={styles.fl}>Temperatura (0-1)</label>
              <input className="input" type="number" min="0" max="1" step="0.05"
                value={form.temperatura} onChange={e => set('temperatura', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.fl}>Max tokens</label>
              <input className="input" type="number" value={form.max_tokens}
                onChange={e => set('max_tokens', Number(e.target.value))} /></div>
            <div className={styles.field}><label className={styles.fl}>Agente principal</label>
              <select className="input" value={String(form.es_principal)}
                onChange={e => set('es_principal', e.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">✅ Sí (principal del módulo)</option>
              </select></div>
            <div className={`${styles.field} ${styles.full}`}>
              <label className={styles.fl}>Descripción</label>
              <input className="input" value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Para qué sirve este agente" /></div>
            <div className={`${styles.field} ${styles.full}`}>
              <label className={styles.fl}>Instrucciones extra</label>
              <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                Se añaden al prompt base del módulo. Usa para personalizar el comportamiento.
              </p>
              <textarea className={styles.ta} rows={4} value={form.instrucciones_extra}
                onChange={e => set('instrucciones_extra', e.target.value)}
                placeholder="Ej: Siempre saluda con el nombre del propietario. Habla en tono formal..." />
            </div>
          </div>
          <div className={styles.actions}>
            <button className="btn btn-ghost" onClick={() => { setShowNew(false); setEditId(null) }}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar agente'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de agentes */}
      {isLoading ? <p style={{ color: '#999' }}>Cargando agentes…</p> : (
        <div className={styles.agenteGrid}>
          {agentes.map(a => (
            <div key={a.id} className={`card ${styles.agenteCard} ${!a.activo ? styles.inactive : ''}`}>
              <div className={styles.aTop}>
                <div className={styles.aIconWrap}>{MODULO_ICON[a.modulo] ?? '🤖'}</div>
                <div className={styles.aInfo}>
                  <p className={styles.aNombre}>{a.nombre}</p>
                  <p className={styles.aModulo}>{a.modulo.replace(/_/g,' ')}</p>
                </div>
                {a.es_principal && <span className="badge badge-amarillo">Principal</span>}
              </div>
              <div className={styles.aMeta}>
                <span className="badge badge-verde">{a.modelo_ia}</span>
                <span style={{ fontSize: 11, color: '#888' }}>T: {a.temperatura}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{a.max_tokens} tokens</span>
              </div>
              {a.descripcion && <p className="body-sm">{a.descripcion}</p>}
              {a.instrucciones_extra && (
                <pre className={styles.instrPrev}>{a.instrucciones_extra.slice(0,120)}{a.instrucciones_extra.length > 120 ? '…' : ''}</pre>
              )}
              <div className={styles.aActions}>
                <button className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 10px' }}
                  onClick={() => startEdit(a)}>✏️ Editar</button>
                <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 10px' }}
                  onClick={() => eliminar(a.id)}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
          {!agentes.length && (
            <div className={styles.empty}>
              <p>Sin agentes configurados.</p>
              <p className="body-sm">Crea agentes independientes por módulo para tener mayor control sobre el comportamiento de la IA.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
