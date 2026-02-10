import { gql } from '@apollo/client';

// Query d'introspection pour récupérer les valeurs d'un enum
export const GET_ENUM_VALUES = gql`
  query GetEnumValues($enumName: String!) {
    __type(name: $enumName) {
      enumValues {
        name
        description
      }
    }
  }
`;

// Query pour récupérer tous les enums nécessaires en une seule requête
export const GET_ALL_ENUMS = gql`
  query GetAllEnums {
    statut: __type(name: "StatutRuche_enum") {
      enumValues {
        name
      }
    }
    typeRuche: __type(name: "TypeRuche_enum") {
      enumValues {
        name
      }
    }
    raceAbeille: __type(name: "TypeRaceAbeille_enum") {
      enumValues {
        name
      }
    }
    maladie: __type(name: "TypeMaladie_enum") {
      enumValues {
        name
      }
    }
    flore: __type(name: "TypeFlore_enum") {
      enumValues {
        name
      }
    }
  }
`;
