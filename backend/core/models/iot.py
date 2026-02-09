from django.db import models
from django.utils import timezone
import uuid
from .base import TimestampedModel

class TypeCapteur(models.TextChoices):
    POIDS = 'Poids', 'Poids'
    TEMPERATURE = 'Temperature', 'Temperature'
    HUMIDITE = 'Humidite', 'Humidite'
    GPS = 'GPS', 'GPS'
    CO2 = 'CO2', 'CO2'
    SON = 'Son', 'Son'
    BATTERIE = 'Batterie', 'Batterie'

class Capteur(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=20, choices=TypeCapteur.choices)
    identifiant = models.CharField(max_length=100, unique=True)
    actif = models.BooleanField(default=True)
    batteriePct = models.FloatField(null=True, blank=True)
    derniereCommunication = models.DateTimeField(null=True, blank=True)
    ruche = models.ForeignKey('Ruche', on_delete=models.CASCADE, related_name='capteurs')

    class Meta:
        db_table = 'capteurs'
        verbose_name = 'Capteur'
        verbose_name_plural = 'Capteurs'

    def __str__(self):
        return f"{self.type} - {self.identifiant}"

class Mesure(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateTimeField(default=timezone.now)
    valeur = models.FloatField()
    capteur = models.ForeignKey(Capteur, on_delete=models.CASCADE, related_name='mesures')

    class Meta:
        db_table = 'mesures'
        verbose_name = 'Mesure'
        verbose_name_plural = 'Mesures'

    def __str__(self):
        return f"{self.capteur.type}: {self.valeur} ({self.created_at})"
