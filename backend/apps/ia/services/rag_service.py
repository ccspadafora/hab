"""
RAG Service — Retrieval-Augmented Generation para HAB.

Estrategia simple sin vector DB:
1. Chunking de documentos en fragmentos de ~500 tokens
2. Embeddings con text-embedding-3-small (mucho más barato que GPT-4o)
3. Búsqueda por similitud coseno en memoria (suficiente para <200 docs)
4. Solo inyecta los top-K fragmentos más relevantes al prompt
   → Reduce tokens de contexto en ~70-80% vs. inyectar todo el knowledge base
"""
from __future__ import annotations
import json
import logging
import math
from typing import List, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)


def _cosine(a: List[float], b: List[float]) -> float:
    dot  = sum(x * y for x, y in zip(a, b))
    magA = math.sqrt(sum(x * x for x in a))
    magB = math.sqrt(sum(x * x for x in b))
    return dot / (magA * magB) if magA and magB else 0.0


def _chunk_texto(texto: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Divide texto en chunks con overlap."""
    words  = texto.split()
    chunks = []
    start  = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(' '.join(words[start:end]))
        start = end - overlap
    return [c for c in chunks if len(c.strip()) > 50]


def obtener_embedding(texto: str) -> List[float]:
    """Genera embedding con text-embedding-3-small (muy económico)."""
    import openai
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(
        model='text-embedding-3-small',
        input=texto[:8000],
    )
    return response.data[0].embedding


def construir_contexto_rag(
    query: str,
    aplica_a: str = 'todos',
    top_k: int = 5,
    min_score: float = 0.35,
) -> str:
    """
    Recupera los fragmentos más relevantes para la query.
    Retorna el contexto listo para inyectar en el prompt.
    """
    from apps.ia.models import BaseConocimientoIA

    docs = BaseConocimientoIA.objects.filter(
        activo=True,
        aplica_a__in=[aplica_a, 'todos'],
    )

    if not docs.exists():
        return ''

    # Embedding de la query
    try:
        query_emb = obtener_embedding(query)
    except Exception as e:
        logger.warning(f'RAG: fallo al generar embedding de query: {e}')
        # Fallback: retornar todos los textos cortos
        textos = [d.contenido_extraido or d.texto_plano for d in docs if d.contenido_extraido or d.texto_plano]
        return '\n\n---\n\n'.join(textos[:3])

    resultados: List[Tuple[float, str, str]] = []

    for doc in docs:
        texto = doc.contenido_extraido or doc.texto_plano
        if not texto:
            continue

        # Si el doc tiene embedding guardado, usarlo
        if doc.embedding_cache:
            try:
                cached = json.loads(doc.embedding_cache)
                # cached es lista de (chunk_texto, embedding)
                for chunk, emb in cached:
                    score = _cosine(query_emb, emb)
                    if score >= min_score:
                        resultados.append((score, doc.nombre, chunk))
                continue
            except Exception:
                pass

        # Chunking y embeddings on-the-fly
        chunks = _chunk_texto(texto)
        chunk_embeddings = []
        for chunk in chunks[:10]:  # máx 10 chunks por doc
            try:
                emb   = obtener_embedding(chunk)
                score = _cosine(query_emb, emb)
                chunk_embeddings.append((chunk, emb))
                if score >= min_score:
                    resultados.append((score, doc.nombre, chunk))
            except Exception:
                continue

        # Guardar en caché para próximas consultas
        if chunk_embeddings:
            try:
                doc.embedding_cache = json.dumps(chunk_embeddings)
                doc.save(update_fields=['embedding_cache'])
            except Exception:
                pass

    # Ordenar por relevancia y tomar top-K
    resultados.sort(key=lambda x: x[0], reverse=True)
    top = resultados[:top_k]

    if not top:
        # Si no hay resultados relevantes, fallback a primeros documentos
        fallback_textos = []
        for doc in docs[:2]:
            t = (doc.contenido_extraido or doc.texto_plano)[:500]
            if t:
                fallback_textos.append(f'[{doc.nombre}]\n{t}')
        return '\n\n---\n\n'.join(fallback_textos)

    partes = []
    for score, nombre, chunk in top:
        partes.append(f'[{nombre} | relevancia: {score:.2f}]\n{chunk}')

    logger.info(
        'rag.contexto_construido',
        extra={'query_len': len(query), 'chunks_recuperados': len(top), 'top_score': top[0][0] if top else 0},
    )
    return '\n\n---\n\n'.join(partes)
