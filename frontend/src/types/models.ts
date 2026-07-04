// ── Auth ──────────────────────────────────────────────────
export type Role = 'admin' | 'analista' | 'asesor' | 'gerente' | 'constructora'

export interface User {
  id:         number
  username:   string
  email:      string
  first_name: string
  last_name:  string
  role:       Role
  phone:      string
  is_active:  boolean
  created_at: string
}

// ── Scraping ──────────────────────────────────────────────
export type EstadoPredio =
  | 'para_estudio'
  | 'contacto_inicial'
  | 'prefactibilidad'
  | 'viable_negociacion'
  | 'cierres_potenciales'
  | 'estruct_propietarios'
  | 'descartado'

export interface MetricasPrefact {
  area_edificable_est:  number
  ingresos_brutos_est:  number
  costo_total_est:      number
  utilidad_bruta_est:   number
  margen_bruto_est:     number
  roi_est:              number
  valor_max_predio_est: number
}

export interface Predio {
  id:                    number
  fuente:                number
  url_origen:            string
  codigo_externo?:       string
  barrio:                string
  localidad:             string
  ciudad:                string
  direccion:             string
  tipo:                  string
  area_lote:             number | null
  area_construida:       number | null
  estrato:               number | null
  precio_publicado:      number | null
  precio_m2:             number | null
  estado:                EstadoPredio
  score_prefactibilidad: number | null
  tags:                  string[]
  tags_manuales:         string[]
  metricas_prefact:      MetricasPrefact
  detalle_scores?:       Record<string, number>
  imagenes:              string[]
  primera_deteccion:     string
  ultima_actualizacion:  string
}

// ── Propietarios ──────────────────────────────────────────
export type EstadoContacto =
  | 'sin_contactar' | 'contactado' | 'interesado'
  | 'calificado' | 'en_negociacion' | 'firmado' | 'descartado'

export interface Propietario {
  id:                 number
  nombre:             string
  tipo:               'persona_natural' | 'persona_juridica'
  cedula_nit:         string
  telefono_principal: string
  telefono_secundario?: string | null
  email:              string
  whatsapp_phone:     string
  asesor_asignado:    number | null
  estado_contacto:    EstadoContacto
  temperatura:        'frio' | 'tibio' | 'caliente'
  ciudad?:            string | null
  direccion_residencia?: string | null
  fuente_origen?:     string | null
  primer_contacto?:   string | null
  ultimo_contacto?:   string | null
  etiquetas:          string[]
  created_at:         string
}

// ── Viabilidad ────────────────────────────────────────────
export interface AnalisisViabilidad {
  id:                   number
  predio:               number
  zona_pot:             string
  indice_construccion:  number | null
  indice_ocupacion?:    number | null
  altura_max_pisos?:    number | null
  uso_suelo?:           string | null
  densidad_max_uds?:    number | null
  area_edificable:      number | null
  unidades_proyectadas: number | null
  precio_m2_nuevo?:     number | null
  valor_bruto_proyecto: number | null
  costo_construccion?:  number | null
  valor_max_predio?:    number | null
  utilidad_estimada?:   number | null
  margen_estimado:      number | null
  es_viable:            boolean | null
  score_viabilidad:     number | null
  justificacion_ia:     string
  solicitado_en:        string
  completado_en:        string | null
}

// ── Leads ─────────────────────────────────────────────────
export type EstadoLead =
  | 'nuevo' | 'contactado' | 'interesado' | 'calificado'
  | 'cita_agendada' | 'propuesta_enviada' | 'en_negociacion'
  | 'promesa_firmada' | 'descartado'

export interface Lead {
  id:          number
  nombre:      string
  telefono:    string
  email:       string
  cedula?:     string | null
  predio:      number | null
  propietario: number | null
  asesor:      number | null
  estado:      EstadoLead
  temperatura: 'frio' | 'tibio' | 'caliente'
  fuente_origen?: string | null
  ultimo_contacto?: string | null
  proxima_accion?: string | null
  nota_proxima_accion?: string | null
  notas?:       string | null
  created_at:  string
  updated_at:  string
}

// ── Bot ───────────────────────────────────────────────────
export interface Conversacion {
  id:               number
  propietario:      number | null
  propietario_nombre?: string   // retornado por ConversacionListSerializer
  wa_contact_phone: string
  estado:           'activa' | 'pausada' | 'cerrada' | 'escalada'
  ia_activa:        boolean
  etapa_bot:        string
  asignado_a:       number | null
  iniciado_en:      string
  ultimo_mensaje:   string | null
  ultimo_mensaje_texto?: string
  mensajes?:        Mensaje[]
}

export interface Mensaje {
  id:             number
  wa_message_id:  string
  direccion:      'entrante' | 'saliente'
  tipo:           string
  contenido:      string
  generado_por_ia: boolean
  enviado_en:     string
}

// ── Proyectos ─────────────────────────────────────────────
export type FaseProyecto =
  | 'estructuracion' | 'presentado' | 'en_negociacion'
  | 'promesa' | 'en_obra' | 'entregado' | 'descartado'

export interface Proyecto {
  id:                   number
  nombre:               string
  codigo:               string
  slug:                 string
  predio:               number
  analisis:             number
  gerente:              number
  gerente_nombre:       string
  fase:                 FaseProyecto
  valor_total_estimado: string | null
  fee_estructuracion:   string | null
  created_at:           string
  updated_at:           string
}

// ── Paginación ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count:    number
  next:     string | null
  previous: string | null
  results:  T[]
}
