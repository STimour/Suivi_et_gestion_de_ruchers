import { gql } from '@apollo/client';

export const GET_INTERVENTIONS = gql`
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
      ruch {
        id
        immatriculation
        rucher {
          id
          nom
        }
      }
    }
  }
`;
