from django.contrib import admin
from .models import (
    Utilisateur, Rucher, Ruche, Reine,
    Intervention, Transhumance,
    Capteur, Mesure, Alerte
)

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('prenom', 'nom', 'email', 'role', 'actif')
    list_filter = ('role', 'actif')
    search_fields = ('nom', 'prenom', 'email')

@admin.register(Rucher)
class RucherAdmin(admin.ModelAdmin):
    list_display = ('nom', 'flore', 'altitude', 'possesseur')
    list_filter = ('flore',)
    search_fields = ('nom',)
    raw_id_fields = ('possesseur',)  

@admin.register(Ruche)
class RucheAdmin(admin.ModelAdmin):
    list_display = ('immatriculation', 'type', 'race', 'statut', 'securisee', 'rucher')
    list_filter = ('statut', 'securisee')
    search_fields = ('immatriculation',)
    raw_id_fields = ('rucher', 'reine')  

@admin.register(Reine)
class ReineAdmin(admin.ModelAdmin):
    list_display = ('codeCouleur', 'anneeNaissance', 'lignee', 'noteDouceur')
    list_filter = ('anneeNaissance',)

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
    list_display = ('capteur', 'date', 'valeur')
    list_filter = ('date',)
    raw_id_fields = ('capteur',)  

@admin.register(Alerte)
class AlerteAdmin(admin.ModelAdmin):
    list_display = ('type', 'date', 'acquittee', 'capteur')
    list_filter = ('type', 'acquittee')
    raw_id_fields = ('capteur',)  