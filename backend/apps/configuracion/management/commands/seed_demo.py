"""
Management command: seed_demo
Popula la base de datos con datos demo realistas de Bogotá para HAB Platform.
Uso: docker compose exec backend python manage.py seed_demo
"""
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


# ── Datos de referencia ───────────────────────────────────

BARRIOS = [
    ('Chapinero Alto', 'Chapinero'),
    ('Usaquén',        'Usaquén'),
    ('Rosales',        'Chapinero'),
    ('Cedritos',       'Usaquén'),
    ('Chicó',          'Usaquén'),
    ('Quinta Camacho', 'Chapinero'),
    ('Niza',           'Suba'),
    ('Santa Bárbara',  'Usaquén'),
    ('Modelia',        'Fontibón'),
    ('Nicolás de Federmán', 'Teusaquillo'),
    ('Pardo Rubio',    'Chapinero'),
    ('La Carolina',    'Usaquén'),
    ('El Lago',        'Chapinero'),
    ('Nogal',          'Chapinero'),
    ('San Patricio',   'Usaquén'),
]

NOMBRES_PROPIETARIOS = [
    ('Carlos',    'Rodríguez Vargas',   '+573001234567'),
    ('María',     'González Pérez',     '+573112345678'),
    ('Jorge',     'Martínez Sánchez',   '+573201234567'),
    ('Patricia',  'López Hernández',    '+573001112233'),
    ('Andrés',    'García Torres',      '+573112223344'),
    ('Claudia',   'Ramírez Gómez',      '+573201112233'),
    ('Fernando',  'Castro Morales',     '+573001223344'),
    ('Lucía',     'Díaz Reyes',         '+573112334455'),
    ('Ricardo',   'Herrera Ospina',     '+573201223344'),
    ('Catalina',  'Moreno Vargas',      '+573001334455'),
    ('Gustavo',   'Pardo Jiménez',      '+573112445566'),
    ('Adriana',   'Vega Salamanca',     '+573201334455'),
]

DESCRIPCIONES_PREDIO = [
    'Casa esquinera en buen estado, garage doble, jardín amplio. Oportunidad de desarrollo.',
    'Lote plano en zona residencial consolidada, excelente vía de acceso.',
    'Casa de dos pisos, antigüedad superior a 40 años, apta para demolición y construcción.',
    'Lote irregular con escrituras al día, urbanismo adelantado.',
    'Casa en esquina con frente doble, cerca a vías principales y parques.',
    'Predio con dos casas independientes, excelente para proyecto multifamiliar.',
    'Lote de terreno en zona de densificación POT, índice de construcción 3.0.',
    'Casa con local comercial en primer piso, cerca a centros educativos.',
    'Inmueble en sector de renovación urbana, área construida supera área vendible.',
    'Casa familiar en barrio consolidado, propietario con disposición de negociar.',
]


