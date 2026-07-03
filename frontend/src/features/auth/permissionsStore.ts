import { create } from 'zustand'

export type ModuloKey =
  | 'dashboard' | 'financiero' | 'predios' | 'viabilidad'
  | 'propietarios' | 'leads' | 'calendario' | 'bot'
  | 'proyectos' | 'estructuracion' | 'ia' | 'configuracion' | 'usuarios'

interface ModuloPermiso { ver: boolean; editar: boolean }
type PermisosMap = Partial<Record<ModuloKey, ModuloPermiso>>

interface PermissionsState {
  permisos: PermisosMap
  role: string
  setPermisos: (role: string, permisos: PermisosMap) => void
  canView:  (modulo: ModuloKey) => boolean
  canEdit:  (modulo: ModuloKey) => boolean
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permisos: {},
  role: '',

  setPermisos: (role, permisos) => set({ role, permisos }),

  canView: (modulo) => {
    const { role, permisos } = get()
    // Sin rol (aún cargando) → mostrar todo para no dejar pantalla vacía
    if (!role) return true
    // Superadmin y admin siempre pueden ver todo
    if (role === 'superadmin' || role === 'admin') return true
    return permisos[modulo]?.ver ?? false
  },

  canEdit: (modulo) => {
    const { role, permisos } = get()
    if (!role) return true
    if (role === 'superadmin' || role === 'admin') return true
    return permisos[modulo]?.editar ?? false
  },
}))
