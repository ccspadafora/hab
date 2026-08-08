from __future__ import annotations

from django.db import models


class PerfilConstructoraMPQuerySet(models.QuerySet):
    def certificadas(self):
        return self.filter(estado_certificacion='certificada')


class PerfilConstructoraMPManager(models.Manager):
    def get_queryset(self):
        return PerfilConstructoraMPQuerySet(self.model, using=self._db)

    def certificadas(self):
        return self.get_queryset().certificadas()
