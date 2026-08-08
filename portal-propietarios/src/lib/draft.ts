export const DRAFT_ID_KEY = 'hab_draft_publicacion_id'
export const DRAFT_DATA_KEY = 'hab_draft_publicacion_data'
export const REGISTRO_TELEFONO_KEY = 'hab_registro_telefono'
export const REGISTRO_DEBUG_OTP_KEY = 'hab_registro_debug_otp'
export const REGISTRO_NOMBRE_KEY = 'hab_registro_nombre'

export function getDraftId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(DRAFT_ID_KEY)
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export function setDraftId(id: number) {
  sessionStorage.setItem(DRAFT_ID_KEY, String(id))
}

export function clearDraftId() {
  sessionStorage.removeItem(DRAFT_ID_KEY)
  sessionStorage.removeItem(DRAFT_DATA_KEY)
}

export function mergeDraftData(partial: Record<string, unknown>) {
  const current = getDraftData()
  const next = { ...current, ...partial }
  sessionStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(next))
  return next
}

export function getDraftData(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(DRAFT_DATA_KEY)
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function axiosErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { error?: string; detail?: string } } }).response
    const data = response?.data
    if (data?.error) return String(data.error)
    if (data?.detail) return String(data.detail)
  }
  if (err instanceof Error) return err.message
  return fallback
}
