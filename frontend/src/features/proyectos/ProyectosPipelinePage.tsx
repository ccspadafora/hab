import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from '../../components/ui/Modal'
import ProyectoForm from './ProyectoForm'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProyectos } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import type { Proyecto, FaseProyecto } from '../../types/models'
import styles from './ProyectosPipelinePage.module.css'

const FASES: { key: FaseProyecto; label: string; icon: string; color: string }[] = [
  { key: 'estructuracion', label: 'Estructuración',  icon: '📐', color: '#2B4D2E' },
  { key: 'presentado',     label: 'Presentado',      icon: '📋', color: '#3D6B40' },
  { key: 'en_negociacion', label: 'En negociación',  icon: '🤝', color: '#C9B84C' },
  { key: 'promesa',        label: 'Promesa',          icon: '📝', color: '#8060A0' },
  { key: 'en_obra',        label: 'En obra',          icon: '🏗️', color: '#A06000' },
  { key: 'entregado',      label: 'Entregado',        icon: '✅', color: '#007A50' },
]
const fmt = (n: string | null) => n ? `$${(Number(n) / 1_000_000).toFixed(0)}M` : '—'

// ── Tarjeta sortable ──────────────────────────────────────
function ProyectoCard({ p, isDragging = false }: { p: Proyecto; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sorting } =
    useSortable({ id: `proy-${p.id}` })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: sorting ? 0.3 : 1 }}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      {...attributes} {...listeners}
    >
      <span className={styles.codigo}>{p.codigo}</span>
      <p className={styles.nombre}>{p.nombre}</p>
      <div className={styles.cardFoot}>
        <span className={styles.gerente}>👤 {p.gerente_nombre}</span>
        <span className={styles.valor}>{fmt(p.valor_total_estimado)}</span>
      </div>
      <Link to={`/proyectos/${p.id}`} className={styles.verLink}
        onClick={e => e.stopPropagation()}>Ver detalle →</Link>
    </div>
  )
}

