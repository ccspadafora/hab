interface ScoreMeterProps {
  score: number | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/** Shows Alto/Medio/Bajo labels — never exact numbers for constructoras */
export function ScoreMeter({ score, showLabel = true, size = 'md' }: ScoreMeterProps) {
  if (score === null || score === undefined) {
    return <span className="score-meter--empty">Sin análisis</span>
  }

  const level = score >= 66 ? 'alto' : score >= 31 ? 'medio' : 'bajo'
  const labels = { alto: 'Alto potencial', medio: 'Potencial medio', bajo: 'Bajo potencial' } as const
  const color = `var(--score-${level})`

  return (
    <div
      className={`score-meter score-meter--${size}`}
      aria-label={`Potencial: ${labels[level]}`}
    >
      <div className="score-meter__bar">
        <div
          className="score-meter__fill"
          style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }}
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="score-meter__label" style={{ color }}>
          {labels[level]}
        </span>
      )}
    </div>
  )
}
