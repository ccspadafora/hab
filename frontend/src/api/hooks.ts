import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  Predio, Propietario, Lead, Conversacion,
  Proyecto, AnalisisViabilidad, PaginatedResponse,
} from '../types/models'

// ── Helpers ──────────────────────────────────────────────
const get = <T>(url: string, params?: object) =>
  apiClient.get<T>(url, { params }).then((r) => r.data)

const post = <T>(url: string, body?: object) =>
  apiClient.post<T>(url, body).then((r) => r.data)

const patch = <T>(url: string, body?: object) =>
  apiClient.patch<T>(url, body).then((r) => r.data)

// ── Predios ───────────────────────────────────────────────
export interface PrediosFilter {
  estado?: string
  barrio?: string
  tipo?: string
  estrato?: number
  search?: string
  ordering?: string
}

export function usePredios(filters?: PrediosFilter) {
  return useQuery({
    queryKey: ['predios', filters],
    queryFn: () => get<PaginatedResponse<Predio>>('/predios/', filters),
  })
}

export function usePredio(id: number) {
  return useQuery({
    queryKey: ['predio', id],
    queryFn: () => get<Predio>(`/predios/${id}/`),
    enabled: !!id,
  })
}

export function usePredioPipeline() {
  return useQuery({
    queryKey: ['predios', 'pipeline'],
    queryFn: () => get<Record<string, { label: string; count: number; predios: Predio[] }>>('/predios/pipeline/'),
  })
}

export function useRecalcularPrefact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (predioId: number) => post(`/predios/${predioId}/recalcular_prefactibilidad/`),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['predio', id] }),
  })
}

// ── Propietarios ──────────────────────────────────────────
export interface PropietariosFilter {
  estado_contacto?: string
  temperatura?: string
  search?: string
  ordering?: string
}

export function usePropietarios(filters?: PropietariosFilter) {
  return useQuery({
    queryKey: ['propietarios', filters],
    queryFn: () => get<PaginatedResponse<Propietario>>('/propietarios/', filters),
  })
}

export function usePropietario(id: number) {
  return useQuery({
    queryKey: ['propietario', id],
    queryFn: () => get<Propietario>(`/propietarios/${id}/`),
    enabled: !!id,
  })
}

// ── Leads ─────────────────────────────────────────────────
export interface LeadsFilter {
  estado?: string
  temperatura?: string
  asesor?: number
  search?: string
}

export function useLeads(filters?: LeadsFilter) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => get<PaginatedResponse<Lead>>('/leads/', filters),
  })
}

export function useLead(id: number) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => get<Lead>(`/leads/${id}/`),
    enabled: !!id,
  })
}

export function useUpdateLeadEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      patch(`/leads/${id}/`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// ── Conversaciones ────────────────────────────────────────
export function useConversaciones(filters?: { estado?: string; search?: string }) {
  return useQuery({
    queryKey: ['conversaciones', filters],
    queryFn: () => get<PaginatedResponse<Conversacion>>('/conversaciones/', filters),
    refetchInterval: 15_000,
  })
}

export function useConversacion(id: number) {
  return useQuery({
    queryKey: ['conversacion', id],
    queryFn: () => get<Conversacion & { mensajes: object[] }>(`/conversaciones/${id}/`),
    enabled: !!id,
    refetchInterval: 5_000,
  })
}

export function useTomarControl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      post(`/conversaciones/${id}/tomar_control/`, { motivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversaciones'] }),
  })
}

