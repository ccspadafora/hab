#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any


DEFAULT_SOURCE_NAME = "Carga CSV manual"
DEFAULT_SOURCE_URL = "https://hab.com.co/manual"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "sin-valor"


def compact_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def parse_money(value: str) -> str | None:
    raw = compact_spaces(value).replace("COP", "").replace("$", "").replace("\xa0", "")
    raw = raw.replace(",", "")
    if not raw:
        return None
    try:
        return str(Decimal(raw))
    except InvalidOperation:
        return None


def parse_decimal(value: str) -> str | None:
    raw = compact_spaces(value).replace(",", ".")
    if not raw:
        return None
    try:
        return str(Decimal(raw))
    except InvalidOperation:
        return None


def normalize_phone(value: str) -> str:
    return re.sub(r"\D+", "", value or "")


def first_phone(value: str) -> str:
    matches = re.findall(r"\d{7,}", value or "")
    return matches[0] if matches else ""


def first_valid_url(value: str) -> str:
    parts = compact_spaces(value).split()
    for part in parts:
        if part.startswith(("http://", "https://")):
            return part
    return ""


def map_estado(embudo: str) -> str:
    key = compact_spaces(embudo).lower()
    mapping = {
        "no viables": "no_viable",
        "viables": "viable",
        "viable": "viable",
        "en análisis": "en_analisis",
        "en analisis": "en_analisis",
        "contacto inicial": "contactado",
        "contactado": "contactado",
        "descartado": "descartado",
    }
    return mapping.get(key, "nuevo")


def map_tipo(nombre: str, direccion: str) -> str:
    hay = f"{nombre} {direccion}".lower()
    if "lote" in hay:
        return "lote"
    if "apart" in hay:
        return "apartamento"
    if "local" in hay:
        return "local"
    return "casa"


def map_barrio(row: dict[str, str]) -> str:
    for key in ("UPL", "LOCALIDAD", "Dirección", "Nombre"):
        value = compact_spaces(row.get(key, ""))
        if value:
            return value[:200]
    return "Sin barrio"


def map_localidad(row: dict[str, str]) -> str:
    value = compact_spaces(row.get("LOCALIDAD", ""))
    if value:
        return value
    upl = compact_spaces(row.get("UPL", ""))
    if upl:
        return upl.split(" ")[0]
    return "Bogota"


def split_personas(value: str) -> list[str]:
    normalized = compact_spaces(value)
    if not normalized:
        return []
    parts = [compact_spaces(p) for p in normalized.split(",")]
    return [p for p in parts if p]


@dataclass
class ApiClient:
    base_url: str
    token: str

    def request(self, method: str, path: str, payload: dict[str, Any] | None = None, query: dict[str, str] | None = None) -> Any:
        url = self.base_url.rstrip("/") + path
        if query:
            url += "?" + urllib.parse.urlencode(query)
        data = None
        headers = {"Authorization": f"Bearer {self.token}"}
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else None
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{method} {path} -> {exc.code}: {body}") from exc


