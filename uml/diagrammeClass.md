classDiagram
direction TB
    class Utilisateur {
	    +id: UUID
	    +nom: String
	    +prenom: String
	    +email: String
	    +motDePasseHash: String
	    +actif: Boolean
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Entreprise {
	    +id: UUID
	    +nom: String
	    +adresse: String
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class UtilisateurEntreprise {
	    +id: UUID
	    +role: RoleUtilisateur
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Offre {
	    +id: UUID
	    +type: TypeOffre
	    +dateDebut: DateTime
	    +dateFin: DateTime
	    +active: Boolean
	    +nbRuchersMax: Integer
	    +nbCapteursMax: Integer
	    +stripeCustomerId: String
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Rucher {
	    +id: UUID
	    +nom: String
	    +latitude: Float
	    +longitude: Float
	    +flore: TypeFlore
	    +altitude: Integer
	    +notes: Text
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Ruche {
	    +id: UUID
	    +immatriculation: String
	    +type: TypeRuche
	    +race: TypeRaceAbeille
	    +statut: StatutRuche
	    +securisee: Boolean
	    +maladie: TypeMaladie?
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Reine {
	    +id: UUID
	    +entrepriseId: UUID
	    +anneeNaissance: Integer
	    +codeCouleur: CodeCouleurReine
	    +lignee: LigneeReine
	    +noteDouceur: Integer
	    +commentaire: Text
	    +nonReproductible: Boolean
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Intervention {
	    +id: UUID
	    +type: TypeIntervention
	    +date: Date
	    +observations: Text
	    +produit: String
	    +dosage: String
	    +nbHausses: Integer
	    +poidsKg: Float
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Transhumance {
	    +id: UUID
	    +date: Date
	    +origineLat: Float
	    +origineLng: Float
	    +destinationLat: Float
	    +destinationLng: Float
	    +floreCible: TypeFlore
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Capteur {
	    +id: UUID
	    +type: TypeCapteur
	    +identifiant: String
	    +actif: Boolean
	    +batteriePct: Float
	    +derniereCommunication: DateTime
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Mesure {
	    +id: UUID
	    +date: DateTime
	    +valeur: Float
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class Alerte {
	    +id: UUID
	    +type: TypeAlerte
	    +date: DateTime
	    +message: String
	    +acquittee: Boolean
	    +created_at: DateTime
	    +updated_at: DateTime
    }

    class StatutRuche {
	    Active
	    Faible
	    Malade
	    Morte
    }

    class TypeRuche {
	    Dadant
	    Langstroth
	    Warre
	    Voirnot
	    KenyaTopBar
	    Ruchette
	    Nuclei
    }

    class TypeRaceAbeille {
	    Buckfast
	    Noire
	    Carnica
	    Ligustica
	    Caucasica
	    HybrideLocale
	    Inconnue
    }

    class LigneeReine {
	    Buckfast
	    Carnica
	    Ligustica
	    Caucasica
	    Locale
	    Inconnue
    }

    class TypeMaladie {
	    Aucune
	    Varroose
	    Nosemose
	    LoqueAmericaine
	    LoqueEuropeenne
	    Acarapisose
	    Ascospherose
	    Tropilaelaps
	    VirusAilesDeformees
	    ParalysieChronique
	    IntoxicationPesticides
    }

    class CodeCouleurReine {
	    Blanc
	    Jaune
	    Rouge
	    Vert
	    Bleu
    }

    class TypeIntervention {
	    Visite
	    Nourrissement
	    Traitement
	    Recolte
	    Division
	    PoseHausse
	    ControleSanitaire
    }

    class TypeCapteur {
	    Poids
	    Temperature
	    Humidite
	    GPS
	    CO2
	    Son
	    Batterie
    }

    class TypeAlerte {
	    Vol
	    ChutePoids
	    TemperatureCritique
	    BatterieFaible
	    DeplacementGPS
	    HorsLigne
    }

    class TypeFlore {
	    Acacia
	    Colza
	    Lavande
	    Tournesol
	    Chataignier
	    Bruyere
	    Montagne
	    ToutesFleurs
    }

    class RoleUtilisateur {
	    AdminEntreprise
	    Apiculteur
	    Lecteur
    }

    class TypeOffre {
	    Freemium
	    Premium
    }

    class Invitation {
	    +id: UUID
	    +token: String
	    +rolePropose: RoleUtilisateur
	    +dateExpiration: DateTime
	    +acceptee: Boolean
	    +created_at: DateTime
	    +updated_at: DateTime
    }

	<<enumeration>> StatutRuche
	<<enumeration>> TypeRuche
	<<enumeration>> TypeRaceAbeille
	<<enumeration>> LigneeReine
	<<enumeration>> TypeMaladie
	<<enumeration>> CodeCouleurReine
	<<enumeration>> TypeIntervention
	<<enumeration>> TypeCapteur
	<<enumeration>> TypeAlerte
	<<enumeration>> TypeFlore
	<<enumeration>> RoleUtilisateur
	<<enumeration>> TypeOffre

    Utilisateur "1" --> "0..*" UtilisateurEntreprise : appartient
    Entreprise "1" --> "0..*" UtilisateurEntreprise : membres
    Entreprise "1" --> "0..*" Invitation : invitations
    Utilisateur "1" --> "0..*" Invitation : envoyeePar
    Entreprise "1" --> "1" Offre : abonnement
    Entreprise "1" --> "0..*" Rucher : possede
    Rucher "1" --> "1..*" Ruche : contient
    Rucher "1" --> "0..*" Transhumance : deplace
    Ruche "0" --> "1" Reine : possede
    Ruche "1" --> "0..*" Intervention : historique
    Ruche "1" --> "0..*" Capteur : equipe
    Capteur "1" --> "0..*" Mesure : genere
    Capteur "1" --> "0..*" Alerte : declenche

	class Utilisateur:::mainclass
	class Entreprise:::mainclass
	class UtilisateurEntreprise:::mainclass
	class Offre:::mainclass
	class Rucher:::mainclass
	class Ruche:::mainclass
	class Reine:::mainclass
	class Intervention:::mainclass
	class Transhumance:::mainclass
	class Capteur:::mainclass
	class Mesure:::mainclass
	class Alerte:::mainclass
	class StatutRuche:::enumclass
	class TypeRuche:::enumclass
	class TypeRaceAbeille:::enumclass
	class LigneeReine:::enumclass
	class TypeMaladie:::enumclass
	class CodeCouleurReine:::enumclass
	class TypeIntervention:::enumclass
	class TypeCapteur:::enumclass
	class TypeAlerte:::enumclass
	class TypeFlore:::enumclass
	class RoleUtilisateur:::enumclass
	class TypeOffre:::enumclass
	class Invitation:::mainclass

	classDef mainclass :,fill:#FFA500,stroke:#BC7000,stroke-width:2px,color:#222
	classDef enumclass :,fill:#009EE0,stroke:#003355,stroke-width:2px,color:#fff