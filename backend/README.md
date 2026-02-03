## Backend - Suivi et Gestion de Ruchers

## Prérequis

- Docker & Docker Compose

## Installation rapide (Docker)

Toutes les commandes ci-dessous sont à exécuter depuis le dossier `backend/`.

### 1) Configurer l'environnement

Copiez le fichier d'exemple :

```bash
cp .env.example .env
```

Puis éditez `.env` :

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `HASURA_GRAPHQL_DATABASE_URL`
- `HASURA_GRAPHQL_ADMIN_SECRET`

### 2) Démarrer les services

```bash
docker compose up -d
```

### 3) Appliquer les migrations Django

```bash
docker compose exec django python manage.py migrate
```

### 4) Créer un superutilisateur Django

```bash
docker compose exec django python manage.py createsuperuser
```

## Accès aux services

- **API Django** : http://localhost:8000
- **Admin Django** : http://localhost:8000/admin
- **Hasura Console** : http://localhost:8081/console
- **Endpoint GraphQL Hasura** : http://localhost:8081/v1/graphql

## Commandes utiles

### Voir les logs

```bash
docker compose logs -f
```

### Arrêter les services

```bash
docker compose down
```

### Reconstruire après changement Dockerfile / dépendances

```bash
docker compose up -d --build
```

## Dépannage

### Hasura : "password authentication failed for user \"postgres\""

Si vous changez `POSTGRES_PASSWORD` / `HASURA_GRAPHQL_DATABASE_URL` après un premier démarrage, Postgres garde l'ancien mot de passe dans le volume.

Si vous pouvez réinitialiser la base locale :

```bash
docker compose down -v
docker compose up -d
```
