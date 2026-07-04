from django.db import migrations, models


ESTADO_MAP = {
    'nuevo': 'para_estudio',
    'contactado': 'contacto_inicial',
    'en_analisis': 'prefactibilidad',
    'viable': 'viable_negociacion',
    'no_viable': 'descartado',
    'descartado': 'descartado',
}


def forwards(apps, schema_editor):
    Predio = apps.get_model('scraping', 'Predio')
    for old_value, new_value in ESTADO_MAP.items():
        Predio.objects.filter(estado=old_value).update(estado=new_value)


def backwards(apps, schema_editor):
    Predio = apps.get_model('scraping', 'Predio')
    reverse_map = {
        'para_estudio': 'nuevo',
        'contacto_inicial': 'contactado',
        'prefactibilidad': 'en_analisis',
        'viable_negociacion': 'viable',
        'cierres_potenciales': 'viable',
        'estruct_propietarios': 'contactado',
        'descartado': 'descartado',
    }
    for old_value, new_value in reverse_map.items():
        Predio.objects.filter(estado=old_value).update(estado=new_value)


class Migration(migrations.Migration):
    dependencies = [
        ('scraping', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='predio',
            name='estado',
            field=models.CharField(
                choices=[
                    ('para_estudio', 'Para estudio'),
                    ('contacto_inicial', 'Contacto inicial'),
                    ('prefactibilidad', 'Prefactibilidad'),
                    ('viable_negociacion', 'Viable - pasar a negociación'),
                    ('cierres_potenciales', 'Cierres potenciales'),
                    ('estruct_propietarios', 'Estructuración propietarios'),
                    ('descartado', 'Descartado'),
                ],
                db_index=True,
                default='para_estudio',
                max_length=32,
            ),
        ),
        migrations.RunPython(forwards, backwards),
    ]
