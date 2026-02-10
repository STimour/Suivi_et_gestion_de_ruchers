import { describe, it, expect } from 'vitest';
import {
  getInterventionTypeStyle,
  INTERVENTION_TYPE_CONFIG,
} from '@/lib/constants/intervention.constants';

describe('getInterventionTypeStyle', () => {
  it('retourne la config pour Visite', () => {
    const style = getInterventionTypeStyle('Visite');
    expect(style.label).toBe('Visite');
    expect(style.badgeClass).toContain('blue');
  });

  it('retourne la config pour Traitement', () => {
    const style = getInterventionTypeStyle('Traitement');
    expect(style.label).toBe('Traitement');
    expect(style.badgeClass).toContain('red');
  });

  it('retourne la config pour Recolte', () => {
    const style = getInterventionTypeStyle('Recolte');
    expect(style.label).toBe('Récolte');
  });

  it('retourne le fallback pour un type inconnu', () => {
    const style = getInterventionTypeStyle('TypeInconnu');
    expect(style.label).toBe('Autre');
    expect(style.badgeClass).toContain('gray');
  });
});

describe('INTERVENTION_TYPE_CONFIG', () => {
  it('contient 7 types', () => {
    expect(Object.keys(INTERVENTION_TYPE_CONFIG)).toHaveLength(7);
  });

  it('chaque config a les propriétés requises', () => {
    Object.values(INTERVENTION_TYPE_CONFIG).forEach((config) => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('badgeClass');
      expect(config).toHaveProperty('bgClass');
      expect(config).toHaveProperty('textClass');
      expect(config).toHaveProperty('icon');
    });
  });
});
