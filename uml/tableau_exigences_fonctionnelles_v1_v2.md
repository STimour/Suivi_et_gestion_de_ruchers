# Tableau des Exigences Fonctionnelles — Plan V1 & V2

## Contexte

Ce document présente la **planification complète** pour atteindre une couverture à 100 % du cahier des charges initial, répartie en deux versions :

- **V1 (MVP livré)** : Version actuelle déployée, couvrant 79 % des exigences du cahier des charges (61 % complet + 18 % partiel) ainsi que 11 fonctionnalités ajoutées hors périmètre initial.
- **V2 (Évolution planifiée)** : Version cible complétant les 21 % d'exigences non implémentées et finalisant les 18 % partiellement couverts, pour atteindre **100 % de conformité** avec le cahier des charges.

L'équipe a fait le choix assumé de diverger du cahier des charges pour la V1 afin de produire un MVP viable et utilisable. La V2 comble ces écarts tout en capitalisant sur l'architecture extensible mise en place.

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ V1 | Livré et fonctionnel dans le MVP |
| ⚠️ V1 → ✅ V2 | Partiellement livré en V1, complété en V2 |
| ❌ V1 → ✅ V2 | Non implémenté en V1, livré en V2 |
| 🆕 V1 | Fonctionnalité ajoutée en V1, non prévue au cahier des charges |
| 🆕 V2 | Fonctionnalité ajoutée en V2, non prévue au cahier des charges |

---

## 1. Gestion Générale (§3.1 du cahier des charges)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-1.1 | Interface simple et intuitive, utilisable sur le terrain | ✅ | — | Interface responsive Next.js + Tailwind CSS, sidebar de navigation, design thème ambre | — |
| EF-1.2 | Gestion par rucher (ex-cheptel) | ✅ | — | Entité `Rucher` avec CRUD complet via GraphQL + UI dédiée (`/dashboard/apiaries`) | — |
| EF-1.3 | Gestion par ruche individuelle avec immatriculation unique | ✅ | — | `Ruche` avec immatriculation `X1234567`, type, race, statut, maladie. CRUD + pages liste/détail | — |
| EF-1.4 | Géolocalisation des ruchers (GPS) | ✅ | — | Lat/lng sur `Rucher` + composants carte interactive (LocationPicker, RuchersMap, MiniMap) | — |
| EF-1.5 | Historique des déplacements (transhumance) | ✅ | — | Entité `Transhumance` + `TranshumanceDialog` + mise à jour localisation du rucher | — |
| EF-1.6 | Système d'alertes anti-vol | ✅ | — | Alertes GPS (Haversine), endpoints `activate/check/deactivate_gps_alert`, notifications automatiques | — |

> **Bilan §3.1** : ✅ 6/6 en V1 — **Couverture complète dès le MVP**

---

## 2. Suivi Sanitaire (§3.2 du cahier des charges)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-2.1 | Suivi de l'état de santé des colonies | ✅ | — | Champ `statut` (Active, Faible, Malade, Morte) + `maladie` (11 pathologies) | — |
| EF-2.2 | Gestion des maladies et pathologies | ✅ | — | Table `TypeMaladie` : Varroose, Nosemose, Loques, Acarapisose, etc. | — |
| EF-2.3 | Traçabilité des traitements | ✅ | — | Interventions `Traitement` avec champs `produit` et `dosage` | — |
| EF-2.4 | Respect des périodes de traitement et délais avant récolte | ⚠️ | ✅ | Calendrier apicole avec rappels saisonniers. Délais non bloquants | **Ajout d'un système de délai de carence** : après un traitement (ex. Apivar), blocage de la création d'intervention `Recolte` pendant la durée réglementaire. Table `DelaiCarence` (produit, durée en jours). Alerte visuelle sur les ruches en période de carence |
| EF-2.5 | Statut sanitaire des ruches | ✅ | — | `StatutRuche` : Active, Faible, Malade, Morte | — |
| EF-2.6 | Mise en quarantaine virtuelle des ruches malades | ❌ | ✅ | Non implémenté | **Quarantaine logique** : lorsqu'une ruche passe en statut `Malade`, elle est automatiquement marquée « en quarantaine ». Restrictions : pas de transhumance, pas de récolte, avertissement lors d'interventions groupées. Badge visuel « 🔴 Quarantaine » dans l'UI. Levée manuelle par l'apiculteur après traitement |
| EF-2.7 | Identification des colonies résistantes (sélection génétique) | ❌ | ✅ | Non implémenté | **Score de résistance** calculé automatiquement : survie hivernale (pondération 40 %), fréquence de maladies (30 %), productivité (30 %). Basé sur l'historique des interventions et des statuts sur 1+ saisons. Affiché sur la fiche ruche et exploitable dans le Tableau de bord Elite |

