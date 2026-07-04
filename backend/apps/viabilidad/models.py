from django.db import models


class AnalisisViabilidad(models.Model):
    predio   = models.OneToOneField('scraping.Predio', on_delete=models.CASCADE, related_name='analisis')
    analista = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL)

    # Normativa POT
    zona_pot            = models.CharField(max_length=100, blank=True)
    indice_construccion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    indice_ocupacion    = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    altura_max_pisos    = models.IntegerField(null=True, blank=True)
    uso_suelo           = models.CharField(max_length=200, blank=True)
    densidad_max_uds    = models.IntegerField(null=True, blank=True)

    # Proyección financiera
    area_edificable      = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unidades_proyectadas = models.IntegerField(null=True, blank=True)
    precio_m2_nuevo      = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    valor_bruto_proyecto = models.DecimalField(max_digits=25, decimal_places=2, null=True, blank=True)
    costo_construccion   = models.DecimalField(max_digits=25, decimal_places=2, null=True, blank=True)
    valor_max_predio     = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    utilidad_estimada    = models.DecimalField(max_digits=25, decimal_places=2, null=True, blank=True)
    margen_estimado      = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Resultado
    es_viable           = models.BooleanField(null=True)
    razon_no_viabilidad = models.TextField(blank=True)
    score_viabilidad    = models.IntegerField(null=True, blank=True)
    justificacion_ia    = models.TextField(blank=True)
    notas               = models.TextField(blank=True)

    solicitado_en = models.DateTimeField(auto_now_add=True)
    completado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Análisis de viabilidad'
        ordering = ['-solicitado_en']

    def __str__(self):
        if self.es_viable is True:
            estado = 'viable'
        elif self.es_viable is False:
            estado = 'descartado'
        else:
            estado = 'pendiente'
        return f'Análisis {self.predio} — {estado}'