class Command(BaseCommand):
    help = 'Pobla la base de datos con datos demo para HAB Platform'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Iniciando seed de datos demo...\n')

        self._crear_usuarios()
        self._crear_zonas_pot()
        fuente = self._crear_fuente()
        predios = self._crear_predios(fuente)
        propietarios = self._crear_propietarios()
        self._vincular_propietarios_predios(propietarios, predios)
        leads = self._crear_leads(propietarios)
        self._crear_conversaciones(propietarios)
        self._crear_proyecto_demo(predios)

        self.stdout.write(self.style.SUCCESS('\n✅ Seed completado exitosamente.\n'))

    # ── Usuarios adicionales ──────────────────────────────
    def _crear_usuarios(self):
        self.stdout.write('👤 Creando usuarios...')
        usuarios = [
            dict(username='analista1',  first_name='Laura',    last_name='Martínez',  role='analista',  email='laura@hab.com.co'),
            dict(username='asesor1',    first_name='Sebastián', last_name='Torres',   role='asesor',    email='sebastian@hab.com.co'),
            dict(username='gerente1',   first_name='Marcela',  last_name='Sánchez',   role='gerente',   email='marcela@hab.com.co'),
        ]
        for u in usuarios:
            if not User.objects.filter(username=u['username']).exists():
                user = User(**u)
                user.set_password('hab2024demo')
                user.save()
                self.stdout.write(f'  ✓ {u["first_name"]} ({u["role"]})')

    # ── Zonas POT ─────────────────────────────────────────
    def _crear_zonas_pot(self):
        from apps.scraping.models import ZonaPOT
        self.stdout.write('🏛️  Creando zonas POT...')
        zonas = [
            dict(nombre_zona='Zona Residencial Chapinero', barrio='Chapinero', localidad='Chapinero',
                 uso_suelo_principal='Residencial', indice_construccion=Decimal('3.5'),
                 indice_ocupacion=Decimal('0.6'), altura_max_pisos=12, es_zona_densificacion=True),
            dict(nombre_zona='Zona Residencial Usaquén', barrio='Usaquén', localidad='Usaquén',
                 uso_suelo_principal='Residencial', indice_construccion=Decimal('2.8'),
                 indice_ocupacion=Decimal('0.55'), altura_max_pisos=8, es_zona_densificacion=True),
            dict(nombre_zona='Zona Mixta Niza', barrio='Niza', localidad='Suba',
                 uso_suelo_principal='Residencial/Comercial', indice_construccion=Decimal('2.0'),
                 indice_ocupacion=Decimal('0.6'), altura_max_pisos=6, es_zona_densificacion=False),
            dict(nombre_zona='Zona Cedritos Residencial', barrio='Cedritos', localidad='Usaquén',
                 uso_suelo_principal='Residencial', indice_construccion=Decimal('3.0'),
                 indice_ocupacion=Decimal('0.65'), altura_max_pisos=10, es_zona_densificacion=True),
            dict(nombre_zona='Zona Rosales Alto Estándar', barrio='Rosales', localidad='Chapinero',
                 uso_suelo_principal='Residencial', indice_construccion=Decimal('4.0'),
                 indice_ocupacion=Decimal('0.5'), altura_max_pisos=15, es_zona_densificacion=True),
        ]
        for z in zonas:
            ZonaPOT.objects.get_or_create(nombre_zona=z['nombre_zona'], defaults=z)
        self.stdout.write(f'  ✓ {len(zonas)} zonas POT')

    # ── Fuente de scraping ────────────────────────────────
    def _crear_fuente(self):
        from apps.scraping.models import FuenteScraping
        self.stdout.write('🔍 Creando fuente de scraping...')
        fuente, _ = FuenteScraping.objects.get_or_create(
            nombre='Metrocuadrado Demo',
            defaults=dict(
                url_base='https://www.metrocuadrado.com',
                activo=True,
                configuracion={'tipo': 'demo', 'paginas': 5},
                ultima_ejecucion=timezone.now() - timedelta(hours=2),
            )
        )
        self.stdout.write(f'  ✓ {fuente.nombre}')
        return fuente

    # ── Predios ───────────────────────────────────────────
    def _crear_predios(self, fuente):
        from apps.scraping.models import Predio, ESTADO_PREDIO_CHOICES

        self.stdout.write('🏘️  Creando predios...')

        predios_data = [
            dict(barrio='Chapinero Alto', localidad='Chapinero', tipo='casa',
                 area_lote=320, area_construida=280, estrato=5, pisos=2, anio_construccion=1978,
                 precio_publicado=1_850_000_000, estado='viable',
                 score_prefactibilidad=Decimal('82.5'),
                 tags=['alta_prioridad','lote_grande','inmueble_antiguo','precio_favorable','zona_densificacion','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[0]),

            dict(barrio='Usaquén', localidad='Usaquén', tipo='lote',
                 area_lote=480, area_construida=0, estrato=6, pisos=0, anio_construccion=None,
                 precio_publicado=3_200_000_000, estado='en_analisis',
                 score_prefactibilidad=Decimal('76.3'),
                 tags=['alta_prioridad','lote_grande','consolidacion_posible','zona_densificacion','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[1]),

            dict(barrio='Rosales', localidad='Chapinero', tipo='casa',
                 area_lote=250, area_construida=320, estrato=6, pisos=3, anio_construccion=1985,
                 precio_publicado=2_400_000_000, estado='viable',
                 score_prefactibilidad=Decimal('79.1'),
                 tags=['alta_prioridad','lote_grande','inmueble_antiguo','zona_densificacion','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[2]),

            dict(barrio='Cedritos', localidad='Usaquén', tipo='casa',
                 area_lote=195, area_construida=180, estrato=4, pisos=2, anio_construccion=1992,
                 precio_publicado=980_000_000, estado='nuevo',
                 score_prefactibilidad=Decimal('61.4'),
                 tags=['media_prioridad','precio_favorable','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[3]),

            dict(barrio='Chicó', localidad='Usaquén', tipo='casa',
                 area_lote=420, area_construida=380, estrato=6, pisos=3, anio_construccion=1972,
                 precio_publicado=4_500_000_000, estado='en_analisis',
                 score_prefactibilidad=Decimal('71.8'),
                 tags=['alta_prioridad','lote_grande','consolidacion_posible','inmueble_antiguo','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[4]),

            dict(barrio='Niza', localidad='Suba', tipo='casa',
                 area_lote=280, area_construida=240, estrato=4, pisos=2, anio_construccion=1988,
                 precio_publicado=1_200_000_000, estado='contactado',
                 score_prefactibilidad=Decimal('58.7'),
                 tags=['media_prioridad','lote_grande','inmueble_antiguo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[5]),

            dict(barrio='Santa Bárbara', localidad='Usaquén', tipo='lote',
                 area_lote=350, area_construida=0, estrato=5, pisos=0, anio_construccion=None,
                 precio_publicado=2_800_000_000, estado='nuevo',
                 score_prefactibilidad=Decimal('68.2'),
                 tags=['media_prioridad','lote_grande','zona_densificacion','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[6]),

            dict(barrio='Quinta Camacho', localidad='Chapinero', tipo='casa',
                 area_lote=160, area_construida=200, estrato=5, pisos=2, anio_construccion=1995,
                 precio_publicado=1_650_000_000, estado='nuevo',
                 score_prefactibilidad=Decimal('44.3'),
                 tags=['baja_prioridad'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[7]),

            dict(barrio='Pardo Rubio', localidad='Chapinero', tipo='casa',
                 area_lote=210, area_construida=190, estrato=4, pisos=2, anio_construccion=1980,
                 precio_publicado=890_000_000, estado='viable',
                 score_prefactibilidad=Decimal('73.6'),
                 tags=['alta_prioridad','lote_grande','inmueble_antiguo','precio_favorable'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[8]),

            dict(barrio='El Lago', localidad='Chapinero', tipo='casa',
                 area_lote=130, area_construida=160, estrato=4, pisos=2, anio_construccion=2001,
                 precio_publicado=750_000_000, estado='descartado',
                 score_prefactibilidad=Decimal('28.1'),
                 tags=['baja_prioridad'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[9]),

            dict(barrio='La Carolina', localidad='Usaquén', tipo='lote',
                 area_lote=520, area_construida=0, estrato=6, pisos=0, anio_construccion=None,
                 precio_publicado=5_800_000_000, estado='en_analisis',
                 score_prefactibilidad=Decimal('85.0'),
                 tags=['alta_prioridad','lote_grande','consolidacion_posible','zona_densificacion','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[1]),

            dict(barrio='San Patricio', localidad='Usaquén', tipo='casa',
                 area_lote=290, area_construida=260, estrato=5, pisos=3, anio_construccion=1975,
                 precio_publicado=2_100_000_000, estado='nuevo',
                 score_prefactibilidad=Decimal('64.9'),
                 tags=['media_prioridad','lote_grande','inmueble_antiguo','estrato_objetivo'],
                 descripcion_raw=DESCRIPCIONES_PREDIO[2]),
        ]

        predios_creados = []
        for i, pd in enumerate(predios_data):
            url = f'https://metrocuadrado.com/demo-predio-{i+1:04d}'
            if not Predio.objects.filter(url_origen=url).exists():
                precio_m2 = pd['precio_publicado'] / pd['area_lote'] if pd['area_lote'] else None
                predio = Predio.objects.create(
                    fuente=fuente,
                    url_origen=url,
                    codigo_externo=f'MC-{10000+i}',
                    ciudad='Bogotá',
                    precio_m2=round(precio_m2, 0) if precio_m2 else None,
                    prefact_calculada_en=timezone.now() - timedelta(hours=random.randint(1, 48)),
                    metricas_prefact=self._calcular_metricas(pd),
                    detalle_scores={
                        'area_lote': round(random.uniform(0.4, 1.0), 3),
                        'zona_pot': round(random.uniform(0.5, 1.0), 3),
                        'precio_vs_mercado': round(random.uniform(0.3, 1.0), 3),
                        'estrato': round(random.uniform(0.3, 1.0), 3),
                        'ubicacion': 0.5,
                        'estado_inmueble': round(random.uniform(0.4, 1.0), 3),
                    },
                    imagenes=[f'https://placehold.co/800x600?text=Predio+{i+1}'],
                    **pd,
                )
                predios_creados.append(predio)
                self.stdout.write(f'  ✓ {predio.barrio} — {predio.tipo} — score {predio.score_prefactibilidad}')

        self.stdout.write(f'  → {len(predios_creados)} predios creados')
        return list(Predio.objects.all())

    def _calcular_metricas(self, pd):
        area = pd.get('area_lote', 0) or 0
        precio = pd.get('precio_publicado', 0) or 0
        area_edif = area * 2.0
        area_vend = area_edif * 0.85
        precio_m2_nuevo = 7_500_000
        ingresos = area_vend * precio_m2_nuevo
        costo_const = area_edif * 1_800_000
        costo_total = costo_const + precio
        utilidad = ingresos - costo_total
        margen = (utilidad / ingresos * 100) if ingresos else 0
        roi = (utilidad / costo_total * 100) if costo_total else 0
        return {
            'area_edificable_est': round(area_edif, 0),
            'ingresos_brutos_est': round(ingresos, 0),
            'costo_total_est':     round(costo_total, 0),
            'utilidad_bruta_est':  round(utilidad, 0),
            'margen_bruto_est':    round(margen, 1),
            'roi_est':             round(roi, 1),
            'valor_max_predio_est': round(costo_total * 0.35, 0),
        }

    # ── Propietarios ──────────────────────────────────────
    def _crear_propietarios(self):
        from apps.leads.models import Propietario

        self.stdout.write('🏠 Creando propietarios...')
        asesor = User.objects.filter(role='asesor').first()
        estados = ['sin_contactar','contactado','interesado','calificado','en_negociacion','firmado','descartado']
        temperaturas = ['frio','tibio','caliente']

        propietarios = []
        for i, (nombre, apellidos, tel) in enumerate(NOMBRES_PROPIETARIOS):
            if not Propietario.objects.filter(telefono_principal=tel).exists():
                estado = estados[i % len(estados)]
                temp = temperaturas[i % len(temperaturas)]
                p = Propietario.objects.create(
                    nombre=f'{nombre} {apellidos}',
                    tipo='persona_natural',
                    cedula_nit=f'{10000000 + i*7654321}',
                    telefono_principal=tel,
                    whatsapp_phone=tel,
                    email=f'{nombre.lower()}.{apellidos.split()[0].lower()}@gmail.com',
                    ciudad='Bogotá',
                    asesor_asignado=asesor,
                    estado_contacto=estado,
                    temperatura=temp,
                    fuente_origen=random.choice(['Scraping Metrocuadrado','Referido','WhatsApp inbound','Llamada fría']),
                    etiquetas=['bogota'] + ([estado] if estado not in ('sin_contactar','descartado') else []),
                    primer_contacto=timezone.now() - timedelta(days=random.randint(5, 60)),
                    ultimo_contacto=timezone.now() - timedelta(days=random.randint(0, 14)),
                )
                propietarios.append(p)
                self.stdout.write(f'  ✓ {p.nombre} ({estado})')

        return list(Propietario.objects.all())

    # ── Vincular propietarios con predios ─────────────────
    def _vincular_propietarios_predios(self, propietarios, predios):
        from apps.leads.models import PropietarioPredio

        self.stdout.write('🔗 Vinculando propietarios con predios...')
        vinculos = 0
        for i, predio in enumerate(predios[:8]):
            prop = propietarios[i % len(propietarios)]
            if not PropietarioPredio.objects.filter(propietario=prop, predio=predio).exists():
                PropietarioPredio.objects.create(
                    propietario=prop,
                    predio=predio,
                    porcentaje_propiedad=Decimal('100.00'),
                    rol='propietario',
                    es_contacto_principal=True,
                )
                vinculos += 1
        self.stdout.write(f'  ✓ {vinculos} vínculos propietario-predio')

    # ── Leads ─────────────────────────────────────────────
    def _crear_leads(self, propietarios):
        from apps.leads.models import Lead, InteraccionLead

        self.stdout.write('🤝 Creando leads...')
        asesor = User.objects.filter(role='asesor').first()
        estados_lead = [
            'nuevo','contactado','interesado','calificado',
            'cita_agendada','propuesta_enviada','en_negociacion','promesa_firmada','descartado',
        ]
        leads_data = [
            dict(nombre='Carlos Rodríguez',   telefono='+573001234567', estado='en_negociacion',  temperatura='caliente'),
            dict(nombre='María González',      telefono='+573112345678', estado='cita_agendada',   temperatura='caliente'),
            dict(nombre='Jorge Martínez',      telefono='+573201234567', estado='interesado',      temperatura='tibio'),
            dict(nombre='Patricia López',      telefono='+573001112233', estado='contactado',      temperatura='tibio'),
            dict(nombre='Andrés García',       telefono='+573112223344', estado='calificado',      temperatura='caliente'),
            dict(nombre='Claudia Ramírez',     telefono='+573201112233', estado='nuevo',           temperatura='frio'),
            dict(nombre='Fernando Castro',     telefono='+573001223344', estado='propuesta_enviada', temperatura='caliente'),
            dict(nombre='Lucía Díaz',          telefono='+573112334455', estado='descartado',      temperatura='frio'),
            dict(nombre='Ricardo Herrera',     telefono='+573201223344', estado='nuevo',           temperatura='frio'),
            dict(nombre='Catalina Moreno',     telefono='+573001334455', estado='interesado',      temperatura='tibio'),
        ]

        leads_creados = []
        for i, ld in enumerate(leads_data):
            if not Lead.objects.filter(telefono=ld['telefono']).exists():
                lead = Lead.objects.create(
                    asesor=asesor,
                    propietario=propietarios[i % len(propietarios)] if propietarios else None,
                    fuente_origen=random.choice(['WhatsApp','Scraping','Referido','Llamada']),
                    primer_contacto=timezone.now() - timedelta(days=random.randint(1, 45)),
                    ultimo_contacto=timezone.now() - timedelta(days=random.randint(0, 7)),
                    **ld,
                )
                # Crear interacciones
                tipos = ['whatsapp','llamada','email','visita']
                for j in range(random.randint(1, 4)):
                    InteraccionLead.objects.create(
                        lead=lead,
                        usuario=asesor,
                        tipo=tipos[j % len(tipos)],
                        descripcion=random.choice([
                            'Primer contacto realizado. Propietario muestra interés inicial.',
                            'Llamada exitosa. Acuerdo para visita al predio.',
                            'Visita realizada. Propietario valida condiciones de negociación.',
                            'Enviada propuesta económica por WhatsApp.',
                            'Propietario solicita tiempo para decidir con familia.',
                            'Reunión presencial en HAB. Avance positivo.',
                        ]),
                        resultado='Positivo' if lead.temperatura == 'caliente' else 'En seguimiento',
                    )
                leads_creados.append(lead)
                self.stdout.write(f'  ✓ {lead.nombre} ({lead.estado})')

        return list(Lead.objects.all())

    # ── Conversaciones WhatsApp ───────────────────────────
    def _crear_conversaciones(self, propietarios):
        from apps.bot.models import Conversacion, Mensaje

        self.stdout.write('💬 Creando conversaciones WhatsApp...')
        estados_conv = ['activa','activa','activa','escalada','pausada']
        etapas = ['inicio','calificacion','presentacion','objeciones','agendamiento']

        mensajes_ejemplo = [
            ('entrante', 'Buenas tardes, me llegó un mensaje sobre mi propiedad en Chapinero'),
            ('saliente', 'Hola! Soy del equipo HAB. Gracias por contactarnos. Tenemos interés en tu predio para un proyecto inmobiliario. ¿Podrías contarme un poco más sobre la propiedad?'),
            ('entrante', 'Claro, es una casa de dos pisos en Chapinero Alto, tiene como 300 metros de lote'),
            ('saliente', 'Excelente! Un lote de 300m² en Chapinero Alto es muy interesante para nosotros. ¿Has considerado alguna vez hacer un aporte de terreno a un proyecto nuevo?'),
            ('entrante', 'No, nunca lo he pensado. ¿Cómo funciona eso?'),
            ('saliente', 'En HAB te explicamos todo. La idea es que el terreno entra como inversión al proyecto y tú recibes apartamentos nuevos a cambio, o una participación económica. ¿Podemos agendar una reunión esta semana?'),
            ('entrante', 'Suena interesante. ¿Cuándo pueden?'),
            ('saliente', '¡Perfecto! Tenemos disponibilidad el jueves a las 3pm o el viernes a las 10am. ¿Cuál te funciona mejor?'),
        ]

        for i, prop in enumerate(propietarios[:6]):
            wa_phone = prop.whatsapp_phone or f'+5730012{34567+i}'
            if not Conversacion.objects.filter(wa_contact_phone=wa_phone).exists():
                etapa = etapas[i % len(etapas)]
                estado = estados_conv[i % len(estados_conv)]
                ia_activa = estado != 'escalada'

                conv = Conversacion.objects.create(
                    propietario=prop,
                    wa_phone_id='123456789',
                    wa_contact_phone=wa_phone,
                    estado=estado,
                    ia_activa=ia_activa,
                    etapa_bot=etapa,
                    contexto={'nombre': prop.nombre, 'interes_detectado': i > 1},
                    ultimo_mensaje=timezone.now() - timedelta(minutes=random.randint(5, 480)),
                )

                # Crear mensajes de la conversación
                msgs_a_crear = mensajes_ejemplo[:min(i + 2, len(mensajes_ejemplo))]
                for j, (direccion, contenido) in enumerate(msgs_a_crear):
                    Mensaje.objects.create(
                        conversacion=conv,
                        wa_message_id=f'wamid.demo.{conv.id}.{j}',
                        direccion=direccion,
                        tipo='texto',
                        contenido=contenido,
                        generado_por_ia=(direccion == 'saliente'),
                        enviado_en=timezone.now() - timedelta(minutes=(len(msgs_a_crear)-j)*3),
                    )

                self.stdout.write(f'  ✓ Conv {wa_phone} ({etapa}) — {len(msgs_a_crear)} mensajes')

    # ── Proyecto demo ─────────────────────────────────────
    def _crear_proyecto_demo(self, predios):
        from apps.proyectos.models import Proyecto, EstructuracionProyecto
        from apps.viabilidad.models import AnalisisViabilidad
        from apps.scraping.models import Predio

        self.stdout.write('🏗️  Creando proyecto demo...')
        gerente = User.objects.filter(role='gerente').first() or User.objects.first()

        predios_viables = Predio.objects.filter(estado='viable')
        if not predios_viables.exists():
            self.stdout.write('  ⚠️  Sin predios viables, saltando proyecto')
            return

        predio = predios_viables.first()

        # Crear análisis de viabilidad
        analisis, _ = AnalisisViabilidad.objects.get_or_create(
            predio=predio,
            defaults=dict(
                analista=gerente,
                zona_pot='Zona Residencial Chapinero',
                indice_construccion=Decimal('3.5'),
                indice_ocupacion=Decimal('0.6'),
                altura_max_pisos=12,
                uso_suelo='Residencial',
                area_edificable=Decimal('1120.00'),
                unidades_proyectadas=18,
                precio_m2_nuevo=Decimal('8500000'),
                valor_bruto_proyecto=Decimal('9520000000'),
                costo_construccion=Decimal('2016000000'),
                valor_max_predio=Decimal('1247000000'),
                utilidad_estimada=Decimal('1457000000'),
                margen_estimado=Decimal('15.3'),
                es_viable=True,
                score_viabilidad=81,
                justificacion_ia='→ Zona de alta densificación con IC 3.5\n→ Precio por debajo del mercado (15%)\n→ Área de lote supera mínimo viable\n→ Estrato objetivo para HAB\n→ Buena conectividad vial',
                completado_en=timezone.now() - timedelta(days=5),
            )
        )

        if not Proyecto.objects.filter(codigo='HAB-2024-001').exists():
            proyecto = Proyecto.objects.create(
                predio=predio,
                analisis=analisis,
                nombre='Proyecto Chapinero Alto 320',
                codigo='HAB-2024-001',
                slug='chapinero-alto-320',
                fase='estructuracion',
                gerente=gerente,
                fee_estructuracion=Decimal('85000000'),
                pct_gerencia=Decimal('4.5'),
                pct_ventas=Decimal('3.0'),
                valor_total_estimado=Decimal('9520000000'),
                fecha_estructuracion=timezone.now().date(),
                fecha_presentacion=(timezone.now() + timedelta(days=30)).date(),
            )

            # Crear estructuración financiera
            EstructuracionProyecto.objects.create(
                proyecto=proyecto,
                version=1,
                es_vigente=True,
                generada_por_ia=True,
                generada_por=gerente,
                area_lote=Decimal('320'),
                area_construida=Decimal('1120'),
                area_vendible=Decimal('952'),
                unidades_totales=18,
                unidades_vis=0,
                unidades_no_vis=18,
                pisos=12,
                precio_m2_promedio=Decimal('8500000'),
                ingresos_brutos=Decimal('8092000000'),
                costo_terreno=Decimal('1850000000'),
                costo_construccion=Decimal('2016000000'),
                costo_urbanismo=Decimal('120000000'),
                costo_diseno=Decimal('80000000'),
                costo_ventas=Decimal('242760000'),
                costo_gerencia=Decimal('364140000'),
                costo_legales=Decimal('60000000'),
                costos_imprevistos=Decimal('100000000'),
                costo_total=Decimal('4832900000'),
                utilidad_bruta=Decimal('3259100000'),
                margen_bruto=Decimal('40.3'),
                utilidad_neta=Decimal('2975000000'),
                margen_neto=Decimal('36.8'),
                roi=Decimal('61.6'),
                tir_estimada=Decimal('28.4'),
                punto_equilibrio_uds=8,
                valor_max_predio=Decimal('1691115000'),
                hab_fee_estructuracion=Decimal('85000000'),
                hab_fee_gerencia=Decimal('364140000'),
                hab_fee_ventas=Decimal('242760000'),
                hab_ingreso_total=Decimal('691900000'),
                resumen_ejecutivo=(
                    'Proyecto de desarrollo multifamiliar en Chapinero Alto sobre lote de 320m². '
                    'La zona presenta alta demanda residencial con IC 3.5 que permite 12 pisos. '
                    'El precio de adquisición es favorable respecto al mercado (15% por debajo). '
                    'ROI estimado del 61.6% con TIR del 28.4% en 36 meses.'
                ),
                fortalezas=[
                    'Localización prime en Chapinero con alta demanda',
                    'Precio de compra por debajo del mercado',
                    'Zona de densificación habilitada hasta 12 pisos',
                    'Propietario con alta disposición a negociar',
                ],
                riesgos=[
                    'Posible incremento en costos de construcción',
                    'Tiempo de ventas puede extenderse en segmento alto',
                    'Requiere licencia de construcción (6-8 meses)',
                ],
                recomendaciones=[
                    'Negociar precio final con base en promesas de compra',
                    'Iniciar trámites de licencia en paralelo a la negociación',
                    'Estructurar preventas desde mes 3 del proyecto',
                ],
            )
            self.stdout.write(f'  ✓ Proyecto {proyecto.codigo} — {proyecto.nombre}')
