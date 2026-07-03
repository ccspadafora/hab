import { useState } from 'react'
import { useBaseConocimiento } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import styles from './IAConocimientoPage.module.css'

const TIPOS    = ['norma','ejemplo_proyecto','instruccion','tabla_precios','otro']
const APLICA_A = ['estructuracion','scoring','bot','todos']
const TIPO_ICON: Record<string, string> = {
  norma: '⚖️', ejemplo_proyecto: '🏗️', instruccion: '📋', tabla_precios: '💰', otro: '📄',
}

const EMPTY = { nombre: '', tipo: 'instruccion', aplica_a: 'todos', descripcion: '', texto_plano: '', activo: true }

export default function IAConocimientoPage() {
  const { data, isLoading } = useBaseConocimiento()
  const qc = useQueryClient()
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [archivo, setArchivo]     = useState<File | null>(null)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const docs = (data?.results ?? []).filter(d => !filtroTipo || d.tipo === filtroTipo)

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('El nombre es requerido'); return }
    setSaving(true)
    setMsg('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (archivo) { fd.append('archivo', archivo); fd.append('archivo_tipo', archivo.name.split('.').pop() ?? '') }
      await apiClient.post('/ia/conocimiento/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      qc.invalidateQueries({ queryKey: ['ia', 'conocimiento'] })
      setShowForm(false); setForm(EMPTY); setArchivo(null)
      setMsg('✅ Documento creado correctamente')
    } catch {
      setMsg('❌ Error al guardar. Verifica los datos.')
    } finally { setSaving(false) }
  }

  const toggleActivo = async (id: number, activo: boolean) => {
    await apiClient.patch(`/ia/conocimiento/${id}/`, { activo: !activo })
    qc.invalidateQueries({ queryKey: ['ia', 'conocimiento'] })
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🤖 IA</div>
          <h1 className="h-med">Base de Conocimiento IA</h1>
        </div>
        <div className={styles.headerRight}>
          <select className={`input ${styles.filtro}`} value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancelar' : '+ Nuevo documento'}
          </button>
        </div>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      {/* Formulario de creación */}
      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Nuevo documento de conocimiento</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.fl}>Nombre *</label>
              <input className="input" value={form.nombre}
                onChange={e => set('nombre', e.target.value)} placeholder="Ej: Norma POT Chapinero 2024" />
            </div>
            <div className={styles.field}>
              <label className={styles.fl}>Tipo</label>
              <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fl}>Aplica a</label>
              <select className="input" value={form.aplica_a} onChange={e => set('aplica_a', e.target.value)}>
                {APLICA_A.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fl}>Activo</label>
              <select className="input" value={String(form.activo)}
                onChange={e => set('activo', e.target.value === 'true')}>
                <option value="true">✅ Sí</option>
                <option value="false">❌ No</option>
              </select>
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.fl}>Descripción</label>
              <input className="input" value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Descripción breve del documento" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.fl}>Texto / Contenido</label>
              <textarea className={styles.textarea} rows={6} value={form.texto_plano}
                onChange={e => set('texto_plano', e.target.value)}
                placeholder="Pega aquí el contenido del documento (norma, instrucción, tabla de precios, etc.)" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.fl}>Archivo adjunto (PDF, DOCX — opcional)</label>
              <input type="file" accept=".pdf,.docx,.txt"
                className={styles.fileInput}
                onChange={e => setArchivo(e.target.files?.[0] ?? null)} />
              {archivo && <p className={styles.fileName}>📎 {archivo.name}</p>}
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY) }}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar documento'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {isLoading ? <p className={styles.loading}>Cargando…</p> : (
        <div className={styles.grid}>
          {docs.map(doc => (
            <div key={doc.id} className={`card ${styles.docCard} ${!doc.activo ? styles.inactive : ''}`}>
              <div className={styles.docTop}>
                <span className={styles.docIcon}>{TIPO_ICON[doc.tipo] ?? '📄'}</span>
                <div className={styles.docMeta}>
                  <span className="badge badge-verde">{doc.tipo.replace('_',' ')}</span>
                  <span className="badge badge-amarillo">{doc.aplica_a}</span>
                </div>
                <button
                  className={`btn ${doc.activo ? 'btn-ghost' : 'btn-secondary'}`}
                  style={{ fontSize: 10, padding: '3px 8px' }}
                  onClick={() => toggleActivo(doc.id, doc.activo)}
                  title={doc.activo ? 'Desactivar' : 'Activar'}
                >
                  {doc.activo ? '✅ Activo' : '❌ Inactivo'}
                </button>
              </div>
              <h3 className={styles.docNombre}>{doc.nombre}</h3>
              {doc.descripcion && <p className="body-sm">{doc.descripcion}</p>}
              {doc.texto_plano && (
                <pre className={styles.preview}>
                  {doc.texto_plano.slice(0, 200)}{doc.texto_plano.length > 200 ? '…' : ''}
                </pre>
              )}
              <p className={styles.fecha}>Creado: {new Date(doc.creado_en).toLocaleDateString('es-CO')}</p>
            </div>
          ))}
          {!docs.length && (
            <div className={styles.empty}>
              <p>Sin documentos{filtroTipo ? ` de tipo "${filtroTipo}"` : ''}.</p>
              <p className="body-sm">Haz clic en "Nuevo documento" para agregar el primero.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
