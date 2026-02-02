# 🐝 Application de Gestion de Ruchers

Application web de suivi et gestion apicole pour optimiser la santé, la productivité et la sécurité des colonies d'abeilles.

## 📋 À propos

Cette application aide les apiculteurs à digitaliser la gestion de leurs ruchers en remplaçant le cahier papier par une solution numérique complète. Elle permet de suivre l'état sanitaire, la production, la généalogie des colonies et de sécuriser le cheptel contre le vol.

## ✨ Fonctionnalités principales

- **Gestion des ruchers** : Organisation par ruchers et cheptels avec géolocalisation GPS
- **Suivi sanitaire** : Traçabilité des interventions, traitements et statuts (Active/Malade/Morte)
- **Actions groupées** : Gain de temps via interventions multiples simultanées
- **Production** : Suivi des récoltes et rendements par ruche/cheptel
- **Généalogie** : Traçabilité des reines et lignées (code couleur, douceur, reproduction)
- **Transhumance** : Historique des déplacements et floraisons
- **Dashboard Elite** : Classement des meilleures ruches pour aide à la décision
- **Sécurité** : Alertes anti-vol avec traceurs GPS (V2)
- **IoT** : Monitoring température/poids en temps réel (V2)

## 🛠️ Stack Technique

**Backend**
- Python 3.11+ / Django 5.x
- GraphQL (Graphene-Django)
- PostgreSQL 15+

**Frontend**
- Next.js 14+ (App Router)
- TypeScript
- Apollo Client
- TailwindCSS + Shadcn/ui

**Communication**
- API GraphQL unique (`/graphql`)

## 🚀 Installation

### Prérequis
- Docker & Docker Compose
- Git

### Installation rapide avec Docker

1. **Cloner le projet**
```bash
git clone https://github.com/STimour/Suivi_et_gestion_de_ruchers.git
cd Suivi_et_gestion_de_ruchers
cd backend
```

2. **Configurer l'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos propres valeurs (mots de passe, secrets)
```

3. **Démarrer les services**
```bash
docker compose up -d
```

4. **Appliquer les migrations**
```bash
docker compose exec django python manage.py migrate
```

5. **Créer un superutilisateur**
```bash
docker compose exec django python manage.py createsuperuser
```

### Accès aux services

- **Application Django** : http://localhost:8000
- **Admin Django** : http://localhost:8000/admin
- **Console Hasura** : http://localhost:8081/console
- **GraphQL Hasura** : http://localhost:8081/v1/graphql

### Installation manuelle (développement)

#### Prérequis
- Python 3.11+
- PostgreSQL 15+

#### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

L'application sera accessible sur `http://localhost:8000`

## 📁 Structure

```
├── backend/          # API Django + GraphQL
│   ├── app/         # Modules métier (ruchers, ruches, interventions...)
│   └── config/       # Configuration Django
```


## 📄 Licence

Ce projet est développé dans un cadre pédagogique en collaboration avec un apiculteur client.