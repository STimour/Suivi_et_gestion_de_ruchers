from django.contrib import admin
from .models import (
    Utilisateur, RoleUtilisateur, Entreprise, UtilisateurEntreprise, Invitation,
    Rucher, Ruche, Reine,
    Intervention, Transhumance,
    Capteur, Mesure, Alerte
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

@admin.register(UtilisateurEntreprise)
class UtilisateurEntrepriseAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'entreprise', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    raw_id_fields = ('utilisateur', 'entreprise')

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'entreprise', 'rolePropose', 'created_at', 'acceptee')
    list_filter = ('rolePropose', 'acceptee', 'created_at')
    raw_id_fields = ('entreprise', 'envoyeePar')

@admin.register(Rucher)
class RucherAdmin(admin.ModelAdmin):
    list_display = ('nom', 'flore', 'altitude', 'entreprise')
    list_filter = ('flore',)
    search_fields = ('nom',)
    raw_id_fields = ('entreprise',)  

@admin.register(Ruche)
class RucheAdmin(admin.ModelAdmin):
    list_display = ('immatriculation', 'type', 'race', 'statut', 'securisee', 'rucher')
    list_filter = ('statut', 'securisee')
    search_fields = ('immatriculation',)
    raw_id_fields = ('rucher',)

@admin.register(Reine)
class ReineAdmin(admin.ModelAdmin):
    list_display = ('codeCouleur', 'anneeNaissance', 'lignee', 'noteDouceur')
    list_filter = ('anneeNaissance',)
    raw_id_fields = ('entreprise', 'ruche')

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
