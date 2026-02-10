from django.db import models, transaction
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from .base import TimestampedModel
from .utilisateur import TypeProfileEntreprise

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

class ReineStatut(models.TextChoices):
    VENDU = 'Vendu', 'Vendu'
    PERDUE = 'Perdue', 'Perdue'
    NON_FECONDEE = 'NonFecondee', 'NonFecondee'
    FECONDEE = 'Fecondee', 'Fecondee'
    DISPONIBLE_VENTE = 'DisponibleVente', 'DisponibleVente'
    ELIMINEE = 'Eliminee', 'Eliminee'

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
    racle = models.ForeignKey('RacleElevage', on_delete=models.SET_NULL, null=True, blank=True, related_name='reines')
    isElevage = models.BooleanField(default=False)
    statut = models.CharField(max_length=30, choices=ReineStatut.choices, default=ReineStatut.FECONDEE)
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

    def _validate_elevage_profile(self):
        if not self.isElevage:
            return
        if not self.entreprise_id:
            raise ValidationError("Une reine en elevage doit etre liee a une entreprise.")
        if not self.racle_id:
            raise ValidationError("Une reine en elevage doit etre liee a une racle d'elevage.")
        has_profile = self.entreprise.profils.filter(
            typeProfile=TypeProfileEntreprise.ELEVEUR_DE_REINES
        ).exists()
        if not has_profile:
            raise ValidationError(
                "L'entreprise doit avoir le profil EleveurDeReines pour activer isElevage."
            )

    def save(self, *args, **kwargs):
        self._validate_elevage_profile()
        super().save(*args, **kwargs)

class RacleElevage(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entreprise = models.ForeignKey('Entreprise', on_delete=models.CASCADE, related_name='racles_elevage')
    reference = models.CharField(max_length=100)
    dateCreation = models.DateField()
    nbCupules = models.IntegerField(validators=[MinValueValidator(0)])
    commentaire = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'racles_elevage'
        verbose_name = "Racle d'elevage"
        verbose_name_plural = "Racles d'elevage"

    def __str__(self):
        return f"{self.reference} ({self.dateCreation})"

class StatutCycleElevage(models.TextChoices):
    EN_COURS = 'EnCours', 'EnCours'
    TERMINE = 'Termine', 'Termine'
    ANNULE = 'Annule', 'Annule'

class TypeTacheElevage(models.TextChoices):
    GREFFAGE = 'Greffage', 'Greffage'
    OPERCULATION = 'Operculation', 'Operculation'
    NAISSANCE_REINE = 'NaissanceReine', 'NaissanceReine'
    CONTROLE_VOL_FECONDATION = 'ControleVolFecondation', 'ControleVolFecondation'
    VALIDATION_PONTE = 'ValidationPonte', 'ValidationPonte'
    MARQUAGE_REINE = 'MarquageReine', 'MarquageReine'
    MISE_EN_VENTE = 'MiseEnVente', 'MiseEnVente'

class StatutTacheElevage(models.TextChoices):
    A_FAIRE = 'AFaire', 'AFaire'
    FAITE = 'Faite', 'Faite'
    EN_RETARD = 'EnRetard', 'EnRetard'
    ANNULEE = 'Annulee', 'Annulee'

class CycleElevageReine(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    racle = models.ForeignKey('RacleElevage', on_delete=models.CASCADE, related_name='cycles_elevage')
    dateDebut = models.DateField()
    dateFin = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=StatutCycleElevage.choices, default=StatutCycleElevage.EN_COURS)

    class Meta:
        db_table = 'cycles_elevage_reines'
        verbose_name = "Cycle d'elevage de reine"
        verbose_name_plural = "Cycles d'elevage de reine"

    def __str__(self):
        return f"Cycle {self.racle_id} ({self.dateDebut})"

    @staticmethod
    def create_for_racle(racle, date_debut=None):
        if date_debut is None:
            date_debut = timezone.now().date()
        with transaction.atomic():
            cycle = CycleElevageReine.objects.create(
                racle=racle,
                dateDebut=date_debut,
                statut=StatutCycleElevage.EN_COURS,
            )
            TacheCycleElevage.create_default_tasks(cycle)
        return cycle

class TacheCycleElevage(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey('CycleElevageReine', on_delete=models.CASCADE, related_name='taches')
    type = models.CharField(max_length=40, choices=TypeTacheElevage.choices)
    jourTheorique = models.IntegerField(validators=[MinValueValidator(0)])
    datePrevue = models.DateField()
    dateRealisee = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=StatutTacheElevage.choices, default=StatutTacheElevage.A_FAIRE)
    commentaire = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'taches_cycle_elevage'
        verbose_name = "Tache de cycle d'elevage"
        verbose_name_plural = "Taches de cycle d'elevage"

    def __str__(self):
        return f"{self.type} ({self.datePrevue})"

    @staticmethod
    def create_default_tasks(cycle):
        base_date = cycle.dateDebut
        schedule = [
            (TypeTacheElevage.GREFFAGE, 0),
            (TypeTacheElevage.OPERCULATION, 6),
            (TypeTacheElevage.NAISSANCE_REINE, 12),
            (TypeTacheElevage.CONTROLE_VOL_FECONDATION, 16),
            (TypeTacheElevage.VALIDATION_PONTE, 21),
            (TypeTacheElevage.MARQUAGE_REINE, 25),
            (TypeTacheElevage.MISE_EN_VENTE, 28),
        ]
        tasks = [
            TacheCycleElevage(
                cycle=cycle,
                type=task_type,
                jourTheorique=offset,
                datePrevue=base_date + timedelta(days=offset),
                statut=StatutTacheElevage.A_FAIRE,
            )
            for task_type, offset in schedule
        ]
        TacheCycleElevage.objects.bulk_create(tasks)

    def save(self, *args, **kwargs):
        if self.statut != StatutTacheElevage.ANNULEE:
            if self.dateRealisee is None and self.statut in (StatutTacheElevage.FAITE, StatutTacheElevage.EN_RETARD):
                self.dateRealisee = timezone.now().date()
            if self.dateRealisee is not None:
                if self.dateRealisee > self.datePrevue:
                    self.statut = StatutTacheElevage.EN_RETARD
                else:
                    self.statut = StatutTacheElevage.FAITE
        super().save(*args, **kwargs)
