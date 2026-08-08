from __future__ import annotations

from django.db import models


class PublicacionInmuebleQuerySet(models.QuerySet):
    def activas(self):
        return self.filter(estado='activa', visible_constructoras=True)

    def en_revision(self):
        return self.filter(estado='en_revision')

    def de_propietario(self, propietario_id: int):
        return self.filter(propietario_id=propietario_id)

    def catalogo(self):
        return self.activas().order_by('-score_prefactibilidad', '-publicado_en')


class PublicacionInmuebleManager(models.Manager):
    def get_queryset(self):
        return PublicacionInmuebleQuerySet(self.model, using=self._db)

    def activas(self):
        return self.get_queryset().activas()

    def en_revision(self):
        return self.get_queryset().en_revision()

    def de_propietario(self, propietario_id: int):
        return self.get_queryset().de_propietario(propietario_id)

    def catalogo(self):
        return self.get_queryset().catalogo()
