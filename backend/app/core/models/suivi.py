from django.db import models
import uuid
from django.core.validators import MinValueValidator

class TypeIntervention(models.TextChoices):
    VISITE = 'Visite', 'Visite'
    NOURRISSEMENT = 'Nourrissement', 'Nourrissement'
    TRAITEMENT = 'Traitement', 'Traitement'
    RECOLTE = 'Recolte', 'Recolte'
    DIVISION = 'Division', 'Division'
    POSE_HAUSSE = 'PoseHausse', 'PoseHausse'
    CONTROLE_SANITAIRE = 'ControleSanitaire', 'ControleSanitaire'

class Intervention(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, choices=TypeIntervention.choices)
    date = models.DateField()
    observations = models.TextField(blank=True)
    produit = models.CharField(max_length=200, blank=True)
    dosage = models.CharField(max_length=100, blank=True)
    nbHausses = models.IntegerField(validators=[MinValueValidator(0)], null=True, blank=True)
    poidsKg = models.FloatField(validators=[MinValueValidator(0.0)], null=True, blank=True)
    ruche = models.ForeignKey('Ruche', on_delete=models.CASCADE, related_name='interventions')

    def __str__(self):
        return f"{self.type} - {self.ruche.immatriculation} ({self.date})"
