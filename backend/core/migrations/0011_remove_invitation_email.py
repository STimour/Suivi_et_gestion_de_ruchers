from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0010_alter_reine_lignee_alter_ruche_maladie_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="invitation",
            name="email",
        ),
    ]
