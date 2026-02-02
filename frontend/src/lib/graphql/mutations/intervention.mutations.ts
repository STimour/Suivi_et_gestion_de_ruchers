import { gql } from '@apollo/client';

// Mutation pour créer une intervention simple
export const CREATE_INTERVENTION = gql`
  mutation CreateIntervention($intervention: interventions_insert_input!) {
    insert_interventions_one(object: $intervention) {
      id
      type
      date
      observations
      produit
      dosage
      nbHausses
      poidsKg
      ruche_id
    }
  }
`;

// Mutation pour créer plusieurs interventions (bulk)
export const CREATE_BULK_INTERVENTIONS = gql`
  mutation CreateBulkInterventions($interventions: [interventions_insert_input!]!) {
    insert_interventions(objects: $interventions) {
      affected_rows
      returning {
        id
        type
        date
        ruche_id
      }
    }
  }
`;

// Mutation pour mettre à jour une intervention
export const UPDATE_INTERVENTION = gql`
  mutation UpdateIntervention($id: uuid!, $changes: interventions_set_input!) {
    update_interventions_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      type
      date
      observations
      produit
      dosage
      nbHausses
      poidsKg
    }
  }
`;

// Mutation pour supprimer une intervention
export const DELETE_INTERVENTION = gql`
  mutation DeleteIntervention($id: uuid!) {
    delete_interventions_by_pk(id: $id) {
      id
    }
  }
`;