> **Bilan §3.2** : V1 = 4 ✅ + 1 ⚠️ + 2 ❌ → V2 = **7/7 ✅ (100 %)**

---

## 3. Traçabilité et Généalogie (§3.3 du cahier des charges)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-3.1 | Historique complet des interventions par ruche | ✅ | — | `Intervention` liée à `Ruche` (FK), types variés, page dédiée, composant `InterventionTable` | — |
| EF-3.2 | Suivi des reines : année de naissance (code couleur) | ✅ | — | `anneeNaissance` + `codeCouleur` (Blanc, Jaune, Rouge, Vert, Bleu) | — |
| EF-3.3 | Suivi des reines : lignée génétique | ✅ | — | FK vers `LigneeReine` (Buckfast, Carnica, Ligustica, Caucasica, Locale, Inconnue) | — |
| EF-3.4 | Suivi des reines : note de douceur | ✅ | — | `noteDouceur` (1-10, validé) | — |
| EF-3.5 | Suivi des reines : historique de ponte | ❌ | ✅ | Non implémenté (notes manuelles via `commentaire`) | **Modèle `HistoriquePonte`** : date, qualité (Régulière, Irrégulière, Absente), couvain compact (booléen), nb cadres de couvain, observations. Lié à `Reine` (FK). Vue chronologique sur la fiche reine avec graphique d'évolution |
| EF-3.6 | Généalogie des essaims | ❌ | ✅ | Non implémenté | **Relations de parenté** : ajout de `reineMere` (FK self, nullable) sur le modèle `Reine`. Permet de tracer les lignées sur N générations. Vue arbre généalogique interactif (composant `GenealogyTree`) sur la fiche reine. Identification automatique des lignées performantes en croisant avec les scores de productivité/résistance |
| EF-3.7 | Marquage des colonies non reproductibles | ✅ | — | Champ `nonReproductible` (booléen) sur `Reine` | — |

> **Bilan §3.3** : V1 = 5 ✅ + 2 ❌ → V2 = **7/7 ✅ (100 %)**

---

## 4. Production et Récoltes (§3.4 du cahier des charges)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-4.1 | Suivi du rendement en miel par ruche et par rucher | ⚠️ | ✅ | Interventions `Recolte` avec `nbHausses` et `poidsKg` par ruche. Pas d'agrégation UI | **Dashboard de production** : page `/dashboard/production` avec agrégation automatique par ruche, par rucher et par entreprise. Filtrage par année/saison. Graphiques (barres, tendances) via bibliothèque de charts |
| EF-4.2 | Gestion des récoltes (0 à 2 par an) | ✅ | — | Interventions `Recolte` sans limite, avec nb hausses et poids | — |
| EF-4.3 | Quantité par hausse (~15 kg) | ⚠️ | ✅ | Poids saisi manuellement | **Estimation automatique** : champ calculé `poidsEstime = nbHausses × 15` pré-rempli, modifiable par l'apiculteur. Permet de comparer le poids réel vs estimé pour identifier les miellées exceptionnelles |
| EF-4.4 | Historique annuel de production | ⚠️ | ✅ | Données horodatées et interrogeables via GraphQL, pas de vue dédiée | **Vue historique annuelle** intégrée au dashboard de production. Tableau comparatif année N vs N-1, graphique d'évolution pluriannuelle. Export CSV des données de production |
| EF-4.5 | Identification des ruches les plus productives | ❌ | ✅ | Non implémenté | **Classement de productivité** : score calculé = poids total récolté / nombre de récoltes, pondéré par la saison. Top 10 / Bottom 10 sur le dashboard. Intégré au Tableau de bord Elite (§3.6) |

