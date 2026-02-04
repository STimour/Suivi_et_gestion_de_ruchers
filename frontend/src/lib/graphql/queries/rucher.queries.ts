import { gql } from '@apollo/client';

// Query pour récupérer tous les ruchers
export const GET_RUCHERS = gql`
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
`;

// Query pour récupérer un rucher par ID avec ses ruches
export const GET_RUCHER_BY_ID = gql`
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
`;

// Query pour récupérer les ruchers d'un utilisateur
export const GET_USER_RUCHERS = gql`
  query GetUserRuchers($utilisateurId: uuid!) {
    ruchers(where: { utilisateur_id: { _eq: $utilisateurId } }) {
      id
      nom
      latitude
      longitude
      flore
      altitude
      notes
      ruches_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// Query pour récupérer les détails complets d'un rucher
export const GET_RUCHER_DETAILS = gql`
  query GetRucherDetails($id: uuid!) {
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
        maladie
        securisee
      }
    }
  }
`;
