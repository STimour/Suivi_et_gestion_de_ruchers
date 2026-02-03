import graphene
from graphene_django import DjangoObjectType
from .models import (
    Utilisateur, Rucher, Cheptel, Ruche, Reine,
    Intervention, Traitement, Recolte,
    Transhumance, TraceurGPS, Alerte,
    Capteur, Mesure
)

# Types GraphQL
class UtilisateurType(DjangoObjectType):
    class Meta:
        model = Utilisateur
        fields = "__all__"

class RucherType(DjangoObjectType):
    class Meta:
        model = Rucher
        fields = "__all__"

class CheptelType(DjangoObjectType):
    class Meta:
        model = Cheptel
        fields = "__all__"

class RucheType(DjangoObjectType):
    class Meta:
        model = Ruche
        fields = "__all__"

class ReineType(DjangoObjectType):
    class Meta:
        model = Reine
        fields = "__all__"

class InterventionType(DjangoObjectType):
    class Meta:
        model = Intervention
        fields = "__all__"

class TraitementType(DjangoObjectType):
    class Meta:
        model = Traitement
        fields = "__all__"

class RecolteType(DjangoObjectType):
    class Meta:
        model = Recolte
        fields = "__all__"

class TranshumanceType(DjangoObjectType):
    class Meta:
        model = Transhumance
        fields = "__all__"

class TraceurGPSType(DjangoObjectType):
    class Meta:
        model = TraceurGPS
        fields = "__all__"

class AlerteType(DjangoObjectType):
    class Meta:
        model = Alerte
        fields = "__all__"

class CapteurType(DjangoObjectType):
    class Meta:
        model = Capteur
        fields = "__all__"

class MesureType(DjangoObjectType):
    class Meta:
        model = Mesure
        fields = "__all__"
