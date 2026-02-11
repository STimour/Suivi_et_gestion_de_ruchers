# Tableau des Exigences Fonctionnelles

## Contexte

Ce document confronte le **cahier des charges initial** avec les **fonctionnalités réellement implémentées** dans le MVP (Minimum Viable Product) livré. Au cours du développement, l'équipe a fait le choix délibéré de diverger de certaines exigences du cahier des charges afin de produire un **MVP viable, utilisable et déployable** dans les délais impartis, tout en conservant une base technique solide permettant l'ajout ultérieur des fonctionnalités manquantes.

**Approche adoptée** : Plutôt que de livrer toutes les fonctionnalités à un niveau superficiel, nous avons privilégié la **profondeur et la qualité** sur un périmètre réduit mais cohérent, couvrant le cœur métier de la gestion apicole.

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ | Implémenté et fonctionnel |
| ⚠️ | Partiellement implémenté / Adapté |
| ❌ | Non implémenté (reporté post-MVP) |
| 🆕 | Ajout non prévu dans le cahier des charges |

---

## 1. Gestion Générale (§3.1 du cahier des charges)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-1.1 | Interface simple et intuitive, utilisable sur le terrain | ✅ | Interface responsive (Next.js + Tailwind CSS), sidebar de navigation, design épuré avec thème ambre cohérent | — |
| EF-1.2 | Gestion par cheptel (groupes de 20 à 50 ruches) → Gestion par rucher | ✅ | Entité `Rucher` avec nom, localisation GPS (lat/lng), type de flore, altitude, notes. CRUD complet via GraphQL (Hasura) + UI dédiée (`/dashboard/apiaries`) | Le cahier des charges mentionnait "cheptel" mais a été requalifié en "rucher" dès la phase de conception |
| EF-1.3 | Gestion par ruche individuelle avec immatriculation unique | ✅ | Entité `Ruche` avec immatriculation unique (format `X1234567`, regex validé), type (Dadant, Langstroth, Warré…), race d'abeille, statut sanitaire, maladie. CRUD complet + pages liste/détail (`/dashboard/hives`) | — |
| EF-1.4 | Géolocalisation des ruchers (GPS) | ✅ | Champs `latitude` et `longitude` sur le modèle `Rucher`. Composants `LocationPicker`, `LocationDisplay`, `RucherMiniMap`, `RuchersMap` avec carte interactive | — |
| EF-1.5 | Historique des déplacements (transhumance) | ✅ | Entité `Transhumance` avec origine (lat/lng), destination (lat/lng), flore cible, date. Mutation GraphQL `CREATE_TRANSHUMANCE` + `UPDATE_RUCHER_LOCATION`. Composant `TranshumanceDialog` en frontend | — |
| EF-1.6 | Système d'alertes anti-vol | ✅ | Alertes GPS via capteurs IoT : `gpsAlertActive`, `gpsReferenceLat/Lng`, `gpsThresholdMeters` sur le modèle `Capteur`. Endpoints REST : `activate_gps_alert`, `check_gps_alert`, `deactivate_gps_alert`. Calcul de distance (formule de Haversine) avec seuil paramétrable. Création d'alertes `DeplacementGPS` et notifications automatiques | — |

---

## 2. Suivi Sanitaire (§3.2 du cahier des charges)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-2.1 | Suivi de l'état de santé des colonies | ✅ | Champ `statut` sur `Ruche` (Active, Faible, Malade, Morte) + champ `maladie` (FK vers `TypeMaladie`) | — |
| EF-2.2 | Gestion des maladies et pathologies | ✅ | Table `TypeMaladie` avec 11 pathologies : Varroose, Nosemose, Loque Américaine/Européenne, Acarapisose, Ascosphérose, Tropilaelaps, Virus Ailes Déformées, Paralysie Chronique, Intoxication Pesticides, Aucune | — |
| EF-2.3 | Traçabilité des traitements (Apivar, acide oxalique, etc.) | ✅ | Interventions de type `Traitement` avec champs `produit` et `dosage` enregistrés par ruche | — |
| EF-2.4 | Respect des périodes de traitement et délais avant récolte | ⚠️ | Le calendrier apicole est implémenté côté notifications (`CALENDRIER_APICOLE` avec rappels saisonniers mois par mois). Les délais avant récolte ne sont pas bloquants automatiquement | La vérification automatique des délais récolte post-traitement a été jugée trop complexe pour le MVP, les rappels saisonniers couvrent le besoin principal |
| EF-2.5 | Statut sanitaire des ruches (Active, Malade, Morte) | ✅ | `StatutRuche` : Active, Faible, Malade, Morte | Le statut « Faible » a été ajouté par rapport au cahier des charges pour une granularité plus fine |
| EF-2.6 | Mise en quarantaine virtuelle des ruches malades | ❌ | Non implémenté | Reporté post-MVP. Le statut « Malade » identifie la ruche mais n'impose pas de quarantaine logique avec restrictions d'actions |
| EF-2.7 | Identification des colonies résistantes (sélection génétique) | ❌ | Non implémenté | Nécessite un historique suffisant et un algorithme de scoring. Reporté post-MVP — le champ `nonReproductible` sur `Reine` pose une base |

