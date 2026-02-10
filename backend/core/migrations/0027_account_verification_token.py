from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0025_capteur_gps_alert_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='AccountVerificationToken',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('token', models.TextField(unique=True)),
                ('dateExpiration', models.DateTimeField()),
                ('utilise', models.BooleanField(default=False)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('utilisateur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verification_tokens', to='core.utilisateur')),
            ],
            options={
                'verbose_name': 'AccountVerificationToken',
                'verbose_name_plural': 'AccountVerificationTokens',
                'db_table': 'account_verification_tokens',
            },
        ),
    ]
