from django.db import models
import uuid

class RoleUtilisateur(models.TextChoices):
    ADMIN = 'Admin', 'Admin'
    APICULTEUR = 'Apiculteur', 'Apiculteur'
    LECTEUR = 'Lecteur', 'Lecteur'

class Utilisateur(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    motDePasseHash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=RoleUtilisateur.choices, default=RoleUtilisateur.LECTEUR)
    dateCreation = models.DateTimeField(auto_now_add=True)
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = 'utilisateurs'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom}"