// ── Columna droppable ─────────────────────────────────────
function Columna({ fase, label, icon, color, proyectos }: {
  fase: FaseProyecto; label: string; icon: string; color: string; proyectos: Proyecto[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${fase}` })

  return (
    <div className={`${styles.col} ${isOver ? styles.colOver : ''}`}>
      <div className={styles.colHead} style={{ borderTopColor: color }}>
        <span>{icon}</span>
        <div>
          <p className={styles.colLabel}>{label}</p>
          <p className={styles.colCount}>{proyectos.length} proyectos</p>
        </div>
      </div>
      <SortableContext
        id={fase}
        items={proyectos.map(p => `proy-${p.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className={`${styles.cards} ${isOver ? styles.cardsOver : ''}`}>
          {proyectos.map(p => <ProyectoCard key={p.id} p={p} />)}
          {!proyectos.length && <div className={styles.emptyCol}>Arrastra aquí</div>}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Vista tabla ───────────────────────────────────────────
function TablaProyectos({ proyectos, onFase }: {
  proyectos: Proyecto[]
  onFase: (id: number, f: FaseProyecto) => void
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Fase</th><th>Gerente</th>
              <th>Valor estimado</th><th>Fee estructuración</th><th></th></tr>
        </thead>
        <tbody>
          {proyectos.map(p => (
            <tr key={p.id}>
              <td>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 11,
                  color: 'var(--amarillo)', background: 'var(--verde)', padding: '2px 8px', borderRadius: 100 }}>
                  {p.codigo}
                </span>
              </td>
              <td style={{ fontWeight: 700 }}>{p.nombre}</td>
              <td>
                <select className={styles.faseSel} value={p.fase}
                  onChange={e => onFase(p.id, e.target.value as FaseProyecto)}>
                  {FASES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </td>
              <td style={{ color: '#888', fontSize: 12 }}>{p.gerente_nombre}</td>
              <td style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--verde)' }}>
                {fmt(p.valor_total_estimado)}
              </td>
              <td style={{ color: '#888' }}>{fmt(p.fee_estructuracion)}</td>
              <td>
                <Link to={`/proyectos/${p.id}`} className="btn btn-secondary"
                  style={{ fontSize: 10, padding: '4px 10px' }}>Ver</Link>
              </td>
            </tr>
          ))}
          {!proyectos.length && (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#bbb' }}>
              Sin proyectos con estos filtros
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function ProyectosPipelinePage() {
  const [search,    setSearch]    = useState('')
  const [fase,      setFase]      = useState('')
  const [view,      setView]      = useState<'kanban' | 'tabla'>('kanban')
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [showForm,  setShowForm]  = useState(false)
  const navigate = useNavigate()

  const { data, isLoading } = useProyectos({ search: search || undefined, fase: fase || undefined })
  const qc = useQueryClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const all: Proyecto[] = data?.results ?? []
  const activeP = all.find(p => `proy-${p.id}` === activeId) ?? null

  const byFase = (f: FaseProyecto) => all.filter(p => p.fase === f)

  const getTargetFase = (overId: string): FaseProyecto | undefined => {
    if (overId.startsWith('col-')) return overId.replace('col-', '') as FaseProyecto
    if (overId.startsWith('proy-')) {
      const id = Number(overId.replace('proy-', ''))
      return all.find(p => p.id === id)?.fase as FaseProyecto | undefined
    }
    return undefined
  }

  const cambiarFase = async (proyId: number, nuevaFase: FaseProyecto) => {
    await apiClient.patch(`/proyectos/${proyId}/`, { fase: nuevaFase })
    qc.invalidateQueries({ queryKey: ['proyectos'] })
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd   = async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const proyId = Number(String(active.id).replace('proy-', ''))
    const target  = getTargetFase(String(over.id))
    const current = all.find(p => p.id === proyId)?.fase
    if (!target || target === current) return
    await cambiarFase(proyId, target)
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🏗️ Proyectos</div>
          <h1 className="h-med">Pipeline de Proyectos</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo proyecto</button>
        <div className={styles.viewToggle}>
          <button className={`${styles.vBtn} ${view === 'kanban' ? styles.vActive : ''}`}
            onClick={() => setView('kanban')}>⬛ Kanban</button>
          <button className={`${styles.vBtn} ${view === 'tabla' ? styles.vActive : ''}`}
            onClick={() => setView('tabla')}>📋 Tabla</button>
        </div>
        </div>
      </div>
      {showForm && (
        <Modal title="🏗️ Nuevo Proyecto" onClose={() => setShowForm(false)} wide>
          <ProyectoForm onClose={() => setShowForm(false)}
            onSaved={p => navigate(`/proyectos/${p.id}`)} />
        </Modal>
      )}

      {/* Filtros */}
      <div className={styles.filters}>
        <input className={`input ${styles.search}`} placeholder="Buscar nombre, código…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className={`input ${styles.sel}`} value={fase} onChange={e => setFase(e.target.value)}>
          <option value="">Todas las fases</option>
          {FASES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        {(search || fase) && (
          <button className="btn btn-ghost" style={{ fontSize: 11 }}
            onClick={() => { setSearch(''); setFase('') }}>✕ Limpiar</button>
        )}
        <span className={styles.total}>{data?.count ?? 0} proyectos</span>
      </div>

      {view === 'kanban' && (
        <p className={styles.hint}>💡 Arrastra proyectos entre columnas para cambiar la fase</p>
      )}

      {isLoading ? <p className={styles.loading}>Cargando…</p> : (
        view === 'tabla' ? (
          <TablaProyectos proyectos={all} onFase={cambiarFase} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={styles.board}>
              {FASES.map(({ key, label, icon, color }) => (
                <Columna key={key} fase={key} label={label} icon={icon} color={color}
                  proyectos={byFase(key)} />
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeP ? <ProyectoCard p={activeP} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        )
      )}
    </div>
  )
}
