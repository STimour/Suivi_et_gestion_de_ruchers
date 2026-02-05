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

## Hasura CLI (migrations)

Les migrations Hasura sont dans `backend/hasura/`.

### Appliquer les migrations

```bash
docker compose exec hasura /bin/hasura-cli --project /hasura migrate apply --database-name default
```

### Appliquer les metadata (si utilisées)

```bash
docker compose exec hasura /bin/hasura-cli --project /hasura metadata apply
```

## Accès aux services

- **API Django** : http://api.localhost:8088
- **Admin Django** : http://api.localhost:8088/admin
- **Hasura Console** : http://hasura.localhost:8088/console
- **Endpoint GraphQL Hasura** : http://hasura.localhost:8088/v1/graphql
- **Traefik Dashboard** : http://localhost:8080

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