> **Bilan §3.4** : V1 = 1 ✅ + 3 ⚠️ + 1 ❌ → V2 = **5/5 ✅ (100 %)**

---

## 5. Actions Groupées (§3.5 du cahier des charges)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-5.1 | Sélection multiple de ruches | ✅ | — | `BulkInterventionDialog` : sélection multiple au sein d'un rucher | — |
| EF-5.2 | Enregistrement d'une intervention commune | ✅ | — | Intervention groupée pour tous types (nourrissement, traitement, visite, récolte) | — |
| EF-5.3 | Gain de temps en période de forte activité | ✅ | — | Actions groupées + `BulkCreateRuchesDialog` (création en lot) | — |

> **Bilan §3.5** : ✅ 3/3 en V1 — **Couverture complète dès le MVP**

---

## 6. Tableau de Bord « Elite » (§3.6 du cahier des charges)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-6.1 | Classement automatique des ruches (productivité, survie, résistance) | ❌ | ✅ | Non implémenté | **Page `/dashboard/elite`** : classement automatique de toutes les ruches par score composite. Trois axes notés de 1 à 10 : productivité (poids récolté, nb hausses), survie hivernale (statut actif post-hiver), résistance sanitaire (fréquence/durée des maladies). Score global = moyenne pondérée personnalisable. Vue tableau triable + vue graphique radar par ruche |
| EF-6.2 | Identification des colonies à conserver / reproduire / exclure | ❌ | ✅ | Seul le champ `nonReproductible` existe | **Recommandations automatisées** basées sur le score Elite : 🟢 « Conserver & Reproduire » (score > 7), 🟡 « Observer » (score 4-7), 🔴 « Exclure de la reproduction » (score < 4). Marquage automatique de `nonReproductible` sur les reines des colonies < 4. Possibilité de forcer manuellement |
| EF-6.3 | Aide à la décision pour la division printanière | ❌ | ✅ | Non implémenté | **Module « Préparation Printemps »** accessible depuis le dashboard Elite en février-avril. Suggestions automatiques : colonies à diviser (score > 8, forte population estimée), colonies donneuses de cadres, colonies à surveiller. Checklist interactive validable par l'apiculteur |

> **Bilan §3.6** : V1 = 0/3 → V2 = **3/3 ✅ (100 %)**

---

## 7. Gestion des Reines — Élevage (§3.7 du cahier des charges)

### 7.1 Éleveurs de reines (§3.7.1)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-7.1 | Gestion d'un bloc de cupule de reines (racle) | ✅ | — | `RacleElevage` avec référence, date, nb cupules, commentaire | — |
| EF-7.2 | Suivi des cycles d'élevage (greffage → vente) | ✅ | — | `CycleElevageReine` avec 7 tâches planifiées automatiquement | — |
| EF-7.3 | Tâches du cycle d'élevage (7 étapes) | ✅ | — | `TacheCycleElevage` : Greffage, Operculation, Naissance, Vol fécondation, Validation ponte, Marquage, Mise en vente. Statut auto (AFaire, Faite, EnRetard, Annulée) | — |
| EF-7.4 | Identification unique de chaque reine | ✅ | — | `anneeNaissance`, `codeCouleur`, `lignee`, `statut` (6 valeurs) | — |
| EF-7.5 | Traçabilité complète pour sélection/certification/vente | ⚠️ | ✅ | Données traçables (timestamps). Pas d'export de certificat | **Export PDF de fiche reine** : certificat d'élevage avec lignée, historique sanitaire, scores, QR code d'identification unique. Conforme aux exigences de traçabilité pour la vente de reines |
| EF-7.6 | Historique sanitaire et comportemental (douceur, vitalité, ponte) | ⚠️ | ✅ | `noteDouceur` implémenté. Vitalité et ponte non modélisées | **Ajout de champs** : `noteVitalite` (1-10), lien vers `HistoriquePonte` (EF-3.5). Fiche reine complète avec onglets : Identité, Comportement, Historique ponte, Cycle d'élevage |
| EF-7.7 | Gestion de lots de reines (par greffage ou série) | ✅ | — | `RacleElevage` regroupe les reines par lot (FK) | — |

