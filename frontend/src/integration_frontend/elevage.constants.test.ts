import { describe, it, expect } from 'vitest';
import {
  getTacheTypeLabel,
  getStatutTacheStyle,
  getStatutCycleStyle,
  getStatutCycleLabel,
  getStatutTacheLabel,
  TYPE_TACHE_ELEVAGE_OPTIONS,
  STATUT_CYCLE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from '@/lib/constants/elevage.constants';

describe('getTacheTypeLabel', () => {
  it('retourne le label pour un type connu', () => {
    expect(getTacheTypeLabel('Greffage')).toBe('Greffage (J0)');
  });

  it('retourne la valeur brute pour un type inconnu', () => {
    expect(getTacheTypeLabel('Inconnu')).toBe('Inconnu');
  });
});

describe('getStatutTacheStyle', () => {
  it('retourne le style pour AFaire', () => {
    expect(getStatutTacheStyle('AFaire')).toContain('amber');
  });

  it('retourne le fallback pour un statut inconnu', () => {
    expect(getStatutTacheStyle('Xyz')).toContain('gray');
  });
});

describe('getStatutTacheLabel', () => {
  it('retourne le label pour Faite', () => {
    expect(getStatutTacheLabel('Faite')).toBe('Faite');
  });

  it('retourne la valeur brute pour un statut inconnu', () => {
    expect(getStatutTacheLabel('Xyz')).toBe('Xyz');
  });
});

describe('getStatutCycleStyle', () => {
  it('retourne le style pour EnCours', () => {
    expect(getStatutCycleStyle('EnCours')).toContain('blue');
  });

  it('retourne le fallback pour un statut inconnu', () => {
    expect(getStatutCycleStyle('Xyz')).toContain('gray');
  });
});

describe('getStatutCycleLabel', () => {
  it('retourne le label pour Termine', () => {
    expect(getStatutCycleLabel('Termine')).toBe('Terminé');
  });

  it('retourne la valeur brute pour un statut inconnu', () => {
    expect(getStatutCycleLabel('Xyz')).toBe('Xyz');
  });
});

describe('constantes elevage', () => {
  it('TYPE_TACHE_ELEVAGE_OPTIONS contient 7 entrées', () => {
    expect(TYPE_TACHE_ELEVAGE_OPTIONS).toHaveLength(7);
  });

  it('STATUT_CYCLE_OPTIONS contient 3 entrées', () => {
    expect(STATUT_CYCLE_OPTIONS).toHaveLength(3);
  });

  it('STATUT_TACHE_OPTIONS contient 4 entrées', () => {
    expect(STATUT_TACHE_OPTIONS).toHaveLength(4);
  });
});
