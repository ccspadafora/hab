import { useState } from 'react'
import { usePrompts, useUpdatePrompt, type PromptIA } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import AgentesTab from './AgentesTab'
import styles from './IAPromptsPage.module.css'

type Tab = 'prompts' | 'agentes'

const MODULOS = [
  'estructuracion','scoring','bot_inicio','bot_presentacion',
  'bot_objeciones','bot_agendamiento','prefactibilidad',
]
const MODULO_ICON: Record<string, string> = {
  estructuracion: '📊', scoring: '🎯', bot_inicio: '👋',
  bot_presentacion: '📋', bot_objeciones: '🤔',
  bot_agendamiento: '📅', prefactibilidad: '🔍',
}
const EMPTY_PROMPT = {
  nombre: '', modulo: 'bot_inicio', prompt_sistema: '', prompt_usuario: '',
  variables_disponibles: [] as string[], activo: true,
}

export default function IAPromptsPage() {
  const { data, isLoading } = usePrompts()
  const update = useUpdatePrompt()
  const qc     = useQueryClient()

  const [tab,     setTab]     = useState<Tab>('prompts')
  const [editing, setEditing] = useState<PromptIA | null>(null)
  const [form,    setForm]    = useState({ prompt_sistema: '', prompt_usuario: '' })
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_PROMPT)
  const [varInput, setVarInput] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  const prompts = data?.results ?? []

  const startEdit = (p: PromptIA) => {
    setEditing(p); setShowNew(false)
    setForm({ prompt_sistema: p.prompt_sistema, prompt_usuario: p.prompt_usuario })
  }

  const saveEdit = () => {
    if (!editing) return
    update.mutate({ id: editing.id, data: form }, { onSuccess: () => setEditing(null) })
  }

  const crearPrompt = async () => {
    if (!newForm.nombre || !newForm.prompt_sistema) { setMsg('Nombre y prompt de sistema son requeridos'); return }
    setSaving(true); setMsg('')
    try {
      await apiClient.post('/ia/prompts/', newForm)
      qc.invalidateQueries({ queryKey: ['ia', 'prompts'] })
      setShowNew(false); setNewForm(EMPTY_PROMPT)
      setMsg('✅ Prompt creado')
    } catch { setMsg('❌ Error al crear prompt') }
    finally { setSaving(false) }
  }

  const addVar = () => {
    if (!varInput.trim()) return
    setNewForm(f => ({ ...f, variables_disponibles: [...f.variables_disponibles, varInput.trim()] }))
    setVarInput('')
  }
  const removeVar = (v: string) =>
    setNewForm(f => ({ ...f, variables_disponibles: f.variables_disponibles.filter(x => x !== v) }))

  return (
    <div>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'prompts' ? styles.tabActive : ''}`}
          onClick={() => setTab('prompts')}>💡 Prompts IA</button>
        <button className={`${styles.tab} ${tab === 'agentes' ? styles.tabActive : ''}`}
          onClick={() => setTab('agentes')}>🤖 Agentes</button>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      {tab === 'agentes' ? <AgentesTab /> : (
        <>
          <div className={styles.topBar}>
            <h1 className="h-med">Prompts IA</h1>
            <button className="btn btn-primary" onClick={() => { setShowNew(s => !s); setEditing(null) }}>
              {showNew ? '✕ Cancelar' : '+ Nuevo prompt'}
            </button>
          </div>

          {/* Formulario nuevo prompt */}
          {showNew && (
            <div className={styles.newCard}>
              <h3 className={styles.newTitle}>Nuevo Prompt</h3>
              <div className={styles.newGrid}>
                <div className={styles.field}>
                  <label className={styles.fl}>Nombre *</label>
                  <input className="input" value={newForm.nombre}
                    onChange={e => setNewForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Bot Calificación Propietario" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fl}>Módulo</label>
                  <select className="input" value={newForm.modulo}
                    onChange={e => setNewForm(f => ({ ...f, modulo: e.target.value }))}>
                    {MODULOS.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label className={styles.fl}>Prompt de sistema *</label>
                  <p className={styles.hint}>Usa {'{{contexto_base}}'} para insertar la base de conocimiento</p>
                  <textarea className={styles.ta} rows={5} value={newForm.prompt_sistema}
                    onChange={e => setNewForm(f => ({ ...f, prompt_sistema: e.target.value }))}
                    placeholder="Eres un asistente de HAB que..." />
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label className={styles.fl}>Prompt de usuario</label>
                  <textarea className={styles.ta} rows={3} value={newForm.prompt_usuario}
                    onChange={e => setNewForm(f => ({ ...f, prompt_usuario: e.target.value }))}
                    placeholder="Template del mensaje del usuario con {{variables}}" />
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label className={styles.fl}>Variables disponibles</label>
                  <div className={styles.varRow}>
                    <input className="input" value={varInput}
                      onChange={e => setVarInput(e.target.value)}
                      placeholder="nombre_variable" style={{ flex: 1 }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVar() }}} />
                    <button className="btn btn-secondary" onClick={addVar} style={{ fontSize: 11 }}>+ Agregar</button>
                  </div>
                  {newForm.variables_disponibles.length > 0 && (
                    <div className={styles.varsList}>
                      {newForm.variables_disponibles.map(v => (
                        <span key={v} className={styles.varChip}>
                          {`{{${v}}}`}
                          <button onClick={() => removeVar(v)} className={styles.varRemove}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.formActions}>
                <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={crearPrompt} disabled={saving}>
                  {saving ? 'Creando…' : '💾 Crear prompt'}
                </button>
              </div>
            </div>
          )}

          {/* Layout de prompts */}
          {isLoading ? <p style={{ color: '#999', padding: '20px 0' }}>Cargando…</p> : (
            <div className={styles.layout}>
              {/* Lista */}
              <div className={styles.list}>
                {prompts.map(p => (
                  <button key={p.id}
                    className={`${styles.promptItem} ${editing?.id === p.id ? styles.active : ''}`}
                    onClick={() => startEdit(p)}>
                    <span className={styles.pIcon}>{MODULO_ICON[p.modulo] ?? '🤖'}</span>
                    <div className={styles.pInfo}>
                      <p className={styles.pNombre}>{p.nombre}</p>
                      <p className={styles.pModulo}>{p.modulo.replace(/_/g,' ')}</p>
                    </div>
                    <span className="badge badge-verde">v{p.version}</span>
                  </button>
                ))}
                {!prompts.length && <p className={styles.emptyList}>Sin prompts. Crea uno nuevo.</p>}
              </div>

              {/* Editor */}
              {editing ? (
                <div className={styles.editor}>
                  <div className={styles.edHead}>
                    <div>
                      <p className={styles.edNombre}>{editing.nombre}</p>
                      <p className={styles.edModulo}>{editing.modulo.replace(/_/g,' ')} · v{editing.version}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                      <button className="btn btn-primary" onClick={saveEdit} disabled={update.isPending}>
                        {update.isPending ? 'Guardando…' : '💾 Guardar'}
                      </button>
                    </div>
                  </div>
                  <div className={styles.edField}>
                    <label className={styles.fl}>Prompt de sistema</label>
                    <p className={styles.hint}>Usa {'{{contexto_base}}'} para insertar la base de conocimiento</p>
                    <textarea className={styles.ta} value={form.prompt_sistema}
                      onChange={e => setForm(f => ({ ...f, prompt_sistema: e.target.value }))} rows={8} />
                  </div>
                  <div className={styles.edField}>
                    <label className={styles.fl}>Prompt de usuario</label>
                    <textarea className={styles.ta} value={form.prompt_usuario}
                      onChange={e => setForm(f => ({ ...f, prompt_usuario: e.target.value }))} rows={5} />
                  </div>
                  {editing.variables_disponibles.length > 0 && (
                    <div>
                      <p className={styles.fl} style={{ marginBottom: 6 }}>Variables</p>
                      <div className={styles.varsList}>
                        {editing.variables_disponibles.map(v => (
                          <code key={v} className={styles.varChip}>{`{{${v}}}`}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.placeholder}>
                  <span style={{ fontSize: 36 }}>💡</span>
                  <p>Selecciona un prompt para editarlo</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