---

## 3. Traçabilité et Généalogie (§3.3 du cahier des charges)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-3.1 | Historique complet des interventions par ruche | ✅ | Entité `Intervention` liée à `Ruche` (FK), avec type, date, observations, produit, dosage, nbHausses, poidsKg. Page `/dashboard/interventions` + composant `InterventionTable` + ajout via `AddInterventionDialog` | — |
| EF-3.2 | Suivi des reines : année de naissance (code couleur international) | ✅ | Champs `anneeNaissance` et `codeCouleur` (Blanc, Jaune, Rouge, Vert, Bleu) sur le modèle `Reine` | — |
| EF-3.3 | Suivi des reines : lignée génétique | ✅ | Champ `lignee` (FK vers `LigneeReine` : Buckfast, Carnica, Ligustica, Caucasica, Locale, Inconnue) | — |
| EF-3.4 | Suivi des reines : note de douceur | ✅ | Champ `noteDouceur` (entier 1-10, validé) | — |
| EF-3.5 | Suivi des reines : historique de ponte | ❌ | Non implémenté en tant que données spécifiques | Reporté post-MVP. Le champ `commentaire` sur Reine permet des notes manuelles |
| EF-3.6 | Généalogie des essaims | ❌ | Non implémenté (pas de relation parent-enfant entre reines/colonies) | La généalogie nécessite un graphe de relations complexe. Reporté post-MVP |
| EF-3.7 | Marquage des colonies non reproductibles | ✅ | Champ `nonReproductible` (booléen) sur le modèle `Reine` | — |

---

## 4. Production et Récoltes (§3.4 du cahier des charges)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-4.1 | Suivi du rendement en miel par ruche et par rucher | ⚠️ | Les interventions de type `Recolte` enregistrent `nbHausses` et `poidsKg` par ruche. L'agrégation par rucher n'est pas automatisée dans l'UI | L'agrégation par rucher est faisable via les données existantes mais le tableau de bord de production n'a pas été priorisé dans le MVP |
| EF-4.2 | Gestion des récoltes (0 à 2 par an) | ✅ | Interventions de type `Recolte` sans limite, avec nombre de hausses et poids en kg | Pas de limite artificielle imposée (le terrain montre que certaines régions permettent plus de 2 récoltes) |
| EF-4.3 | Quantité par hausse (~15 kg) | ⚠️ | Le poids est saisi manuellement (champ `poidsKg`), pas de calcul automatique basé sur le nombre de hausses | Choix de laisser la liberté de saisie à l'apiculteur plutôt que d'imposer un ratio fixe |
| EF-4.4 | Historique annuel de production | ⚠️ | Toutes les interventions sont horodatées et interrogeables — le filtrage annuel est possible via GraphQL mais pas de vue dédiée dans l'UI | Reporté pour le dashboard analytique post-MVP |
| EF-4.5 | Identification des ruches les plus productives | ❌ | Non implémenté (pas de classement/scoring) | Fait partie du « Tableau de bord Elite » (§3.6), reporté post-MVP |

---

## 5. Actions Groupées (§3.5 du cahier des charges)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-5.1 | Sélection multiple de ruches | ✅ | Composant `BulkInterventionDialog` permettant de sélectionner plusieurs ruches d'un même rucher | — |
| EF-5.2 | Enregistrement d'une intervention commune (nourrissement, traitement, visite, récolte) | ✅ | Intervention groupée via `BulkInterventionDialog` : création d'une intervention identique pour chaque ruche sélectionnée. Supporte tous les types d'intervention | — |
| EF-5.3 | Gain de temps en période de forte activité | ✅ | Les actions groupées + la création en lot de ruches (`BulkCreateRuchesDialog`) réduisent significativement le nombre de saisies | — |

---

