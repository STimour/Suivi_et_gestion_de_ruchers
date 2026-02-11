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
- Hasura GraphQL Engine
- PostgreSQL 15+

**Frontend**
- Next.js 14+ (App Router)
- TypeScript
- Apollo Client
- TailwindCSS + Shadcn/ui

**Communication**
- API GraphQL unique via Hasura (`http://hasura.localhost:8088/v1/graphql`)

## 🚀 Installation
 
 ### Prérequis
 - Python 3.11+
 - Node.js 18+
 - PostgreSQL 15+
 
 ### Backend
 Pour la mise en place complète du backend (copie de `.env`, `docker compose up -d`, migrations, création du superutilisateur), veuillez consulter le guide dédié : [backend/README.md](./backend/README.md).

### Frontend
```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure

```
├── backend/          # Django + Hasura
│   ├── apps/         # Modules métier (ruchers, ruches, interventions...)
│   └── config/       # Configuration Django
├── frontend/         # Interface Next.js
│   ├── src/app/      # Pages et routes
│   ├── components/   # Composants UI
│   └── lib/          # GraphQL queries/mutations
```

## 🧩 Fichiers UML

- [uml/API_Documentation.md](./uml/API_Documentation.md)
- [uml/beamercolorthememetropolis.sty](./uml/beamercolorthememetropolis.sty)
- [uml/beamerfontthememetropolis.sty](./uml/beamerfontthememetropolis.sty)
- [uml/beamerinnerthememetropolis.sty](./uml/beamerinnerthememetropolis.sty)
- [uml/beamerouterthememetropolis.sty](./uml/beamerouterthememetropolis.sty)
- [uml/beamerthememetropolis.sty](./uml/beamerthememetropolis.sty)
- [uml/diagrammeClass.md](./uml/diagrammeClass.md)
- [uml/DiagrammeClass.svg](./uml/DiagrammeClass.svg)
- [uml/DiagrammeContexte.md](./uml/DiagrammeContexte.md)
- [uml/DiagrammeContexte.png](./uml/DiagrammeContexte.png)
- [uml/diagrammeEtat.md](./uml/diagrammeEtat.md)
- [uml/DiagrammeSequence.md](./uml/DiagrammeSequence.md)
- [uml/diagrammeSequence.png](./uml/diagrammeSequence.png)
- [uml/personna_Jean.md](./uml/personna_Jean.md)
- [uml/personna_Marc.md](./uml/personna_Marc.md)
- [uml/pgfplotsthemetol.sty](./uml/pgfplotsthemetol.sty)
- [uml/presentation.aux](./uml/presentation.aux)
- [uml/presentation.log](./uml/presentation.log)
- [uml/presentation.nav](./uml/presentation.nav)
- [uml/presentation.out](./uml/presentation.out)
- [uml/presentation.pdf](./uml/presentation.pdf)
- [uml/presentation.snm](./uml/presentation.snm)
- [uml/presentation.tex](./uml/presentation.tex)
- [uml/presentation.toc](./uml/presentation.toc)
- [uml/tableau_exigences_fonctionnelles_v1_v2.md](./uml/tableau_exigences_fonctionnelles_v1_v2.md)
- [uml/tableau_exigences_fonctionnelles.md](./uml/tableau_exigences_fonctionnelles.md)
- [uml/userFlow_GestionReine.md](./uml/userFlow_GestionReine.md)
- [uml/userStories_GestionRuche.md](./uml/userStories_GestionRuche.md)

## 👥 Équipe

- **Chef de projet** : Sayfoutdinov Timour
- **Frontend** : Joly Dorian
- **Backend** : Gesse Corentin
- **DevOps** : Ait Ouarab Mélissa

## 📄 Licence

Ce projet est développé dans un cadre pédagogique en collaboration avec un apiculteur client.
