from django.contrib import admin
from .models import (
    Utilisateur,
    Entreprise,
    EntrepriseProfile,
    UtilisateurEntreprise,
    Invitation,
    AccountVerificationToken,
    PasswordResetToken,
    Offre,
    TypeOffreModel,
    LimitationOffre,
    Rucher,
    Ruche,
    Reine,
    RacleElevage,
    TypeFlore,
    TypeMaladie,
    TypeRuche,
    TypeRaceAbeille,
    LigneeReine,
    Intervention,
    Transhumance,
    Alerte,
    Capteur,
    Mesure,
)

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('prenom', 'nom', 'email', 'actif')
    list_filter = ('actif',)
    search_fields = ('nom', 'prenom', 'email')

@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'created_at')
    search_fields = ('nom',)

@admin.register(EntrepriseProfile)
class EntrepriseProfileAdmin(admin.ModelAdmin):
    list_display = ('entreprise', 'typeProfile', 'created_at')
    list_filter = ('typeProfile', 'created_at')
    raw_id_fields = ('entreprise',)

@admin.register(UtilisateurEntreprise)
class UtilisateurEntrepriseAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'entreprise', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    raw_id_fields = ('utilisateur', 'entreprise')

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('id', 'entreprise', 'rolePropose', 'created_at', 'acceptee')
    list_filter = ('rolePropose', 'acceptee', 'created_at')
    raw_id_fields = ('entreprise', 'envoyeePar')

@admin.register(AccountVerificationToken)
class AccountVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ('id', 'utilisateur', 'dateExpiration', 'utilise', 'created_at')
    list_filter = ('utilise', 'dateExpiration', 'created_at')
    raw_id_fields = ('utilisateur',)

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('id', 'utilisateur', 'dateExpiration', 'utilise', 'created_at')
    list_filter = ('utilise', 'dateExpiration', 'created_at')
    raw_id_fields = ('utilisateur',)

@admin.register(Rucher)
class RucherAdmin(admin.ModelAdmin):
    list_display = ('nom', 'flore', 'altitude', 'entreprise')
    list_filter = ('flore',)
    search_fields = ('nom',)
    raw_id_fields = ('entreprise',)  

@admin.register(Ruche)
class RucheAdmin(admin.ModelAdmin):
    list_display = ('immatriculation', 'type', 'race', 'statut', 'maladie', 'securisee', 'rucher')
    list_filter = ('statut', 'maladie', 'securisee')
    search_fields = ('immatriculation',)
    raw_id_fields = ('rucher',)

@admin.register(Reine)
class ReineAdmin(admin.ModelAdmin):
    list_display = ('codeCouleur', 'anneeNaissance', 'lignee', 'noteDouceur')
    list_filter = ('anneeNaissance',)
    raw_id_fields = ('entreprise', 'ruche', 'racle')

@admin.register(RacleElevage)
class RacleElevageAdmin(admin.ModelAdmin):
    list_display = ('reference', 'dateCreation', 'nbCupules', 'entreprise')
    list_filter = ('dateCreation',)
    search_fields = ('reference',)
    raw_id_fields = ('entreprise',)

@admin.register(Offre)
class OffreAdmin(admin.ModelAdmin):
    list_display = (
        'entreprise',
        'type',
        'active',
        'dateDebut',
        'dateFin',
        'nbRuchersMax',
        'nbCapteursMax',
        'nbReinesMax',
        'limitationOffre',
    )
    list_filter = ('type', 'active')
    search_fields = ('entreprise__nom',)
    raw_id_fields = ('entreprise', 'limitationOffre')

@admin.register(LimitationOffre)
class LimitationOffreAdmin(admin.ModelAdmin):
    list_display = ('typeOffre', 'nbRuchersMax', 'nbCapteursMax', 'nbReinesMax')
    list_filter = ('typeOffre',)

@admin.register(TypeOffreModel)
class TypeOffreModelAdmin(admin.ModelAdmin):
    list_display = ('value', 'titre', 'description', 'prixHT', 'prixTTC', 'stripeProductId')
    search_fields = ('value', 'titre', 'description', 'stripeProductId')

@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ('type', 'date', 'ruche')
    list_filter = ('type', 'date')
    raw_id_fields = ('ruche',)  

@admin.register(Transhumance)
class TranshumanceAdmin(admin.ModelAdmin):
    list_display = ('date', 'rucher', 'floreCible')
    list_filter = ('floreCible',)
    raw_id_fields = ('rucher',) 

@admin.register(Capteur)
class CapteurAdmin(admin.ModelAdmin):
    list_display = ('identifiant', 'type', 'actif', 'batteriePct', 'ruche')
    list_filter = ('type', 'actif')
    search_fields = ('identifiant',)
    raw_id_fields = ('ruche',)  

@admin.register(Mesure)
class MesureAdmin(admin.ModelAdmin):
    list_display = ('capteur', 'created_at', 'valeur')
    list_filter = ('created_at',)
    raw_id_fields = ('capteur',)  

@admin.register(Alerte)
class AlerteAdmin(admin.ModelAdmin):
    list_display = ('type', 'created_at', 'acquittee', 'capteur')
    list_filter = ('type', 'acquittee')
    raw_id_fields = ('capteur',)  


@admin.register(TypeFlore)
class TypeFloreAdmin(admin.ModelAdmin):
    list_display = ('value', 'label')
    search_fields = ('value', 'label')


@admin.register(TypeRuche)
class TypeRucheAdmin(admin.ModelAdmin):
    list_display = ('value', 'label')
    search_fields = ('value', 'label')


@admin.register(TypeRaceAbeille)
class TypeRaceAbeilleAdmin(admin.ModelAdmin):
    list_display = ('value', 'label')
    search_fields = ('value', 'label')


@admin.register(LigneeReine)
class LigneeReineAdmin(admin.ModelAdmin):
    list_display = ('value', 'label')
    search_fields = ('value', 'label')


@admin.register(TypeMaladie)
class TypeMaladieAdmin(admin.ModelAdmin):
    list_display = ('value', 'label')
    search_fields = ('value', 'label')
