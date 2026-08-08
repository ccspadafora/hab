export type EstadoPublicacion =
  | 'borrador'
  | 'en_revision'
  | 'activa'
  | 'en_negociacion'
  | 'cerrada_exitosa'
  | 'cerrada_sin_exito'
  | 'rechazada'

export type TipoInmueble = 'casa' | 'lote' | 'apartamento' | 'local' | 'bodega'

export type EstadoInmueble = 'muy_bueno' | 'bueno' | 'regular' | 'demolicion'

export interface MetricasPrefact {
  ingresos_brutos_est: number
  costo_total_est: number
  utilidad_bruta_est: number
  margen_bruto_est: number
  roi_est: number
  valor_max_predio_est: number
  unidades_proyectadas: number | null
}

export interface Publicacion {
  id: number
  titulo: string
  tipo: TipoInmueble
  barrio: string
  localidad: string
  area_lote: number
  area_construida: number | null
  estrato: number
  anio_construccion: number | null
  fotos: string[]
  estado: EstadoPublicacion
  estado_label?: string
  score_prefactibilidad: number | null
  tags_prefact: string[]
  metricas_prefact: MetricasPrefact | null
  identidad_verificada: boolean
  propiedad_verificada: boolean
  esta_verificada?: boolean
  puede_activarse?: boolean
  publicado_en: string | null
  updated_at: string
}

export interface DashboardPropietario {
  propietario_id: number
  total_publicaciones: number
  activas: number
  en_revision: number
  borradores: number
  score_promedio: number | null
}

export interface PublicacionCreatePayload {
  titulo?: string
  tipo: TipoInmueble
  direccion?: string
  barrio?: string
  localidad?: string
  ciudad?: string
  latitud?: number | null
  longitud?: number | null
  area_lote: number
  area_construida?: number | null
  pisos?: number | null
  habitaciones?: number | null
  banos?: number | null
  estrato: number
  anio_construccion?: number | null
  estado_inmueble?: EstadoInmueble | ''
  descripcion?: string
  precio_esperado?: number | null
  acepta_aporte?: boolean
  fotos?: string[]
  documentos?: string[]
}

export type PublicacionUpdatePayload = Partial<PublicacionCreatePayload>
