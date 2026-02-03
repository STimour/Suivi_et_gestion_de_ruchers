import { gql } from '@apollo/client';

// Mutation pour créer un rucher
export const CREATE_RUCHER = gql`
  mutation CreateRucher($rucher: ruchers_insert_input!) {
    insert_ruchers_one(object: $rucher) {
      id
      nom
      latitude
      longitude
      flore
      altitude
      notes
    }
  }
`;

// Mutation pour mettre à jour un rucher
export const UPDATE_RUCHER = gql`
  mutation UpdateRucher($id: uuid!, $changes: ruchers_set_input!) {
    update_ruchers_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      nom
      latitude
      longitude
      flore
      altitude
      notes
    }
  }
`;

// Mutation pour supprimer un rucher
export const DELETE_RUCHER = gql`
  mutation DeleteRucher($id: uuid!) {
    delete_ruchers_by_pk(id: $id) {
      id
    }
  }
`;
