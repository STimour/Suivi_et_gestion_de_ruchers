import { gql } from '@apollo/client';

// Query pour récupérer toutes les ruches
export const GET_RUCHES = gql`
  query GetRuches {
    ruches(order_by: { created_at: desc }) {
      id
      immatriculation
      type
      race
      statut
      maladie
      securisee
      created_at
      updated_at
      rucher {
        id
        nom
      }
      reine {
        id
        anneeNaissance
        codeCouleur
        lignee
        noteDouceur
      }
    }
  }
`;

// Query pour récupérer une ruche par ID avec tout son historique
export const GET_RUCHE_BY_ID = gql`
  query GetRucheById($id: uuid!) {
    ruches_by_pk(id: $id) {
      id
      immatriculation
      type
      race
      statut
      maladie
      securisee
      created_at
      updated_at
      rucher {
        id
        nom
        latitude
        longitude
      }
      reine {
        id
        anneeNaissance
        codeCouleur
        lignee
        noteDouceur
        commentaire
        nonReproductible
      }
      interventions(order_by: { date: desc }) {
        id
        type
        date
        observations
        produit
        dosage
        nbHausses
        poidsKg
      }
      capteurs {
        id
        type
        identifiant
        actif
        batteriePct
        derniereCommunication
      }
    }
  }
`;

// Query pour récupérer les ruches d'un rucher
export const GET_RUCHES_BY_RUCHER = gql`
  query GetRuchesByRucher($rucherId: uuid!) {
    ruches(
      where: { rucher_id: { _eq: $rucherId } }
      order_by: { created_at: desc }
    ) {
      id
      immatriculation
      type
      race
      statut
      maladie
      securisee
      created_at
      updated_at
      reine {
        id
        anneeNaissance
        codeCouleur
        noteDouceur
      }
    }
  }
`;
