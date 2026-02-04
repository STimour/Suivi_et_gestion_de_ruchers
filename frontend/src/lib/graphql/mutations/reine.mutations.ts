import { gql } from '@apollo/client';

// Mutation pour créer une reine
export const CREATE_REINE = gql`
  mutation CreateReine($reine: reines_insert_input!) {
    insert_reines_one(object: $reine) {
      id
      anneeNaissance
      codeCouleur
      lignee
      noteDouceur
      commentaire
      nonReproductible
    }
  }
`;
