from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_offre"),
    ]

    operations = [
        migrations.CreateModel(
            name="__tmp__TypeMaladie",
            fields=[],
            options={"managed": False, "default_permissions": ()},
        ),
        migrations.AddField(
            model_name="ruche",
            name="maladie",
            field=models.CharField(
                max_length=50,
                choices=[
                    ("Aucune", "Aucune"),
                    ("Varroose", "Varroose"),
                    ("Nosemose", "Nosemose"),
                    ("LoqueAmericaine", "LoqueAmericaine"),
                    ("LoqueEuropeenne", "LoqueEuropeenne"),
                    ("Acarapisose", "Acarapisose"),
                    ("Ascospherose", "Ascospherose"),
                    ("Tropilaelaps", "Tropilaelaps"),
                    ("VirusAilesDeformees", "VirusAilesDeformees"),
                    ("ParalysieChronique", "ParalysieChronique"),
                    ("IntoxicationPesticides", "IntoxicationPesticides"),
                ],
                default="Aucune",
            ),
        ),
    ]