### 7.2 Activité mixte miel + élevage (§3.7.2)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-7.8 | Lien explicite entre reines et ruches de production | ✅ | — | OneToOneField `Reine ↔ Ruche` + champ `isElevage` | — |
| EF-7.9 | Gestion des remérages | ⚠️ | ✅ | Changement de reine possible via API, pas de workflow dédié | **Workflow « Remérage »** : nouvelle intervention de type `Remerage` avec champs dédiés (raison : perte, âge, sélection ; reine sortante, reine entrante). Historique des remérages consultable sur la fiche ruche. Notification automatique si reine > 2 ans sans remérage |
| EF-7.10 | Identification des ruches souches / éleveuses / production | ⚠️ | ✅ | `isElevage` et `nonReproductible` pour distinction de base | **Catégorisation explicite des ruches** : ajout de champ `roleRuche` (enum : `Production`, `Souche`, `Eleveuse`, `Starter`, `Finisseur`). Filtrage par rôle dans la liste des ruches. Badge visuel sur les cartes de ruche |
| EF-7.11 | Suivi impact des reines sur productivité/résistance/survie | ❌ | ✅ | Non implémenté | **Corrélation reine ↔ performance** : sur la fiche reine, section « Impact » montrant la productivité moyenne, la résistance sanitaire et la survie hivernale des ruches où cette reine a été introduite. Croisement avec le score Elite. Permet d'identifier les lignées les plus performantes |
| EF-7.12 | Marquage automatique reproductible / non reproductible | ⚠️ | ✅ | `nonReproductible` en saisie manuelle | **Marquage automatique** : règles configurables — reine morte avant 2 ans → `nonReproductible = true`, score Elite de la ruche < 3 → `nonReproductible = true`, reine non fécondée après 30 jours → suggestion de marquage. Notifications à l'apiculteur avec possibilité de confirmer ou ignorer |
| EF-7.13 | Profils entreprise : Apiculteur / Éleveur | ✅ | — | `EntrepriseProfile` + `TypeProfileEntreprise` + switch UI | — |

> **Bilan §3.7** : V1 = 7 ✅ + 4 ⚠️ + 2 ❌ → V2 = **13/13 ✅ (100 %)**

---

## 8. Fonctionnalités IoT et Sécurité (§4 du cahier des charges)

### 8.1 Monitoring IoT (§4.1)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-8.1 | Capteurs de poids (balances) | ✅ | — | `Capteur` type `Poids` + `Mesure` horodatée | — |
| EF-8.2 | Capteurs de température interne | ✅ | — | Type `Temperature` dans `TypeCapteur` | — |
| EF-8.3 | Données en temps réel | ⚠️ | ✅ | API REST pour enregistrer/lister les mesures. Pas de streaming temps réel | **WebSocket IoT temps réel** : nouveau consumer Django Channels `IoTDataConsumer`. Le frontend s'abonne par ruche/rucher et reçoit les mesures en push. Graphiques temps réel (poids, température, humidité) avec mise à jour automatique. Indicateur « dernière communication » en temps réel |
| EF-8.4 | Alertes en cas d'anomalie (chute de poids, température) | ✅ | — | `Alerte` avec types ChutePoids, TemperatureCritique, BatterieFaible, HorsLigne | — |

### 8.2 Anti-vol (§4.2)

