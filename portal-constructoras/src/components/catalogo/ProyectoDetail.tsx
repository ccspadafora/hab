import type { ProyectoCatalogo } from '@/types/proyecto'
import { formatCOP, formatDate, slugifyLocalidad } from '@/lib/utils'
import { ScoreMeter } from '@/components/ui/ScoreMeter'

/**
 * CRITICAL: NEVER render dirección, propietario, teléfono, or real property photos.
 */
interface ProyectoDetailProps {
  proyecto: ProyectoCatalogo
  onInterest?: () => void
  interested?: boolean
}

export function ProyectoDetail({ proyecto, onInterest, interested }: ProyectoDetailProps) {
  const slug = proyecto.localidad_slug || slugifyLocalidad(proyecto.localidad || proyecto.barrio)
  const m = proyecto.metricas_prefact

  return (
    <article className="proyecto-detail">
      <div className={`proyecto-detail__hero proyecto-card__image--zone-${slug.slice(0, 1) || 'a'}`}>
        <div className="proyecto-card__zone-placeholder" aria-hidden="true">
          <span className="proyecto-card__zone-name">{proyecto.localidad || proyecto.barrio}</span>
        </div>
        <span className="proyecto-card__image-label">Imagen referencial de la zona</span>
      </div>

      <div className="proyecto-detail__header">
        <div>
          <p className="section-label">Proyecto anonimizado</p>
          <h1>
            {proyecto.barrio}, {proyecto.localidad}
          </h1>
          <p className="proyecto-detail__meta">
            {proyecto.tipo_label} · Estrato {proyecto.estrato}
            {proyecto.publicado_en ? ` · Publicado ${formatDate(proyecto.publicado_en)}` : ''}
          </p>
        </div>
        <ScoreMeter score={proyecto.score_prefactibilidad} size="lg" />
      </div>

      <dl className="proyecto-detail__grid">
        <div>
          <dt>Área del lote</dt>
          <dd>{proyecto.area_lote} m²</dd>
        </div>
        <div>
          <dt>Unidades proyectadas</dt>
          <dd>{m?.unidades_proyectadas != null ? `~${m.unidades_proyectadas}` : '—'}</dd>
        </div>
        <div>
          <dt>Margen bruto est.</dt>
          <dd>{m?.margen_bruto_est != null ? `${m.margen_bruto_est}%` : '—'}</dd>
        </div>
        <div>
          <dt>ROI estimado</dt>
          <dd>{m?.roi_est != null ? `${m.roi_est}%` : '—'}</dd>
        </div>
        <div>
          <dt>Ingresos brutos est.</dt>
          <dd>{formatCOP(m?.ingresos_brutos_est)}</dd>
        </div>
        {proyecto.anio_construccion != null && (
          <div>
            <dt>Año construcción</dt>
            <dd>{proyecto.anio_construccion}</dd>
          </div>
        )}
      </dl>

      {proyecto.tags_prefact && proyecto.tags_prefact.length > 0 && (
        <ul className="proyecto-detail__tags">
          {proyecto.tags_prefact.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      <p className="proyecto-card__disclaimer">
        * Valores orientativos. La dirección exacta y datos del propietario se revelan solo
        durante la negociación mediada por HAB.
      </p>

      {onInterest && (
        <div className="proyecto-detail__cta">
          <button
            type="button"
            className="btn-primary"
            onClick={onInterest}
            disabled={proyecto.en_negociacion_activa || interested}
          >
            {proyecto.en_negociacion_activa
              ? 'No disponible'
              : interested
                ? 'Interés registrado'
                : 'Me interesa'}
          </button>
        </div>
      )}
    </article>
  )
}
