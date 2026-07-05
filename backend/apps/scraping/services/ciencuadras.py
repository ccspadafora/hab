from __future__ import annotations

from decimal import Decimal
import json
import re
import time
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from django.db import transaction

from apps.scraping.models import Predio

from .base import BaseScraper, ScrapingRunResult


class CienCuadrasScraper(BaseScraper):
    source_key = "ciencuadras"

    TYPE_MAP = {
        "apartamento": "apartamento",
        "apartaestudio": "apartamento",
        "casa": "casa",
        "lote": "lote",
        "local": "local",
    }

    def ejecutar(self) -> ScrapingRunResult:
        sitemap_urls = self._build_sitemap_urls()
        if not sitemap_urls:
            raise ValueError("No hay sitemaps configurados para Ciencuadras.")

        self.log(f"Ciencuadras: {len(sitemap_urls)} sitemaps configurados")
        visited_detail_urls: set[str] = set()
        delay = getattr(self.config, "delay_entre_paginas", 0) or 0

        for sitemap_url in sitemap_urls:
            try:
                detail_urls = self._extract_detail_urls_from_sitemap(sitemap_url)
            except Exception as exc:
                self.result.errores += 1
                self.log(f"Error leyendo sitemap {sitemap_url}: {exc}")
                continue

            self.log(f"Sitemap {sitemap_url}: {len(detail_urls)} detalles")

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
            "Ciencuadras finalizado: "
            f"{self.result.predios_encontrados} encontrados, "
            f"{self.result.predios_nuevos} nuevos, "
            f"{self.result.predios_actualizados} actualizados, "
            f"{self.result.errores} errores"
        )
        return self.result

    def _build_sitemap_urls(self) -> list[str]:
        explicit = self.fuente.configuracion.get("detail_sitemaps") or []
        if explicit:
            return self.dedupe_keep_order(explicit)

        negocio = (self.fuente.configuracion.get("negocio") or "venta").strip("/") or "venta"
        city_slug = (
            self.fuente.configuracion.get("city_slug")
            or self.fuente.configuracion.get("city_path")
            or "bogota"
        ).strip("/").split("/")[0]

        max_paginas = max(getattr(self.config, "max_paginas", 1) or 1, 1)
        base_url = self.fuente.url_base.rstrip("/")
        sitemap_urls = [f"{base_url}/sitemap-detalles-{negocio}-{city_slug}.xml"]
        for index in range(1, max_paginas):
            sitemap_urls.append(f"{base_url}/sitemap-detalles-{negocio}-{city_slug}-{index}.xml")
        return sitemap_urls

    def _extract_detail_urls_from_sitemap(self, sitemap_url: str) -> list[str]:
        response = self.session.get(sitemap_url, timeout=30)
        response.raise_for_status()

        locs = re.findall(r"<loc>([^<]+)</loc>", response.text, flags=re.IGNORECASE)
        allowed_types = self._allowed_types()
        detail_urls: list[str] = []
        for loc in locs:
            parsed = urlparse(loc)
            if "ciencuadras.com" not in parsed.netloc:
                continue
            if "/inmueble/" not in parsed.path:
                continue
            tipo = self._extract_tipo_from_url(parsed.path)
            if allowed_types and tipo not in allowed_types:
                continue
            detail_urls.append(loc.strip())
        return self.dedupe_keep_order(detail_urls)

    def _parse_detail(self, detail_url: str) -> dict:
        response = self.session.get(detail_url, timeout=30)
        response.raise_for_status()
        raw_html = response.text
        soup = BeautifulSoup(raw_html, "html.parser")

        product = self._extract_product_ldjson(soup) or {}
        offer = product.get("offers") or {}
        item_offered = offer.get("itemOffered") or {}

        title = self.clean_text(product.get("name")) or self._meta_content(soup, "property", "og:title")
        description = self._meta_content(soup, "name", "description") or self.clean_text(product.get("description"))
        codigo = (
            self._extract_escaped_string(raw_html, "propertyCode")
            or self._extract_escaped_number(raw_html, "propertyId")
            or self._extract_codigo_from_url(detail_url)
        )

        barrio, localidad, ciudad = self._extract_location_parts(title)
        tipo = self._extract_tipo_from_url(urlparse(detail_url).path) or self._extract_tipo_from_title(title)
        address = self._extract_escaped_string(raw_html, "address")
        latitud = self.text_to_decimal(self._nested_get(item_offered, "geo", "latitude"))
        longitud = self.text_to_decimal(self._nested_get(item_offered, "geo", "longitude"))

        area_construida = (
            self._extract_area_construida_from_description(description)
            or self.text_to_decimal(self._nested_get(item_offered, "floorSize", "value"))
            or self.text_to_decimal(self._extract_escaped_string(raw_html, "areaPrivate"))
        )
        area_lote = (
            self._extract_area_lote_from_description(description)
            or self.text_to_decimal(self._extract_escaped_string(raw_html, "totalArea"))
            or area_construida
        )

        estrato = (
            self._extract_additional_property(item_offered, "Estrato")
            or self.text_to_int(self._extract_escaped_string(raw_html, "stratum"))
        )
        pisos = self.text_to_int(self._extract_escaped_string(raw_html, "floor"))
        anio_construccion = self._extract_anio_construccion(self._extract_escaped_string(raw_html, "antiquity"))
        precio_publicado = (
            self.text_to_decimal(offer.get("price"))
            or self.text_to_decimal(self._extract_escaped_string(raw_html, "price"))
            or self.text_to_decimal(self._extract_escaped_string(raw_html, "sellingPrice"))
        )
        precio_m2 = self._compute_precio_m2(precio_publicado, area_lote or area_construida)
        imagenes = self._extract_images(soup, raw_html)
        contacto = self._extract_contact_info(soup, description, raw_html, detail_url)

        return {
            "fuente": self.fuente,
            "url_origen": detail_url,
            "codigo_externo": str(codigo or "").strip(),
            "barrio": barrio or "Sin barrio",
            "localidad": localidad or "Sin localidad",
            "ciudad": ciudad or "Bogotá",
            "direccion": address or barrio or "Sin dirección",
            "latitud": latitud,
            "longitud": longitud,
            "tipo": tipo or "casa",
            "area_lote": area_lote,
            "area_construida": area_construida,
            "estrato": estrato,
            "pisos": pisos,
            "anio_construccion": anio_construccion,
            "precio_publicado": precio_publicado,
            "precio_m2": precio_m2,
            "imagenes": imagenes,
            "descripcion_raw": description,
            "raw_data": {
                "title": title,
                "source": self.source_key,
                "contacto": contacto,
                "product_ldjson": product,
            },
        }

    def _extract_product_ldjson(self, soup) -> dict:
        for script in soup.select('script[type="application/ld+json"]'):
            content = (script.string or script.get_text() or "").strip()
            if not content:
                continue
            try:
                parsed = json.loads(content)
            except Exception:
                continue

            candidates = parsed if isinstance(parsed, list) else [parsed]
            for candidate in candidates:
                if not isinstance(candidate, dict):
                    continue
                if candidate.get("@type") == "Product":
                    return candidate
        return {}

    def _extract_contact_info(self, soup, description: str, raw_html: str, detail_url: str) -> dict:
        page_text = " ".join(filter(None, [description, soup.get_text(" ", strip=True)]))
        emails = self._extract_emails(page_text)
        phones = self._extract_phones(page_text)
        whatsapp_links = self._extract_whatsapp_links(soup, detail_url)
        publisher_name = (
            self._extract_publisher_name(description)
            or self._extract_escaped_string(raw_html, "publisher")
            or ""
        )

        whatsapp_phone = ""
        if whatsapp_links:
            whatsapp_phone = self._extract_phone_from_whatsapp_url(whatsapp_links[0]) or ""
            if whatsapp_phone and whatsapp_phone not in phones:
                phones.insert(0, whatsapp_phone)

        return {
            "publisher_name": publisher_name,
            "emails": emails,
            "phones": phones,
            "whatsapp_links": whatsapp_links,
            "whatsapp_phone": whatsapp_phone,
            "has_direct_contact": bool(emails or phones or whatsapp_links),
        }

    def _extract_publisher_name(self, description: str) -> str:
        match = re.search(r"\binformes\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ ]+)$", description.strip())
        if match:
            return self.clean_text(match.group(1))
        return ""

    def _extract_images(self, soup, raw_html: str) -> list[str]:
        urls: list[str] = []
        og_image = self._meta_content(soup, "property", "og:image")
        if og_image:
            urls.append(og_image)

        urls.extend(re.findall(r"https://[^\"'\\s>]+(?:jpg|jpeg|png|webp)", raw_html, flags=re.IGNORECASE))
        return self.dedupe_keep_order(urls)[:16]

    def _extract_location_parts(self, title: str) -> tuple[str, str, str]:
        match = re.search(
            r"en\s+(?:Venta|Arriendo),?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .-]+),\s*([A-Za-zÁÉÍÓÚÑáéíóúñ .-]+),\s*([A-Za-zÁÉÍÓÚÑáéíóúñ .-]+)",
            title,
            re.IGNORECASE,
        )
        if match:
            return (
                self.clean_text(match.group(1)).title(),
                self.clean_text(match.group(2)).title(),
                self.clean_text(match.group(3)).title(),
            )

        url_barrio = self._extract_barrio_from_title_or_url(title)
        return (url_barrio, "", "Bogotá")

    def _extract_barrio_from_title_or_url(self, title: str) -> str:
        lowered = title.lower()
        for marker in (" en venta en ", " en arriendo en "):
            if marker in lowered:
                start = lowered.index(marker) + len(marker)
                suffix = title[start:]
                return self.clean_text(suffix.split(",")[0]).title()
        return ""

    def _extract_tipo_from_title(self, title: str) -> str:
        lowered = title.lower()
        for needle, tipo in self.TYPE_MAP.items():
            if needle in lowered:
                return tipo
        return "casa"

    def _extract_tipo_from_url(self, path: str) -> str:
        match = re.search(r"/inmueble/([a-z0-9-]+)-en-", path)
        if not match:
            return "casa"
        raw_tipo = match.group(1).split("-")[0]
        return self.TYPE_MAP.get(raw_tipo, "casa")

    def _extract_codigo_from_url(self, detail_url: str) -> str:
        match = re.search(r"-(\d{6,})$", urlparse(detail_url).path)
        return match.group(1) if match else ""

    def _extract_area_construida_from_description(self, description: str) -> Decimal | None:
        patterns = [
            r"([\d.,]+)\s*m(?:²|2)?\s+de\s+área\s+construida",
            r"([\d.,]+)\s*m(?:²|2)?\s+área\s+construida",
        ]
        for pattern in patterns:
            match = re.search(pattern, description, flags=re.IGNORECASE)
            if match:
                return self.text_to_decimal(match.group(1))
        return None

    def _extract_area_lote_from_description(self, description: str) -> Decimal | None:
        match = re.search(
            r"([\d.,]+)\s*m(?:etros)?\s*de\s*frente\s*por\s*([\d.,]+)\s*m(?:etros)?\s*de\s*fondo",
            description,
            flags=re.IGNORECASE,
        )
        if not match:
            return None

        frente = self.text_to_decimal(match.group(1))
        fondo = self.text_to_decimal(match.group(2))
        if not frente or not fondo:
            return None
        try:
            return (frente * fondo).quantize(Decimal("0.01"))
        except Exception:
            return frente * fondo

    def _extract_additional_property(self, item_offered: dict, name: str) -> int | None:
        for item in item_offered.get("additionalProperty") or []:
            if not isinstance(item, dict):
                continue
            if self.clean_text(item.get("name")).lower() == name.lower():
                return self.text_to_int(item.get("value"))
        return None

    def _extract_anio_construccion(self, antiguedad: str | None) -> int | None:
        if not antiguedad:
            return None
        years = self.text_to_int(antiguedad)
        if years is None:
            return None
        current_year = 2026
        return max(current_year - years, 1900)

    def _extract_emails(self, text: str) -> list[str]:
        matches = re.findall(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text, flags=re.IGNORECASE)
        filtered = [email.lower() for email in matches if not email.lower().endswith("@ciencuadras.com")]
        return self.dedupe_keep_order(filtered)

    def _extract_phones(self, text: str) -> list[str]:
        matches = re.findall(r"(?:\+?57[\s-]?)?(?:3\d{2}|60\d)[\s-]?\d{3}[\s-]?\d{4}", text)
        normalized = [self._normalize_phone(match) for match in matches]
        normalized = [phone for phone in normalized if phone and phone != "+576013905331"]
        return self.dedupe_keep_order(normalized)

    def _extract_whatsapp_links(self, soup, detail_url: str) -> list[str]:
        links: list[str] = []
        for anchor in soup.select("a[href]"):
            href = anchor.get("href") or ""
            if "wa.me/" not in href and "whatsapp.com/" not in href and "api.whatsapp.com/" not in href:
                continue
            absolute = self.absolute_url(detail_url, href)
            if absolute:
                links.append(absolute)
        return self.dedupe_keep_order(links)

    def _extract_phone_from_whatsapp_url(self, url: str) -> str | None:
        match = re.search(r"(?:wa\.me/|phone=)(\d{10,15})", url)
        if not match:
            return None
        return self._normalize_phone(match.group(1))

    def _normalize_phone(self, value: str | None) -> str:
        if not value:
            return ""
        digits = re.sub(r"\D+", "", value)
        if not digits:
            return ""
        if digits.startswith("57") and len(digits) >= 12:
            digits = digits[2:]
        if len(digits) == 10 and digits.startswith("3"):
            return f"+57{digits}"
        if len(digits) == 10 and digits.startswith("60"):
            return f"+57{digits}"
        if len(digits) == 7:
            return digits
        return f"+{digits}" if not value.startswith("+") else value

    def _extract_escaped_string(self, raw_html: str, key: str) -> str:
        patterns = [
            rf"&q;{re.escape(key)}&q;:\s*&q;([^&]+?)&q;",
            rf'"{re.escape(key)}"\s*:\s*"([^"]+)"',
        ]
        for pattern in patterns:
            match = re.search(pattern, raw_html, flags=re.IGNORECASE)
            if match:
                return self.clean_text(match.group(1).replace("\\u0026", "&"))
        return ""

    def _extract_escaped_number(self, raw_html: str, key: str) -> str:
        patterns = [
            rf"&q;{re.escape(key)}&q;:\s*(\d+)",
            rf'"{re.escape(key)}"\s*:\s*(\d+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, raw_html, flags=re.IGNORECASE)
            if match:
                return match.group(1)
        return ""

    def _nested_get(self, value: dict, *keys: str):
        current = value
        for key in keys:
            if not isinstance(current, dict):
                return None
            current = current.get(key)
        return current

    def _meta_content(self, soup, attr: str, value: str) -> str:
        node = soup.find("meta", attrs={attr: value})
        return self.clean_text(node.get("content")) if node and node.get("content") else ""

    def _compute_precio_m2(self, precio: Decimal | None, area: Decimal | None) -> Decimal | None:
        if not precio or not area or area <= 0:
            return None
        try:
            return (precio / area).quantize(Decimal("0.01"))
        except Exception:
            return None

    def _allowed_types(self) -> set[str]:
        tipos = list(getattr(self.config, "tipos_predio", None) or [])
        normalized = {self.TYPE_MAP.get(str(item).strip().lower(), str(item).strip().lower()) for item in tipos if str(item).strip()}
        return {item for item in normalized if item}

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
        payload = dict(payload)
        payload.pop("fuente", None)

        obj = self.find_existing_predio(payload)
        contacto = payload.get("raw_data", {}).get("contacto", {})
        if obj:
            for field, value in payload.items():
                setattr(obj, field, value)
            obj.save()
            self.upsert_propietario_contacto(obj, contacto)
            return False

        predio = Predio.objects.create(
            fuente=self.fuente,
            estado="para_estudio",
            **payload,
        )
        self.upsert_propietario_contacto(predio, contacto)
        return True
