import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import styles from './PermisosPage.module.css'

interface PermisoItem { id: number; role: string; modulo: string; puede_ver: boolean; puede_editar: boolean }
interface PermisosData {
  permisos: PermisoItem[]
  roles:    { key: string; label: string }[]
  modulos:  { key: string; label: string }[]
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: '#E07070', admin: '#C9B84C', administrativo: '#6090C0',
  finanzas: '#2B4D2E', estructuracion: '#8060A0', comercial: '#A06000',
}

export default function PermisosPage() {
  const qc = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string>('comercial')
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['permisos'],
    queryFn: () => apiClient.get('/auth/permisos/').then(r => r.data as PermisosData),
  })

  const [localPermisos, setLocalPermisos] = useState<Record<string, Record<string, { ver: boolean; editar: boolean }>>>({})

  const getPermiso = (role: string, modulo: string) => {
    if (localPermisos[role]?.[modulo] !== undefined) return localPermisos[role][modulo]
    const found = data?.permisos.find(p => p.role === role && p.modulo === modulo)
    return { ver: found?.puede_ver ?? false, editar: found?.puede_editar ?? false }
  }

  const setPermiso = (role: string, modulo: string, field: 'ver' | 'editar', val: boolean) => {
    setLocalPermisos(prev => {
      const updated = { ...prev, [role]: { ...(prev[role] ?? {}), [modulo]: { ...getPermiso(role, modulo), [field]: val } } }
      // Si activa editar, también activa ver
      if (field === 'editar' && val) updated[role][modulo].ver = true
      // Si desactiva ver, también desactiva editar
      if (field === 'ver' && !val) updated[role][modulo].editar = false
      return updated
    })
  }

  const guardar = async () => {
    const role = selectedRole
    const permisosDatos = data?.modulos.map(m => ({
      role, modulo: m.key,
      puede_ver:    getPermiso(role, m.key).ver,
      puede_editar: getPermiso(role, m.key).editar,
    })) ?? []

    setSaving(true); setMsg('')
    try {
      await apiClient.patch('/auth/permisos/', { permisos: permisosDatos })
      qc.invalidateQueries({ queryKey: ['permisos'] })
      setMsg('✅ Permisos guardados')
      setTimeout(() => setMsg(''), 3000)
    } catch { setMsg('❌ Error al guardar') }
    finally { setSaving(false) }
  }

  const restaurar = async () => {
    if (!confirm('¿Restaurar todos los permisos a los valores por defecto?')) return
    await apiClient.post('/auth/permisos/', { action: 'reset' })
    setLocalPermisos({})
    qc.invalidateQueries({ queryKey: ['permisos'] })
    setMsg('✅ Permisos restaurados')
  }

  const rolesVisibles = data?.roles.filter(r =>
    ['superadmin','admin','administrativo','finanzas','estructuracion','comercial'].includes(r.key)
  ) ?? []

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🔐 Seguridad</div>
          <h1 className="h-med">Permisos por Rol</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/usuarios" className="btn btn-ghost">← Volver a Usuarios</Link>
          <button className="btn btn-ghost" onClick={restaurar}>🔄 Restaurar defaults</button>
        </div>
      </div>

      <p className="body-sm" style={{ marginBottom: 20 }}>
        Selecciona un rol y configura qué módulos puede <strong>ver</strong> y <strong>editar</strong>.
        Los roles <strong>superadmin</strong> y <strong>admin</strong> siempre tienen acceso total.
      </p>

      {isLoading ? <p className={styles.loading}>Cargando permisos…</p> : (
        <div className={styles.layout}>
          {/* Lista de roles */}
          <div className={styles.roleList}>
            {rolesVisibles.map(r => (
              <button
                key={r.key}
                className={`${styles.roleBtn} ${selectedRole === r.key ? styles.roleBtnActive : ''}`}
                style={selectedRole === r.key ? { borderLeftColor: ROLE_COLORS[r.key] ?? 'var(--verde)' } : {}}
                onClick={() => setSelectedRole(r.key)}
              >
                <span className={styles.roleDot} style={{ background: ROLE_COLORS[r.key] ?? '#aaa' }} />
                <span className={styles.roleLabel}>{r.label}</span>
                {(r.key === 'superadmin' || r.key === 'admin') && (
                  <span className={styles.fullAccessTag}>Acceso total</span>
                )}
              </button>
            ))}
          </div>

          {/* Matriz de permisos */}
          <div className={styles.matrix}>
            <div className={styles.matrixHeader}>
              <h3 className={styles.matrixTitle}>
                Permisos para: <span style={{ color: ROLE_COLORS[selectedRole] ?? 'var(--verde)' }}>
                  {rolesVisibles.find(r => r.key === selectedRole)?.label}
                </span>
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {msg && <span style={{ fontSize: 12, color: 'var(--positivo)' }}>{msg}</span>}
                {selectedRole !== 'superadmin' && selectedRole !== 'admin' && (
                  <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                    {saving ? 'Guardando…' : '💾 Guardar permisos'}
                  </button>
                )}
              </div>
            </div>

            {(selectedRole === 'superadmin' || selectedRole === 'admin') ? (
              <div className={styles.fullAccessMsg}>
                <span style={{ fontSize: 32 }}>🔓</span>
                <p>Este rol tiene acceso total a todos los módulos.</p>
                <p className="body-sm">No es posible restringir permisos para superadmin/admin.</p>
              </div>
            ) : (
              <table className={styles.permTable}>
                <thead>
                  <tr>
                    <th className={styles.thMod}>Módulo</th>
                    <th className={styles.thPerm}>👁️ Ver</th>
                    <th className={styles.thPerm}>✏️ Editar</th>
                    <th className={styles.thAccess}>Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.modulos ?? []).map(m => {
                    const p = getPermiso(selectedRole, m.key)
                    const nivel = p.editar ? 'total' : p.ver ? 'solo-lectura' : 'sin-acceso'
                    return (
                      <tr key={m.key} className={`${styles.permRow} ${nivel === 'sin-acceso' ? styles.noAccess : ''}`}>
                        <td className={styles.tdMod}>{m.label}</td>
                        <td className={styles.tdCheck}>
                          <label className={styles.toggle}>
                            <input type="checkbox" checked={p.ver}
                              onChange={e => setPermiso(selectedRole, m.key, 'ver', e.target.checked)} />
                            <span className={styles.slider} />
                          </label>
                        </td>
                        <td className={styles.tdCheck}>
                          <label className={styles.toggle}>
                            <input type="checkbox" checked={p.editar} disabled={!p.ver}
                              onChange={e => setPermiso(selectedRole, m.key, 'editar', e.target.checked)} />
                            <span className={`${styles.slider} ${!p.ver ? styles.sliderDisabled : ''}`} />
                          </label>
                        </td>
                        <td>
                          <span className={`${styles.nivelBadge} ${styles['nivel_' + nivel.replace('-','_')]}`}>
                            {nivel === 'total' ? '✅ Total' : nivel === 'solo-lectura' ? '👁️ Solo lectura' : '🚫 Sin acceso'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
