from django.db import models
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from .base import TimestampedModel

class EnumValueModel(models.Model):
    value = models.CharField(primary_key=True, max_length=50)
    label = models.CharField(max_length=50)

    class Meta:
        abstract = True

    def __str__(self):
        return self.label

class TypeFlore(EnumValueModel):
    ACACIA = 'Acacia'
    COLZA = 'Colza'
    LAVANDE = 'Lavande'
    TOURNESOL = 'Tournesol'
    CHATAIGNIER = 'Chataignier'
    BRUYERE = 'Bruyere'
    MONTAGNE = 'Montagne'
    TOUTES_FLEURS = 'ToutesFleurs'

    class Meta:
        db_table = 'type_flore'
        verbose_name = 'Type de flore'
        verbose_name_plural = 'Types de flore'

class StatutRuche(models.TextChoices):
    ACTIVE = 'Active', 'Active'
    FAIBLE = 'Faible', 'Faible'
    MALADE = 'Malade', 'Malade'
    MORTE = 'Morte', 'Morte'

class TypeRuche(EnumValueModel):
    DADANT = 'Dadant'
    LANGSTROTH = 'Langstroth'
    WARRE = 'Warre'
    VOIRNOT = 'Voirnot'
    KENYA_TOP_BAR = 'KenyaTopBar'
    RUCHETTE = 'Ruchette'
    NUCLEI = 'Nuclei'

    class Meta:
        db_table = 'type_ruche'
        verbose_name = 'Type de ruche'
        verbose_name_plural = 'Types de ruche'

class TypeRaceAbeille(EnumValueModel):
    BUCKFAST = 'Buckfast'
    NOIRE = 'Noire'
    CARNICA = 'Carnica'
    LIGUSTICA = 'Ligustica'
    CAUCASICA = 'Caucasica'
    HYBRIDE_LOCALE = 'HybrideLocale'
    INCONNUE = 'Inconnue'

    class Meta:
        db_table = 'type_race_abeille'
        verbose_name = "Type de race d'abeille"
        verbose_name_plural = "Types de race d'abeille"

class LigneeReine(EnumValueModel):
    BUCKFAST = 'Buckfast'
    CARNICA = 'Carnica'
    LIGUSTICA = 'Ligustica'
    CAUCASICA = 'Caucasica'
    LOCALE = 'Locale'
    INCONNUE = 'Inconnue'

    class Meta:
        db_table = 'lignee_reine'
        verbose_name = 'Lignee de reine'
        verbose_name_plural = 'Lignees de reine'

class CodeCouleurReine(models.TextChoices):
    BLANC = 'Blanc', 'Blanc'
    JAUNE = 'Jaune', 'Jaune'
    ROUGE = 'Rouge', 'Rouge'
    VERT = 'Vert', 'Vert'
    BLEU = 'Bleu', 'Bleu'

class TypeMaladie(EnumValueModel):
    AUCUNE = 'Aucune'
    VARROOSE = 'Varroose'
    NOSEMOSE = 'Nosemose'
    LOQUE_AMERICAINE = 'LoqueAmericaine'
    LOQUE_EUROPEENNE = 'LoqueEuropeenne'
    ACARAPISOSE = 'Acarapisose'
    ASCOSPHEROSE = 'Ascospherose'
    TROPILAEPS = 'Tropilaelaps'
    VIRUS_AILES_DEFORMEES = 'VirusAilesDeformees'
    PARALYSIE_CHRONIQUE = 'ParalysieChronique'
    INTOXICATION_PESTICIDES = 'IntoxicationPesticides'

    class Meta:
        db_table = 'type_maladie'
        verbose_name = 'Type de maladie'
        verbose_name_plural = 'Types de maladie'

class Rucher(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    flore = models.ForeignKey(
        TypeFlore,
        to_field='value',
        db_column='flore',
        on_delete=models.PROTECT,
    )
    altitude = models.IntegerField()
    notes = models.TextField(blank=True)
    entreprise = models.ForeignKey('Entreprise', on_delete=models.CASCADE, related_name='ruchers', null=True, blank=True)

    class Meta:
        db_table = 'ruchers'
        verbose_name = 'Rucher'
        verbose_name_plural = 'Ruchers'

    def __str__(self):
        return self.nom

class Ruche(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    immatriculation = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[A-Z]\d{7}$",
                message="L'immatriculation doit être au format X1234567.",
            )
        ],
    )
    type = models.ForeignKey(
        TypeRuche,
        to_field='value',
        db_column='type',
        on_delete=models.PROTECT,
    )
    race = models.ForeignKey(
        TypeRaceAbeille,
        to_field='value',
        db_column='race',
        on_delete=models.PROTECT,
    )
    statut = models.CharField(max_length=20, choices=StatutRuche.choices, default=StatutRuche.ACTIVE)
    maladie = models.ForeignKey(
        TypeMaladie,
        to_field='value',
        db_column='maladie',
        on_delete=models.PROTECT,
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

class Reine(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entreprise = models.ForeignKey('Entreprise', on_delete=models.CASCADE, related_name='reines', null=True, blank=True)
    ruche = models.OneToOneField('Ruche', on_delete=models.SET_NULL, null=True, blank=True, related_name='reine')
    anneeNaissance = models.IntegerField(validators=[MinValueValidator(1900), MaxValueValidator(2100)])
    codeCouleur = models.CharField(max_length=10, choices=CodeCouleurReine.choices)
    lignee = models.ForeignKey(
        LigneeReine,
        to_field='value',
        db_column='lignee',
        on_delete=models.PROTECT,
    )
    noteDouceur = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    commentaire = models.TextField(blank=True)
    nonReproductible = models.BooleanField(default=False)

    class Meta:
        db_table = 'reines'
        verbose_name = 'Reine'
        verbose_name_plural = 'Reines'

    def __str__(self):
        return f"Reine {self.codeCouleur} ({self.anneeNaissance})"
