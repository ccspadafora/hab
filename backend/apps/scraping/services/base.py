from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
import re
from typing import Iterable
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


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
