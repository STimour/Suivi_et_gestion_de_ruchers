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

export const GET_REINES_ELEVAGE = gql`
  query GetReinesElevage {
    reines(where: { isElevage: { _eq: true } }, order_by: { created_at: desc }) {
      id
      anneeNaissance
      codeCouleur
      lignee
      statut
      commentaire
      created_at
      ruche {
        id
        immatriculation
      }
      cycles_elevage_reines(order_by: { created_at: desc }) {
        id
        dateDebut
        dateFin
        statut
        created_at
        taches_cycle_elevages(order_by: { jourTheorique: asc }) {
          id
          type
          jourTheorique
          datePrevue
          dateRealisee
          statut
          commentaire
        }
      }
    }
  }
`;

export const GET_TACHES_ELEVAGE_OVERVIEW = gql`
  query GetTachesElevageOverview {
    taches_cycle_elevage(
      where: { statut: { _nin: ["Annulee"] } }
      order_by: { datePrevue: asc }
    ) {
      id
      type
      jourTheorique
      datePrevue
      dateRealisee
      statut
      commentaire
      cycles_elevage_reine {
        id
        statut
        dateDebut
        reine {
          id
          codeCouleur
          anneeNaissance
        }
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
