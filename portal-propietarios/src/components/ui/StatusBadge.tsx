const ESTADO_CONFIG = {
  borrador:          { label: 'Borrador',       color: 'var(--estado-borrador)'   },
  en_revision:       { label: 'En revisión',    color: 'var(--estado-revision)'   },
  activa:            { label: 'Activo',         color: 'var(--estado-activa)'     },
  en_negociacion:    { label: 'En negociación', color: 'var(--estado-negociacion)' },
  cerrada_exitosa:   { label: '¡Acuerdo!',      color: 'var(--estado-exito)'      },
  cerrada_sin_exito: { label: 'Finalizado',     color: 'var(--estado-sin-exito)'  },
  rechazada:         { label: 'No aplicó',      color: 'var(--estado-rechazada)'  },
} as const

type Estado = keyof typeof ESTADO_CONFIG

interface StatusBadgeProps {
  estado: Estado
  size?:  'sm' | 'md' | 'lg'
}

export function StatusBadge({ estado, size = 'md' }: StatusBadgeProps) {
  const config = ESTADO_CONFIG[estado]
  return (
    <span
      className={`status-badge status-badge--${size}`}
      style={{ backgroundColor: config.color + '20', color: config.color,
               border: `1px solid ${config.color}40` }}
      aria-label={`Estado: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