| ID | Exigence | V1 | V2 | Détail V1 (MVP livré) | Détail V2 (évolution planifiée) |
|----|----------|----|----|----------------------|-------------------------------|
| EF-8.5 | Traceurs GPS intégrés aux ruches | ✅ | — | Capteur `GPS` + intégration Traccar (CRUD devices) | — |
| EF-8.6 | Détection de mouvement (accéléromètre) | ⚠️ | ✅ | Détection via GPS (seuil de déplacement en mètres, Haversine) | **Support accéléromètre** : nouveau type capteur `Accelerometre`. Détection de secousses/vibrations suspectes (seuil configurable). Alerte `MouvementSuspect` combinable avec l'alerte GPS pour réduire les faux positifs. Priorité alerte : accéléromètre (instantané) → confirmation GPS (localisation) |
| EF-8.7 | Alertes immédiates en cas de déplacement non autorisé | ✅ | — | `check_gps_alert` + alerte `DeplacementGPS` + notification + email | — |

> **Bilan §4** : V1 = 5 ✅ + 2 ⚠️ → V2 = **7/7 ✅ (100 %)**

---

## 9. Fonctionnalités Ajoutées (hors cahier des charges)

### 9.1 Ajouts V1 (MVP)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| 🆕 EF-9.1 | Système multi-entreprise | `Entreprise` + `UtilisateurEntreprise` avec rôles (Admin, Apiculteur, Lecteur), switch d'entreprise |
| 🆕 EF-9.2 | Système d'invitations | `Invitation` avec token, rôle, expiration. Flux email → acceptation → rattachement |
| 🆕 EF-9.3 | Offre Freemium / Premium (Stripe) | `Offre` + `LimitationOffre` + checkout Stripe + webhooks. Quotas par offre |
| 🆕 EF-9.4 | Système de notifications | 6 types de notifications, webhooks Hasura, panel UI avec badge compteur |
| 🆕 EF-9.5 | Calendrier apicole automatisé | Rappels saisonniers mensuels (février → novembre) |
| 🆕 EF-9.6 | Vérification de compte par email | `AccountVerificationToken` + WebSocket pour confirmation temps réel |
| 🆕 EF-9.7 | Réinitialisation de mot de passe | `PasswordResetToken` + flux email sécurisé |
| 🆕 EF-9.8 | Création en lot de ruches | `BulkCreateRuchesDialog` : ajout rapide de plusieurs ruches |
| 🆕 EF-9.9 | Infrastructure de production | Docker Compose + Traefik (HTTPS) + PostgreSQL + Hasura + Django + Next.js + Traccar |
| 🆕 EF-9.10 | Qualité de code (SonarCloud) | Analyse statique, couverture tests backend (pytest) + frontend (Vitest) |
| 🆕 EF-9.11 | Documentation API (Swagger/OpenAPI) | `OpenAPISpec.json` + Swagger UI intégré |

### 9.2 Ajouts V2 (Évolution)

| ID | Fonctionnalité | Détail | Priorité |
|----|----------------|--------|----------|
| 🆕 EF-9.12 | Cahier de miellerie numérique | Remplacement du cahier papier conformément à l'objectif §1.2 du cahier des charges. Module dédié avec registre des récoltes, traçabilité lot → extraction → conditionnement → vente. Conforme aux exigences sanitaires (numéro de lot, DLUO) | Haute |
| 🆕 EF-9.13 | Export de données (CSV / PDF) | Export des interventions, récoltes, fiches ruches et reines au format CSV et PDF. Certificats d'élevage en PDF | Moyenne |
| 🆕 EF-9.14 | Mode hors-ligne (PWA) | Progressive Web App avec Service Worker. Saisie d'interventions hors-ligne avec synchronisation automatique au retour de la connexion. Indispensable pour le terrain | Haute |
| 🆕 EF-9.15 | Tableau de bord analytique avancé | Dashboard avec KPI globaux : taux de mortalité, production moyenne, coût par ruche, ROI par rucher. Graphiques pluriannuels | Moyenne |

---

## 10. Synthèse Comparative V1 vs V2

### 10.1 Par section du cahier des charges

