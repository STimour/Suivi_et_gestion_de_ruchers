import { describe, it, expect } from 'vitest';
import {
  StatutRuche,
  TypeIntervention,
  TypeCapteur,
  TypeAlerte,
  TypeFlore,
  RoleUtilisateur,
} from '@/lib/types';

describe('StatutRuche', () => {
  it('contient les 4 statuts', () => {
    expect(StatutRuche.Active).toBe('ACTIVE');
    expect(StatutRuche.Faible).toBe('FAIBLE');
    expect(StatutRuche.Malade).toBe('MALADE');
    expect(StatutRuche.Morte).toBe('MORTE');
  });
});

describe('TypeIntervention', () => {
  it('contient 7 types', () => {
    expect(Object.keys(TypeIntervention)).toHaveLength(7);
    expect(TypeIntervention.Visite).toBe('VISITE');
    expect(TypeIntervention.Recolte).toBe('RECOLTE');
  });
});

describe('TypeCapteur', () => {
  it('contient 7 types', () => {
    expect(Object.keys(TypeCapteur)).toHaveLength(7);
    expect(TypeCapteur.GPS).toBe('GPS');
    expect(TypeCapteur.Temperature).toBe('TEMPERATURE');
  });
});

describe('TypeAlerte', () => {
  it('contient 6 types', () => {
    expect(Object.keys(TypeAlerte)).toHaveLength(6);
    expect(TypeAlerte.Vol).toBe('VOL');
    expect(TypeAlerte.DeplacementGPS).toBe('DEPLACEMENT_GPS');
  });
});

describe('TypeFlore', () => {
  it('contient 8 flores', () => {
    expect(Object.keys(TypeFlore)).toHaveLength(8);
    expect(TypeFlore.Lavande).toBe('LAVANDE');
    expect(TypeFlore.Acacia).toBe('ACACIA');
  });
});

describe('RoleUtilisateur', () => {
  it('contient 3 rôles', () => {
    expect(Object.keys(RoleUtilisateur)).toHaveLength(3);
    expect(RoleUtilisateur.Admin).toBe('ADMIN');
    expect(RoleUtilisateur.Apiculteur).toBe('APICULTEUR');
    expect(RoleUtilisateur.Lecteur).toBe('LECTEUR');
  });
});
