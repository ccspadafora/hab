import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { Modal } from '../../components/ui/Modal'
import type { User } from '../../types/models'
import styles from './UsuariosPage.module.css'

const ROLES = [
  { key: 'superadmin',    label: 'Super Admin',     color: '#E07070' },
  { key: 'admin',         label: 'Admin',            color: '#C9B84C' },
  { key: 'administrativo',label: 'Administrativo',   color: '#6090C0' },
  { key: 'finanzas',      label: 'Finanzas',         color: '#2B4D2E' },
  { key: 'estructuracion',label: 'Estructuración',   color: '#8060A0' },
  { key: 'comercial',     label: 'Comercial',        color: '#A06000' },
]
const EMPTY_FORM = {
  username: '', email: '', first_name: '', last_name: '',
  role: 'comercial', phone: '', password: '',
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLES.find(r => r.key === role)
  const color = cfg?.color ?? '#aaa'
  return (
    <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {cfg?.label ?? role}
    </span>
  )
}

export default function UsuariosPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => apiClient.get('/users/?page_size=100').then(r => r.data as { results: User[] }),
  })
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [resetPw,  setResetPw]  = useState<{ id: number; name: string } | null>(null)
  const [newPw,    setNewPw]    = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const abrirCrear = () => {
    setEditUser(null); setForm(EMPTY_FORM); setMsg(''); setShowForm(true)
  }
  const abrirEditar = (u: User) => {
    setEditUser(u)
    setForm({ username: u.username, email: u.email, first_name: u.first_name,
      last_name: u.last_name, role: u.role, phone: u.phone, password: '' })
    setMsg(''); setShowForm(true)
  }

  const guardar = async () => {
    if (!form.username || !form.email || (!editUser && !form.password)) {
      setMsg('Usuario, email y contraseña son requeridos'); return
    }
    setSaving(true); setMsg('')
    try {
      const body: Record<string, string> = { ...form }
      if (!body.password) delete body.password
      if (editUser) {
        await apiClient.patch(`/users/${editUser.id}/`, body)
      } else {
        await apiClient.post('/users/', body)
      }
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      setShowForm(false); setMsg('')
    } catch (e: any) {
      setMsg('❌ ' + JSON.stringify(e?.response?.data ?? 'Error'))
    } finally { setSaving(false) }
  }

  const toggleActivo = async (u: User) => {
    await apiClient.patch(`/users/${u.id}/toggle_activo/`)
    qc.invalidateQueries({ queryKey: ['usuarios'] })
  }

  const cambiarPassword = async () => {
    if (!resetPw || newPw.length < 8) return
    await apiClient.post(`/users/${resetPw.id}/reset_password/`, { password: newPw })
    setResetPw(null); setNewPw('')
  }

  const usuarios = data?.results ?? []

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />👥 Gestión</div>
          <h1 className="h-med">Usuarios y Roles</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/usuarios/permisos" className="btn btn-secondary">🔐 Permisos por rol</Link>
          <button className="btn btn-primary" onClick={abrirCrear}>+ Nuevo usuario</button>
        </div>
      </div>

      {/* Resumen por rol */}
      <div className={styles.rolesGrid}>
        {ROLES.map(r => {
          const count = usuarios.filter(u => u.role === r.key).length
          return (
            <div key={r.key} className={styles.rolCard} style={{ borderTopColor: r.color }}>
              <span className={styles.rolN} style={{ color: r.color }}>{count}</span>
              <span className={styles.rolL}>{r.label}</span>
            </div>
          )
        })}
      </div>

      {/* Tabla de usuarios */}
      {isLoading ? <p className={styles.loading}>Cargando usuarios…</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th>
                  <th>Estado</th><th>Registrado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className={!u.is_active ? styles.inactiveRow : ''}>
                  <td className={styles.tdUser}>
                    <div className={styles.avatar} style={{ background: ROLES.find(r => r.key === u.role)?.color ?? '#aaa' }}>
                      {(u.first_name?.[0] || u.username[0]).toUpperCase()}
                    </div>
                    <span className={styles.username}>@{u.username}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : '—'}
                  </td>
                  <td style={{ color: '#666', fontSize: 12 }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-verde' : ''}`}
                      style={!u.is_active ? { background: '#eee', color: '#aaa', border: '1px solid #ddd' } : {}}>
                      {u.is_active ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td style={{ color: '#aaa', fontSize: 11 }}>
                    {new Date(u.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 8px' }}
                        onClick={() => abrirEditar(u)}>✏️</button>
                      <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}
                        onClick={() => setResetPw({ id: u.id, name: u.username })}>🔑</button>
                      <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}
                        onClick={() => toggleActivo(u)}>
                        {u.is_active ? '🚫' : '✅'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar usuario */}
      {showForm && (
        <Modal title={editUser ? `✏️ Editar: ${editUser.username}` : '👤 Nuevo Usuario'}
          onClose={() => setShowForm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {msg && <p className={styles.msg}>{msg}</p>}
            <div className={styles.formGrid}>
              {[
                { label: 'Usuario *', k: 'username', placeholder: 'nombre_usuario' },
                { label: 'Email *', k: 'email', placeholder: 'correo@empresa.com' },
                { label: 'Nombre', k: 'first_name', placeholder: 'Nombre' },
                { label: 'Apellido', k: 'last_name', placeholder: 'Apellido' },
                { label: 'Teléfono', k: 'phone', placeholder: '+57 300...' },
              ].map(({ label, k, placeholder }) => (
                <div key={k} className={styles.field}>
                  <label className={styles.fl}>{label}</label>
                  <input className="input" value={(form as any)[k]}
                    onChange={e => set(k, e.target.value)} placeholder={placeholder} />
                </div>
              ))}
              <div className={styles.field}>
                <label className={styles.fl}>Rol</label>
                <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              {!editUser && (
                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.fl}>Contraseña * (mín. 8 caracteres)</label>
                  <input className="input" type="password" value={form.password}
                    onChange={e => set('password', e.target.value)} placeholder="••••••••" />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                {saving ? 'Guardando…' : editUser ? '💾 Actualizar' : '✅ Crear usuario'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal reset password */}
      {resetPw && (
        <Modal title={`🔑 Nueva contraseña: @${resetPw.name}`} onClose={() => setResetPw(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className={styles.fl}>Nueva contraseña (mín. 8 caracteres)</label>
              <input className="input" type="password" value={newPw} style={{ marginTop: 6 }}
                onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setResetPw(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={cambiarPassword} disabled={newPw.length < 8}>
                🔑 Cambiar contraseña
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
