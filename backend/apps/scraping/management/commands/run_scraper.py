from django.core.management.base import BaseCommand, CommandError

from apps.configuracion.models import ConfiguracionScraping
from apps.scraping.models import FuenteScraping
from apps.scraping.services.registry import get_scraper_for_fuente


class Command(BaseCommand):
    help = "Ejecuta manualmente el scraper de una fuente."

    def add_arguments(self, parser):
        parser.add_argument("--fuente-id", type=int, help="ID de la fuente")
        parser.add_argument("--fuente", type=str, help="Nombre o parte del nombre de la fuente")

    def handle(self, *args, **options):
        fuente_id = options.get("fuente_id")
        fuente_name = options.get("fuente")

        qs = FuenteScraping.objects.filter(activo=True)
        if fuente_id:
            fuente = qs.filter(pk=fuente_id).first()
        elif fuente_name:
            fuente = qs.filter(nombre__icontains=fuente_name).first()
        else:
            raise CommandError("Debes pasar --fuente-id o --fuente.")

        if not fuente:
            raise CommandError("No se encontró la fuente solicitada.")

        config = ConfiguracionScraping.objects.filter(fuente=fuente).first()
        scraper = get_scraper_for_fuente(fuente, config=config)
        result = scraper.ejecutar()

        self.stdout.write(self.style.SUCCESS(f"Fuente: {fuente.nombre}"))
        self.stdout.write(f"Encontrados: {result.predios_encontrados}")
        self.stdout.write(f"Nuevos: {result.predios_nuevos}")
        self.stdout.write(f"Actualizados: {result.predios_actualizados}")
        self.stdout.write(f"Errores: {result.errores}")
        if result.logs:
            self.stdout.write("")
            self.stdout.write(result.log_text)
