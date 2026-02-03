import uuid
from django.db import models

from .utilisateur import Entreprise
from .base import TimestampedModel


class TypeOffre(models.TextChoices):
    FREEMIUM = "Freemium", "Freemium"
    PREMIUM = "Premium", "Premium"


class Offre(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name="offres")
    type = models.CharField(max_length=20, choices=TypeOffre.choices)
    dateDebut = models.DateTimeField()
    dateFin = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    nbRuchersMax = models.IntegerField()
    nbCapteursMax = models.IntegerField()
    stripeCustomerId = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "offres"
        verbose_name = "Offre"
        verbose_name_plural = "Offres"

    def __str__(self):
        return f"Offre {self.type} ({self.entreprise})"
