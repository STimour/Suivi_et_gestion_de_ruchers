import { describe, it, expect } from 'vitest';
import { NOTIFICATION_TYPE_CONFIG } from '@/lib/constants/notification.constants';

describe('NOTIFICATION_TYPE_CONFIG', () => {
  it('contient 5 types de notification', () => {
    expect(Object.keys(NOTIFICATION_TYPE_CONFIG)).toHaveLength(5);
  });

  it('contient RappelVisite', () => {
    expect(NOTIFICATION_TYPE_CONFIG.RappelVisite.label).toBe('Rappel visite');
  });

  it('contient AlerteSanitaire', () => {
    expect(NOTIFICATION_TYPE_CONFIG.AlerteSanitaire.label).toBe('Alerte sanitaire');
    expect(NOTIFICATION_TYPE_CONFIG.AlerteSanitaire.iconColor).toContain('red');
  });

  it('chaque config a les propriétés requises', () => {
    Object.values(NOTIFICATION_TYPE_CONFIG).forEach((config) => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('bgClass');
      expect(config).toHaveProperty('textClass');
      expect(config).toHaveProperty('iconColor');
    });
  });
});
