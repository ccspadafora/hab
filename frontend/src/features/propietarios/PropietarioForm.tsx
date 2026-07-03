import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import type { Propietario } from '../../types/models'
import styles from './PropietarioForm.module.css'

const ESTADOS_CONTACTO = ['sin_contactar','contactado','interesado','calificado','en_negociacion','firmado','descartado']

interface Props { propietario?: Propietario | null; onClose: () => void; onSaved?: (p: Propietario) => void }

export default function PropietarioForm({ propietario, onClose, onSaved }: Props) {
  const qc     = useQueryClient()
  const isEdit = !!propietario

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios','form'],
    queryFn: () => apiClient.get('/users/?page_size=100').then(r => r.data),
  })
  const usuarios: any[] = Array.isArray(usuariosData) ? usuariosData : (usuariosData?.results ?? [])

  const [form, setForm] = useState({
    nombre: '', tipo: 'persona_natural', cedula_nit: '',
    telefono_principal: '', telefono_secundario: '',
    email: '', whatsapp_phone: '',
    ciudad: 'Bogotá', direccion_residencia: '',
    estado_contacto: 'sin_contactar', temperatura: 'frio',
    fuente_origen: '', etiquetas: '',
    asesor_asignado: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  useEffect(() => {
    if (propietario) {
      setForm({
        nombre:              propietario.nombre,
        tipo:                propietario.tipo,
        cedula_nit:          propietario.cedula_nit,
        telefono_principal:  propietario.telefono_principal,
        telefono_secundario: propietario.telefono_secundario ?? '',
        email:               propietario.email,
        whatsapp_phone:      propietario.whatsapp_phone,
        ciudad:              propietario.ciudad ?? 'Bogotá',
        direccion_residencia:(propietario as any).direccion_residencia ?? '',
        estado_contacto:     propietario.estado_contacto,
        temperatura:         propietario.temperatura,
        fuente_origen:       propietario.fuente_origen ?? '',
        etiquetas:           (propietario.etiquetas ?? []).join(', '),
        asesor_asignado:     String(propietario.asesor_asignado ?? ''),
      })
    }
  }, [propietario])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const guardar = async () => {
    if (!form.nombre || !form.telefono_principal) {
      setMsg('Nombre y teléfono principal son requeridos'); return
    }
    setSaving(true); setMsg('')
    try {
      const body: Record<string, unknown> = {
        ...form,
        etiquetas: form.etiquetas ? form.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : [],
        asesor_asignado: form.asesor_asignado || null,
        whatsapp_phone: form.whatsapp_phone || form.telefono_principal,
      }
      Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null })
      let saved: Propietario
      if (isEdit) saved = (await apiClient.patch(`/propietarios/${propietario!.id}/`, body)).data
      else        saved = (await apiClient.post('/propietarios/', body)).data
      qc.invalidateQueries({ queryKey: ['propietarios'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      onSaved?.(saved); onClose()
    } catch (e: any) {
      const d = e?.response?.data
      setMsg('❌ ' + (typeof d === 'object' ? JSON.stringify(d) : String(d)))
    } finally { setSaving(false) }
  }

  return (
    <div>
      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.sectionTitle}>👤 Datos personales</div>
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.fl}>Nombre completo *</label>
          <input name="nombre" className="input" value={form.nombre} onChange={handleChange} placeholder="Ej: Carlos Mendoza Vargas" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Tipo</label>
          <select name="tipo" className="input" value={form.tipo} onChange={handleChange}>
            <option value="persona_natural">Persona natural</option>
            <option value="persona_juridica">Persona jurídica</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Cédula / NIT</label>
          <input name="cedula_nit" className="input" value={form.cedula_nit} onChange={handleChange} placeholder="Ej: 79451234" />
        </div>
      </div>

      <div className={styles.sectionTitle}>📞 Contacto</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Teléfono principal *</label>
          <input name="telefono_principal" className="input" value={form.telefono_principal} onChange={handleChange} placeholder="+573001234567" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>WhatsApp</label>
          <input name="whatsapp_phone" className="input" value={form.whatsapp_phone} onChange={handleChange} placeholder="+573001234567" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Teléfono secundario</label>
          <input name="telefono_secundario" className="input" value={form.telefono_secundario} onChange={handleChange} placeholder="Opcional" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Email</label>
          <input name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Ciudad</label>
          <input name="ciudad" className="input" value={form.ciudad} onChange={handleChange} placeholder="Bogotá" />
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Dirección residencia</label>
          <input name="direccion_residencia" className="input" value={form.direccion_residencia} onChange={handleChange} placeholder="Cra 15 # 85-30" />
        </div>
      </div>

      <div className={styles.sectionTitle}>📊 CRM</div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.fl}>Estado de contacto</label>
          <select name="estado_contacto" className="input" value={form.estado_contacto} onChange={handleChange}>
            {ESTADOS_CONTACTO.map(e => <option key={e} value={e}>{e.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Temperatura</label>
          <select name="temperatura" className="input" value={form.temperatura} onChange={handleChange}>
            <option value="frio">🧊 Frío</option>
            <option value="tibio">🌤️ Tibio</option>
            <option value="caliente">🔥 Caliente</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Fuente de origen</label>
          <select name="fuente_origen" className="input" value={form.fuente_origen} onChange={handleChange}>
            <option value="">— Seleccionar —</option>
            <option value="scraping_web">Scraping web</option>
            <option value="whatsapp_inbound">WhatsApp inbound</option>
            <option value="referido">Referido</option>
            <option value="red_contactos">Red de contactos</option>
            <option value="panel">Ingreso manual</option>
            <option value="llamada">Llamada entrante</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fl}>Asesor asignado</label>
          <select name="asesor_asignado" className="input" value={form.asesor_asignado} onChange={handleChange}>
            <option value="">Sin asignar</option>
            {usuarios.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
              </option>
            ))}
          </select>
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.fl}>Etiquetas (separadas por coma)</label>
          <input name="etiquetas" className="input" value={form.etiquetas} onChange={handleChange} placeholder="Ej: propietario_directo, urgente, heredero" />
        </div>
      </div>

      {!isEdit && (
        <div className={styles.autoLeadInfo}>
          🤝 <strong>Al guardar</strong> se creará automáticamente un <strong>Lead en CRM</strong> con estado "Nuevo".
        </div>
      )}

      <div className={styles.actions}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? '💾 Actualizar propietario' : '✅ Crear propietario'}
        </button>
      </div>
    </div>
  )
}
