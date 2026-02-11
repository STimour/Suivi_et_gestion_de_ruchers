import { describe, it, expect } from 'vitest';
import {
  TYPE_CAPTEUR_OPTIONS,
  getCapteurTypeLabel,
  getCapteurTypeIcon,
} from '@/lib/constants/capteur.constants';
import { HelpCircle } from 'lucide-react';

describe('TYPE_CAPTEUR_OPTIONS', () => {
  it('contient 7 types de capteurs', () => {
    expect(TYPE_CAPTEUR_OPTIONS).toHaveLength(7);
  });

  it('chaque option a value, label et icon', () => {
    for (const opt of TYPE_CAPTEUR_OPTIONS) {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
      expect(opt).toHaveProperty('icon');
    }
  });
});

describe('getCapteurTypeLabel', () => {
  it('retourne le label pour un type connu', () => {
    expect(getCapteurTypeLabel('Temperature')).toBe('Température');
  });

  it('retourne la valeur brute pour un type inconnu', () => {
    expect(getCapteurTypeLabel('Inconnu')).toBe('Inconnu');
  });
});

describe('getCapteurTypeIcon', () => {
  it('retourne l\'icone pour un type connu', () => {
    const icon = getCapteurTypeIcon('Poids');
    expect(icon).toBeDefined();
    expect(icon).not.toBe(HelpCircle);
  });

  it('retourne HelpCircle pour un type inconnu', () => {
    expect(getCapteurTypeIcon('Inconnu')).toBe(HelpCircle);
  });
});