export function useCederControl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => post(`/conversaciones/${id}/ceder_control/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversaciones'] }),
  })
}

// ── Proyectos ─────────────────────────────────────────────
export function useProyectos(filters?: { fase?: string; search?: string; page_size?: number }) {
  return useQuery({
    queryKey: ['proyectos', filters],
    queryFn: () => get<PaginatedResponse<Proyecto>>('/proyectos/', filters),
  })
}

export function useProyecto(id: number) {
  return useQuery({
    queryKey: ['proyecto', id],
    queryFn: () => get<Proyecto>(`/proyectos/${id}/`),
    enabled: !!id,
  })
}

// ── Viabilidad ────────────────────────────────────────────
export function useAnalisis(id: number) {
  return useQuery({
    queryKey: ['analisis', id],
    queryFn: () => get<AnalisisViabilidad>(`/viabilidad/${id}/`),
    enabled: !!id,
  })
}

export function useCrearAnalisis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (predioId: number) => post('/viabilidad/', { predio: predioId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['predios'] }),
  })
}

// ── Viabilidad detalle ────────────────────────────────────
export function useAnalisisByPredio(predioId: number) {
  return useQuery({
    queryKey: ['analisis', 'predio', predioId],
    queryFn: () => get<{ results: AnalisisViabilidad[] }>('/viabilidad/', { predio: predioId }),
    enabled: !!predioId,
  })
}

// ── Configuración ─────────────────────────────────────────
export interface ConfigItem {
  id: number; clave: string; valor: unknown; tipo: string
  descripcion: string; categoria: string; editable_frontend: boolean
}
export interface ConfigIA {
  id: number
  modelo_estructuracion: string; modelo_bot_whatsapp: string; modelo_scoring: string
  temperatura_bot: string; temperatura_estructuracion: string
  max_tokens_respuesta_bot: number; max_tokens_estructuracion: number
  ia_bot_activa_global: boolean; escalar_tras_n_mensajes: number
}

export function useConfigSistema(categoria?: string) {
  return useQuery({
    queryKey: ['config', 'sistema', categoria],
    queryFn: () => get<{ results: ConfigItem[] }>('/config/sistema/', { categoria }),
  })
}
export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, valor }: { id: number; valor: unknown }) =>
      patch(`/config/sistema/${id}/`, { valor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}
export function useConfigIA() {
  return useQuery({
    queryKey: ['config', 'ia'],
    queryFn: () => get<ConfigIA>('/config/ia/'),
  })
}
export function useUpdateConfigIA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ConfigIA>) => apiClient.patch('/config/ia/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'ia'] }),
  })
}

// ── Base de conocimiento IA ───────────────────────────────
export interface DocIA {
  id: number; nombre: string; tipo: string; aplica_a: string
  descripcion: string; activo: boolean; texto_plano: string; creado_en: string
}
export interface PromptIA {
  id: number; nombre: string; modulo: string; activo: boolean
  version: number; prompt_sistema: string; prompt_usuario: string
  variables_disponibles: string[]; actualizado_en: string
}

export function useBaseConocimiento() {
  return useQuery({
    queryKey: ['ia', 'conocimiento'],
    queryFn: () => get<{ results: DocIA[] }>('/ia/conocimiento/'),
  })
}
export function usePrompts() {
  return useQuery({
    queryKey: ['ia', 'prompts'],
    queryFn: () => get<{ results: PromptIA[] }>('/ia/prompts/'),
  })
}
export function useUpdatePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PromptIA> }) =>
      patch(`/ia/prompts/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ia', 'prompts'] }),
  })
}
export function useGenerarEstructuracion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (proyectoId: number) => post(`/proyectos/${proyectoId}/generar_estructuracion_ia/`),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['proyecto', id] }),
  })
}

// ── Dashboard stats ───────────────────────────────────────
export interface DashboardStats {
  predios_total:       number
  predios_viables:     number
  predios_nuevos:      number
  propietarios_total:  number
  leads_activos:       number
  proyectos_activos:   number
  conversaciones_hoy:  number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [predios, propietarios, leads, proyectos, convs] = await Promise.all([
        get<PaginatedResponse<Predio>>('/predios/', { page_size: 1 }),
        get<PaginatedResponse<Propietario>>('/propietarios/', { page_size: 1 }),
        get<PaginatedResponse<Lead>>('/leads/', { page_size: 1 }),
        get<PaginatedResponse<Proyecto>>('/proyectos/', { page_size: 1 }),
        get<PaginatedResponse<Conversacion>>('/conversaciones/', { estado: 'activa', page_size: 1 }),
      ])
      const viables = await get<PaginatedResponse<Predio>>('/predios/', { estado: 'viable', page_size: 1 })
      const nuevos  = await get<PaginatedResponse<Predio>>('/predios/', { estado: 'nuevo', page_size: 1 })
      return {
        predios_total:      predios.count,
        predios_viables:    viables.count,
        predios_nuevos:     nuevos.count,
        propietarios_total: propietarios.count,
        leads_activos:      leads.count,
        proyectos_activos:  proyectos.count,
        conversaciones_hoy: convs.count,
      }
    },
    staleTime: 1000 * 60,
  })
}
