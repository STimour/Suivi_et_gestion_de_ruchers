from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0024_notification'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    """
                    ALTER TABLE capteurs
                        ADD COLUMN IF NOT EXISTS "gpsAlertActive" boolean NOT NULL DEFAULT false;
                    ALTER TABLE capteurs
                        ADD COLUMN IF NOT EXISTS "gpsReferenceLat" double precision NULL;
                    ALTER TABLE capteurs
                        ADD COLUMN IF NOT EXISTS "gpsReferenceLng" double precision NULL;
                    ALTER TABLE capteurs
                        ADD COLUMN IF NOT EXISTS "gpsThresholdMeters" double precision NOT NULL DEFAULT 100.0;
                    ALTER TABLE capteurs
                        ADD COLUMN IF NOT EXISTS "gpsLastCheckedAt" timestamp with time zone NULL;
                    ALTER TABLE capteurs
                        ADD COLUMN IF NOT EXISTS "gpsLastAlertAt" timestamp with time zone NULL;
                    """,
                    reverse_sql="""
                    ALTER TABLE capteurs DROP COLUMN IF EXISTS "gpsLastAlertAt";
                    ALTER TABLE capteurs DROP COLUMN IF EXISTS "gpsLastCheckedAt";
                    ALTER TABLE capteurs DROP COLUMN IF EXISTS "gpsThresholdMeters";
                    ALTER TABLE capteurs DROP COLUMN IF EXISTS "gpsReferenceLng";
                    ALTER TABLE capteurs DROP COLUMN IF EXISTS "gpsReferenceLat";
                    ALTER TABLE capteurs DROP COLUMN IF EXISTS "gpsAlertActive";
                    """,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='capteur',
                    name='gpsAlertActive',
                    field=models.BooleanField(default=False),
                ),
                migrations.AddField(
                    model_name='capteur',
                    name='gpsReferenceLat',
                    field=models.FloatField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='capteur',
                    name='gpsReferenceLng',
                    field=models.FloatField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='capteur',
                    name='gpsThresholdMeters',
                    field=models.FloatField(default=100.0),
                ),
                migrations.AddField(
                    model_name='capteur',
                    name='gpsLastCheckedAt',
                    field=models.DateTimeField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='capteur',
                    name='gpsLastAlertAt',
                    field=models.DateTimeField(blank=True, null=True),
                ),
            ],
        ),
        migrations.AlterField(
            model_name='alerte',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
