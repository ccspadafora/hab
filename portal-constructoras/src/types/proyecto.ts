export interface MetricasPrefact {
  ingresos_brutos_est: number | null
  costo_total_est?: number | null
  utilidad_bruta_est?: number | null
  margen_bruto_est: number | null
  roi_est: number | null
  valor_max_predio_est?: number | null
  unidades_proyectadas: number | null
}

/** Anonymized catalog view for constructoras — NO dirección, propietario, or real photos */
export interface ProyectoCatalogo {
  id: number
  tipo: string
  tipo_label: string
  barrio: string
  localidad: string
  localidad_slug?: string
  area_lote: number
  estrato: number
  anio_construccion?: number | null
  score_prefactibilidad: number
  tags_prefact?: string[]
  metricas_prefact: MetricasPrefact
  visible_constructoras?: boolean
  en_negociacion_activa: boolean
  publicado_en: string | null
}

export interface ProyectoFilters {
  barrio?: string
  localidad?: string
  estrato?: string
  score_min?: string
  tipo?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
