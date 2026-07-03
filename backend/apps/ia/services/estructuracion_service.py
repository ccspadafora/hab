import json
import logging

import openai
from django.conf import settings

from apps.ia.models import BaseConocimientoIA, PromptIA
from apps.proyectos.models import Proyecto

logger = logging.getLogger(__name__)


class EstructuracionIAService:
    """
    Genera la estructuración financiera de un proyecto usando GPT-4o
    con documentos de la base de conocimiento como contexto.
    """

    def __init__(self, proyecto_id: int):
        self.proyecto   = Proyecto.objects.select_related('predio', 'analisis').get(pk=proyecto_id)
        self.prompt     = PromptIA.objects.filter(modulo='estructuracion', activo=True).first()
        self.documentos = BaseConocimientoIA.objects.filter(
            activo=True,
            aplica_a__in=['estructuracion', 'todos'],
        )

    def construir_contexto(self) -> str:
        """
        Usa RAG para recuperar solo los fragmentos más relevantes.
        Reduce consumo de tokens en ~70-80% vs. inyectar todo el knowledge base.
        """
        from apps.ia.services.rag_service import construir_contexto_rag
        query = (
            f'estructuración financiera proyecto inmobiliario '
            f'{self.proyecto.predio.barrio} '
            f'área {self.proyecto.predio.area_lote}m2 '
            f'estrato {self.proyecto.predio.estrato}'
        )
        contexto_rag = construir_contexto_rag(
            query=query,
            aplica_a='estructuracion',
            top_k=6,
        )
        if contexto_rag:
            return contexto_rag
        # Fallback: todos los documentos (comportamiento anterior)
        chunks = []
        for doc in self.documentos:
            texto = doc.contenido_extraido or doc.texto_plano
            if texto:
                chunks.append(f'[{doc.nombre}]\n{texto}')
        return '\n\n---\n\n'.join(chunks)

    def generar(self) -> dict:
        contexto      = self.construir_contexto()
        predio_data   = self._serializar_predio()
        analisis_data = self._serializar_analisis()

        system_prompt = self._render_system(contexto)
        user_prompt   = self._render_user(predio_data, analisis_data)

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user',   'content': user_prompt},
            ],
            response_format={'type': 'json_object'},
            max_tokens=4000,
        )
        logger.info(
            'ia.estructuracion.tokens',
            extra={
                'proyecto_id':    self.proyecto.pk,
                'prompt_tokens':  response.usage.prompt_tokens,
                'total_tokens':   response.usage.total_tokens,
            },
        )
        return json.loads(response.choices[0].message.content)

    def _serializar_predio(self) -> dict:
        p = self.proyecto.predio
        return {
            'barrio':            p.barrio,
            'localidad':         p.localidad,
            'area_lote':         str(p.area_lote),
            'tipo':              p.tipo,
            'estrato':           p.estrato,
            'precio_publicado':  str(p.precio_publicado),
        }

    def _serializar_analisis(self) -> dict:
        a = self.proyecto.analisis
        return {
            'zona_pot':              a.zona_pot,
            'indice_construccion':   str(a.indice_construccion),
            'area_edificable':       str(a.area_edificable),
            'unidades_proyectadas':  a.unidades_proyectadas,
            'margen_estimado':       str(a.margen_estimado),
        }

    def _render_system(self, contexto: str) -> str:
        if self.prompt:
            return self.prompt.prompt_sistema.replace('{{contexto_base}}', contexto)
        return (
            'Eres un experto en estructuración de proyectos inmobiliarios en Bogotá.\n'
            f'Usa los siguientes documentos de referencia:\n{contexto}\n'
            'Responde SIEMPRE en JSON con los campos de EstructuracionProyecto.'
        )

    def _render_user(self, predio: dict, analisis: dict) -> str:
        if self.prompt:
            return (
                self.prompt.prompt_usuario
                .replace('{{predio}}',   json.dumps(predio,   ensure_ascii=False))
                .replace('{{analisis}}', json.dumps(analisis, ensure_ascii=False))
            )
        return (
            f'Genera la estructuración financiera para este predio:\n'
            f'Predio: {json.dumps(predio, ensure_ascii=False)}\n'
            f'Análisis: {json.dumps(analisis, ensure_ascii=False)}'
        )
