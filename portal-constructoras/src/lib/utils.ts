import { clsx, type ClassValue } from 'clsx'

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatCOP = (amount: number | null | undefined): string => {
  if (amount == null) return '—'
  return COP.format(amount)
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function slugifyLocalidad(localidad: string): string {
  return localidad
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export const COOKIE_NAME =
  process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'hab_constructora_token'

export const PERFIL_COOKIE = 'hab_constructora_perfil_id'
