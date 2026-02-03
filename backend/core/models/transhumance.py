from django.db import models
import uuid
from .organisation import TypeFlore
from .base import TimestampedModel

class Transhumance(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField()
    origineLat = models.FloatField()
    origineLng = models.FloatField()
    destinationLat = models.FloatField()
    destinationLng = models.FloatField()
    floreCible = models.CharField(max_length=20, choices=TypeFlore.choices)
    rucher = models.ForeignKey('Rucher', on_delete=models.CASCADE, related_name='transhumances')

    class Meta:
        db_table = 'transhumances'
        verbose_name = 'Transhumance'
        verbose_name_plural = 'Transhumances'

    def __str__(self):
        return f"Transhumance du {self.date} - {self.rucher.nom}"

class TypeAlerte(models.TextChoices):
    VOL = 'Vol', 'Vol'
    CHUTE_POIDS = 'ChutePoids', 'ChutePoids'
    TEMPERATURE_CRITIQUE = 'TemperatureCritique', 'TemperatureCritique'
    BATTERIE_FAIBLE = 'BatterieFaible', 'BatterieFaible'
    DEPLACEMENT_GPS = 'DeplacementGPS', 'DeplacementGPS'
    HORS_LIGNE = 'HorsLigne', 'HorsLigne'

class Alerte(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, choices=TypeAlerte.choices)
    message = models.TextField()
    acquittee = models.BooleanField(default=False)
    capteur = models.ForeignKey('Capteur', on_delete=models.CASCADE, related_name='alertes')

    class Meta:
        db_table = 'alertes'
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'

    def __str__(self):
        return f"Alerte {self.type} - {self.created_at}"
