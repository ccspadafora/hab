from __future__ import annotations

from decimal import Decimal
import re
import time
from urllib.parse import urlparse, urlunparse, urlencode, parse_qsl

from django.db import transaction

from apps.scraping.models import Predio

from .base import BaseScraper, ScrapingRunResult


class FincaRaizScraper(BaseScraper):
    source_key = "fincaraiz"

    PROPERTY_SLUGS = {
        "apartamento": "apartamentos",
        "casa": "casas",
        "lote": "lotes",
        "local": "locales",
    }
    TITLE_TYPE_MAP = {
        "apartamento": "apartamento",
        "casa": "casa",
        "lote": "lote",
        "local": "local",
    }

    def ejecutar(self) -> ScrapingRunResult:
        search_urls = self._build_search_urls()
        if not search_urls:
            raise ValueError("No hay URLs de búsqueda configuradas para Fincaraiz.")

        self.log(f"Fincaraiz: {len(search_urls)} búsquedas configuradas")
        visited_detail_urls: set[str] = set()
        delay = getattr(self.config, "delay_entre_paginas", 0) or 0

        for search_url in search_urls:
            self.log(f"Buscando listados en {search_url}")
            detail_urls = self._extract_detail_urls(search_url)
            self.log(f"Se detectaron {len(detail_urls)} detalles en {search_url}")

            for detail_url in detail_urls:
                if detail_url in visited_detail_urls:
                    continue
                visited_detail_urls.add(detail_url)
                try:
                    payload = self._parse_detail(detail_url)
                    if not payload:
                        self.result.errores += 1
                        self.log(f"Sin payload útil en {detail_url}")
                        continue
                    if not self._passes_filters(payload):
                        self.log(f"Descartado por filtros: {detail_url}")
                        continue
                    self.result.predios_encontrados += 1
                    created = self._upsert_predio(payload)
                    if created:
                        self.result.predios_nuevos += 1
                    else:
                        self.result.predios_actualizados += 1
                except Exception as exc:
                    self.result.errores += 1
                    self.log(f"Error en detalle {detail_url}: {exc}")

                if delay > 0:
                    time.sleep(delay)

        self.log(
            "Fincaraiz finalizado: "
            f"{self.result.predios_encontrados} encontrados, "
            f"{self.result.predios_nuevos} nuevos, "
            f"{self.result.predios_actualizados} actualizados, "
            f"{self.result.errores} errores"
        )
        return self.result

    def _build_search_urls(self) -> list[str]:
        entrypoints = self.fuente.configuracion.get("entrypoints") or []
        if entrypoints:
            return entrypoints

        negocio = self.fuente.configuracion.get("negocio", "venta").strip("/") or "venta"
        city_path = self.fuente.configuracion.get("city_path", "bogota/bogota-dc").strip("/")
        tipos = list(getattr(self.config, "tipos_predio", None) or []) or ["casa", "lote"]

        urls: list[str] = []
        for tipo in tipos:
            listing_slug = self.PROPERTY_SLUGS.get(tipo)
            if not listing_slug:
                continue
            urls.append(f"{self.fuente.url_base.rstrip('/')}/{negocio}/{listing_slug}/{city_path}")
        return self.dedupe_keep_order(urls)

    def _extract_detail_urls(self, search_url: str) -> list[str]:
        max_paginas = getattr(self.config, "max_paginas", 1) or 1
        detail_urls: list[str] = []

        for page_number in range(1, max_paginas + 1):
            page_url = self._with_page(search_url, page_number)
            soup = self.fetch_soup(page_url)
            page_links = self._extract_detail_urls_from_soup(page_url, soup)
            if not page_links:
                if page_number == 1:
                    self.log(f"Sin links detectados en {page_url}")
                break
            detail_urls.extend(page_links)
            self.log(f"Página {page_number}: {len(page_links)} links")

        return self.dedupe_keep_order(detail_urls)

    def _with_page(self, base_url: str, page_number: int) -> str:
        if page_number == 1:
            return base_url

        parsed = urlparse(base_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query["pagina"] = str(page_number)
        return urlunparse(parsed._replace(query=urlencode(query)))

    def _extract_detail_urls_from_soup(self, page_url: str, soup) -> list[str]:
        detail_urls: list[str] = []
        for anchor in soup.select("a[href]"):
            absolute = self.absolute_url(page_url, anchor.get("href"))
            if not absolute:
                continue
            parsed = urlparse(absolute)
            if "fincaraiz.com.co" not in parsed.netloc:
                continue
            if not re.search(r"/\d{6,}$", parsed.path):
                continue
            if any(skip in parsed.path for skip in ("/inmobiliaria/", "/proyecto-", "/constructora/")):
                continue
            detail_urls.append(f"{parsed.scheme}://{parsed.netloc}{parsed.path}")
        return self.dedupe_keep_order(detail_urls)

    def _parse_detail(self, detail_url: str) -> dict:
        soup = self.fetch_soup(detail_url)
        strings = [self.clean_text(item) for item in soup.stripped_strings]
        strings = [item for item in strings if item]

        title = self._extract_title(strings)
        location_label = self._value_after(strings, "Ubicación Principal")
        ubicacion = self._value_after(strings, "Ubicación")
        details = self._extract_detail_map(strings)
        descripcion = self._extract_description(strings)
        codigo = self._extract_codigo(strings, detail_url)
        price = self._extract_price(strings)
        area_top = self._extract_area_top(strings)

        barrio, localidad, ciudad = self._extract_location_parts(title, location_label, ubicacion)
        tipo = self._extract_tipo(title, details)
        area_construida = self.text_to_decimal(details.get("Área Construida")) or area_top
        area_privada = self.text_to_decimal(details.get("Área Privada"))
        area_lote = area_construida or area_privada
        precio_publicado = price
        precio_m2 = self._compute_precio_m2(precio_publicado, area_lote)
        pisos = self.text_to_int(details.get("Cantidad de Pisos")) or self.text_to_int(details.get("Piso N°"))
        estrato = self.text_to_int(details.get("Estrato"))
        anio_construccion = self._extract_anio_construccion(details.get("Antigüedad"))
        imagenes = self._extract_images(soup, detail_url)

        return {
            "url_origen": detail_url,
            "codigo_externo": codigo,
            "barrio": barrio or "Sin barrio",
            "localidad": localidad or "Sin localidad",
            "ciudad": ciudad or "Bogotá",
            "direccion": self._build_direccion(title, barrio),
            "tipo": tipo,
            "area_lote": area_lote,
            "area_construida": area_construida,
            "estrato": estrato,
            "pisos": pisos,
            "anio_construccion": anio_construccion,
            "precio_publicado": precio_publicado,
            "precio_m2": precio_m2,
            "imagenes": imagenes,
            "descripcion_raw": descripcion,
            "raw_data": {
                "title": title,
                "location_label": location_label,
                "ubicacion": ubicacion,
                "detail_map": details,
                "imagenes": imagenes,
                "source": self.source_key,
            },
        }

    def _extract_title(self, strings: list[str]) -> str:
        for item in strings:
            if " en Venta en " in item or " en Arriendo en " in item:
                return item
        return ""

    def _extract_price(self, strings: list[str]) -> Decimal | None:
        for index, item in enumerate(strings[:50]):
            if item.startswith("$"):
                return self.text_to_decimal(item)
            if item == "Precio de Venta" and index > 0:
                return self.text_to_decimal(strings[index - 1])
        return None

    def _extract_area_top(self, strings: list[str]) -> Decimal | None:
        for item in strings[:40]:
            if "m²" in item or "m2" in item.lower():
                value = self.text_to_decimal(item)
                if value:
                    return value
        return None

    def _extract_detail_map(self, strings: list[str]) -> dict[str, str]:
        section_start = None
        section_end = None
        for idx, item in enumerate(strings):
            if item == "Detalles de la Propiedad":
                section_start = idx + 1
            elif item == "Descripción" and section_start is not None:
                section_end = idx
                break

        if section_start is None:
            return {}

        section_items = strings[section_start:section_end]
        section_items = [item for item in section_items if item not in {"•", "Ver más"}]

        detail_map: dict[str, str] = {}
        i = 0
        while i + 1 < len(section_items):
            key = section_items[i]
            value = section_items[i + 1]
            if key in {
                "Tipo de Inmueble",
                "Estado",
                "Baños",
                "Antigüedad",
                "Habitaciones",
                "Parqueaderos",
                "Área Construida",
                "Área Privada",
                "Estrato",
                "Administración",
                "Piso N°",
                "Cantidad de Pisos",
                "Acepta permuta",
                "Remodelado",
            }:
                detail_map[key] = value
                i += 2
                continue
            i += 1
        return detail_map

    def _extract_description(self, strings: list[str]) -> str:
        try:
            start = strings.index("Descripción") + 1
        except ValueError:
            return ""

        end = len(strings)
        description_parts = []
        for item in strings[start:end]:
            if item.startswith("Código Fincaraíz:"):
                break
            if item in {
                "Agenda tu visita",
                "Contactar",
                "Completa tus datos para habilitar el medio de contacto",
                "Descarga la app",
            }:
                continue
            description_parts.append(item)
        return " ".join(description_parts).strip()

    def _extract_codigo(self, strings: list[str], detail_url: str) -> str:
        for item in strings:
            match = re.search(r"Código Fincaraíz:\s*(\d+)", item)
            if match:
                return match.group(1)
        match = re.search(r"/(\d{6,})$", urlparse(detail_url).path)
        return match.group(1) if match else ""

    def _extract_location_parts(self, title: str, location_label: str, ubicacion: str) -> tuple[str, str, str]:
        barrio = ""
        localidad = ""
        ciudad = "Bogotá"

        title_match = re.search(r" en (?:Venta|Arriendo) en ([^,]+),\s*([^,]+)", title, re.IGNORECASE)
        if title_match:
            barrio = self.clean_text(title_match.group(1))
            ciudad = self.clean_text(title_match.group(2))

        if location_label:
            parts = [self.clean_text(part) for part in location_label.split(",") if self.clean_text(part)]
            if parts:
                barrio = barrio or parts[0]
            if len(parts) >= 2:
                ciudad = parts[1]

        if ubicacion:
            parts = [self.clean_text(part) for part in ubicacion.split(",") if self.clean_text(part)]
            if parts:
                localidad = parts[0].title()
            if len(parts) >= 2:
                ciudad = parts[1].title()

        return barrio.title(), localidad, ciudad.title()

    def _extract_tipo(self, title: str, details: dict[str, str]) -> str:
        detail_tipo = self.clean_text(details.get("Tipo de Inmueble"))
        lowered = detail_tipo.lower()
        for needle, tipo in self.TITLE_TYPE_MAP.items():
            if needle in lowered:
                return tipo

        title_lower = title.lower()
        for needle, tipo in self.TITLE_TYPE_MAP.items():
            if needle in title_lower:
                return tipo
        return "casa"

    def _extract_anio_construccion(self, antiguedad: str | None) -> int | None:
        if not antiguedad:
            return None
        match = re.search(r"(\d+)", antiguedad)
        if not match:
            return None
        years = int(match.group(1))
        current_year = 2026
        if "más de" in antiguedad.lower():
            years += 5
        return max(current_year - years, 1900)

    def _extract_images(self, soup, detail_url: str) -> list[str]:
        urls: list[str] = []
        for image in soup.select("img[src]"):
            src = image.get("src")
            absolute = self.absolute_url(detail_url, src)
            if not absolute:
                continue
            lowered = absolute.lower()
            if not any(ext in lowered for ext in (".jpg", ".jpeg", ".png", ".webp")):
                continue
            if "logo" in lowered or "icon" in lowered:
                continue
            urls.append(absolute)
        return self.dedupe_keep_order(urls)[:12]

    def _compute_precio_m2(self, precio: Decimal | None, area: Decimal | None) -> Decimal | None:
        if not precio or not area:
            return None
        if area <= 0:
            return None
        try:
            return (precio / area).quantize(Decimal("0.01"))
        except Exception:
            return None

    def _build_direccion(self, title: str, barrio: str) -> str:
        if title:
            cleaned = re.sub(r"^[A-Za-záéíóúñÁÉÍÓÚÑ ]+ en (Venta|Arriendo) en ", "", title, flags=re.IGNORECASE)
            return cleaned.strip()
        return barrio

    def _value_after(self, strings: list[str], marker: str) -> str:
        for index, item in enumerate(strings):
            if item == marker and index + 1 < len(strings):
                return strings[index + 1]
        return ""

    def _passes_filters(self, payload: dict) -> bool:
        if not self.config:
            return True

        localidades = [str(item).strip().lower() for item in (self.config.localidades or []) if str(item).strip()]
        if localidades and str(payload.get("localidad") or "").strip().lower() not in localidades:
            return False

        barrios = [str(item).strip().lower() for item in (self.config.barrios_objetivo or []) if str(item).strip()]
        if barrios and str(payload.get("barrio") or "").strip().lower() not in barrios:
            return False

        estrato = payload.get("estrato")
        if estrato is not None:
            if self.config.estrato_min is not None and estrato < self.config.estrato_min:
                return False
            if self.config.estrato_max is not None and estrato > self.config.estrato_max:
                return False

        precio = payload.get("precio_publicado")
        if precio is not None:
            if self.config.precio_min is not None and precio < self.config.precio_min:
                return False
            if self.config.precio_max is not None and precio > self.config.precio_max:
                return False

        area = payload.get("area_lote")
        if area is not None and self.config.area_lote_min is not None and area < self.config.area_lote_min:
            return False

        return True

    @transaction.atomic
    def _upsert_predio(self, payload: dict) -> bool:
        obj = Predio.objects.filter(url_origen=payload["url_origen"]).first()
        if obj:
            for field, value in payload.items():
                setattr(obj, field, value)
            obj.save()
            return False

        Predio.objects.create(
            fuente=self.fuente,
            estado="para_estudio",
            **payload,
        )
        return True
