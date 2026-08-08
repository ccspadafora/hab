import { getBrowserClient } from './client'
import type { PaginatedResponse, ProyectoCatalogo, ProyectoFilters } from '@/types/proyecto'
import type { MatchesResponse } from '@/types/match'

export interface LoginResponse {
  status: string
  access: string
  portal_user_id: number
  constructora_id: number
  perfil_id?: number | null
  email: string
}

export interface SolicitudResponse {
  id: number
  nombre_empresa: string
  estado: string
  created_at: string
}

export async function loginConstructora(email: string, password: string): Promise<LoginResponse> {
  const { data } = await getBrowserClient().post<LoginResponse>('/auth/constructora/login/', {
    email,
    password,
  })
  return data
}

export async function solicitarOTP(telefono: string) {
  const { data } = await getBrowserClient().post('/auth/constructora/otp/solicitar/', { telefono })
  return data
}

export async function verificarOTP(telefono: string, code: string) {
  const { data } = await getBrowserClient().post('/auth/constructora/otp/verificar/', {
    telefono,
    code,
  })
  return data
}

export async function crearSolicitud(payload: Record<string, unknown>): Promise<SolicitudResponse> {
  const { data } = await getBrowserClient().post<SolicitudResponse>(
    '/constructoras/solicitud/',
    payload,
  )
  return data
}

export async function fetchProyectos(
  filters: ProyectoFilters = {},
): Promise<PaginatedResponse<ProyectoCatalogo>> {
  const { data } = await getBrowserClient().get<PaginatedResponse<ProyectoCatalogo>>('/proyectos/', {
    params: Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    ),
  })
  return data
}

export async function fetchProyecto(id: number | string): Promise<ProyectoCatalogo> {
  const { data } = await getBrowserClient().get<ProyectoCatalogo>(`/proyectos/${id}/`)
  return data
}

export async function expresarInteres(id: number, nota: string) {
  const { data } = await getBrowserClient().post(`/proyectos/${id}/interes/`, { nota })
  return data
}

export async function fetchMatches(perfilId?: number | null): Promise<MatchesResponse> {
  const headers: Record<string, string> = {}
  const params: Record<string, string | number> = {}
  if (perfilId) {
    headers['X-Perfil-Id'] = String(perfilId)
    params.perfil_id = perfilId
  }
  const { data } = await getBrowserClient().get<MatchesResponse>('/constructora/matches/', {
    headers,
    params,
  })
  return data
}

export async function fetchPerfil() {
  const { data } = await getBrowserClient().get('/constructora/perfil/')
  return data
}
