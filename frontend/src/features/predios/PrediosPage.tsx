import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  usePredioPipeline,
  usePredios,
  useBulkDeletePredios,
  useBulkUpdatePredioEstado,
  useUpdatePredioEstado,
  type PrediosFilter,
} from '../../api/hooks'
import { ScoreBadge } from '../../components/ui/Badges'
import { Modal } from '../../components/ui/Modal'
import PredioForm from './PredioForm'
import type { EstadoPredio, Predio } from '../../types/models'
import styles from './PrediosPage.module.css'

const ESTADOS: EstadoPredio[] = [
  'para_estudio',
  'contacto_inicial',
  'prefactibilidad',
  'viable_negociacion',
  'cierres_potenciales',
  'estruct_propietarios',
  'descartado',
]
const TIPOS   = ['casa','lote','apartamento','local']
const CIUDADES = ['Bogotá', 'Chía', 'Cajicá', 'La Calera', 'Sopó', 'Cota', 'Mosquera', 'Funza', 'Madrid', 'Zipaquirá']
const LOCALIDADES = ['Usaquén', 'Chapinero', 'Teusaquillo', 'Barrios Unidos', 'Suba', 'Engativá', 'Fontibón', 'Kennedy', 'Santa Fe', 'La Candelaria', 'Rafael Uribe', 'Bosa']
const PRICE_MAX_LIMIT = 20_000_000_000
const SCORE_MIN_LIMIT = 0
const SCORE_MAX_LIMIT = 100
const COLUMNAS: { key: EstadoPredio; label: string; accent: string; hint: string }[] = [
  { key: 'para_estudio',         label: 'Para estudio',                 accent: '#7B8D65', hint: 'predios por revisar y perfilar' },
  { key: 'contacto_inicial',     label: 'Contacto inicial',             accent: '#3F83D5', hint: 'primer acercamiento con propietario' },
  { key: 'prefactibilidad',      label: 'Prefactibilidad',              accent: '#B98952', hint: 'análisis técnico y comercial' },
  { key: 'viable_negociacion',   label: 'Viable - negociación',         accent: '#2F7A52', hint: 'oportunidades listas para empujar' },
  { key: 'cierres_potenciales',  label: 'Cierres potenciales',          accent: '#B86C3A', hint: 'casos con probabilidad real de cierre' },
  { key: 'estruct_propietarios', label: 'Estr. propietarios',           accent: '#7E52A0', hint: 'alineación y estructura de propietarios' },
  { key: 'descartado',           label: 'Archivo',                      accent: '#8B7E73', hint: 'oportunidades pausadas o descartadas' },
]

const ESTADO_LABELS = COLUMNAS.reduce<Record<EstadoPredio, string>>((acc, col) => {
  acc[col.key] = col.label
  return acc
}, {} as Record<EstadoPredio, string>)

function fmtMoney(value: number | null) {
  if (!value) return 'COP 0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtCompactMoney(value: number | null) {
  if (!value) return '—'
  return `$${(value / 1_000_000).toFixed(1)}M`
}

function fmtNumber(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value)
}

function toggleItem(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function PredioCard({ predio, isDragging = false }: { predio: Predio; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sorting } =
    useSortable({ id: `predio-${predio.id}` })
  const imagen = predio.imagenes?.[0]

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: sorting ? 0.35 : 1 }}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      {imagen ? (
        <div className={styles.cardMedia} style={{ backgroundImage: `url(${imagen})` }} />
      ) : (
        <div className={styles.cardMediaFallback}>
          <span>{predio.tipo === 'lote' ? 'Lote' : predio.tipo}</span>
        </div>
      )}
      <div className={styles.cardBody}>
        {predio.codigo_externo && <p className={styles.cardCode}>{predio.codigo_externo}</p>}
        <p className={styles.cardTitle}>{predio.direccion || `${predio.barrio} · ${predio.localidad}`}</p>
        <p className={styles.cardPrice}>{fmtMoney(predio.precio_publicado)}</p>
        <div className={styles.metaGrid}>
          <span>{fmtNumber(predio.area_lote)} m²</span>
          <span>{predio.localidad}</span>
          <span>{predio.precio_m2 ? fmtMoney(predio.precio_m2) : 'Sin precio/m²'}</span>
        </div>
        <div className={styles.tagRow}>
          <span className={styles.softTag}>{predio.barrio}</span>
          <span className={styles.softTag}>{predio.tipo}</span>
          {predio.tags?.slice(0, 2).map((tag) => <span key={tag} className={styles.softTagAlt}>{tag}</span>)}
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.scoreWrap}>
            <span className={styles.scoreLabel}>Score</span>
            <ScoreBadge score={predio.score_prefactibilidad} />
          </div>
          <Link to={`/predios/${predio.id}`} className={styles.verLink} onClick={(e) => e.stopPropagation()}>
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  )
}

