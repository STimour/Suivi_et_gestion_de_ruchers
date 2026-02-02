from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator

class TypeFlore(models.TextChoices):
    ACACIA = 'Acacia', 'Acacia'
    COLZA = 'Colza', 'Colza'
    LAVANDE = 'Lavande', 'Lavande'
    TOURNESOL = 'Tournesol', 'Tournesol'
    CHATAIGNIER = 'Chataignier', 'Chataignier'
    BRUYERE = 'Bruyere', 'Bruyere'
    MONTAGNE = 'Montagne', 'Montagne'
    TOUTES_FLEURS = 'ToutesFleurs', 'ToutesFleurs'

class StatutRuche(models.TextChoices):
    ACTIVE = 'Active', 'Active'
    FAIBLE = 'Faible', 'Faible'
    MALADE = 'Malade', 'Malade'
    MORTE = 'Morte', 'Morte'

class Rucher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    flore = models.CharField(max_length=20, choices=TypeFlore.choices)
    altitude = models.IntegerField()
    notes = models.TextField(blank=True)
    entreprise = models.ForeignKey('Entreprise', on_delete=models.CASCADE, related_name='ruchers', null=True, blank=True)

    class Meta:
        db_table = 'ruchers'
        verbose_name = 'Rucher'
        verbose_name_plural = 'Ruchers'

    def __str__(self):
        return self.nom

class Ruche(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    immatriculation = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=100)
    race = models.CharField(max_length=100)
    statut = models.CharField(max_length=20, choices=StatutRuche.choices, default=StatutRuche.ACTIVE)
    securisee = models.BooleanField(default=False)
    rucher = models.ForeignKey(Rucher, on_delete=models.CASCADE, related_name='ruches')
    reine = models.OneToOneField('Reine', on_delete=models.SET_NULL, null=True, blank=True, related_name='ruche')

    class Meta:
        db_table = 'ruches'
        verbose_name = 'Ruche'
        verbose_name_plural = 'Ruches'

    def __str__(self):
        return self.immatriculation

class Reine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    anneeNaissance = models.IntegerField(validators=[MinValueValidator(1900), MaxValueValidator(2100)])
    codeCouleur = models.CharField(max_length=20)
    lignee = models.CharField(max_length=100)
    noteDouceur = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    commentaire = models.TextField(blank=True)
    nonReproductible = models.BooleanField(default=False)

    class Meta:
        db_table = 'reines'
        verbose_name = 'Reine'
        verbose_name_plural = 'Reines'

    def __str__(self):
        return f"Reine {self.codeCouleur} ({self.anneeNaissance})"