def unwrap_list(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        results = payload.get("results")
        if isinstance(results, list):
            return results
    raise RuntimeError(f"Respuesta inesperada para listado: {payload!r}")


def login(base_url: str, username: str, password: str) -> str:
    url = base_url.rstrip("/") + "/auth/login/"
    payload = json.dumps({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method="POST", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["access"]


def ensure_source(api: ApiClient, source_name: str) -> int:
    sources = unwrap_list(api.request("GET", "/scraping/fuentes/"))
    for source in sources:
        if source.get("nombre") == source_name:
            return source["id"]
    created = api.request(
        "POST",
        "/scraping/fuentes/",
        {
            "nombre": source_name,
            "url_base": DEFAULT_SOURCE_URL,
            "activo": True,
            "configuracion": {},
        },
    )
    return created["id"]


def fetch_existing_predio(api: ApiClient, codigo_externo: str) -> dict[str, Any] | None:
    items = unwrap_list(api.request("GET", "/predios/", query={"search": codigo_externo}))
    if len(items) == 1:
        return items[0]
    for item in items:
        if item.get("codigo_externo") == codigo_externo:
            return item
    return None


def fetch_existing_propietario(api: ApiClient, telefono: str) -> dict[str, Any] | None:
    if not telefono:
        return None
    items = unwrap_list(api.request("GET", "/propietarios/", query={"search": telefono}))
    for item in items:
        if normalize_phone(item.get("telefono_principal", "")) == telefono:
            return item
    return None


def create_predio_payload(row: dict[str, str], source_id: int, index: int) -> dict[str, Any]:
    nombre = compact_spaces(row.get("Nombre", ""))
    direccion = compact_spaces(row.get("Dirección", ""))
    localidad = map_localidad(row)
    barrio = map_barrio(row)
    source_text = "|".join(
        [
            nombre,
            direccion,
            localidad,
            compact_spaces(row.get("Fecha de creación", "")),
            compact_spaces(row.get("Teléfono", "")),
        ]
    )
    slug = hashlib.sha1(source_text.encode("utf-8")).hexdigest()[:12]
    codigo = f"CSVLC-{index:03d}"
    precio = parse_money(row.get("Costo mínimo", "")) or parse_money(row.get("Costo Máximo", ""))
    source_url = first_valid_url(row.get("URL", ""))
    payload: dict[str, Any] = {
        "fuente": source_id,
        "codigo_externo": codigo,
        "url_origen": source_url or f"{DEFAULT_SOURCE_URL}/{slugify(localidad)}/{slug}",
        "barrio": barrio,
        "localidad": localidad,
        "ciudad": "Bogota",
        "direccion": direccion or nombre,
        "tipo": map_tipo(nombre, direccion),
        "estado": map_estado(row.get("Embudo", "")),
        "descripcion_raw": compact_spaces(row.get("Estatus Jurídico", "")) or nombre,
    }
    area_lote = parse_decimal(row.get("M2(lote)", ""))
    precio_m2 = parse_money(row.get("PRECIO M2", ""))
    if area_lote:
        payload["area_lote"] = area_lote
    if precio:
        payload["precio_publicado"] = precio
    if precio_m2 and precio_m2 != "0":
        payload["precio_m2"] = precio_m2
    estrato_raw = compact_spaces(row.get("Tratamiento urbanístico", ""))
    if estrato_raw.isdigit():
        payload["estrato"] = int(estrato_raw)
    return payload


def create_propietario_payload(row: dict[str, str], asesor_id: int | None) -> dict[str, Any] | None:
    telefono = first_phone(row.get("Teléfono", ""))
    nombre = compact_spaces(row.get("Persona de contacto", "")) or compact_spaces(row.get("Nombre", ""))
    if not telefono or not nombre:
        return None
    tipo_contacto = compact_spaces(row.get("Tipo de contacto", "")).lower()
    payload: dict[str, Any] = {
        "nombre": nombre,
        "tipo": "persona_juridica" if "inmobiliaria" in tipo_contacto else "persona_natural",
        "telefono_principal": telefono,
        "whatsapp_phone": telefono,
        "ciudad": "Bogota",
        "asesor_asignado": asesor_id,
        "fuente_origen": "csv_lotes_y_casas",
        "etiquetas": ["importado_csv"],
    }
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa predios desde CSV por endpoints")
    parser.add_argument("--csv", required=True, help="Ruta al CSV")
    parser.add_argument("--api-base", required=True, help="Base API, ejemplo http://54.210.122.251/api/v1")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--source-name", default=DEFAULT_SOURCE_NAME)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.0)
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"No existe el CSV: {csv_path}", file=sys.stderr)
        return 1

    token = login(args.api_base, args.username, args.password)
    api = ApiClient(args.api_base, token)
    source_id = ensure_source(api, args.source_name)
    me = api.request("GET", "/auth/me/")
    asesor_id = me.get("id")

    created_predios = 0
    skipped_predios = 0
    created_props = 0
    linked_props = 0
    errors = 0

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader, start=1):
            if args.limit and index > args.limit:
                break
            try:
                predio_payload = create_predio_payload(row, source_id, index)
                existing = fetch_existing_predio(api, predio_payload["codigo_externo"])
                if existing:
                    predio_id = existing["id"]
                    skipped_predios += 1
                else:
                    created = api.request("POST", "/predios/", predio_payload)
                    predio_id = created["id"]
                    created_predios += 1

                propietario_payload = create_propietario_payload(row, asesor_id)
                if propietario_payload:
                    telefono = propietario_payload["telefono_principal"]
                    propietario = fetch_existing_propietario(api, telefono)
                    if propietario:
                        propietario_id = propietario["id"]
                    else:
                        propietario = api.request("POST", "/propietarios/", propietario_payload)
                        propietario_id = propietario["id"]
                        created_props += 1
                    api.request(
                        "POST",
                        f"/predios/{predio_id}/agregar_propietario/",
                        {"propietario": propietario_id, "rol": "propietario", "porcentaje_propiedad": 100},
                    )
                    linked_props += 1
                if args.sleep:
                    time.sleep(args.sleep)
                print(f"[ok] fila={index} predio={predio_id} codigo={predio_payload['codigo_externo']}")
            except Exception as exc:  # noqa: BLE001
                errors += 1
                print(f"[error] fila={index}: {exc}", file=sys.stderr)

    print(
        json.dumps(
            {
                "source_id": source_id,
                "created_predios": created_predios,
                "skipped_predios": skipped_predios,
                "created_propietarios": created_props,
                "linked_propietarios": linked_props,
                "errors": errors,
            },
            ensure_ascii=True,
        )
    )
    return 0 if errors == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