## 6. Tableau de Bord « Elite » (§3.6 du cahier des charges)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-6.1 | Classement automatique des ruches (productivité, survie, résistance) | ❌ | Non implémenté | Nécessite un historique de données sur plusieurs saisons. Reporté post-MVP |
| EF-6.2 | Identification des colonies à conserver / reproduire / exclure | ❌ | Non implémenté (seul le champ `nonReproductible` existe) | Le scoring automatisé nécessite des algorithmes métier validés avec l'apiculteur. Reporté |
| EF-6.3 | Aide à la décision pour la division printanière | ❌ | Non implémenté | Fait partie du volet analytique avancé. Reporté post-MVP |

---

## 7. Gestion des Reines — Élevage (§3.7 du cahier des charges)

### 7.1 Éleveurs de reines (§3.7.1)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-7.1 | Gestion d'un bloc de cupule de reines (racle) | ✅ | Entité `RacleElevage` avec référence, date de création, nombre de cupules, commentaire. Liée à une entreprise | — |
| EF-7.2 | Suivi des cycles d'élevage (greffage → vente) | ✅ | Entité `CycleElevageReine` avec date début/fin, statut (EnCours, Terminé, Annulé). Création automatique des 7 tâches planifiées via `create_default_tasks()` | — |
| EF-7.3 | Tâches du cycle : greffage, operculation, naissance, vol de fécondation, validation ponte, marquage, mise en vente | ✅ | Entité `TacheCycleElevage` avec les 7 types, jour théorique, date prévue/réalisée, statut (AFaire, Faite, EnRetard, Annulée). Calcul automatique du statut en retard | — |
| EF-7.4 | Identification unique de chaque reine (année, couleur, lignée, statut) | ✅ | Modèle `Reine` complet : `anneeNaissance`, `codeCouleur`, `lignee`, `statut` (Vendu, Perdue, NonFecondee, Fecondee, DisponibleVente, Eliminee) | — |
| EF-7.5 | Traçabilité complète pour sélection/certification/vente | ⚠️ | Toutes les données sont enregistrées et traçables (timestamps). Pas de module d'export de certificat | L'export de certificats est une fonctionnalité documentaire, reportée post-MVP |
| EF-7.6 | Historique sanitaire et comportemental (douceur, vitalité, ponte) | ⚠️ | `noteDouceur` (1-10) implémenté. Vitalité et régularité de ponte non modélisées spécifiquement | Simplification pour le MVP — le champ `commentaire` permet des notes libres |
| EF-7.7 | Gestion de lots de reines (par greffage ou série) | ✅ | La `RacleElevage` regroupe les reines par lot. Les reines sont liées à une racle via FK | — |

### 7.2 Activité mixte miel + élevage (§3.7.2)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-7.8 | Lien explicite entre reines et ruches de production | ✅ | Relation `OneToOneField` entre `Reine` et `Ruche`. Champ `isElevage` pour distinguer reines d'élevage vs production | — |
| EF-7.9 | Gestion des remérages (remplacement, perte, sélection) | ⚠️ | Le changement de reine associée à une ruche est possible via l'API. Pas de workflow dédié « remérage » dans l'UI | Le flux de remérage complet (avec historique) est reporté post-MVP |
| EF-7.10 | Identification des ruches souches / éleveuses / production | ⚠️ | Le champ `isElevage` sur `Reine` et `nonReproductible` permettent une distinction de base. Pas de catégorisation explicite des ruches | La catégorisation fine des ruches (souche, éleveuse, production) n'a pas été priorisée |
| EF-7.11 | Suivi impact des reines sur productivité/résistance/survie | ❌ | Non implémenté | Fait partie du volet analytique « Elite ». Nécessite un historique multi-saison |
| EF-7.12 | Marquage automatique reproductible / non reproductible | ⚠️ | Champ `nonReproductible` sur `Reine` (saisie manuelle). Pas de marquage automatique basé sur l'âge ou la mortalité | L'automatisation du marquage nécessite des règles métier complexes à valider |
| EF-7.13 | Profils entreprise : Apiculteur Producteur / Éleveur de Reines | ✅ | Modèle `EntrepriseProfile` + `TypeProfileEntreprise` (ApiculteurProducteur, EleveurDeReines, Pollinisateur). Switch de profil dans l'UI (sidebar `ProfileModeSwitcher`) avec navigation et vues adaptées | Le profil « Pollinisateur » a été ajouté en anticipation |

---

## 8. Fonctionnalités IoT et Sécurité (§4 du cahier des charges)

