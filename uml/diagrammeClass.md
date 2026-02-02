classDiagram

%% =========================
%% Utilisateurs
%% =========================

class Utilisateur:::mainclass {
  +id: UUID
  +nom: String
  +prenom: String
  +email: String
  +motDePasseHash: String
  +role: RoleUtilisateur
  +dateCreation: DateTime
  +actif: Boolean
}

%% =========================
%% Organisation & Structure
%% =========================

class Rucher:::mainclass {
  +id: UUID
  +nom: String
  +latitude: Float
  +longitude: Float
  +flore: TypeFlore
  +altitude: Integer
  +notes: Text
}

class Ruche:::mainclass {
  +id: UUID
  +immatriculation: String
  +type: String
  +race: String
  +statut: StatutRuche
  +securisee: Boolean
}

class Reine:::mainclass {
  +id: UUID
  +anneeNaissance: Integer
  +codeCouleur: String
  +lignee: String
  +noteDouceur: Integer
  +commentaire: Text
  +nonReproductible: Boolean
}

%% =========================
%% Suivi & Interventions
%% =========================

class Intervention:::mainclass {
  +id: UUID
  +type: TypeIntervention
  +date: Date
  +observations: Text
  +produit: String
  +dosage: String
  +nbHausses: Integer
  +poidsKg: Float
}

%% =========================
%% Transhumance & Sécurité
%% =========================

class Transhumance:::mainclass {
  +id: UUID
  +date: Date
  +origineLat: Float
  +origineLng: Float
  +destinationLat: Float
  +destinationLng: Float
  +floreCible: TypeFlore
}

%% =========================
%% IoT Monitoring
%% =========================

class Capteur:::mainclass {
  +id: UUID
  +type: TypeCapteur
  +identifiant: String
  +actif: Boolean
  +batteriePct: Float
  +derniereCommunication: DateTime
}

class Mesure:::mainclass {
  +id: UUID
  +date: DateTime
  +valeur: Float
}

class Alerte:::mainclass {
  +id: UUID
  +type: TypeAlerte
  +date: DateTime
  +message: String
  +acquittee: Boolean
}

%% =========================
%% Relations
%% =========================

Utilisateur "1" --> "0..*" Rucher : possede

Rucher "1" --> "1..*" Ruche : contient
Rucher "1" --> "0..*" Transhumance : deplace

Ruche "1" --> "0..1" Reine : possede
Ruche "1" --> "0..*" Intervention : historique
Ruche "1" --> "0..*" Capteur : equipe

Capteur "1" --> "0..*" Mesure : genere
Capteur "1" --> "0..*" Alerte : declenche

%% =========================
%% Enums
%% =========================

class StatutRuche:::enumclass {
  <<enumeration>>
  Active
  Faible
  Malade
  Morte
}

class TypeIntervention:::enumclass {
  <<enumeration>>
  Visite
  Nourrissement
  Traitement
  Recolte
  Division
  PoseHausse
  ControleSanitaire
}

class TypeCapteur:::enumclass {
  <<enumeration>>
  Poids
  Temperature
  Humidite
  GPS
  CO2
  Son
  Batterie
}

class TypeAlerte:::enumclass {
  <<enumeration>>
  Vol
  ChutePoids
  TemperatureCritique
  BatterieFaible
  DeplacementGPS
  HorsLigne
}

class TypeFlore:::enumclass {
  <<enumeration>>
  Acacia
  Colza
  Lavande
  Tournesol
  Chataignier
  Bruyere
  Montagne
  ToutesFleurs
}

class RoleUtilisateur:::enumclass {
  <<enumeration>>
  Admin
  Apiculteur
  Lecteur
}

%% =========================
%% Définition des couleurs
%% =========================

classDef mainclass fill:#FFA500,stroke:#BC7000,stroke-width:2px,color:#222;
classDef enumclass fill:#009EE0,stroke:#003355,stroke-width:2px,color:#fff;
