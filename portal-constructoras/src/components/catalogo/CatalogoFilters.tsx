'use client'

import type { ProyectoFilters } from '@/types/proyecto'

interface CatalogoFiltersProps {
  filters: ProyectoFilters
  onChange: (next: ProyectoFilters) => void
}

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'casa', label: 'Casa' },
  { value: 'lote', label: 'Lote' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'local', label: 'Local' },
  { value: 'bodega', label: 'Bodega' },
]

const ESTRATOS = ['', '1', '2', '3', '4', '5', '6']
const SCORES = [
  { value: '', label: 'Cualquier potencial' },
  { value: '31', label: 'Medio o superior' },
  { value: '66', label: 'Alto potencial' },
]

export function CatalogoFilters({ filters, onChange }: CatalogoFiltersProps) {
  const set = (key: keyof ProyectoFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  return (
    <aside className="catalogo-filters" aria-label="Filtros del catálogo">
      <h2 className="catalogo-filters__title">Filtros</h2>

      <label className="form-field">
        <span>Barrio</span>
        <input
          type="search"
          value={filters.barrio ?? ''}
          onChange={(e) => set('barrio', e.target.value)}
          placeholder="Ej. Chapinero"
        />
      </label>

      <label className="form-field">
        <span>Estrato</span>
        <select
          value={filters.estrato ?? ''}
          onChange={(e) => set('estrato', e.target.value)}
        >
          {ESTRATOS.map((e) => (
            <option key={e || 'all'} value={e}>
              {e ? `Estrato ${e}` : 'Todos'}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Tipo</span>
        <select value={filters.tipo ?? ''} onChange={(e) => set('tipo', e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t.value || 'all'} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Potencial mínimo</span>
        <select
          value={filters.score_min ?? ''}
          onChange={(e) => set('score_min', e.target.value)}
        >
          {SCORES.map((s) => (
            <option key={s.value || 'all'} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn-secondary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onChange({})}
      >
        Limpiar filtros
      </button>
    </aside>
  )
}
