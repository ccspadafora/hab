import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLeads, useUpdateLeadEstado } from '../../api/hooks'
import { TemperaturaBadge, LeadEstadoBadge } from '../../components/ui/Badges'
import type { Lead, EstadoLead } from '../../types/models'
import styles from './LeadsKanbanPage.module.css'

const COLUMNAS: { key: EstadoLead; label: string; color: string }[] = [
  { key: 'nuevo',             label: 'Nuevo',             color: '#8FA882' },
  { key: 'contactado',        label: 'Contactado',        color: '#6090C0' },
  { key: 'interesado',        label: 'Interesado',        color: '#C9B84C' },
  { key: 'calificado',        label: 'Calificado',        color: '#3D6B40' },
  { key: 'cita_agendada',     label: 'Cita agendada',     color: '#2B4D2E' },
  { key: 'propuesta_enviada', label: 'Propuesta enviada', color: '#8060A0' },
  { key: 'en_negociacion',    label: 'En negociación',    color: '#A06000' },
  { key: 'promesa_firmada',   label: 'Promesa firmada',   color: '#007A50' },
]

// ── Tarjeta sortable ──────────────────────────────────────
function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sorting } =
    useSortable({ id: `lead-${lead.id}` })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: sorting ? 0.3 : 1 }}
      className={`${styles.leadCard} ${isDragging ? styles.dragging : ''}`}
      {...attributes} {...listeners}
    >
      <div className={styles.leadTop}>
        <p className={styles.leadNombre}>{lead.nombre}</p>
        <TemperaturaBadge temp={lead.temperatura} />
      </div>
      <p className={styles.leadTel}>📞 {lead.telefono}</p>
      {lead.email && <p className={styles.leadEmail}>✉️ {lead.email}</p>}
      <Link to={`/leads/${lead.id}`} className={styles.verLink}
        onClick={e => e.stopPropagation()}>Ver detalle →</Link>
    </div>
  )
}

// ── Columna droppable ─────────────────────────────────────
function Columna({ colKey, label, color, leads }: {
  colKey: EstadoLead; label: string; color: string; leads: Lead[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${colKey}` })

  return (
    <div className={`${styles.column} ${isOver ? styles.colOver : ''}`}>
      <div className={styles.colHeader}>
        <span className={styles.colDot} style={{ background: color }} />
        <span className={styles.colLabel}>{label}</span>
        <span className={styles.colCount}>{leads.length}</span>
      </div>
      {/* SortableContext con id explícito = colKey */}
      <SortableContext
        id={colKey}
        items={leads.map(l => `lead-${l.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className={`${styles.cards} ${isOver ? styles.cardsOver : ''}`}>
          {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
          {!leads.length && <div className={styles.emptyCol}>Arrastra aquí</div>}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Vista de tabla ────────────────────────────────────────
function TablaLeads({ leads, onEstado }: { leads: Lead[]; onEstado: (id: number, e: EstadoLead) => void }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th><th>Teléfono</th><th>Estado</th>
            <th>Temperatura</th><th>Fuente</th><th>Actualizado</th><th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id}>
              <td className={styles.tdNombre}>{l.nombre}</td>
              <td>{l.telefono}</td>
              <td><LeadEstadoBadge estado={l.estado} /></td>
              <td><TemperaturaBadge temp={l.temperatura} /></td>
              <td className={styles.tdMuted}>{l.fuente_origen || '—'}</td>
              <td className={styles.tdMuted}>{new Date(l.updated_at).toLocaleDateString('es-CO')}</td>
              <td>
                <select className={styles.estadoSel} value={l.estado}
                  onChange={e => onEstado(l.id, e.target.value as EstadoLead)}>
                  {COLUMNAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <Link to={`/leads/${l.id}`} className="btn btn-secondary"
                  style={{ fontSize: 10, padding: '4px 10px', marginLeft: 6 }}>Ver</Link>
              </td>
            </tr>
          ))}
          {!leads.length && (
            <tr><td colSpan={7} className={styles.tableEmpty}>Sin leads con estos filtros</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function LeadsKanbanPage() {
  const [search,    setSearch]    = useState('')
  const [estado,    setEstado]    = useState('')
  const [temp,      setTemp]      = useState('')
  const [view,      setView]      = useState<'kanban' | 'tabla'>('kanban')
  const [activeId,  setActiveId]  = useState<string | null>(null)

  const { data, isLoading } = useLeads({
    search:      search  || undefined,
    estado:      estado  || undefined,
    temperatura: temp    || undefined,
  })
  const updateEstado = useUpdateLeadEstado()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const leads: Lead[] = data?.results ?? []
  const activeLead = leads.find(l => `lead-${l.id}` === activeId) ?? null

  const byEstado = (e: EstadoLead) => leads.filter(l => l.estado === e)

  // Identifica la columna destino buscando en qué SortableContext está el over.id
  const getTargetCol = (overId: string): EstadoLead | undefined => {
    // over es una columna vacía: "col-{key}"
    if (overId.startsWith('col-')) return overId.replace('col-', '') as EstadoLead
    // over es una tarjeta: "lead-{id}" → buscar su estado actual
    if (overId.startsWith('lead-')) {
      const id = Number(overId.replace('lead-', ''))
      return leads.find(l => l.id === id)?.estado as EstadoLead | undefined
    }
    return undefined
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const leadId   = Number(String(active.id).replace('lead-', ''))
    const target   = getTargetCol(String(over.id))
    const current  = leads.find(l => l.id === leadId)?.estado
    if (!target || target === current) return
    updateEstado.mutate({ id: leadId, estado: target })
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />🤝 CRM</div>
          <h1 className="h-med">Leads — Pipeline</h1>
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.vBtn} ${view === 'kanban' ? styles.vActive : ''}`}
            onClick={() => setView('kanban')}>⬛ Kanban</button>
          <button className={`${styles.vBtn} ${view === 'tabla' ? styles.vActive : ''}`}
            onClick={() => setView('tabla')}>📋 Tabla</button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <input className={`input ${styles.search}`} placeholder="Buscar nombre, teléfono…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className={`input ${styles.sel}`} value={estado} onChange={e => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {COLUMNAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select className={`input ${styles.sel}`} value={temp} onChange={e => setTemp(e.target.value)}>
          <option value="">Temperatura</option>
          <option value="frio">🧊 Frío</option>
          <option value="tibio">🌤️ Tibio</option>
          <option value="caliente">🔥 Caliente</option>
        </select>
        {(search || estado || temp) && (
          <button className="btn btn-ghost" style={{ fontSize: 11 }}
            onClick={() => { setSearch(''); setEstado(''); setTemp('') }}>✕ Limpiar</button>
        )}
        <span className={styles.total}>{data?.count ?? 0} leads</span>
      </div>

      {view === 'kanban' && (
        <p className={styles.hint}>💡 Arrastra las tarjetas entre columnas para cambiar el estado</p>
      )}

      {isLoading ? <p className={styles.loading}>Cargando leads…</p> : (
        view === 'tabla' ? (
          <TablaLeads leads={leads}
            onEstado={(id, e) => updateEstado.mutate({ id, estado: e })} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={styles.board}>
              {COLUMNAS.map(({ key, label, color }) => (
                <Columna key={key} colKey={key} label={label} color={color} leads={byEstado(key)} />
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        )
      )}
    </div>
  )
}
