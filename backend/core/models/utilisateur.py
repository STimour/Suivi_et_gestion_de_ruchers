from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from .base import TimestampedModel

class RoleUtilisateur(models.TextChoices):
    ADMIN_ENTREPRISE = 'AdminEntreprise', 'AdminEntreprise'
    APICULTEUR = 'Apiculteur', 'Apiculteur'
    LECTEUR = 'Lecteur', 'Lecteur'

class Utilisateur(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    motDePasseHash = models.CharField(max_length=255)
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = 'utilisateurs'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom}"

class Entreprise(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    adresse = models.TextField()

    class Meta:
        db_table = 'entreprises'
        verbose_name = 'Entreprise'
        verbose_name_plural = 'Entreprises'

    def __str__(self):
        return self.nom


class TypeProfileEntreprise(models.TextChoices):
    APICULTEUR_PRODUCTEUR = 'ApiculteurProducteur', 'ApiculteurProducteur'
    ELEVEUR_DE_REINES = 'EleveurDeReines', 'EleveurDeReines'
    POLLINISATEUR = 'Pollinisateur', 'Pollinisateur'


class EntrepriseProfile(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='profils')
    typeProfile = models.CharField(max_length=30, choices=TypeProfileEntreprise.choices)

    class Meta:
        db_table = 'entreprise_profiles'
        verbose_name = 'EntrepriseProfile'
        verbose_name_plural = 'EntrepriseProfiles'

    def __str__(self):
        return f"{self.entreprise} - {self.typeProfile}"

class UtilisateurEntreprise(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='appartenances')
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='membres')
    role = models.CharField(max_length=20, choices=RoleUtilisateur.choices)

    class Meta:
        db_table = 'utilisateurs_entreprises'
        verbose_name = 'UtilisateurEntreprise'
        verbose_name_plural = 'UtilisateursEntreprises'
        unique_together = ['utilisateur', 'entreprise']

    def __str__(self):
        return f"{self.utilisateur} - {self.entreprise} ({self.role})"

class Invitation(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.TextField(unique=True)
    rolePropose = models.CharField(max_length=20, choices=RoleUtilisateur.choices)
    dateExpiration = models.DateTimeField()
    acceptee = models.BooleanField(default=False)
    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='invitations')
    envoyeePar = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='invitations_envoyees')

    class Meta:
        db_table = 'invitations'
        verbose_name = 'Invitation'
        verbose_name_plural = 'Invitations'

    def __str__(self):
        return f"Invitation {self.id} - {self.entreprise}"
