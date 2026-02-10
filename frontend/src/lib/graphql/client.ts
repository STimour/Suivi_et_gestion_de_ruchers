import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { toast } from 'sonner';

// Gestion des erreurs GraphQL avec support 401/403
const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }: any) => {
      const errorCode = extensions?.code;

      // Handle 401 Unauthorized - Session expirée
      if (errorCode === 'UNAUTHENTICATED' || errorCode === 'UNAUTHORIZED' || message.includes('Unauthorized')) {
        toast.error('Session expirée', {
          description: 'Veuillez vous reconnecter'
        });

        // Clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return;
      }

      // Handle 403 Forbidden - Permissions insuffisantes
      if (errorCode === 'FORBIDDEN' || message.includes('permission')) {
        toast.error('Accès refusé', {
          description: 'Vous n\'avez pas les permissions nécessaires'
        });
      }

      console.error(
        `[GraphQL error]: Message: ${message}, Code: ${errorCode}`
      );
    });
  }

  if (networkError) {
    const statusCode = (networkError as any)?.statusCode;

    // Handle HTTP 401
    if (statusCode === 401) {
      toast.error('Session expirée', {
        description: 'Veuillez vous reconnecter'
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
      return;
    }

    // Handle HTTP 403
    if (statusCode === 403) {
      toast.error('Accès refusé', {
        description: 'Permissions insuffisantes'
      });
      return;
    }

    // Other network errors
    console.error(`[Network error]: ${networkError}`);
    toast.error('Erreur de connexion', {
      description: 'Impossible de contacter le serveur'
    });
  }
});

// Link pour ajouter le JWT dans les headers
const authLink = setContext((_, { headers }) => {
  // Récupérer le token depuis le localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    }
  };
});

// Lien HTTP vers Hasura
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://hasura.localhost:8088/v1/graphql',
});

// Configuration du cache Apollo
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Configuration du cache pour les ruchers
        ruchers: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        // Configuration du cache pour les ruches
        ruches: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        // Configuration du cache pour les interventions
        interventions: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        // Configuration du cache pour les notifications
        notifications: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// Client Apollo
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
