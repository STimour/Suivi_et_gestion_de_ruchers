# Connexion Frontend ↔ Backend

## 🔌 Architecture

Le frontend Next.js se connecte au backend via **Hasura GraphQL Engine**.

```
Frontend (Next.js)          Backend
     :3000          →       Hasura GraphQL :8081
                            ↓
                            Django :8000
                            ↓
                            PostgreSQL :5432
```

## ✅ Configuration réalisée

### 1. Apollo Client configuré

**Fichier** : `src/lib/graphql/client.ts`
- Client Apollo avec gestion des erreurs
- Cache configuré pour les entités principales
- Connexion à Hasura sur `http://localhost:8081/v1/graphql`

### 2. Provider Apollo

**Fichier** : `src/lib/graphql/apollo-provider.tsx`
- Enveloppe l'application entière
- Intégré dans `layout.tsx`

### 3. Queries GraphQL

**Ruchers** : `src/lib/graphql/queries/rucher.queries.ts`
- `GET_RUCHERS` - Liste tous les ruchers
- `GET_RUCHER_BY_ID` - Détail d'un rucher avec ruches
- `GET_USER_RUCHERS` - Ruchers d'un utilisateur

**Ruches** : `src/lib/graphql/queries/ruche.queries.ts`
- `GET_RUCHES` - Liste toutes les ruches
- `GET_RUCHE_BY_ID` - Détail d'une ruche avec historique
- `GET_RUCHES_BY_RUCHER` - Ruches d'un rucher

**Interventions** : `src/lib/graphql/mutations/intervention.mutations.ts`
- `CREATE_INTERVENTION` - Créer une intervention
- `CREATE_BULK_INTERVENTIONS` - Créer plusieurs interventions (⭐ fonctionnalité star)
- `UPDATE_INTERVENTION` - Modifier une intervention
- `DELETE_INTERVENTION` - Supprimer une intervention

### 4. Variables d'environnement

**Fichier** : `.env.local` (créé automatiquement)
```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://hasura.localhost:8088/v1/graphql
NEXT_PUBLIC_DJANGO_API_URL=http://api.localhost:8088
```

## 🚀 Démarrage

### Prérequis
Le backend doit être lancé :
```bash
cd ../backend
docker-compose up -d
```

Vérifier que les services sont actifs :
```bash
docker ps
```

Vous devriez voir :
- `suivi_et_gestion_de_ruchers-postgres-1` (port 5432)
- `suivi_et_gestion_de_ruchers-django-1` (port 8000)
- `suivi_et_gestion_de_ruchers-hasura-1` (port 8081)

### Lancer le frontend

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Lancer en développement
npm run dev
```

Le frontend sera sur http://localhost:3000

## 🧪 Tester la connexion

### 1. Console Hasura

Ouvrir http://localhost:8081/console

Tester une query :
```graphql
query {
  ruchers {
    id
    nom
    latitude
    longitude
  }
}
```

### 2. Dans le frontend

Créer une page de test avec Apollo :

```tsx
'use client';

import { useQuery } from '@apollo/client';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';

export default function TestPage() {
  const { data, loading, error } = useQuery(GET_RUCHERS);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error.message}</p>;

  return (
    <div>
      <h1>Ruchers</h1>
      <ul>
        {data?.ruchers.map((rucher: any) => (
          <li key={rucher.id}>{rucher.nom}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 📊 Structure des tables (backend)

Tables disponibles via Hasura :
- `utilisateurs` - Utilisateurs de l'app
- `ruchers` - Ruchers (apiaries)
- `ruches` - Ruches (hives)
- `reines` - Reines (queens)
- `interventions` - Interventions
- `transhumances` - Déplacements
- `capteurs` - Capteurs IoT
- `mesures` - Mesures des capteurs
- `alertes` - Alertes système

## 🔐 Authentification

Pour l'instant, la connexion se fait sans authentification (dev mode).

Pour activer l'authentification Hasura :
1. Générer un secret : `openssl rand -base64 32`
2. Ajouter dans `.env.local` : `NEXT_PUBLIC_HASURA_ADMIN_SECRET=<votre-secret>`
3. Mettre à jour Hasura avec ce secret

## 🐛 Dépannage

### Erreur de connexion

Si vous avez des erreurs de connexion :

1. Vérifier que Hasura est accessible :
```bash
curl http://localhost:8081/v1/graphql
```

2. Vérifier les logs Hasura :
```bash
docker logs suivi_et_gestion_de_ruchers-hasura-1
```

3. Vérifier la console :
http://localhost:8081/console

### CORS

Si vous avez des erreurs CORS, configurer Hasura avec :
```yaml
# Dans docker-compose.yml du backend
HASURA_GRAPHQL_CORS_DOMAIN: "*"
```

## 📝 Prochaines étapes

- [ ] Créer les hooks Apollo personnalisés (`useRuchers`, `useRuches`, etc.)
- [ ] Implémenter l'authentification JWT
- [ ] Créer les mutations pour CRUD complet
- [ ] Ajouter les subscriptions GraphQL (real-time)
- [ ] Implémenter le cache offline avec IndexedDB

## 🔗 Liens utiles

- Console Hasura : http://hasura.localhost:8088/console
- Django Admin : http://api.localhost:8088/admin
- Frontend : http://localhost:3000
- GraphQL Playground : http://hasura.localhost:8088/console/api-explorer
