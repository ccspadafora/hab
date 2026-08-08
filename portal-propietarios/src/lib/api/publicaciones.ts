import { getBrowserClient } from '@/lib/api/client'
import type {
  DashboardPropietario,
  Publicacion,
  PublicacionCreatePayload,
  PublicacionUpdatePayload,
} from '@/types/publicacion'

export async function apiGetDashboard(): Promise<DashboardPropietario> {
  const { data } = await getBrowserClient().get<DashboardPropietario>('/propietario/dashboard/')
  return data
}

export async function apiListPublicaciones(): Promise<Publicacion[]> {
  const { data } = await getBrowserClient().get<Publicacion[] | { results: Publicacion[] }>(
    '/propietario/publicaciones/',
  )
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export async function apiGetPublicacion(id: number): Promise<Publicacion> {
  const { data } = await getBrowserClient().get<Publicacion>(`/propietario/publicaciones/${id}/`)
  return data
}

export async function apiCreatePublicacion(
  payload: PublicacionCreatePayload,
): Promise<Publicacion> {
  const { data } = await getBrowserClient().post<Publicacion>(
    '/propietario/publicaciones/',
    payload,
  )
  return data
}

export async function apiUpdatePublicacion(
  id: number,
  payload: PublicacionUpdatePayload,
): Promise<Publicacion> {
  const { data } = await getBrowserClient().patch<Publicacion>(
    `/propietario/publicaciones/${id}/`,
    payload,
  )
  return data
}

export async function apiEnviarRevision(id: number): Promise<Publicacion> {
  const { data } = await getBrowserClient().post<Publicacion>(
    `/propietario/publicaciones/${id}/enviar_revision/`,
  )
  return data
}
