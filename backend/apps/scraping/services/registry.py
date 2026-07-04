from urllib.parse import urlparse

from .fincaraiz import FincaRaizScraper


def get_scraper_for_fuente(fuente, config=None):
    source_name = (fuente.nombre or "").lower()
    source_host = urlparse(fuente.url_base).netloc.lower()

    if "fincaraiz" in source_name or "fincaraiz" in source_host:
        return FincaRaizScraper(fuente=fuente, config=config)

    raise ValueError(f"No existe scraper implementado para la fuente '{fuente.nombre}'.")
