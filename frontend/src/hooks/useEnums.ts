import { useQuery } from '@apollo/client/react';
import { GET_ALL_ENUMS } from '@/lib/graphql/queries/enums.queries';
import { useMemo } from 'react';
import {
  STATUT_OPTIONS,
  TYPE_RUCHE_OPTIONS,
  RACE_ABEILLE_OPTIONS,
  MALADIE_OPTIONS,
  FLORE_OPTIONS,
} from '@/lib/constants/ruche.constants';

interface EnumValue {
  name: string;
}

interface EnumType {
  enumValues: EnumValue[];
}

interface EnumsData {
  statut: EnumType | null;
  typeRuche: EnumType | null;
  raceAbeille: EnumType | null;
  maladie: EnumType | null;
  flore: EnumType | null;
}

interface SelectOption {
  value: string;
  label: string;
}

// Mapping pour des labels personnalisés (optionnel)
const LABEL_MAPPINGS: Record<string, string> = {
  // Types de ruche
  KenyaTopBar: 'Kenya Top Bar',

  // Races
  HybrideLocale: 'Hybride Locale',
  Ligustica: 'Ligustica (Italienne)',
  Noire: 'Noire (Apis mellifera mellifera)',

  // Maladies
  LoqueAmericaine: 'Loque Américaine',
  LoqueEuropeenne: 'Loque Européenne',
  Tropilaelaps: 'Tropilaelaps',
  VirusAilesDeformees: 'Virus des Ailes Déformées',
  ParalysieChronique: 'Paralysie Chronique',
  IntoxicationPesticides: 'Intoxication aux Pesticides',

  // Flore
  Chataignier: 'Châtaignier',
  Bruyere: 'Bruyère',
  ToutesFleurs: 'Toutes Fleurs',
};

function formatEnumToOptions(enumValues: EnumValue[] | undefined, fallback: SelectOption[]): SelectOption[] {
  if (!enumValues || enumValues.length === 0) return fallback;

  return enumValues.map((ev) => ({
    value: ev.name,
    label: LABEL_MAPPINGS[ev.name] || ev.name,
  }));
}

export function useEnums() {
  const { data, loading, error } = useQuery<EnumsData>(GET_ALL_ENUMS, {
    // Cache les résultats pour éviter de requêter à chaque fois
    fetchPolicy: 'cache-first',
  });

  const enums = useMemo(() => {
    // Si les données ne sont pas encore chargées ou en erreur, utiliser les constantes par défaut
    if (loading || error || !data) {
      return {
        statut: STATUT_OPTIONS,
        typeRuche: TYPE_RUCHE_OPTIONS,
        raceAbeille: RACE_ABEILLE_OPTIONS,
        maladie: MALADIE_OPTIONS,
        flore: FLORE_OPTIONS,
      };
    }

    return {
      statut: formatEnumToOptions(data.statut?.enumValues, STATUT_OPTIONS),
      typeRuche: formatEnumToOptions(data.typeRuche?.enumValues, TYPE_RUCHE_OPTIONS),
      raceAbeille: formatEnumToOptions(data.raceAbeille?.enumValues, RACE_ABEILLE_OPTIONS),
      maladie: formatEnumToOptions(data.maladie?.enumValues, MALADIE_OPTIONS),
      flore: formatEnumToOptions(data.flore?.enumValues, FLORE_OPTIONS),
    };
  }, [data, loading, error]);

  return {
    enums,
    loading,
    error,
  };
}
