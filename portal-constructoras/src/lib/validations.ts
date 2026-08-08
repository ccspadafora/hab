import { z } from 'zod'

export const solicitudCertificacionSchema = z.object({
  nombre_empresa: z.string().min(2, 'Ingresa el nombre de la empresa').max(200),
  nit: z.string().min(5, 'NIT inválido').max(20),
  contacto_nombre: z.string().min(2, 'Ingresa el nombre de contacto').max(200),
  contacto_email: z.string().email('Correo inválido'),
  contacto_cargo: z.string().min(2, 'Ingresa el cargo').max(100),
  contacto_telefono: z
    .string()
    .regex(/^\+?\d{7,15}$/, 'Teléfono en formato internacional (+57…)'),
  descripcion_empresa: z.string().min(20, 'Describe la empresa (mín. 20 caracteres)'),
  anios_experiencia: z.coerce.number().int().min(0, 'Debe ser ≥ 0').max(100),
  proyectos_ejecutados: z.coerce.number().int().min(0, 'Debe ser ≥ 0'),
  zonas_interes: z.string().optional(),
  tipos_proyecto: z.string().optional(),
  inversion_disponible: z
    .union([z.literal(''), z.coerce.number().positive('Debe ser un monto positivo')])
    .optional(),
})

export type SolicitudCertificacionForm = z.infer<typeof solicitudCertificacionSchema>

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export type LoginForm = z.infer<typeof loginSchema>
