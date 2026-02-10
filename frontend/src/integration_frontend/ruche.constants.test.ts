import { describe, it, expect } from 'vitest';
import {
  STATUT_OPTIONS,
  TYPE_RUCHE_OPTIONS,
  RACE_ABEILLE_OPTIONS,
  MALADIE_OPTIONS,
  FLORE_OPTIONS,
  TYPE_INTERVENTION_OPTIONS,
} from '@/lib/constants/ruche.constants';

describe('constantes ruche', () => {
  it('STATUT_OPTIONS contient 4 statuts', () => {
    expect(STATUT_OPTIONS).toHaveLength(4);
    expect(STATUT_OPTIONS.map((o) => o.value)).toContain('Active');
  });

  it('TYPE_RUCHE_OPTIONS contient 7 types', () => {
    expect(TYPE_RUCHE_OPTIONS).toHaveLength(7);
    expect(TYPE_RUCHE_OPTIONS.map((o) => o.value)).toContain('Dadant');
  });

  it('RACE_ABEILLE_OPTIONS contient 7 races', () => {
    expect(RACE_ABEILLE_OPTIONS).toHaveLength(7);
    expect(RACE_ABEILLE_OPTIONS.map((o) => o.value)).toContain('Buckfast');
  });

  it('MALADIE_OPTIONS contient 11 maladies', () => {
    expect(MALADIE_OPTIONS).toHaveLength(11);
    expect(MALADIE_OPTIONS.map((o) => o.value)).toContain('Varroose');
  });

  it('FLORE_OPTIONS contient 8 flores', () => {
    expect(FLORE_OPTIONS).toHaveLength(8);
    expect(FLORE_OPTIONS.map((o) => o.value)).toContain('Lavande');
  });

  it('TYPE_INTERVENTION_OPTIONS contient 7 types', () => {
    expect(TYPE_INTERVENTION_OPTIONS).toHaveLength(7);
  });

  it('chaque option a value et label', () => {
    [...STATUT_OPTIONS, ...TYPE_RUCHE_OPTIONS, ...FLORE_OPTIONS].forEach((opt) => {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
    });
  });
});