### 8.1 Monitoring IoT (§4.1)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-8.1 | Capteurs de poids (balances) | ✅ | Modèle `Capteur` avec type `Poids`, lié à une ruche. Modèle `Mesure` pour les valeurs horodatées | — |
| EF-8.2 | Capteurs de température interne | ✅ | Type `Temperature` dans `TypeCapteur` | — |
| EF-8.3 | Données en temps réel | ⚠️ | Les mesures sont enregistrables via l'API REST (`associate_capteur`, `list_capteurs`). Pas de streaming temps réel (WebSocket) pour les données IoT — le WebSocket existant est réservé à la vérification d'email | L'infrastructure WebSocket (Django Channels) est en place mais le streaming IoT temps réel a été reporté |
| EF-8.4 | Alertes en cas d'anomalie (chute de poids, température anormale) | ✅ | Modèle `Alerte` avec types : `ChutePoids`, `TemperatureCritique`, `BatterieFaible`, `HorsLigne`. Création automatique d'alertes et notifications | — |

### 8.2 Anti-vol (§4.2)

| ID | Exigence (cahier des charges) | Statut | Implémentation MVP | Justification de divergence |
|----|-------------------------------|--------|---------------------|----------------------------|
| EF-8.5 | Traceurs GPS intégrés aux ruches | ✅ | Capteur de type `GPS` associable aux ruches. Intégration avec le serveur **Traccar** (création/mise à jour/suppression de devices via `traccar_client.py`) | — |
| EF-8.6 | Détection de mouvement (accéléromètre) | ⚠️ | Implémenté via GPS (détection de déplacement au-delà d'un seuil en mètres, formule de Haversine) plutôt que via accéléromètre physique | La détection GPS est plus fiable et moins coûteuse en batterie que l'accéléromètre pour le cas d'usage anti-vol |
| EF-8.7 | Alertes immédiates en cas de déplacement non autorisé | ✅ | Endpoint `check_gps_alert` : compare la position actuelle avec la position de référence, crée une alerte `DeplacementGPS` + notification + email si seuil dépassé | — |

---

## 9. Fonctionnalités Ajoutées (non prévues dans le cahier des charges)

| ID | Fonctionnalité | Implémentation | Justification |
|----|----------------|----------------|---------------|
| 🆕 EF-9.1 | **Système multi-entreprise** | Modèle `Entreprise` + `UtilisateurEntreprise` avec rôles (AdminEntreprise, Apiculteur, Lecteur). Un utilisateur peut appartenir à plusieurs entreprises et switcher entre elles | Besoin terrain : les apiculteurs professionnels travaillent souvent pour plusieurs structures (GAEC, associations) |
| 🆕 EF-9.2 | **Système d'invitations** | Entité `Invitation` avec token, rôle proposé, date d'expiration. Flux complet : création par admin → email → page d'acceptation → inscription avec rattachement automatique | Permet la collaboration multi-utilisateurs au sein d'une entreprise |
| 🆕 EF-9.3 | **Offre Freemium / Premium (Stripe)** | Modèle `Offre` + `TypeOffreModel` + `LimitationOffre`. Intégration Stripe (checkout, webhooks). Limitations par offre : nombre de ruchers, capteurs, reines | Modèle économique nécessaire à la viabilité du produit |
| 🆕 EF-9.4 | **Système de notifications** | Entité `Notification` avec 6 types (RappelVisite, RappelTraitement, Equipe, Saisonnier, AlerteSanitaire, AlerteGPS). Webhooks Hasura pour déclenchement automatique. Panel de notifications dans l'UI avec badge de compteur | Améliore l'expérience utilisateur et la réactivité |
| 🆕 EF-9.5 | **Calendrier apicole automatisé** | Rappels saisonniers automatiques par mois (février→novembre) : préparation cadres, visite printemps, surveillance essaimage, pose hausses, récoltes, traitement varroa, nourrissement, hivernage | Aide à la décision concrète pour les apiculteurs débutants et intermédiaires |
| 🆕 EF-9.6 | **Vérification de compte par email** | `AccountVerificationToken` + flux WebSocket temps réel pour confirmation instantanée sans rechargement de page | Sécurité et conformité — empêche les inscriptions avec des emails invalides |
| 🆕 EF-9.7 | **Réinitialisation de mot de passe** | `PasswordResetToken` avec lien sécurisé par email, expiration temporelle | Fonctionnalité standard attendue par les utilisateurs |
| 🆕 EF-9.8 | **Création en lot de ruches** | Composant `BulkCreateRuchesDialog` : création de plusieurs ruches d'un coup pour un rucher | Gain de temps massif lors de l'installation de nouveaux ruchers |
| 🆕 EF-9.9 | **Infrastructure de production** | Docker Compose avec Traefik (reverse proxy + HTTPS Let's Encrypt), PostgreSQL, Hasura, Django (Gunicorn), Next.js, Traccar. Déploiement automatisé | Non spécifié dans le cahier des charges mais indispensable pour un MVP déployable |
| 🆕 EF-9.10 | **Qualité de code (SonarCloud)** | Analyse statique configurée (SonarCloud) avec couverture de tests backend (pytest) et frontend (Vitest). Tests unitaires et d'intégration | Garantit la maintenabilité et la fiabilité du code |
| 🆕 EF-9.11 | **Documentation API (Swagger/OpenAPI)** | Spécification OpenAPI complète (`OpenAPISpec.json`) + interface Swagger UI intégrée | Facilite l'intégration et la maintenance de l'API REST |

---

## 10. Synthèse Statistique

| Catégorie | Total exigences | ✅ Implémenté | ⚠️ Partiel | ❌ Non implémenté |
|-----------|----------------|--------------|-----------|-------------------|
| Gestion générale (§3.1) | 6 | 6 | 0 | 0 |
| Suivi sanitaire (§3.2) | 7 | 4 | 1 | 2 |
| Traçabilité et généalogie (§3.3) | 7 | 5 | 0 | 2 |
| Production et récoltes (§3.4) | 5 | 1 | 3 | 1 |
| Actions groupées (§3.5) | 3 | 3 | 0 | 0 |
| Tableau de bord Elite (§3.6) | 3 | 0 | 0 | 3 |
| Élevage de reines (§3.7) | 13 | 7 | 3 | 3 |
| IoT et sécurité (§4) | 7 | 5 | 2 | 0 |
| **TOTAL** | **51** | **31 (61%)** | **9 (18%)** | **11 (21%)** |
| Fonctionnalités ajoutées (🆕) | **11** | 11 | 0 | 0 |

---

## 11. Justification Globale des Divergences

### Pourquoi un MVP plutôt qu'une couverture exhaustive ?

1. **Contrainte de temps** : Le projet a été réalisé dans un cadre académique avec des délais fixes. Livrer 79% des exigences à un niveau fonctionnel et fiable est préférable à 100% de fonctionnalités instables.

2. **Priorisation métier** : En collaboration avec l'apiculteur client (conformément au §1.4 du cahier des charges), nous avons priorisé les fonctionnalités à forte valeur ajoutée quotidienne : gestion des ruchers/ruches, interventions, élevage de reines, IoT/anti-vol.

3. **Fonctionnalités analytiques reportées** : Le Tableau de bord « Elite » (§3.6), la généalogie des essaims et le scoring des colonies nécessitent un **historique de données sur plusieurs saisons** qui n'existe pas encore. Ces fonctionnalités n'auraient pas pu être testées de manière réaliste.

4. **Ajouts à forte valeur** : Les 11 fonctionnalités ajoutées (multi-entreprise, invitations, Freemium/Premium, notifications, vérification email, infrastructure de production) n'étaient pas dans le cahier des charges mais sont **indispensables** pour un produit réellement utilisable et déployable.

5. **Architecture extensible** : Le socle technique (Django + Hasura + Next.js + Docker) et le modèle de données sont conçus pour accueillir facilement les fonctionnalités manquantes sans refactoring majeur.

### Fonctionnalités prioritaires pour la V2

| Priorité | Fonctionnalité | Effort estimé |
|----------|----------------|---------------|
| 1 | Quarantaine virtuelle des ruches malades | Faible |
| 2 | Dashboard de production (agrégation récoltes par rucher/an) | Moyen |
| 3 | Historique de ponte des reines | Moyen |
| 4 | Workflow de remérage dédié | Moyen |
| 5 | Tableau de bord Elite (scoring colonies) | Élevé |
| 6 | Généalogie des essaims (graphe de relations) | Élevé |
| 7 | Streaming IoT temps réel (WebSocket) | Moyen |

---

## 12. Équipe Projet

| Rôle | Membre |
|------|--------|
| Chef de projet | Sayfoutdinov Timour |
| Développement Front-end | Joly Dorian |
| Développement Back-end | Gesse Corentin |
| DevOps / Infrastructure | Ait Ouarab Mélissa |

---

*Document généré le 11 février 2026 — Version MVP*
