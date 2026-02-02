import graphene
from .schema_types import (
    UtilisateurType, RucherType, CheptelType, RucheType, ReineType,
    InterventionType, TraitementType, RecolteType,
    TranshumanceType, TraceurGPSType, AlerteType,
    CapteurType, MesureType
)
from .models import (
    Utilisateur, Rucher, Cheptel, Ruche, Reine,
    Intervention, Traitement, Recolte,
    Transhumance, TraceurGPS, Alerte,
    Capteur, Mesure
)

# Query principale
class Query(graphene.ObjectType):
    utilisateurs = graphene.List(UtilisateurType)
    ruchers = graphene.List(RucherType)
    cheptels = graphene.List(CheptelType)
    ruches = graphene.List(RucheType)
    reines = graphene.List(ReineType)
    interventions = graphene.List(InterventionType)
    traitements = graphene.List(TraitementType)
    recoltes = graphene.List(RecolteType)
    transhumances = graphene.List(TranshumanceType)
    traceurs_gps = graphene.List(TraceurGPSType)
    alertes = graphene.List(AlerteType)
    capteurs = graphene.List(CapteurType)
    mesures = graphene.List(MesureType)

    def resolve_utilisateurs(root, info):
        return Utilisateur.objects.all()

    def resolve_ruchers(root, info):
        return Rucher.objects.all()

    def resolve_cheptels(root, info):
        return Cheptel.objects.all()

    def resolve_ruches(root, info):
        return Ruche.objects.all()

    def resolve_reines(root, info):
        return Reine.objects.all()

    def resolve_interventions(root, info):
        return Intervention.objects.all()

    def resolve_traitements(root, info):
        return Traitement.objects.all()

    def resolve_recoltes(root, info):
        return Recolte.objects.all()

    def resolve_transhumances(root, info):
        return Transhumance.objects.all()

    def resolve_traceurs_gps(root, info):
        return TraceurGPS.objects.all()

    def resolve_alertes(root, info):
        return Alerte.objects.all()

    def resolve_capteurs(root, info):
        return Capteur.objects.all()

    def resolve_mesures(root, info):
        return Mesure.objects.all()
