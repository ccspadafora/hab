import { getBrowserClient } from '@/lib/api/client'

export interface AuthTokenResponse {
  status: string
  access: string
  portal_user_id: number
  propietario_id: number
}

export interface RegistroResponse {
  status: string
  portal_user_id: number
  propietario_id: number
  expires?: string
  debug_otp?: string
}

export interface OtpSolicitarResponse {
  status: string
  expires?: string
  debug_otp?: string
}

export async function apiRegistro(payload: {
  nombre: string
  telefono: string
  email?: string
  password: string
}): Promise<RegistroResponse> {
  const { data } = await getBrowserClient().post<RegistroResponse>(
    '/auth/propietario/registro/',
    payload,
  )
  return data
}

export async function apiLogin(payload: {
  telefono: string
  password: string
}): Promise<AuthTokenResponse> {
  const { data } = await getBrowserClient().post<AuthTokenResponse>(
    '/auth/propietario/login/',
    payload,
  )
  return data
}

export async function apiSolicitarOtp(telefono: string): Promise<OtpSolicitarResponse> {
  const { data } = await getBrowserClient().post<OtpSolicitarResponse>(
    '/auth/propietario/otp/solicitar/',
    { telefono },
  )
  return data
}

export async function apiVerificarOtp(payload: {
  telefono: string
  code: string
}): Promise<AuthTokenResponse> {
  const { data } = await getBrowserClient().post<AuthTokenResponse>(
    '/auth/propietario/otp/verificar/',
    payload,
  )
  return data
}
