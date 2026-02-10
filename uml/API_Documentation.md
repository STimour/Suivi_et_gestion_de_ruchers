# 📖 Documentation API — Suivi et Gestion de Ruchers

> **Version** : 1.0  
> **Date** : Février 2026  
> **Projet** : Suivi et Gestion de Ruchers  
> **Architecture** : Django REST (backend métier) + Hasura GraphQL (données CRUD)

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Authentification](#2-authentification)
3. [API REST — Django](#3-api-rest--django)
   - [Auth](#31-auth)
   - [Entreprise](#32-entreprise)
   - [Capteurs (IoT)](#33-capteurs-iot)
   - [Webhooks](#34-webhooks)
   - [Stripe](#35-stripe)
4. [API GraphQL — Hasura](#4-api-graphql--hasura)
   - [Ruchers](#41-ruchers)
   - [Ruches](#42-ruches)
   - [Reines](#43-reines)
   - [Interventions](#44-interventions)
   - [Transhumances](#45-transhumances)
   - [Notifications](#46-notifications)
   - [Énumérations (tables de référence)](#47-énumérations-tables-de-référence)
5. [Modèle de données](#5-modèle-de-données)
6. [Codes d'erreur](#6-codes-derreur)

---

## 1. Vue d'ensemble

L'application utilise une **architecture hybride** :

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **REST API** | Django (Python) | Authentification, gestion entreprise, IoT (Traccar), webhooks, Stripe |
| **GraphQL API** | Hasura | CRUD données métier (ruchers, ruches, reines, interventions, transhumances, notifications) |
| **Frontend** | Next.js + Apollo Client | Consomme les deux APIs |

### URLs de base

| Environnement | REST API | GraphQL API | Swagger UI |
|---------------|----------|-------------|------------|
| Local | `http://localhost:8000/api/` | `http://localhost:8080/v1/graphql` | `http://localhost:8000/swagger/` |

### Headers communs

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Pour Hasura, le JWT contient des **claims Hasura** qui permettent le contrôle d'accès par rôle et par entreprise :

```json
{
  "https://hasura.io/jwt/claims": {
    "x-hasura-user-id": "<uuid>",
    "x-hasura-default-role": "Apiculteur",
    "x-hasura-allowed-roles": ["Lecteur", "Apiculteur", "AdminEntreprise"],
    "x-hasura-entreprise-id": "<uuid>",
    "x-hasura-offre": "Freemium"
  }
}
```

---

## 2. Authentification

Le système utilise des **JSON Web Tokens (JWT)** signés en HS256. Les tokens ont une durée de validité de **24 heures**.

### Flux d'authentification

```
1. POST /api/auth/register  ou  POST /api/auth/login
   → Réponse : { access_token, user }

2. Inclure le token dans chaque requête :
   Authorization: Bearer <access_token>

3. POST /api/auth/logout  (confirmation côté serveur, suppression côté client)
```

### Rôles utilisateur

| Rôle | Valeur | Description |
|------|--------|-------------|
| Admin Entreprise | `AdminEntreprise` | Gestion complète de l'entreprise, invitations, offres |
| Apiculteur | `Apiculteur` | Gestion des ruchers, ruches, interventions |
| Lecteur | `Lecteur` | Lecture seule |

---

## 3. API REST — Django

**Base URL** : `/api/`

### 3.1 Auth

#### `POST /api/auth/register`

Inscription d'un nouvel utilisateur.

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `email` | string | ✅ | Adresse email (unique) |
| `password` | string | ✅ | Mot de passe |
| `nom` | string | ✅ | Nom de famille |
| `prenom` | string | ✅ | Prénom |

**Réponse `201` :**

```json
{
  "access_token": "eyJhbGciOiJIUzI...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "entreprises": [
      { "id": "uuid", "nom": "Ma Ruche SARL", "role": "AdminEntreprise" }
    ]
  }
}
```

**Erreurs :**

| Code | Erreur | Description |
|------|--------|-------------|
| 400 | `missing_fields` | Champs requis manquants |
| 409 | `email_already_exists` | Email déjà utilisé |

---

#### `POST /api/auth/login`

Connexion d'un utilisateur existant.

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `email` | string | ✅ | Adresse email |
| `password` | string | ✅ | Mot de passe |

**Réponse `200` :**

```json
{
  "access_token": "eyJhbGciOiJIUzI...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "entreprises": [
      { "id": "uuid", "nom": "Ma Ruche SARL", "role": "AdminEntreprise" }
    ]
  }
}
```

**Erreurs :**

| Code | Erreur | Description |
|------|--------|-------------|
| 400 | `missing_fields` | Email ou mot de passe manquant |
| 401 | `invalid_credentials` | Email ou mot de passe incorrect |
| 403 | `user_inactive` | Compte désactivé |

---

#### `POST /api/auth/logout`

Déconnexion (confirmation serveur). Le client doit supprimer le token localement.

**Headers :** `Authorization: Bearer <token>`

**Réponse `200` :**

```json
{ "message": "logout_successful" }
```

---

#### `GET /api/auth/me`

Récupérer le profil de l'utilisateur connecté avec ses entreprises et offres.

**Headers :** `Authorization: Bearer <token>`

**Réponse `200` :**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "actif": true,
    "entreprises": [
      {
        "id": "uuid",
        "nom": "Ma Ruche SARL",
        "role": "AdminEntreprise",
        "typeOffre": "Freemium",
        "typeProfiles": ["ApiculteurProducteur"],
        "subscriptionActive": true,
        "paid": false,
        "offre": {
          "id": "uuid",
          "type": { "value": "Freemium", "titre": "Freemium", "description": "...", "prixHT": null, "prixTTC": null },
          "dateDebut": "2026-01-01T00:00:00+00:00",
          "dateFin": null,
          "active": true,
          "nbRuchersMax": 3,
          "nbCapteursMax": 1,
          "nbReinesMax": 5
        }
      }
    ]
  }
}
```

---

#### `POST /api/auth/accept-invitation`

Accepter une invitation à rejoindre une entreprise.

**Headers :** `Authorization: Bearer <token>`

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `token` | string | ✅ | Token JWT de l'invitation |

**Réponse `200` :**

```json
{
  "message": "invitation_accepted",
  "access_token": "eyJhbGciOiJIUzI...",
  "entreprise": { "id": "uuid", "nom": "Mon Entreprise", "role": "Apiculteur" },
  "user": { "id": "uuid", "email": "user@example.com", "entreprises": [...] }
}
```

**Erreurs :**

| Code | Erreur | Description |
|------|--------|-------------|
| 401 | `invalid_token` | Token invalide ou expiré |
| 404 | `invitation_not_found` | Invitation introuvable |
| 409 | `invitation_already_accepted` | Invitation déjà acceptée |
| 410 | `invitation_expired` | Invitation expirée |

---

#### `POST /api/auth/switch-entreprise`

Changer le contexte entreprise et obtenir un nouveau token JWT.

**Headers :** `Authorization: Bearer <token>`

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `entreprise_id` | string (uuid) | ✅ | ID de l'entreprise cible |

**Réponse `200` :**

```json
{
  "access_token": "eyJhbGciOiJIUzI...",
  "entreprise": { "id": "uuid", "nom": "Mon Entreprise", "role": "Apiculteur" }
}
```

**Erreurs :**

| Code | Erreur | Description |
|------|--------|-------------|
| 403 | `not_in_entreprise` | L'utilisateur n'est pas membre de cette entreprise |

---

#### `GET /api/auth/current-entreprise`

Récupérer les détails de l'entreprise courante du token.

**Headers :** `Authorization: Bearer <token>`

**Réponse `200` :**

```json
{
  "entreprise": {
    "id": "uuid",
    "nom": "Ma Ruche SARL",
    "role": "AdminEntreprise",
    "typeOffre": "Freemium",
    "typeProfiles": ["ApiculteurProducteur", "EleveurDeReines"],
    "subscriptionActive": true,
    "paid": false,
    "offre": { "..." }
  }
}
```

---

### 3.2 Entreprise

#### `POST /api/entreprise`

Créer une entreprise. L'utilisateur connecté devient **AdminEntreprise**.

**Headers :** `Authorization: Bearer <token>`

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `nom` | string | ✅ | Nom de l'entreprise |
| `adresse` | string | ✅ | Adresse postale |
| `typeProfiles` | string[] | ❌ | Profils métier : `ApiculteurProducteur`, `EleveurDeReines`, `Pollinisateur` |
| `typeOffre` | string | ❌ | Type d'offre : `Freemium` (défaut) ou `Premium` |

**Réponse `201` :**

```json
{
  "id": "uuid",
  "nom": "Mon Entreprise",
  "adresse": "123 rue des Abeilles",
  "access_token": "eyJhbGciOiJIUzI..."
}
```

---

#### `POST /api/entreprise/invitation`

Créer une invitation et envoyer un email au destinataire.

**Headers :** `Authorization: Bearer <token>`

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `email` | string | ✅ | Email du destinataire |
| `rolePropose` | string | ✅ | Rôle proposé : `Apiculteur`, `AdminEntreprise`, `Lecteur` |
| `entreprise_id` | string (uuid) | ✅ | ID de l'entreprise |

**Réponse `201` :**

```json
{
  "id": "uuid",
  "token": "eyJhbGciOiJIUzI...",
  "email": "invite@example.com",
  "rolePropose": "Apiculteur",
  "entreprise_id": "uuid",
  "dateExpiration": "2026-02-16T12:00:00+00:00",
  "email_sent": true
}
```

---

#### `POST /api/entreprises/:entreprise_id/offre`

Mettre à jour le type d'offre d'une entreprise. **Rôle requis : AdminEntreprise**.

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `typeOffre` | string | ✅ | `Freemium` ou `Premium` |

**Réponse `200` :**

```json
{
  "entreprise_id": "uuid",
  "typeOffre": "Premium",
  "nbRuchersMax": -1,
  "nbCapteursMax": 3,
  "nbReinesMax": -1
}
```

> **Note :** `-1` signifie illimité.

---

#### `POST /api/entreprises/:entreprise_id/profiles`

Mettre à jour les profils métier d'une entreprise. **Rôle requis : AdminEntreprise**.

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `typeProfiles` | string[] | ✅ | Liste des profils |

**Valeurs autorisées :** `ApiculteurProducteur`, `EleveurDeReines`, `Pollinisateur`

**Réponse `200` :**

```json
{
  "entreprise_id": "uuid",
  "typeProfiles": ["ApiculteurProducteur", "EleveurDeReines"]
}
```

---

#### `GET /api/entreprises/:entreprise_id/offre/status`

Statut de l'offre et de l'abonnement Stripe. **Rôle requis : AdminEntreprise**.

**Réponse `200` :**

```json
{
  "entreprise_id": "uuid",
  "type": "Premium",
  "active": true,
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "paid": true
}
```

---

#### `GET /api/profiles`

Liste des profils entreprise disponibles (pas d'authentification requise côté vue, mais route protégée).

**Réponse `200` :**

```json
{
  "profiles": [
    { "value": "ApiculteurProducteur", "titre": "ApiculteurProducteur", "description": "" },
    { "value": "EleveurDeReines", "titre": "EleveurDeReines", "description": "" },
    { "value": "Pollinisateur", "titre": "Pollinisateur", "description": "" }
  ]
}
```

---

### 3.3 Capteurs (IoT)

#### `POST /api/capteurs/associate`

Associer un capteur à une ruche et créer le device dans **Traccar**.

**Headers :** `Authorization: Bearer <token>`

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `ruche_id` | string (uuid) | ✅ | ID de la ruche |
| `type` | string | ✅ | Type de capteur (voir enum) |
| `identifiant` | string | ✅ | Identifiant unique du capteur |
| `name` | string | ❌ | Nom affiché dans Traccar |

**Types de capteur :** `Poids`, `Temperature`, `Humidite`, `GPS`, `CO2`, `Son`, `Batterie`

**Réponse `201` :**

```json
{
  "capteur": {
    "id": "uuid",
    "type": "Poids",
    "identifiant": "CAP-001",
    "actif": true,
    "batteriePct": null,
    "derniereCommunication": null,
    "ruche_id": "uuid"
  },
  "traccar_device": {
    "id": 42,
    "name": "Poids - A1234567",
    "uniqueId": "CAP-001"
  }
}
```

**Erreurs :**

| Code | Erreur | Description |
|------|--------|-------------|
| 404 | `ruche_not_found` | Ruche introuvable |
| 403 | `forbidden` | Ruche hors entreprise |
| 409 | `capteur_already_exists` | Identifiant déjà utilisé |
| 502 | `TraccarError` | Erreur de communication avec Traccar |

---

#### `GET /api/capteurs`

Lister les capteurs de l'entreprise courante.

**Réponse `200` :**

```json
{
  "capteurs": [
    {
      "id": "uuid",
      "type": "Temperature",
      "identifiant": "TEMP-001",
      "actif": true,
      "batteriePct": 85.5,
      "derniereCommunication": "2026-02-09T10:30:00+00:00",
      "ruche_id": "uuid"
    }
  ]
}
```

---

#### `PATCH /api/capteurs/:capteur_id`

Mettre à jour un capteur (+ synchronisation Traccar).

**Body (tous les champs sont optionnels) :**

| Champ | Type | Description |
|-------|------|-------------|
| `type` | string | Nouveau type de capteur |
| `identifiant` | string | Nouvel identifiant unique |
| `actif` | boolean | Actif ou inactif |
| `batteriePct` | float | Niveau de batterie (%) |
| `derniereCommunication` | datetime | Dernière communication |
| `name` | string | Nom dans Traccar |

**Réponse `200` :** Objet capteur mis à jour.

---

#### `DELETE /api/capteurs/:capteur_id/delete`

Supprimer un capteur et le device Traccar associé.

**Réponse `200` :**

```json
{ "status": "deleted" }
```

---

### 3.4 Webhooks

#### `POST /api/webhooks/intervention-created`

Webhook Hasura appelé à la création d'une intervention. Génère des notifications pour les membres de l'entreprise (sauf le créateur).

**Header requis :** `X-Hasura-Webhook-Secret: <secret>`

**Body (format Hasura Event Trigger) :**

```json
{
  "event": {
    "data": {
      "new": {
        "id": "uuid",
        "ruche_id": "uuid",
        "type": "Visite"
      }
    },
    "session_variables": {
      "x-hasura-user-id": "uuid"
    }
  }
}
```

**Réponse `200` :**

```json
{ "ok": true, "created": 3 }
```

---

#### `POST /api/webhooks/daily-notifications`

Webhook appelé quotidiennement (Hasura Scheduled Event). Génère :

- **Rappels de visite** : si aucune intervention depuis 30 jours sur une ruche Active/Faible
- **Rappels de traitement** : si un traitement approche (27-33 jours depuis le dernier)
- **Rappels saisonniers** : conseils apicoles mensuels (le 1er du mois)
- **Alertes sanitaires** : ruches malades sans traitement récent (14 jours)

**Réponse `200` :**

```json
{ "ok": true, "created": 12 }
```

---

### 3.5 Stripe

#### `POST /api/entreprises/:entreprise_id/checkout/premium`

Créer une session Stripe Checkout pour souscrire à l'offre Premium. **Rôle requis : AdminEntreprise**.

**Réponse `200` :**

```json
{ "url": "https://checkout.stripe.com/pay/cs_xxx" }
```

---

#### `POST /api/stripe/webhook`

Webhook Stripe pour la gestion des événements de paiement.

**Événements traités :**

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Active l'offre Premium pour l'entreprise |
| `invoice.payment_succeeded` | Maintient l'offre active |
| `invoice.payment_failed` | Désactive l'offre |
| `customer.subscription.deleted` | Rétrograde vers Freemium |

---

## 4. API GraphQL — Hasura

**Endpoint** : `POST /v1/graphql`

**Headers :**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Le contrôle d'accès est géré par Hasura via les **claims JWT** (`x-hasura-entreprise-id`, `x-hasura-role`). Chaque table est filtrée par `entreprise_id`.

---

### 4.1 Ruchers

#### Query : `GetRuchers`

Liste tous les ruchers de l'entreprise courante, triés par nom.

```graphql
query GetRuchers {
  ruchers(order_by: { nom: asc }) {
    id
    nom
    latitude
    longitude
    flore
    altitude
    notes
    ruches {
      id
    }
  }
}
```

#### Query : `GetRucherById`

Détail d'un rucher avec ses ruches, reines et transhumances.

```graphql
query GetRucherById($id: uuid!) {
  ruchers_by_pk(id: $id) {
    id
    nom
    latitude
    longitude
    flore
    altitude
    notes
    ruches {
      id
      immatriculation
      type
      race
      statut
      securisee
      reine {
        id
        anneeNaissance
        codeCouleur
        lignee
        noteDouceur
        nonReproductible
      }
    }
    transhumances {
      id
      date
      origineLat
      origineLng
      destinationLat
      destinationLng
      floreCible
    }
  }
}
```

#### Mutation : `CreateRucher`

```graphql
mutation CreateRucher($rucher: ruchers_insert_input!) {
  insert_ruchers_one(object: $rucher) {
    id
    nom
    latitude
    longitude
    flore
    altitude
    notes
  }
}
```

**Variables :**

```json
{
  "rucher": {
    "nom": "Rucher des Alpes",
    "latitude": 45.1885,
    "longitude": 5.7245,
    "flore": "Montagne",
    "altitude": 1200,
    "notes": "Accès 4x4 uniquement"
  }
}
```

#### Mutation : `UpdateRucher`

```graphql
mutation UpdateRucher($id: uuid!, $changes: ruchers_set_input!) {
  update_ruchers_by_pk(pk_columns: { id: $id }, _set: $changes) {
    id
    nom
    latitude
    longitude
    flore
    altitude
    notes
  }
}
```

#### Mutation : `DeleteRucher`

```graphql
mutation DeleteRucher($id: uuid!) {
  delete_ruchers_by_pk(id: $id) {
    id
  }
}
```

---

### 4.2 Ruches

#### Query : `GetRuches`

Liste toutes les ruches avec leur rucher et reine associés.

```graphql
query GetRuches {
  ruches(order_by: { created_at: desc }) {
    id
    immatriculation
    type
    race
    statut
    maladie
    securisee
    created_at
    updated_at
    rucher {
      id
      nom
    }
    reine {
      id
      anneeNaissance
      codeCouleur
      lignee
      noteDouceur
    }
  }
}
```

#### Query : `GetRucheById`

Détail complet d'une ruche avec interventions et capteurs.

```graphql
query GetRucheById($id: uuid!) {
  ruches_by_pk(id: $id) {
    id
    immatriculation
    type
    race
    statut
    maladie
    securisee
    created_at
    updated_at
    rucher {
      id
      nom
      latitude
      longitude
    }
    reine {
      id
      anneeNaissance
      codeCouleur
      lignee
      noteDouceur
      commentaire
      nonReproductible
    }
    interventions(order_by: { date: desc }) {
      id
      type
      date
      observations
      produit
      dosage
      nbHausses
      poidsKg
    }
    capteurs {
      id
      type
      identifiant
      actif
      batteriePct
      derniereCommunication
    }
  }
}
```

#### Mutation : `CreateRuche`

```graphql
mutation CreateRuche($ruche: ruches_insert_input!) {
  insert_ruches_one(object: $ruche) {
    id
    immatriculation
    type
    race
    statut
    securisee
    rucher { id nom }
  }
}
```

**Variables :**

```json
{
  "ruche": {
    "immatriculation": "A1234567",
    "type": "Dadant",
    "race": "Buckfast",
    "statut": "Active",
    "maladie": "Aucune",
    "securisee": false,
    "rucher_id": "uuid"
  }
}
```

> **Validation** : L'immatriculation doit respecter le format `^[A-Z]\d{7}$` (ex. `A1234567`).

#### Mutation : `CreateRucheWithReine`

Création atomique d'une ruche et d'une reine en une seule transaction.

```graphql
mutation CreateRucheWithReine($ruche: ruches_insert_input!, $reine: reines_insert_input!) {
  insert_ruches_one(object: $ruche) {
    id
    immatriculation
    type
    race
    statut
    securisee
    rucher { id nom }
  }
  insert_reines_one(object: $reine) {
    id
    anneeNaissance
    codeCouleur
    lignee
    noteDouceur
    commentaire
    nonReproductible
  }
}
```

#### Mutation : `UpdateRuche`

```graphql
mutation UpdateRuche($id: uuid!, $changes: ruches_set_input!) {
  update_ruches_by_pk(pk_columns: { id: $id }, _set: $changes) {
    id
    immatriculation
    type
    race
    statut
    securisee
  }
}
```

#### Mutation : `DeleteRuche`

```graphql
mutation DeleteRuche($id: uuid!) {
  delete_ruches_by_pk(id: $id) {
    id
  }
}
```

---

### 4.3 Reines

#### Query : `GetReines`

Liste toutes les reines avec leur ruche et rucher associés.

```graphql
query GetReines {
  reines(order_by: { created_at: desc }) {
    id
    created_at
    updated_at
    anneeNaissance
    codeCouleur
    lignee
    noteDouceur
    commentaire
    nonReproductible
    ruche {
      id
      immatriculation
      rucher {
        id
        nom
      }
    }
    entreprise {
      id
      nom
    }
  }
}
```

#### Query : `GetReineById`

```graphql
query GetReineById($id: uuid!) {
  reines_by_pk(id: $id) {
    id
    created_at
    updated_at
    anneeNaissance
    codeCouleur
    lignee
    noteDouceur
    commentaire
    nonReproductible
    ruche {
      id
      immatriculation
      rucher {
        id
        nom
      }
    }
    entreprise {
      id
      nom
    }
  }
}
```

#### Mutation : `CreateReine`

```graphql
mutation CreateReine($reine: reines_insert_input!) {
  insert_reines_one(object: $reine) {
    id
    anneeNaissance
    codeCouleur
    lignee
    noteDouceur
    commentaire
    nonReproductible
  }
}
```

**Variables :**

```json
{
  "reine": {
    "anneeNaissance": 2025,
    "codeCouleur": "Bleu",
    "lignee": "Buckfast",
    "noteDouceur": 8,
    "commentaire": "Excellente pondeuse",
    "nonReproductible": false,
    "ruche_id": "uuid",
    "entreprise_id": "uuid"
  }
}
```

#### Mutation : `UpdateReine`

```graphql
mutation UpdateReine($id: uuid!, $changes: reines_set_input!) {
  update_reines_by_pk(pk_columns: { id: $id }, _set: $changes) {
    id
    anneeNaissance
    codeCouleur
    lignee
    noteDouceur
    commentaire
    nonReproductible
  }
}
```

#### Mutation : `DeleteReine`

```graphql
mutation DeleteReine($id: uuid!) {
  delete_reines_by_pk(id: $id) {
    id
  }
}
```

---

### 4.4 Interventions

#### Query : `GetInterventions`

```graphql
query GetInterventions {
  interventions(order_by: { date: desc }) {
    id
    type
    date
    observations
    produit
    dosage
    nbHausses
    poidsKg
    ruche {
      id
      immatriculation
      rucher { id nom }
    }
  }
}
```

#### Mutation : `CreateIntervention`

```graphql
mutation CreateIntervention($intervention: interventions_insert_input!) {
  insert_interventions_one(object: $intervention) {
    id
    type
    date
    observations
    produit
    dosage
    nbHausses
    poidsKg
    ruche_id
  }
}
```

**Variables :**

```json
{
  "intervention": {
    "type": "Visite",
    "date": "2026-02-09T10:00:00+00:00",
    "observations": "Colonie en bonne santé",
    "ruche_id": "uuid"
  }
}
```

**Types d'intervention :** `Visite`, `Nourrissement`, `Traitement`, `Recolte`, `Division`, `PoseHausse`, `ControleSanitaire`

#### Mutation : `CreateBulkInterventions`

Création en lot de plusieurs interventions.

```graphql
mutation CreateBulkInterventions($interventions: [interventions_insert_input!]!) {
  insert_interventions(objects: $interventions) {
    affected_rows
    returning {
      id
      type
      date
      ruche_id
    }
  }
}
```

#### Mutation : `UpdateIntervention`

```graphql
mutation UpdateIntervention($id: uuid!, $changes: interventions_set_input!) {
  update_interventions_by_pk(pk_columns: { id: $id }, _set: $changes) {
    id
    type
    date
    observations
    produit
    dosage
    nbHausses
    poidsKg
  }
}
```

#### Mutation : `DeleteIntervention`

```graphql
mutation DeleteIntervention($id: uuid!) {
  delete_interventions_by_pk(id: $id) {
    id
  }
}
```

---

### 4.5 Transhumances

#### Mutation : `CreateTranshumance`

Enregistrer un déplacement de rucher.

```graphql
mutation CreateTranshumance($transhumance: transhumances_insert_input!) {
  insert_transhumances_one(object: $transhumance) {
    id
    date
    origineLat
    origineLng
    destinationLat
    destinationLng
    floreCible
    rucher_id
  }
}
```

**Variables :**

```json
{
  "transhumance": {
    "date": "2026-06-15",
    "origineLat": 43.6,
    "origineLng": 3.88,
    "destinationLat": 44.05,
    "destinationLng": 4.36,
    "floreCible": "Lavande",
    "rucher_id": "uuid"
  }
}
```

#### Mutation : `UpdateRucherLocation`

Met à jour les coordonnées et la flore d'un rucher suite à une transhumance.

```graphql
mutation UpdateRucherLocation($id: uuid!, $latitude: float8!, $longitude: float8!, $flore: String!) {
  update_ruchers_by_pk(
    pk_columns: { id: $id }
    _set: { latitude: $latitude, longitude: $longitude, flore: $flore }
  ) {
    id
    nom
    latitude
    longitude
    flore
  }
}
```

---

### 4.6 Notifications

#### Query : `GetNotifications`

```graphql
query GetNotifications($limit: Int = 20) {
  notifications(order_by: { date: desc }, limit: $limit) {
    id
    type
    titre
    message
    lue
    date
    ruche_id
    intervention_id
    ruche {
      id
      immatriculation
    }
  }
}
```

**Types de notification :** `RappelVisite`, `RappelTraitement`, `Equipe`, `Saisonnier`, `AlerteSanitaire`

#### Query : `GetUnreadNotificationCount`

```graphql
query GetUnreadNotificationCount {
  notifications_aggregate(where: { lue: { _eq: false } }) {
    aggregate {
      count
    }
  }
}
```

#### Mutation : `MarkNotificationRead`

```graphql
mutation MarkNotificationRead($id: uuid!) {
  update_notifications_by_pk(pk_columns: { id: $id }, _set: { lue: true }) {
    id
    lue
  }
}
```

#### Mutation : `MarkAllNotificationsRead`

```graphql
mutation MarkAllNotificationsRead {
  update_notifications(where: { lue: { _eq: false } }, _set: { lue: true }) {
    affected_rows
  }
}
```

#### Mutation : `DeleteNotification`

```graphql
mutation DeleteNotification($id: uuid!) {
  delete_notifications_by_pk(id: $id) {
    id
  }
}
```

---

### 4.7 Énumérations (tables de référence)

Les tables de référence suivantes sont accessibles via Hasura REST et GraphQL.

#### Endpoints REST Hasura

| Endpoint | Description |
|----------|-------------|
| `GET /api/rest/type_maladie` | Types de maladies |
| `GET /api/rest/type_ruche` | Types de ruches |
| `GET /api/rest/type_race_abeille` | Races d'abeilles |
| `GET /api/rest/type_flore` | Types de flore |
| `GET /api/rest/lignee_reine` | Lignées de reines |

Chaque endpoint retourne un tableau `{ label, value }`.

#### Valeurs de référence

##### Types de ruche

| Valeur | Label |
|--------|-------|
| `Dadant` | Dadant |
| `Langstroth` | Langstroth |
| `Warre` | Warré |
| `Voirnot` | Voirnot |
| `KenyaTopBar` | Kenya Top Bar |
| `Ruchette` | Ruchette |
| `Nuclei` | Nuclei |

##### Races d'abeilles

| Valeur | Label |
|--------|-------|
| `Buckfast` | Buckfast |
| `Noire` | Noire |
| `Carnica` | Carnica |
| `Ligustica` | Ligustica |
| `Caucasica` | Caucasica |
| `HybrideLocale` | Hybride Locale |
| `Inconnue` | Inconnue |

##### Statuts de ruche

| Valeur | Description |
|--------|-------------|
| `Active` | Ruche en activité normale |
| `Faible` | Colonie affaiblie, surveillance requise |
| `Malade` | Ruche nécessitant un traitement |
| `Morte` | Colonie perdue |

##### Types de flore

| Valeur | Label |
|--------|-------|
| `Acacia` | Acacia |
| `Colza` | Colza |
| `Lavande` | Lavande |
| `Tournesol` | Tournesol |
| `Chataignier` | Châtaignier |
| `Bruyere` | Bruyère |
| `Montagne` | Montagne |
| `ToutesFleurs` | Toutes Fleurs |

##### Types de maladie

| Valeur | Label |
|--------|-------|
| `Aucune` | Aucune |
| `Varroose` | Varroose |
| `Nosemose` | Nosemose |
| `LoqueAmericaine` | Loque Américaine |
| `LoqueEuropeenne` | Loque Européenne |
| `Acarapisose` | Acarapisose |
| `Ascospherose` | Ascosphérose |
| `Tropilaelaps` | Tropilaelaps |
| `VirusAilesDeformees` | Virus Ailes Déformées |
| `ParalysieChronique` | Paralysie Chronique |
| `IntoxicationPesticides` | Intoxication Pesticides |

##### Lignées de reine

| Valeur | Label |
|--------|-------|
| `Buckfast` | Buckfast |
| `Carnica` | Carnica |
| `Ligustica` | Ligustica |
| `Caucasica` | Caucasica |
| `Locale` | Locale |
| `Inconnue` | Inconnue |

##### Codes couleur reine

| Valeur | Année (terminaison) |
|--------|---------------------|
| `Blanc` | 1 ou 6 |
| `Jaune` | 2 ou 7 |
| `Rouge` | 3 ou 8 |
| `Vert` | 4 ou 9 |
| `Bleu` | 5 ou 0 |

##### Statuts de reine

| Valeur | Description |
|--------|-------------|
| `Fecondee` | Reine fécondée, en production |
| `NonFecondee` | Reine non encore fécondée |
| `DisponibleVente` | Reine prête à la vente |
| `Vendu` | Reine vendue |
| `Perdue` | Reine perdue |
| `Eliminee` | Reine éliminée |

##### Types de capteur

| Valeur | Description |
|--------|-------------|
| `Poids` | Balance connectée |
| `Temperature` | Sonde de température |
| `Humidite` | Capteur d'humidité |
| `GPS` | Module GPS/antivol |
| `CO2` | Capteur de CO₂ |
| `Son` | Capteur sonore |
| `Batterie` | Niveau de batterie |

##### Types d'intervention

| Valeur | Description |
|--------|-------------|
| `Visite` | Visite de contrôle |
| `Nourrissement` | Nourrissement de la colonie |
| `Traitement` | Traitement sanitaire |
| `Recolte` | Récolte de miel |
| `Division` | Division de colonie |
| `PoseHausse` | Pose d'une hausse |
| `ControleSanitaire` | Contrôle sanitaire complet |

---

## 5. Modèle de données

### Schéma relationnel

```
┌──────────────┐       ┌──────────────────────┐       ┌───────────────┐
│ utilisateurs │──M:N──│ utilisateurs_        │──N:1──│  entreprises  │
│              │       │   entreprises         │       │               │
│ id (uuid PK) │       │ role                  │       │ id (uuid PK)  │
│ nom          │       └──────────────────────┘       │ nom           │
│ prenom       │                                       │ adresse       │
│ email        │       ┌──────────────────────┐       └───────┬───────┘
│ motDePasseHash│       │    invitations       │               │
│ actif        │       │ token, rolePropose   │───────────────┘
└──────────────┘       │ dateExpiration       │
                       │ acceptee             │       ┌───────────────┐
                       └──────────────────────┘       │    offres     │
                                                       │ type (FK)     │
                                                       │ dateDebut     │
┌──────────────┐       ┌──────────────────────┐       │ active        │
│   ruchers    │──1:N──│     ruches           │       │ nbRuchersMax  │
│              │       │                      │       │ nbReinesMax   │
│ id (uuid PK) │       │ id (uuid PK)         │       └───────────────┘
│ nom          │       │ immatriculation      │
│ latitude     │       │ type (FK)            │       ┌───────────────┐
│ longitude    │       │ race (FK)            │──1:1──│    reines     │
│ flore (FK)   │       │ statut               │       │               │
│ altitude     │       │ maladie (FK)         │       │ id (uuid PK)  │
│ notes        │       │ securisee            │       │ anneeNaissance│
│ entreprise_id│       │ rucher_id (FK)       │       │ codeCouleur   │
└──────┬───────┘       └──────────┬───────────┘       │ lignee (FK)   │
       │                          │                    │ noteDouceur   │
       │               ┌─────────┴────────┐           │ commentaire   │
       │               │                  │           │ nonReprod.    │
       │         ┌─────┴──────┐    ┌──────┴───────┐   │ ruche_id (FK) │
       │         │interventions│    │  capteurs    │   │ entreprise_id │
       │         │            │    │              │   └───────────────┘
       │         │ type       │    │ type         │
       │         │ date       │    │ identifiant  │   ┌───────────────┐
       │         │ observations│    │ actif        │   │   mesures     │
       │         │ produit    │    │ batteriePct  │──1:N│ date         │
       │         │ dosage     │    │ ruche_id(FK) │   │ valeur        │
       │         │ nbHausses  │    └──────────────┘   │ capteur_id    │
       │         │ poidsKg    │                       └───────────────┘
       │         │ ruche_id   │
       │         └────────────┘
       │
       │         ┌──────────────┐
       └──1:N────│transhumances │
                 │              │
                 │ date         │
                 │ origineLat/Lng│
                 │ destinationLat/Lng│
                 │ floreCible   │
                 │ rucher_id    │
                 └──────────────┘
```

### Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `utilisateurs` | Comptes utilisateur | `id` (uuid) |
| `entreprises` | Entreprises apicoles | `id` (uuid) |
| `utilisateurs_entreprises` | Liaison utilisateur ↔ entreprise + rôle | `id` (uuid) |
| `invitations` | Invitations à rejoindre une entreprise | `id` (uuid) |
| `offres` | Abonnement actif de l'entreprise | `id` (uuid) |
| `ruchers` | Emplacements de ruchers | `id` (uuid) |
| `ruches` | Ruches individuelles | `id` (uuid) |
| `reines` | Reines d'abeilles | `id` (uuid) |
| `interventions` | Actions réalisées sur les ruches | `id` (uuid) |
| `transhumances` | Déplacements de ruchers | `id` (uuid) |
| `capteurs` | Capteurs IoT connectés aux ruches | `id` (uuid) |
| `mesures` | Relevés de capteurs | `id` (uuid) |
| `alertes` | Alertes IoT | `id` (uuid) |
| `notifications` | Notifications utilisateur | `id` (uuid) |
| `cycles_elevage_reines` | Cycles d'élevage de reines | `id` (uuid) |
| `taches_cycle_elevage` | Tâches du cycle d'élevage | `id` (uuid) |

---

## 6. Codes d'erreur

### Codes HTTP

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Création réussie |
| `400` | Requête invalide (champs manquants, validation) |
| `401` | Non authentifié (token manquant ou invalide) |
| `403` | Non autorisé (rôle insuffisant) |
| `404` | Ressource introuvable |
| `405` | Méthode HTTP non autorisée |
| `409` | Conflit (doublon) |
| `410` | Ressource expirée (invitation) |
| `500` | Erreur serveur |
| `502` | Erreur service externe (Traccar, Stripe) |

### Codes d'erreur métier (REST)

| Code erreur | Description |
|-------------|-------------|
| `missing_fields` | Champs obligatoires manquants |
| `invalid_json` | Corps de requête JSON invalide |
| `email_already_exists` | Email déjà utilisé |
| `invalid_credentials` | Email ou mot de passe incorrect |
| `user_inactive` | Compte utilisateur désactivé |
| `token_expired` | Token JWT expiré |
| `invalid_token` | Token JWT invalide |
| `user_not_found` | Utilisateur introuvable |
| `missing_authorization` | Header Authorization manquant |
| `not_in_entreprise` | Utilisateur non membre de l'entreprise |
| `forbidden` | Accès refusé (rôle insuffisant) |
| `entreprise_not_found` | Entreprise introuvable |
| `invitation_not_found` | Invitation introuvable |
| `invitation_already_accepted` | Invitation déjà acceptée |
| `invitation_expired` | Invitation expirée (7 jours) |
| `invalid_type_offre` | Type d'offre invalide |
| `invalid_profiles` | Profils entreprise invalides |
| `capteur_not_found` | Capteur introuvable |
| `capteur_already_exists` | Identifiant capteur déjà utilisé |
| `ruche_not_found` | Ruche introuvable |
| `stripe_not_configured` | Configuration Stripe manquante |
| `stripe_checkout_failed` | Erreur Stripe lors du checkout |