| Section | Total | V1 ✅ | V1 ⚠️ | V1 ❌ | V2 ✅ | Couverture V1 | Couverture V2 |
|---------|-------|-------|--------|-------|-------|---------------|---------------|
| §3.1 Gestion générale | 6 | 6 | 0 | 0 | — | **100 %** | 100 % |
| §3.2 Suivi sanitaire | 7 | 4 | 1 | 2 | +3 | 57 % | **100 %** |
| §3.3 Traçabilité / Généalogie | 7 | 5 | 0 | 2 | +2 | 71 % | **100 %** |
| §3.4 Production / Récoltes | 5 | 1 | 3 | 1 | +4 | 20 % | **100 %** |
| §3.5 Actions groupées | 3 | 3 | 0 | 0 | — | **100 %** | 100 % |
| §3.6 Tableau de bord Elite | 3 | 0 | 0 | 3 | +3 | 0 % | **100 %** |
| §3.7 Élevage de reines | 13 | 7 | 4 | 2 | +6 | 54 % | **100 %** |
| §4 IoT et sécurité | 7 | 5 | 2 | 0 | +2 | 71 % | **100 %** |
| **TOTAL cahier des charges** | **51** | **31** | **10** | **10** | **+20** | **61 %** | **100 %** |
| Ajouts hors cahier des charges | 11 (V1) + 4 (V2) | 11 | — | — | +4 | — | — |

### 10.2 Vue globale

```
V1 (MVP)          ████████████████████░░░░░  79 % (✅ 61% + ⚠️ 18%)
V2 (Cible)        █████████████████████████  100 %

Fonctionnalités totales livrées :
  V1 : 31 complètes + 10 partielles + 11 ajouts = 52 fonctionnalités
  V2 : 51 complètes + 15 ajouts                 = 66 fonctionnalités
```

---

## 11. Planning V2

### 11.1 Répartition par sprint

| Sprint | Durée | Fonctionnalités | IDs |
|--------|-------|-----------------|-----|
| **Sprint 1** — Sanitaire & Quarantaine | 2 semaines | Quarantaine virtuelle, délais de carence post-traitement | EF-2.4, EF-2.6 |
| **Sprint 2** — Production & Récoltes | 3 semaines | Dashboard production, estimation hausse, historique annuel, classement productivité | EF-4.1, EF-4.3, EF-4.4, EF-4.5 |
| **Sprint 3** — Reines & Généalogie | 3 semaines | Historique de ponte, généalogie (reineMere + arbre), vitalité, export PDF certificat | EF-3.5, EF-3.6, EF-7.5, EF-7.6 |
| **Sprint 4** — Élevage avancé | 2 semaines | Workflow remérage, catégorisation ruches, marquage automatique reproductible | EF-7.9, EF-7.10, EF-7.12 |
| **Sprint 5** — Tableau de bord Elite | 3 semaines | Score composite, classement, recommandations automatiques, module division printanière | EF-6.1, EF-6.2, EF-6.3, EF-2.7 |
| **Sprint 6** — Analytics & Corrélations | 2 semaines | Impact reine sur performance, cahier de miellerie, dashboard analytique | EF-7.11, EF-9.12, EF-9.15 |
| **Sprint 7** — IoT temps réel | 2 semaines | WebSocket IoT, support accéléromètre | EF-8.3, EF-8.6 |
| **Sprint 8** — UX & Exports | 2 semaines | Mode hors-ligne (PWA), exports CSV/PDF | EF-9.13, EF-9.14 |

### 11.2 Estimation globale V2

| Métrique | Valeur |
|----------|--------|
| Nombre de sprints | 8 |
| Durée totale estimée | ~19 semaines |
| Nouvelles entités/modèles | 3 (HistoriquePonte, DelaiCarence, CahierMiellerie) |
| Champs ajoutés sur modèles existants | ~8 (reineMere, noteVitalite, roleRuche, etc.) |
| Nouvelles pages frontend | 4 (production, elite, generalogie, cahier miellerie) |
| Nouveaux composants frontend | ~15 |
| Nouvelles API/endpoints | ~6 |

---

## 12. Équipe Projet

| Rôle | Membre |
|------|--------|
| Chef de projet | Sayfoutdinov Timour |
| Développement Front-end | Joly Dorian |
| Développement Back-end | Gesse Corentin |
| DevOps / Infrastructure | Ait Ouarab Mélissa |

---

*Document généré le 11 février 2026 — Plan V1 & V2*
