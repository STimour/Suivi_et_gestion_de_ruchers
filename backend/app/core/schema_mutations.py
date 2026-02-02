import graphene
from .schema_types import (
    UtilisateurType, RucherType, RucheType, CapteurType
)
from .models import (
    Utilisateur, Rucher, Ruche, Cheptel, Capteur
)

# Mutations CRUD pour Utilisateur
class CreateUtilisateur(graphene.Mutation):
    class Arguments:
        nom = graphene.String(required=True)
        prenom = graphene.String(required=True)
        email = graphene.String(required=True)
        motDePasseHash = graphene.String(required=True)
        role = graphene.String()
    
    utilisateur = graphene.Field(UtilisateurType)
    
    def mutate(self, info, nom, prenom, email, motDePasseHash, role="Lecteur"):
        utilisateur = Utilisateur(
            nom=nom,
            prenom=prenom,
            email=email,
            motDePasseHash=motDePasseHash,
            role=role
        )
        utilisateur.save()
        return CreateUtilisateur(utilisateur=utilisateur)

class UpdateUtilisateur(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
        nom = graphene.String()
        prenom = graphene.String()
        email = graphene.String()
        role = graphene.String()
        actif = graphene.Boolean()
    
    utilisateur = graphene.Field(UtilisateurType)
    
    def mutate(self, info, id, **kwargs):
        utilisateur = Utilisateur.objects.get(id=id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(utilisateur, key, value)
        utilisateur.save()
        return UpdateUtilisateur(utilisateur=utilisateur)

class DeleteUtilisateur(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        try:
            utilisateur = Utilisateur.objects.get(id=id)
            utilisateur.delete()
            return DeleteUtilisateur(success=True)
        except Utilisateur.DoesNotExist:
            return DeleteUtilisateur(success=False)

# Mutations CRUD pour Rucher
class CreateRucher(graphene.Mutation):
    class Arguments:
        nom = graphene.String(required=True)
        latitude = graphene.Float(required=True)
        longitude = graphene.Float(required=True)
        flore = graphene.String(required=True)
        altitude = graphene.Int(required=True)
        notes = graphene.String()
        possesseur_id = graphene.UUID(required=True)
    
    rucher = graphene.Field(RucherType)
    
    def mutate(self, info, nom, latitude, longitude, flore, altitude, possesseur_id, notes=""):
        possesseur = Utilisateur.objects.get(id=possesseur_id)
        rucher = Rucher(
            nom=nom,
            latitude=latitude,
            longitude=longitude,
            flore=flore,
            altitude=altitude,
            notes=notes,
            possesseur=possesseur
        )
        rucher.save()
        return CreateRucher(rucher=rucher)

class UpdateRucher(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
        nom = graphene.String()
        latitude = graphene.Float()
        longitude = graphene.Float()
        flore = graphene.String()
        altitude = graphene.Int()
        notes = graphene.String()
    
    rucher = graphene.Field(RucherType)
    
    def mutate(self, info, id, **kwargs):
        rucher = Rucher.objects.get(id=id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(rucher, key, value)
        rucher.save()
        return UpdateRucher(rucher=rucher)

class DeleteRucher(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        try:
            rucher = Rucher.objects.get(id=id)
            rucher.delete()
            return DeleteRucher(success=True)
        except Rucher.DoesNotExist:
            return DeleteRucher(success=False)

# Mutations CRUD pour Ruche
class CreateRuche(graphene.Mutation):
    class Arguments:
        immatriculation = graphene.String(required=True)
        type_ruche = graphene.String(required=True)
        race = graphene.String(required=True)
        statut = graphene.String()
        securisee = graphene.Boolean()
        cheptel_id = graphene.UUID(required=True)
    
    ruche = graphene.Field(RucheType)
    
    def mutate(self, info, immatriculation, type_ruche, race, cheptel_id, statut="Active", securisee=False):
        cheptel = Cheptel.objects.get(id=cheptel_id)
        ruche = Ruche(
            immatriculation=immatriculation,
            type=type_ruche,
            race=race,
            statut=statut,
            securisee=securisee,
            cheptel=cheptel
        )
        ruche.save()
        return CreateRuche(ruche=ruche)

class UpdateRuche(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
        immatriculation = graphene.String()
        type_ruche = graphene.String()
        race = graphene.String()
        statut = graphene.String()
        securisee = graphene.Boolean()
        cheptel_id = graphene.UUID()
    
    ruche = graphene.Field(RucheType)
    
    def mutate(self, info, id, **kwargs):
        ruche = Ruche.objects.get(id=id)
        if 'cheptel_id' in kwargs and kwargs['cheptel_id'] is not None:
            kwargs['cheptel'] = Cheptel.objects.get(id=kwargs.pop('cheptel_id'))
        if 'type_ruche' in kwargs:
            kwargs['type'] = kwargs.pop('type_ruche')
        
        for key, value in kwargs.items():
            if value is not None:
                setattr(ruche, key, value)
        ruche.save()
        return UpdateRuche(ruche=ruche)

class DeleteRuche(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        try:
            ruche = Ruche.objects.get(id=id)
            ruche.delete()
            return DeleteRuche(success=True)
        except Ruche.DoesNotExist:
            return DeleteRuche(success=False)

# Mutations CRUD pour Capteur
class CreateCapteur(graphene.Mutation):
    class Arguments:
        type = graphene.String(required=True)
        identifiant = graphene.String(required=True)
        ruche_id = graphene.UUID(required=True)
        actif = graphene.Boolean()
    
    capteur = graphene.Field(CapteurType)
    
    def mutate(self, info, type, identifiant, ruche_id, actif=True):
        ruche = Ruche.objects.get(id=ruche_id)
        capteur = Capteur(
            type=type,
            identifiant=identifiant,
            actif=actif,
            ruche=ruche
        )
        capteur.save()
        return CreateCapteur(capteur=capteur)

class UpdateCapteur(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
        type = graphene.String()
        identifiant = graphene.String()
        actif = graphene.Boolean()
        ruche_id = graphene.UUID()
    
    capteur = graphene.Field(CapteurType)
    
    def mutate(self, info, id, **kwargs):
        capteur = Capteur.objects.get(id=id)
        if 'ruche_id' in kwargs and kwargs['ruche_id'] is not None:
            kwargs['ruche'] = Ruche.objects.get(id=kwargs.pop('ruche_id'))
        
        for key, value in kwargs.items():
            if value is not None:
                setattr(capteur, key, value)
        capteur.save()
        return UpdateCapteur(capteur=capteur)

class DeleteCapteur(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        try:
            capteur = Capteur.objects.get(id=id)
            capteur.delete()
            return DeleteCapteur(success=True)
        except Capteur.DoesNotExist:
            return DeleteCapteur(success=False)

# Mutation principale
class Mutation(graphene.ObjectType):
    create_utilisateur = CreateUtilisateur.Field()
    update_utilisateur = UpdateUtilisateur.Field()
    delete_utilisateur = DeleteUtilisateur.Field()
    
    create_rucher = CreateRucher.Field()
    update_rucher = UpdateRucher.Field()
    delete_rucher = DeleteRucher.Field()
    
    create_ruche = CreateRuche.Field()
    update_ruche = UpdateRuche.Field()
    delete_ruche = DeleteRuche.Field()
    
    create_capteur = CreateCapteur.Field()
    update_capteur = UpdateCapteur.Field()
    delete_capteur = DeleteCapteur.Field()
