from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_entreprise_remove_rucher_possesseur_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Offre",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        max_length=20,
                        choices=[("Freemium", "Freemium"), ("Premium", "Premium")],
                    ),
                ),
                ("dateDebut", models.DateTimeField()),
                ("dateFin", models.DateTimeField(null=True, blank=True)),
                ("active", models.BooleanField(default=True)),
                ("nbRuchersMax", models.IntegerField()),
                ("nbCapteursMax", models.IntegerField()),
                ("stripeCustomerId", models.CharField(max_length=255, blank=True)),
                (
                    "entreprise",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="offres",
                        to="core.entreprise",
                    ),
                ),
            ],
            options={
                "verbose_name": "Offre",
                "verbose_name_plural": "Offres",
                "db_table": "offres",
            },
        ),
    ]

