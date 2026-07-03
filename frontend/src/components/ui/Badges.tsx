import type { EstadoPredio, EstadoContacto, EstadoLead } from '../../types/models'

// ── Score de prefactibilidad ──────────────────────────────
export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
  const color = score >= 70 ? '#7EC87E' : score >= 50 ? '#C9B84C' : '#E07070'
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 15,
      color,
    }}>
      {score}
    </span>
  )
}

// ── Estado del predio ─────────────────────────────────────
const PREDIO_ESTADO: Record<EstadoPredio, { label: string; bg: string; color: string }> = {
  nuevo:       { label: 'Nuevo',       bg: 'rgba(43,77,46,0.09)',    color: '#2B4D2E' },
  en_analisis: { label: 'En análisis', bg: 'rgba(201,184,76,0.14)',  color: '#9A8A30' },
  viable:      { label: 'Viable',      bg: 'rgba(126,200,126,0.18)', color: '#3A7A3A' },
  no_viable:   { label: 'No viable',   bg: 'rgba(224,112,112,0.14)', color: '#B54040' },
  contactado:  { label: 'Contactado',  bg: 'rgba(100,149,237,0.14)', color: '#3060A0' },
  descartado:  { label: 'Descartado',  bg: 'rgba(150,150,150,0.12)', color: '#888' },
}

export function EstadoBadge({ estado }: { estado: EstadoPredio }) {
  const cfg = PREDIO_ESTADO[estado] ?? { label: estado, bg: '#eee', color: '#555' }
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  )
}

// ── Temperatura CRM ───────────────────────────────────────
const TEMP_MAP = {
  frio:     { emoji: '🧊', color: '#6090C0' },
  tibio:    { emoji: '🌤️', color: '#C9B84C' },
  caliente: { emoji: '🔥', color: '#E07070' },
}

export function TemperaturaBadge({ temp }: { temp: 'frio' | 'tibio' | 'caliente' }) {
  const cfg = TEMP_MAP[temp]
  return (
    <span style={{ fontSize: 13, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
      {cfg.emoji} {temp}
    </span>
  )
}

// ── Estado de contacto CRM ────────────────────────────────
const CONTACTO_COLORS: Record<EstadoContacto, string> = {
  sin_contactar: '#aaa',
  contactado:    '#6090C0',
  interesado:    '#C9B84C',
  calificado:    '#8FA882',
  en_negociacion:'#3D6B40',
  firmado:       '#2B4D2E',
  descartado:    '#E07070',
}

export function ContactoBadge({ estado }: { estado: EstadoContacto }) {
  const color = CONTACTO_COLORS[estado] ?? '#aaa'
  return (
    <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {estado.replace('_', ' ')}
    </span>
  )
}

// ── Estado de lead ────────────────────────────────────────
const LEAD_COLORS: Record<EstadoLead, string> = {
  nuevo:             '#8FA882',
  contactado:        '#6090C0',
  interesado:        '#C9B84C',
  calificado:        '#3D6B40',
  cita_agendada:     '#2B4D2E',
  propuesta_enviada: '#8060A0',
  en_negociacion:    '#A06000',
  promesa_firmada:   '#007A50',
  descartado:        '#E07070',
}

export function LeadEstadoBadge({ estado }: { estado: EstadoLead }) {
  const color = LEAD_COLORS[estado] ?? '#aaa'
  return (
    <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {estado.replace(/_/g, ' ')}
    </span>
  )
}
