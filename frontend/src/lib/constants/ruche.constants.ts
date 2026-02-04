// Constantes correspondant aux enums Django du backend

export const STATUT_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Faible', label: 'Faible' },
  { value: 'Malade', label: 'Malade' },
  { value: 'Morte', label: 'Morte' },
];

export const TYPE_RUCHE_OPTIONS = [
  { value: 'Dadant', label: 'Dadant' },
  { value: 'Langstroth', label: 'Langstroth' },
  { value: 'Warre', label: 'Warré' },
  { value: 'Voirnot', label: 'Voirnot' },
  { value: 'KenyaTopBar', label: 'Kenya Top Bar' },
  { value: 'Ruchette', label: 'Ruchette' },
  { value: 'Nuclei', label: 'Nuclei' },
];

export const RACE_ABEILLE_OPTIONS = [
  { value: 'Buckfast', label: 'Buckfast' },
  { value: 'Noire', label: 'Noire (Apis mellifera mellifera)' },
  { value: 'Carnica', label: 'Carnica' },
  { value: 'Ligustica', label: 'Ligustica (Italienne)' },
  { value: 'Caucasica', label: 'Caucasica' },
  { value: 'HybrideLocale', label: 'Hybride Locale' },
  { value: 'Inconnue', label: 'Inconnue' },
];

export const MALADIE_OPTIONS = [
  { value: 'Aucune', label: 'Aucune' },
  { value: 'Varroose', label: 'Varroose' },
  { value: 'Nosemose', label: 'Nosémose' },
  { value: 'LoqueAmericaine', label: 'Loque Américaine' },
  { value: 'LoqueEuropeenne', label: 'Loque Européenne' },
  { value: 'Acarapisose', label: 'Acarapisose' },
  { value: 'Ascospherose', label: 'Ascosphérose' },
  { value: 'Tropilaelaps', label: 'Tropilaelaps' },
  { value: 'VirusAilesDeformees', label: 'Virus des Ailes Déformées' },
  { value: 'ParalysieChronique', label: 'Paralysie Chronique' },
  { value: 'IntoxicationPesticides', label: 'Intoxication aux Pesticides' },
];

export const FLORE_OPTIONS = [
  { value: 'Acacia', label: 'Acacia' },
  { value: 'Bruyere', label: 'Bruyère' },
  { value: 'Chataignier', label: 'Châtaignier' },
  { value: 'Colza', label: 'Colza' },
  { value: 'Lavande', label: 'Lavande' },
  { value: 'Montagne', label: 'Montagne' },
  { value: 'Tournesol', label: 'Tournesol' },
  { value: 'ToutesFleurs', label: 'Toutes Fleurs' },
];

export const TYPE_INTERVENTION_OPTIONS = [
  { value: 'Visite', label: 'Visite' },
  { value: 'Nourrissement', label: 'Nourrissement' },
  { value: 'Traitement', label: 'Traitement' },
  { value: 'Recolte', label: 'Récolte' },
  { value: 'Division', label: 'Division' },
  { value: 'PoseHausse', label: 'Pose Hausse' },
  { value: 'ControleSanitaire', label: 'Contrôle Sanitaire' },
];
