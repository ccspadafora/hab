from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracionscraping',
            name='ciudades',
            field=models.JSONField(default=list),
        ),
    ]
