from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_intervention_nullable_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="invitation",
            name="token",
            field=models.TextField(unique=True),
        ),
    ]
