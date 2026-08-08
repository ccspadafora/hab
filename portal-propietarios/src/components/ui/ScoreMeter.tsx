interface ScoreMeterProps {
  score: number | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreMeter({ score, showLabel = true, size = 'md' }: ScoreMeterProps) {
  if (score === null) return <span className="score-meter--empty">Sin análisis</span>

  const level = score >= 66 ? 'alto' : score >= 31 ? 'medio' : 'bajo'
  const labels = { alto: 'Alto potencial', medio: 'Potencial medio', bajo: 'Bajo potencial' }
  const color = `var(--score-${level})`

  return (
    <div className={`score-meter score-meter--${size}`} aria-label={`Score: ${score} de 100`}>
      <div className="score-meter__bar">
        <div
          className="score-meter__fill"
          style={{ width: `${score}%`, backgroundColor: color }}
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
