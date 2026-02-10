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

export const UPDATE_TACHE_ELEVAGE = gql`
  mutation UpdateTacheElevage($id: uuid!, $changes: taches_cycle_elevage_set_input!) {
    update_taches_cycle_elevage_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      statut
      dateRealisee
      commentaire
    }
  }
`;

export const UPDATE_CYCLE_ELEVAGE = gql`
  mutation UpdateCycleElevage($id: uuid!, $changes: cycles_elevage_reines_set_input!) {
    update_cycles_elevage_reines_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      statut
      dateFin
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
