import uuid
from django.db import models

from .utilisateur import Entreprise
from .base import TimestampedModel


class TypeOffre(models.TextChoices):
    FREEMIUM = "Freemium", "Freemium"
    PREMIUM = "Premium", "Premium"


class TypeOffreModel(models.Model):
    value = models.CharField(primary_key=True, max_length=20)
    titre = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "type_offre"
        verbose_name = "Type d'offre"
        verbose_name_plural = "Types d'offre"

    def __str__(self):
        return self.titre


class LimitationOffre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    typeOffre = models.ForeignKey(
        TypeOffreModel,
        to_field="value",
        db_column="typeOffre",
        on_delete=models.PROTECT,
    )
    nbRuchersMax = models.IntegerField()
    nbCapteursMax = models.IntegerField()
    nbReinesMax = models.IntegerField()

    class Meta:
        db_table = "limitations_offres"
        verbose_name = "LimitationOffre"
        verbose_name_plural = "LimitationsOffres"

    def __str__(self):
        return f"{self.typeOffre} (R:{self.nbRuchersMax}, C:{self.nbCapteursMax}, Q:{self.nbReinesMax})"


class Offre(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entreprise = models.OneToOneField(Entreprise, on_delete=models.CASCADE, related_name="offre")
    type = models.ForeignKey(
        TypeOffreModel,
        to_field="value",
        db_column="type",
        on_delete=models.PROTECT,
    )
    dateDebut = models.DateTimeField()
    dateFin = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    nbRuchersMax = models.IntegerField()
    nbCapteursMax = models.IntegerField()
    nbReinesMax = models.IntegerField(default=0)
    stripeCustomerId = models.CharField(max_length=255, blank=True)
    stripeSubscriptionId = models.CharField(max_length=255, blank=True)
    limitationOffre = models.ForeignKey(
        LimitationOffre,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="offres",
    )

    class Meta:
        db_table = "offres"
        verbose_name = "Offre"
        verbose_name_plural = "Offres"

    def __str__(self):
        return f"Offre {self.type} ({self.entreprise})"
