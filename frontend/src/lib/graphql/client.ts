import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Gestion des erreurs GraphQL
const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }: any) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Lien HTTP vers Hasura
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8081/v1/graphql',
  headers: {
    // Ajouter l'admin secret si disponible (pour les mutations)
    ...(process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET && {
      'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET,
    }),
  },
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
      },
    },
  },
});

// Client Apollo
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
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
