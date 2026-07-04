import { useMemo, useRef, useState } from 'react'
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

function PipelineColumnHeader({ label, accent, hint, count }: {
  label: string
  accent: string
  hint: string
  count: number
}) {
  return (
    <header className={styles.colHeader} style={{ borderTopColor: accent }}>
      <div>
        <div className={styles.colTop}>
          <span className={styles.colDot} style={{ background: accent }} />
          <span className={styles.colLabel}>{label}</span>
          <span className={styles.colCount}>{count}</span>
        </div>
        <p className={styles.colHint}>{hint}</p>
      </div>
    </header>
  )
}

function PredioColumn({ colKey, predios }: {
  colKey: EstadoPredio
  predios: Predio[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${colKey}` })

  return (
    <section className={`${styles.column} ${isOver ? styles.colOver : ''}`}>
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
  const [search,    setSearch]    = useState('')
  const [ordering,  setOrdering]  = useState('-primera_deteccion')
  const [showForm,  setShowForm]  = useState(false)
  const [view,      setView]      = useState<'pipeline' | 'tabla'>('pipeline')
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const headerScrollRef = useRef<HTMLDivElement | null>(null)
  const bodyScrollRef = useRef<HTMLDivElement | null>(null)

  const filters: PrediosFilter = {
    estado:   estado   || undefined,
    tipo:     tipo     || undefined,
    search:   search   || undefined,
    ordering: ordering || undefined,
  }
  const { data, isLoading } = usePredios(filters)
  const { data: pipelineData, isLoading: pipelineLoading } = usePredioPipeline()
  const updateEstado = useUpdatePredioEstado()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const pipelinePredios = useMemo(() => {
    if (!pipelineData) return []
    return ESTADOS.flatMap((key) => pipelineData[key]?.predios ?? [])
  }, [pipelineData])

  const filteredPipelinePredios = useMemo(() => {
    return pipelinePredios.filter((predio) => {
      if (estado && predio.estado !== estado) return false
      if (tipo && predio.tipo !== tipo) return false
      if (!search) return true
      const haystack = [
        predio.direccion,
        predio.barrio,
        predio.localidad,
        predio.ciudad,
      ].join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  }, [pipelinePredios, estado, tipo, search])

  const activePredio = filteredPipelinePredios.find((predio) => `predio-${predio.id}` === activeId) ?? null

  const getColumnState = (overId: string): EstadoPredio | undefined => {
    if (overId.startsWith('col-')) return overId.replace('col-', '') as EstadoPredio
    if (overId.startsWith('predio-')) {
      const id = Number(overId.replace('predio-', ''))
      return filteredPipelinePredios.find((predio) => predio.id === id)?.estado
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
    const current = filteredPipelinePredios.find((predio) => predio.id === predioId)?.estado
    if (!target || target === current) return
    updateEstado.mutate({ id: predioId, estado: target })
  }

  const syncHeaderScroll = () => {
    if (!headerScrollRef.current || !bodyScrollRef.current) return
    headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft
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
        {(estado || tipo || search) && (
          <button
            className="btn btn-ghost"
            onClick={() => { setEstado(''); setTipo(''); setSearch(''); }}
            style={{ fontSize: 11 }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {view === 'pipeline' && (
        <p className={styles.hint}>Arrastra tarjetas entre columnas para mover el predio dentro del pipeline operativo.</p>
      )}

      {/* Tabla / Pipeline */}
      {(isLoading || (view === 'pipeline' && pipelineLoading)) ? (
        <div className={styles.loading}>Cargando predios…</div>
      ) : view === 'tabla' ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
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
                <tr key={p.id}>
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
                  <td colSpan={8} className={styles.empty}>
                    No hay predios con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.pipelineShell}>
            <div ref={headerScrollRef} className={styles.boardHeaderViewport}>
              <div className={styles.board}>
                {COLUMNAS.map((col) => (
                  <div key={col.key} className={styles.column}>
                    <PipelineColumnHeader
                      label={col.label}
                      accent={col.accent}
                      hint={col.hint}
                      count={filteredPipelinePredios.filter((predio) => predio.estado === col.key).length}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div ref={bodyScrollRef} className={styles.boardViewport} onScroll={syncHeaderScroll}>
              <div className={styles.board}>
                {COLUMNAS.map((col) => (
                  <PredioColumn
                    key={col.key}
                    colKey={col.key}
                    predios={filteredPipelinePredios.filter((predio) => predio.estado === col.key)}
                  />
                ))}
              </div>
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