function PredioColumn({ colKey, label, accent, hint, predios }: {
  colKey: EstadoPredio
  label: string
  accent: string
  hint: string
  predios: Predio[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${colKey}` })

  return (
    <section className={`${styles.column} ${isOver ? styles.colOver : ''}`}>
      <header className={styles.colHeader} style={{ borderTopColor: accent }}>
        <div>
          <div className={styles.colTop}>
            <span className={styles.colDot} style={{ background: accent }} />
            <span className={styles.colLabel}>{label}</span>
            <span className={styles.colCount}>{predios.length}</span>
          </div>
          <p className={styles.colHint}>{hint}</p>
        </div>
      </header>
      <SortableContext
        id={colKey}
        items={predios.map((predio) => `predio-${predio.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className={`${styles.cards} ${isOver ? styles.cardsOver : ''}`}>
          {predios.map((predio) => <PredioCard key={predio.id} predio={predio} />)}
          {!predios.length && <div className={styles.emptyCol}>Suelta aquí para mover el predio</div>}
        </div>
      </SortableContext>
    </section>
  )
}

export default function PrediosPage() {
  const [estado,    setEstado]    = useState('')
  const [tipo,      setTipo]      = useState('')
  const [ciudad,    setCiudad]    = useState('')
  const [localidades, setLocalidades] = useState<string[]>([])
  const [search,    setSearch]    = useState('')
  const [ordering,  setOrdering]  = useState('-primera_deteccion')
  const [estratoMin, setEstratoMin] = useState(1)
  const [estratoMax, setEstratoMax] = useState(6)
  const [precioMin, setPrecioMin] = useState(0)
  const [precioMax, setPrecioMax] = useState(PRICE_MAX_LIMIT)
  const [scoreMin, setScoreMin] = useState(SCORE_MIN_LIMIT)
  const [scoreMax, setScoreMax] = useState(SCORE_MAX_LIMIT)
  const [page,      setPage]      = useState(1)
  const [pageSize,  setPageSize]  = useState(20)
  const [showForm,  setShowForm]  = useState(false)
  const [view,      setView]      = useState<'pipeline' | 'tabla'>('pipeline')
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkEstado, setBulkEstado] = useState<EstadoPredio>('para_estudio')

  const filters: PrediosFilter = {
    estado:   estado   || undefined,
    tipo:     tipo     || undefined,
    ciudad:   ciudad   || undefined,
    localidades: localidades.length ? localidades.join(',') : undefined,
    estrato_min: estratoMin > 1 ? estratoMin : undefined,
    estrato_max: estratoMax < 6 ? estratoMax : undefined,
    precio_min: precioMin > 0 ? precioMin : undefined,
    precio_max: precioMax < PRICE_MAX_LIMIT ? precioMax : undefined,
    score_min: scoreMin > SCORE_MIN_LIMIT ? scoreMin : undefined,
    score_max: scoreMax < SCORE_MAX_LIMIT ? scoreMax : undefined,
    search:   search   || undefined,
    ordering: ordering || undefined,
    page,
    page_size: pageSize,
  }
  const pipelineFilters: PrediosFilter = {
    estado: filters.estado,
    tipo: filters.tipo,
    ciudad: filters.ciudad,
    localidades: filters.localidades,
    estrato_min: filters.estrato_min,
    estrato_max: filters.estrato_max,
    precio_min: filters.precio_min,
    precio_max: filters.precio_max,
    score_min: filters.score_min,
    score_max: filters.score_max,
    search: filters.search,
    ordering: filters.ordering,
  }
  const { data, isLoading } = usePredios(filters)
  const { data: pipelineData, isLoading: pipelineLoading } = usePredioPipeline(pipelineFilters)
  const updateEstado = useUpdatePredioEstado()
  const bulkUpdateEstado = useBulkUpdatePredioEstado()
  const bulkDelete = useBulkDeletePredios()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const tablaPredios = data?.results ?? []

  useEffect(() => {
    const visibles = new Set(tablaPredios.map((p) => p.id))
    setSelectedIds((prev) => prev.filter((id) => visibles.has(id)))
  }, [data?.results])

  useEffect(() => {
    setPage(1)
  }, [estado, tipo, ciudad, localidades, search, ordering, estratoMin, estratoMax, precioMin, precioMax, scoreMin, scoreMax, pageSize])

  const pipelinePredios = useMemo(() => {
    if (!pipelineData) return []
    return ESTADOS.flatMap((key) => pipelineData[key]?.predios ?? [])
  }, [pipelineData])

  const activePredio = pipelinePredios.find((predio) => `predio-${predio.id}` === activeId) ?? null
  const allVisibleSelected = tablaPredios.length > 0 && tablaPredios.every((p) => selectedIds.includes(p.id))
  const totalPredios = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalPredios / pageSize))
  const fromItem = totalPredios === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = totalPredios === 0 ? 0 : Math.min(page * pageSize, totalPredios)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const togglePredio = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(tablaPredios.map((p) => p.id))
  }

  const handleBulkEstado = () => {
    if (!selectedIds.length) return
    bulkUpdateEstado.mutate(
      { ids: selectedIds, estado: bulkEstado },
      { onSuccess: () => setSelectedIds([]) },
    )
  }

  const handleBulkDelete = () => {
    if (!selectedIds.length) return
    const ok = window.confirm(`¿Eliminar ${selectedIds.length} predios seleccionados? Esta acción no se puede deshacer.`)
    if (!ok) return
    bulkDelete.mutate(selectedIds, { onSuccess: () => setSelectedIds([]) })
  }

  const getColumnState = (overId: string): EstadoPredio | undefined => {
    if (overId.startsWith('col-')) return overId.replace('col-', '') as EstadoPredio
    if (overId.startsWith('predio-')) {
      const id = Number(overId.replace('predio-', ''))
      return pipelinePredios.find((predio) => predio.id === id)?.estado
    }
    return undefined
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const predioId = Number(String(active.id).replace('predio-', ''))
    const target = getColumnState(String(over.id))
    const current = pipelinePredios.find((predio) => predio.id === predioId)?.estado
    if (!target || target === current) return
    updateEstado.mutate({ id: predioId, estado: target })
  }

  const clearFilters = () => {
    setEstado('')
    setTipo('')
    setCiudad('')
    setLocalidades([])
    setSearch('')
    setOrdering('-primera_deteccion')
    setEstratoMin(1)
    setEstratoMax(6)
    setPrecioMin(0)
    setPrecioMax(PRICE_MAX_LIMIT)
    setScoreMin(SCORE_MIN_LIMIT)
    setScoreMax(SCORE_MAX_LIMIT)
    setPage(1)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🏘️ Adquisición</div>
          <h1 className="h-med">Pipeline de Predios</h1>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button className={`${styles.vBtn} ${view === 'pipeline' ? styles.vActive : ''}`} onClick={() => setView('pipeline')}>
              Pipeline
            </button>
            <button className={`${styles.vBtn} ${view === 'tabla' ? styles.vActive : ''}`} onClick={() => setView('tabla')}>
              Tabla
            </button>
          </div>
          <span className={styles.total}>{isLoading ? '…' : `${data?.count ?? 0} predios`}</span>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo predio</button>
        </div>
      </div>
      {showForm && (
        <Modal title="📍 Nuevo Predio" onClose={() => setShowForm(false)} wide>
          <PredioForm onClose={() => setShowForm(false)} />
        </Modal>
      )}

      {/* Filtros controlados */}
      <div className={styles.filters}>
        <input
          className={`input ${styles.search}`}
          placeholder="Buscar barrio, dirección, código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`input ${styles.sel}`}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
          ))}
        </select>
        <select
          className={`input ${styles.sel}`}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className={`input ${styles.sel}`}
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
        >
          <option value="-primera_deteccion">Más recientes</option>
          <option value="-score_prefactibilidad">Mayor score</option>
          <option value="precio_publicado">Menor precio</option>
          <option value="-precio_publicado">Mayor precio</option>
        </select>
        {(estado || tipo || ciudad || localidades.length || search || estratoMin > 1 || estratoMax < 6 || precioMin > 0 || precioMax < PRICE_MAX_LIMIT || scoreMin > 0 || scoreMax < 100) && (
          <button
            className="btn btn-ghost"
            onClick={clearFilters}
            style={{ fontSize: 11 }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div className={styles.advancedFilters}>
        <div className={styles.filterSection}>
          <label className={styles.filterLabel}>Ciudad</label>
          <select className={`input ${styles.selWide}`} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            <option value="">Todas las ciudades</option>
            {CIUDADES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className={`${styles.filterSection} ${styles.filterSectionWide}`}>
          <label className={styles.filterLabel}>Localidades</label>
          <div className={styles.chipGrid}>
            {LOCALIDADES.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.chip} ${localidades.includes(item) ? styles.chipActive : ''}`}
                onClick={() => setLocalidades((current) => toggleItem(current, item))}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <label className={styles.filterLabel}>Estrato</label>
          <div className={styles.inlineInputs}>
            <select className={`input ${styles.miniInput}`} value={estratoMin} onChange={(e) => setEstratoMin(Math.min(Number(e.target.value), estratoMax))}>
              {[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>Min {item}</option>)}
            </select>
            <select className={`input ${styles.miniInput}`} value={estratoMax} onChange={(e) => setEstratoMax(Math.max(Number(e.target.value), estratoMin))}>
              {[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>Max {item}</option>)}
            </select>
          </div>
        </div>

        <div className={`${styles.filterSection} ${styles.rangeCard}`}>
          <div className={styles.rangeTop}>
            <label className={styles.filterLabel}>Precio publicado</label>
            <span className={styles.rangeValue}>
              {fmtCompactMoney(precioMin)} - {precioMax >= PRICE_MAX_LIMIT ? 'Sin tope' : fmtCompactMoney(precioMax)}
            </span>
          </div>
          <div className={styles.inlineInputs}>
            <input
              className={`input ${styles.miniInput}`}
              type="number"
              min="0"
              step="50000000"
              value={precioMin}
              onChange={(e) => setPrecioMin(Math.min(Number(e.target.value) || 0, precioMax))}
            />
            <input
              className={`input ${styles.miniInput}`}
              type="number"
              min="0"
              step="50000000"
              value={precioMax}
              onChange={(e) => setPrecioMax(Math.max(Number(e.target.value) || 0, precioMin))}
            />
          </div>
          <div className={styles.rangeInputs}>
            <input
              className={styles.slider}
              type="range"
              min="0"
              max={String(PRICE_MAX_LIMIT)}
              step="50000000"
              value={precioMin}
              onChange={(e) => setPrecioMin(Math.min(Number(e.target.value), precioMax))}
            />
            <input
              className={styles.slider}
              type="range"
              min="0"
              max={String(PRICE_MAX_LIMIT)}
              step="50000000"
              value={precioMax}
              onChange={(e) => setPrecioMax(Math.max(Number(e.target.value), precioMin))}
            />
          </div>
        </div>

        <div className={`${styles.filterSection} ${styles.rangeCard}`}>
          <div className={styles.rangeTop}>
            <label className={styles.filterLabel}>Score prefactibilidad</label>
            <span className={styles.rangeValue}>{scoreMin} - {scoreMax}</span>
          </div>
          <div className={styles.inlineInputs}>
            <input
              className={`input ${styles.miniInput}`}
              type="number"
              min={String(SCORE_MIN_LIMIT)}
              max={String(SCORE_MAX_LIMIT)}
              value={scoreMin}
              onChange={(e) => setScoreMin(Math.min(Number(e.target.value) || 0, scoreMax))}
            />
            <input
              className={`input ${styles.miniInput}`}
              type="number"
              min={String(SCORE_MIN_LIMIT)}
              max={String(SCORE_MAX_LIMIT)}
              value={scoreMax}
              onChange={(e) => setScoreMax(Math.max(Number(e.target.value) || 0, scoreMin))}
            />
          </div>
          <div className={styles.rangeInputs}>
            <input
              className={styles.slider}
              type="range"
              min={String(SCORE_MIN_LIMIT)}
              max={String(SCORE_MAX_LIMIT)}
              step="1"
              value={scoreMin}
              onChange={(e) => setScoreMin(Math.min(Number(e.target.value), scoreMax))}
            />
            <input
              className={styles.slider}
              type="range"
              min={String(SCORE_MIN_LIMIT)}
              max={String(SCORE_MAX_LIMIT)}
              step="1"
              value={scoreMax}
              onChange={(e) => setScoreMax(Math.max(Number(e.target.value), scoreMin))}
            />
          </div>
        </div>
      </div>

      {view === 'pipeline' && (
        <p className={styles.hint}>Arrastra tarjetas entre columnas para mover el predio dentro del pipeline operativo.</p>
      )}

      {/* Tabla / Pipeline */}
      {(isLoading || (view === 'pipeline' && pipelineLoading)) ? (
        <div className={styles.loading}>Cargando predios…</div>
      ) : view === 'tabla' ? (
        <div className={styles.tableWrap}>
          <div className={styles.tableTopBar}>
            <div className={styles.tableSummary}>
              <strong>{totalPredios}</strong>
              <span>predios totales</span>
              <em>{`Mostrando ${fromItem}-${toItem}`}</em>
            </div>
            <div className={styles.pagerControls}>
              <label className={styles.pageSizeLabel}>
                <span>Items por página</span>
                <select
                  className={styles.pageSizeSel}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[20, 50, 100, 200].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <div className={styles.pager}>
                <button
                  className={styles.pagerBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Anterior
                </button>
                <span className={styles.pageIndicator}>Página {page} de {totalPages}</span>
                <button
                  className={styles.pagerBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
          <div className={styles.bulkBar}>
            <label className={styles.bulkSelectAll}>
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
              <span>{selectedIds.length} seleccionados</span>
            </label>
            <select
              className={styles.bulkEstadoSel}
              value={bulkEstado}
              onChange={(e) => setBulkEstado(e.target.value as EstadoPredio)}
              disabled={!selectedIds.length || bulkUpdateEstado.isPending || bulkDelete.isPending}
            >
              {COLUMNAS.map((col) => <option key={col.key} value={col.key}>{col.label}</option>)}
            </select>
            <button
              className="btn btn-secondary"
              onClick={handleBulkEstado}
              disabled={!selectedIds.length || bulkUpdateEstado.isPending || bulkDelete.isPending}
            >
              {bulkUpdateEstado.isPending ? 'Aplicando…' : 'Cambiar estado'}
            </button>
            <button
              className={styles.bulkDeleteBtn}
              onClick={handleBulkDelete}
              disabled={!selectedIds.length || bulkDelete.isPending || bulkUpdateEstado.isPending}
            >
              {bulkDelete.isPending ? 'Eliminando…' : 'Eliminar seleccionados'}
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCol}></th>
                <th>Predio</th>
                <th>Tipo</th>
                <th>Área lote</th>
                <th>Precio</th>
                <th>Estrato</th>
                <th>Score</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((p) => (
                <tr key={p.id} className={selectedIds.includes(p.id) ? styles.rowSelected : ''}>
                  <td className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => togglePredio(p.id)}
                    />
                  </td>
                  <td>
                    <p className={styles.direccion}>{p.direccion || '—'}</p>
                    <p className={styles.barrio}>{p.barrio} · {p.localidad}</p>
                  </td>
                  <td><span className="badge badge-verde">{p.tipo}</span></td>
                  <td>{p.area_lote ? `${p.area_lote} m²` : '—'}</td>
                  <td className={styles.precio}>{fmtCompactMoney(p.precio_publicado)}</td>
                  <td>{p.estrato ? `E${p.estrato}` : '—'}</td>
                  <td><ScoreBadge score={p.score_prefactibilidad} /></td>
                  <td>
                    <select
                      className={styles.estadoSel}
                      value={p.estado}
                      onChange={(e) => updateEstado.mutate({ id: p.id, estado: e.target.value as EstadoPredio })}
                    >
                      {COLUMNAS.map((col) => <option key={col.key} value={col.key}>{col.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <Link
                      to={`/predios/${p.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: 11, padding: '6px 14px' }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
              {!data?.results.length && (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    No hay predios con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={styles.tableBottomBar}>
            <span className={styles.pageIndicator}>Página {page} de {totalPages}</span>
            <div className={styles.pager}>
              <button
                className={styles.pagerBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <button
                className={styles.pagerBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.boardViewport}>
            <div className={styles.board}>
              {COLUMNAS.map((col) => (
                <PredioColumn
                  key={col.key}
                  colKey={col.key}
                  label={col.label}
                  accent={col.accent}
                  hint={col.hint}
                  predios={pipelinePredios.filter((predio) => predio.estado === col.key)}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activePredio ? <PredioCard predio={activePredio} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
