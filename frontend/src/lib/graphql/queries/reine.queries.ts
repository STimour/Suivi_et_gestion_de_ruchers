import { gql } from '@apollo/client';

export const GET_REINES = gql`
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
`;

export const GET_REINE_BY_ID = gql`
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
`;
