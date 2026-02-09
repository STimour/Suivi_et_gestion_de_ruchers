import { gql } from '@apollo/client';

// Mutation pour créer une ruche
export const CREATE_RUCHE = gql`
  mutation CreateRuche($ruche: ruches_insert_input!) {
    insert_ruches_one(object: $ruche) {
      id
      immatriculation
      type
      race
      statut
      securisee
      rucher {
        id
        nom
      }
    }
  }
`;

// Mutation pour créer une ruche avec une reine (transaction unique)
export const CREATE_RUCHE_WITH_REINE = gql`
  mutation CreateRucheWithReine($ruche: ruches_insert_input!, $reine: reines_insert_input!) {
    insert_ruches_one(object: $ruche) {
      id
      immatriculation
      type
      race
      statut
      securisee
      rucher {
        id
        nom
      }
    }
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

// Mutation pour mettre à jour une ruche
export const UPDATE_RUCHE = gql`
  mutation UpdateRuche($id: uuid!, $changes: ruches_set_input!) {
    update_ruches_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      immatriculation
      type
      race
      statut
      securisee
    }
  }
`;

// Mutation pour supprimer une ruche
export const DELETE_RUCHE = gql`
  mutation DeleteRuche($id: uuid!) {
    delete_ruches_by_pk(id: $id) {
      id
    }
  }
`;
