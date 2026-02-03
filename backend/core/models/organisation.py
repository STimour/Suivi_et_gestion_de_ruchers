from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator

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

class TypeRuche(models.TextChoices):
    DADANT = 'Dadant', 'Dadant'
    LANGSTROTH = 'Langstroth', 'Langstroth'
    WARRE = 'Warre', 'Warre'
    VOIRNOT = 'Voirnot', 'Voirnot'
    KENYA_TOP_BAR = 'KenyaTopBar', 'KenyaTopBar'
    RUCHETTE = 'Ruchette', 'Ruchette'
    NUCLEI = 'Nuclei', 'Nuclei'

class TypeRaceAbeille(models.TextChoices):
    BUCKFAST = 'Buckfast', 'Buckfast'
    NOIRE = 'Noire', 'Noire'
    CARNICA = 'Carnica', 'Carnica'
    LIGUSTICA = 'Ligustica', 'Ligustica'
    CAUCASICA = 'Caucasica', 'Caucasica'
    HYBRIDE_LOCALE = 'HybrideLocale', 'HybrideLocale'
    INCONNUE = 'Inconnue', 'Inconnue'

class LigneeReine(models.TextChoices):
    BUCKFAST = 'Buckfast', 'Buckfast'
    CARNICA = 'Carnica', 'Carnica'
    LIGUSTICA = 'Ligustica', 'Ligustica'
    CAUCASICA = 'Caucasica', 'Caucasica'
    LOCALE = 'Locale', 'Locale'
    INCONNUE = 'Inconnue', 'Inconnue'

class CodeCouleurReine(models.TextChoices):
    BLANC = 'Blanc', 'Blanc'
    JAUNE = 'Jaune', 'Jaune'
    ROUGE = 'Rouge', 'Rouge'
    VERT = 'Vert', 'Vert'
    BLEU = 'Bleu', 'Bleu'

class TypeMaladie(models.TextChoices):
    AUCUNE = 'Aucune', 'Aucune'
    VARROOSE = 'Varroose', 'Varroose'
    NOSEMOSE = 'Nosemose', 'Nosemose'
    LOQUE_AMERICAINE = 'LoqueAmericaine', 'LoqueAmericaine'
    LOQUE_EUROPEENNE = 'LoqueEuropeenne', 'LoqueEuropeenne'
    ACARAPISOSE = 'Acarapisose', 'Acarapisose'
    ASCOSPHEROSE = 'Ascospherose', 'Ascospherose'
    TROPILAEPS = 'Tropilaelaps', 'Tropilaelaps'
    VIRUS_AILES_DEFORMEES = 'VirusAilesDeformees', 'VirusAilesDeformees'
    PARALYSIE_CHRONIQUE = 'ParalysieChronique', 'ParalysieChronique'
    INTOXICATION_PESTICIDES = 'IntoxicationPesticides', 'IntoxicationPesticides'

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
    immatriculation = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^A\d{7}$",
                message="L'immatriculation doit être au format A1234567.",
            )
        ],
    )
    type = models.CharField(max_length=20, choices=TypeRuche.choices)
    race = models.CharField(max_length=20, choices=TypeRaceAbeille.choices)
    statut = models.CharField(max_length=20, choices=StatutRuche.choices, default=StatutRuche.ACTIVE)
    maladie = models.CharField(
        max_length=50,
        choices=TypeMaladie.choices,
        default=TypeMaladie.AUCUNE,
    )
    securisee = models.BooleanField(default=False)
    rucher = models.ForeignKey(Rucher, on_delete=models.CASCADE, related_name='ruches')
    # Relation inverse via Reine.ruche

    class Meta:
        db_table = 'ruches'
        verbose_name = 'Ruche'
        verbose_name_plural = 'Ruches'

    def __str__(self):
        return self.immatriculation

class Reine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entreprise = models.ForeignKey('Entreprise', on_delete=models.CASCADE, related_name='reines', null=True, blank=True)
    ruche = models.OneToOneField('Ruche', on_delete=models.SET_NULL, null=True, blank=True, related_name='reine')
    anneeNaissance = models.IntegerField(validators=[MinValueValidator(1900), MaxValueValidator(2100)])
    codeCouleur = models.CharField(max_length=10, choices=CodeCouleurReine.choices)
    lignee = models.CharField(max_length=20, choices=LigneeReine.choices)
    noteDouceur = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    commentaire = models.TextField(blank=True)
    nonReproductible = models.BooleanField(default=False)

    class Meta:
        db_table = 'reines'
        verbose_name = 'Reine'
        verbose_name_plural = 'Reines'

    def __str__(self):
        return f"Reine {self.codeCouleur} ({self.anneeNaissance})"
