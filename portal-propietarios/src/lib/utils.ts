import clsx, { type ClassValue } from 'clsx'

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

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function toScoreNumber(score: number | string | null | undefined): number | null {
  if (score == null || score === '') return null
  const n = typeof score === 'number' ? score : Number(score)
  return Number.isFinite(n) ? n : null
}
