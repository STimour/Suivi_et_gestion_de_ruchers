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

export const CREATE_RACLE = gql`
  mutation CreateRacle($racle: racles_elevage_insert_input!) {
    insert_racles_elevage_one(object: $racle) {
      id
      reference
      dateCreation
      nbCupules
    }
  }
`;

export const DELETE_RACLE_CASCADE = gql`
  mutation DeleteRacleCascade($racleId: uuid!) {
    delete_taches_cycle_elevage(
      where: { cycles_elevage_reine: { racle_id: { _eq: $racleId } } }
    ) {
      affected_rows
    }
    delete_cycles_elevage_reines(where: { racle_id: { _eq: $racleId } }) {
      affected_rows
    }
    update_reines(
      where: { racle_id: { _eq: $racleId } }
      _set: { racle_id: null }
    ) {
      affected_rows
    }
    delete_racles_elevage_by_pk(id: $racleId) {
      id
    }
  }
`;

export const CREATE_REINES_BATCH = gql`
  mutation CreateReinesBatch($reines: [reines_insert_input!]!) {
    insert_reines(objects: $reines) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const UPDATE_REINES_BY_RACLE = gql`
  mutation UpdateReinesByRacle($racleId: uuid!, $changes: reines_set_input!) {
    update_reines(where: { racle_id: { _eq: $racleId } }, _set: $changes) {
      affected_rows
      returning {
        id
        statut
      }
    }
  }
`;
