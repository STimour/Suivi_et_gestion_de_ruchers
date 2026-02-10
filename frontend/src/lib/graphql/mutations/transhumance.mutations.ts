import { gql } from '@apollo/client';

export const CREATE_TRANSHUMANCE = gql`
  mutation CreateTranshumance($transhumance: transhumances_insert_input!) {
    insert_transhumances_one(object: $transhumance) {
      id
      date
      origineLat
      origineLng
      destinationLat
      destinationLng
      floreCible
      rucher_id
    }
  }
`;

export const UPDATE_RUCHER_LOCATION = gql`
  mutation UpdateRucherLocation($id: uuid!, $latitude: float8!, $longitude: float8!, $flore: String!) {
    update_ruchers_by_pk(
      pk_columns: { id: $id }
      _set: { latitude: $latitude, longitude: $longitude, flore: $flore }
    ) {
      id
      nom
      latitude
      longitude
      flore
    }
  }
`;
