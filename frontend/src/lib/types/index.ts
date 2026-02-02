// =========================
// Enums
// =========================

export enum StatutRuche {
  Active = 'ACTIVE',
  Faible = 'FAIBLE',
  Malade = 'MALADE',
  Morte = 'MORTE',
}

export enum TypeIntervention {
  Visite = 'VISITE',
  Nourrissement = 'NOURRISSEMENT',
  Traitement = 'TRAITEMENT',
  Recolte = 'RECOLTE',
  Division = 'DIVISION',
  PoseHausse = 'POSE_HAUSSE',
  ControleSanitaire = 'CONTROLE_SANITAIRE',
}

export enum TypeCapteur {
  Poids = 'POIDS',
  Temperature = 'TEMPERATURE',
  Humidite = 'HUMIDITE',
  GPS = 'GPS',
  CO2 = 'CO2',
  Son = 'SON',
  Batterie = 'BATTERIE',
}

export enum TypeAlerte {
  Vol = 'VOL',
  ChutePoids = 'CHUTE_POIDS',
  TemperatureCritique = 'TEMPERATURE_CRITIQUE',
  BatterieFaible = 'BATTERIE_FAIBLE',
  DeplacementGPS = 'DEPLACEMENT_GPS',
  HorsLigne = 'HORS_LIGNE',
}

export enum TypeFlore {
  Acacia = 'ACACIA',
  Colza = 'COLZA',
  Lavande = 'LAVANDE',
  Tournesol = 'TOURNESOL',
  Chataignier = 'CHATAIGNIER',
  Bruyere = 'BRUYERE',
  Montagne = 'MONTAGNE',
  ToutesFleurs = 'TOUTES_FLEURS',
}

export enum RoleUtilisateur {
  Admin = 'ADMIN',
  Apiculteur = 'APICULTEUR',
  Lecteur = 'LECTEUR',
}

// =========================
// Types Principaux
// =========================

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasseHash: string;
  role: RoleUtilisateur;
  dateCreation: Date;
  actif: boolean;
}

export interface Rucher {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  flore: TypeFlore;
  altitude: number;
  notes?: string;
  // Relations
  ruches?: Ruche[];
  transhumances?: Transhumance[];
  utilisateurId: string;
  utilisateur?: Utilisateur;
}

export interface Ruche {
  id: string;
  immatriculation: string;
  type: string;
  race: string;
  statut: StatutRuche;
  securisee: boolean;
  // Relations
  rucherId: string;
  rucher?: Rucher;
  reineId?: string;
  reine?: Reine;
  interventions?: Intervention[];
  capteurs?: Capteur[];
}

export interface Reine {
  id: string;
  anneeNaissance: number;
  codeCouleur: string;
  lignee: string;
  noteDouceur: number; // 0-10
  commentaire?: string;
  nonReproductible: boolean;
  // Relations
  rucheId?: string;
  ruche?: Ruche;
}

export interface Intervention {
  id: string;
  type: TypeIntervention;
  date: Date;
  observations?: string;
  // Champs spécifiques selon le type
  produit?: string; // Pour traitement/nourrissement
  dosage?: string; // Pour traitement
  nbHausses?: number; // Pour pose hausse
  poidsKg?: number; // Pour récolte
  // Relations
  rucheId: string;
  ruche?: Ruche;
}

export interface Transhumance {
  id: string;
  date: Date;
  origineLat: number;
  origineLng: number;
  destinationLat: number;
  destinationLng: number;
  floreCible: TypeFlore;
  // Relations
  rucherId: string;
  rucher?: Rucher;
}

export interface Capteur {
  id: string;
  type: TypeCapteur;
  identifiant: string;
  actif: boolean;
  batteriePct: number;
  derniereCommunication: Date;
  // Relations
  rucheId: string;
  ruche?: Ruche;
  mesures?: Mesure[];
  alertes?: Alerte[];
}

export interface Mesure {
  id: string;
  date: Date;
  valeur: number;
  // Relations
  capteurId: string;
  capteur?: Capteur;
}

export interface Alerte {
  id: string;
  type: TypeAlerte;
  date: Date;
  message: string;
  acquittee: boolean;
  // Relations
  capteurId: string;
  capteur?: Capteur;
}
