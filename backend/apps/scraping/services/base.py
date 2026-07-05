from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
import re
from typing import Iterable
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from apps.leads.models import Propietario, PropietarioPredio
from apps.scraping.models import Predio


@dataclass
class ScrapingRunResult:
    predios_encontrados: int = 0
    predios_nuevos: int = 0
    predios_actualizados: int = 0
    errores: int = 0
    logs: list[str] = field(default_factory=list)

    @property
    def log_text(self) -> str:
        return "\n".join(self.logs)


class BaseScraper:
    source_key = "base"
    default_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
    }

    def __init__(self, fuente, config=None, session: requests.Session | None = None):
        self.fuente = fuente
        self.config = config
        self.session = session or requests.Session()
        self.session.headers.update(self.default_headers)
        self.result = ScrapingRunResult()

    def log(self, message: str) -> None:
        self.result.logs.append(message)

    def ejecutar(self) -> ScrapingRunResult:
        raise NotImplementedError

    def fetch_soup(self, url: str) -> BeautifulSoup:
        response = self.session.get(url, timeout=30)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")

    def find_existing_predio(self, payload: dict) -> Predio | None:
        codigo_externo = (payload.get("codigo_externo") or "").strip()
        url_origen = payload.get("url_origen")

        if codigo_externo:
            existing = Predio.objects.filter(
                fuente=self.fuente,
                codigo_externo=codigo_externo,
            ).first()
            if existing:
                return existing

        if url_origen:
            return Predio.objects.filter(url_origen=url_origen).first()
        return None

    def upsert_propietario_contacto(self, predio: Predio, contacto: dict) -> None:
        phones = contacto.get("phones") or []
        emails = contacto.get("emails") or []
        whatsapp_phone = contacto.get("whatsapp_phone") or ""
        telefono_principal = whatsapp_phone or (phones[0] if phones else "")
        email = emails[0] if emails else ""

        if not telefono_principal:
            return

        propietario = None
        if whatsapp_phone:
            propietario = Propietario.objects.filter(whatsapp_phone=whatsapp_phone).first()
        if not propietario and telefono_principal:
            propietario = Propietario.objects.filter(telefono_principal=telefono_principal).first()
        if not propietario and email:
            propietario = Propietario.objects.filter(email=email).first()

        source_name = self.source_key.replace("_", " ").title()
        nombre = contacto.get("publisher_name") or f"Contacto {source_name} {predio.codigo_externo or predio.id}"

        if propietario:
            changed = False
            if email and not propietario.email:
                propietario.email = email
                changed = True
            if whatsapp_phone and not propietario.whatsapp_phone:
                propietario.whatsapp_phone = whatsapp_phone
                changed = True
            if telefono_principal and not propietario.telefono_principal:
                propietario.telefono_principal = telefono_principal
                changed = True
            if contacto.get("publisher_name") and propietario.nombre.startswith("Contacto "):
                propietario.nombre = nombre
                changed = True
            if changed:
                propietario.save()
        else:
            propietario = Propietario.objects.create(
                nombre=nombre,
                telefono_principal=telefono_principal,
                email=email,
                whatsapp_phone=whatsapp_phone,
                ciudad=predio.ciudad,
                fuente_origen=f"scraping_{self.source_key}",
                etiquetas=["captado_scraping", self.source_key],
            )

        PropietarioPredio.objects.get_or_create(
            propietario=propietario,
            predio=predio,
            rol="propietario",
            defaults={
                "porcentaje_propiedad": 100,
                "es_contacto_principal": True,
                "notas": f"Asociado automáticamente desde scraping de {source_name}.",
            },
        )

    @staticmethod
    def absolute_url(base_url: str, href: str | None) -> str | None:
        if not href:
            return None
        return urljoin(base_url, href)

    @staticmethod
    def clean_text(value: str | None) -> str:
        if not value:
            return ""
        return re.sub(r"\s+", " ", value).strip()

    @classmethod
    def text_to_decimal(cls, value: str | None) -> Decimal | None:
        if not value:
            return None
        cleaned = re.sub(r"[^\d,.\-]", "", value)
        if not cleaned:
            return None
        if "," in cleaned and "." in cleaned:
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", ".")
        try:
            return Decimal(cleaned)
        except Exception:
            return None

    @classmethod
    def text_to_int(cls, value: str | None) -> int | None:
        decimal_value = cls.text_to_decimal(value)
        if decimal_value is None:
            return None
        try:
            return int(decimal_value)
        except Exception:
            return None

    @staticmethod
    def normalize_slug(value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

    @staticmethod
    def dedupe_keep_order(items: Iterable[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for item in items:
            if not item or item in seen:
                continue
            seen.add(item)
            result.append(item)
        return result
