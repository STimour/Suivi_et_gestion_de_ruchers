from django.db import models
from django.utils import timezone
import uuid
from .base import TimestampedModel


class TypeNotification(models.TextChoices):
    RAPPEL_VISITE = 'RappelVisite', 'RappelVisite'
    RAPPEL_TRAITEMENT = 'RappelTraitement', 'RappelTraitement'
    EQUIPE = 'Equipe', 'Equipe'
    SAISONNIER = 'Saisonnier', 'Saisonnier'
    ALERTE_SANITAIRE = 'AlerteSanitaire', 'AlerteSanitaire'
    ALERTE_GPS = 'AlerteGPS', 'AlerteGPS'


class Notification(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, choices=TypeNotification.choices)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    lue = models.BooleanField(default=False)
    date = models.DateTimeField(default=timezone.now)
    utilisateur = models.ForeignKey(
        'Utilisateur', on_delete=models.CASCADE, related_name='notifications'
    )
    entreprise = models.ForeignKey(
        'Entreprise', on_delete=models.CASCADE, related_name='notifications'
    )
    ruche = models.ForeignKey(
        'Ruche', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications'
    )
    intervention = models.ForeignKey(
        'Intervention', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications'
    )

    class Meta:
        db_table = 'notifications'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['utilisateur', 'entreprise', '-date']),
            models.Index(fields=['utilisateur', 'lue']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"{self.type} - {self.titre}"
