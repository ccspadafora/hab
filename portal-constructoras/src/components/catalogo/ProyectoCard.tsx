import Link from 'next/link'
import type { ProyectoCatalogo } from '@/types/proyecto'
import { formatCOP, slugifyLocalidad } from '@/lib/utils'
import { ScoreMeter } from '@/components/ui/ScoreMeter'

/**
 * CRITICAL: this component NEVER receives or renders:
 *   - dirección exacta
 *   - nombre del propietario
 *   - teléfono del propietario
 *   - fotos reales del inmueble
 */
interface ProyectoCardProps {
  proyecto: ProyectoCatalogo
  onInterest?: (id: number) => void
  interested?: boolean
}

export function ProyectoCard({ proyecto, onInterest, interested }: ProyectoCardProps) {
  const slug = proyecto.localidad_slug || slugifyLocalidad(proyecto.localidad || proyecto.barrio)
  const m = proyecto.metricas_prefact

  return (
    <article className="proyecto-card" aria-label={`Proyecto en ${proyecto.barrio}`}>
      <div className={`proyecto-card__image proyecto-card__image--zone-${slug.slice(0, 1) || 'a'}`}>
        <div className="proyecto-card__zone-placeholder" aria-hidden="true">
          <span className="proyecto-card__zone-name">{proyecto.localidad || proyecto.barrio}</span>
        </div>
        <span className="proyecto-card__image-label">Imagen referencial de la zona</span>
        <div className="proyecto-card__score">
          <ScoreMeter score={proyecto.score_prefactibilidad} size="sm" />
        </div>
      </div>

      <div className="proyecto-card__body">
        <div className="proyecto-card__location">
          {proyecto.barrio}, {proyecto.localidad}
        </div>
        <div className="proyecto-card__type">{proyecto.tipo_label}</div>

        <dl className="proyecto-card__metrics">
          <div>
            <dt>Área lote</dt>
            <dd>{proyecto.area_lote} m²</dd>
          </div>
          <div>
            <dt>Unidades est.</dt>
            <dd>~{m?.unidades_proyectadas ?? '—'}</dd>
          </div>
          <div>
            <dt>Margen bruto est.</dt>
            <dd>{m?.margen_bruto_est != null ? `${m.margen_bruto_est}%` : '—'}</dd>
          </div>
          <div>
            <dt>ROI est.</dt>
            <dd>{m?.roi_est != null ? `${m.roi_est}%` : '—'}</dd>
          </div>
          {m?.ingresos_brutos_est != null && (
            <div>
              <dt>Ingresos est.</dt>
              <dd>{formatCOP(m.ingresos_brutos_est)}</dd>
            </div>
          )}
        </dl>

        <p className="proyecto-card__disclaimer">
          * Valores orientativos. Estructuración detallada disponible en la negociación.
        </p>
      </div>

      <div className="proyecto-card__actions">
        <Link href={`/catalogo/${proyecto.id}`} className="btn-secondary">
          Ver detalle
        </Link>
        {onInterest && (
          <button
            type="button"
            onClick={() => onInterest(proyecto.id)}
            className="btn-primary"
            disabled={proyecto.en_negociacion_activa || interested}
          >
            {proyecto.en_negociacion_activa
              ? 'No disponible'
              : interested
                ? 'Interés registrado'
                : 'Me interesa'}
          </button>
        )}
      </div>
    </article>
  )
}
