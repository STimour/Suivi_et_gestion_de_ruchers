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

export const UPDATE_REINE = gql`
  mutation UpdateReine($id: uuid!, $changes: reines_set_input!) {
    update_reines_by_pk(pk_columns: { id: $id }, _set: $changes) {
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

export const DELETE_REINE = gql`
  mutation DeleteReine($id: uuid!) {
    delete_reines_by_pk(id: $id) {
      id
    }
  }
`;
