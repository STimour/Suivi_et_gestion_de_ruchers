import { describe, it, expect } from 'vitest';
import { CREATE_RUCHER, UPDATE_RUCHER, DELETE_RUCHER } from '@/lib/graphql/mutations/rucher.mutations';
import { CREATE_RUCHE, CREATE_RUCHE_WITH_REINE, UPDATE_RUCHE, DELETE_RUCHE } from '@/lib/graphql/mutations/ruche.mutations';
import { CREATE_REINE, UPDATE_REINE, UPDATE_TACHE_ELEVAGE, UPDATE_CYCLE_ELEVAGE, DELETE_REINE } from '@/lib/graphql/mutations/reine.mutations';
import { CREATE_INTERVENTION, CREATE_BULK_INTERVENTIONS, UPDATE_INTERVENTION, DELETE_INTERVENTION } from '@/lib/graphql/mutations/intervention.mutations';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ, DELETE_NOTIFICATION } from '@/lib/graphql/mutations/notification.mutations';
import { CREATE_TRANSHUMANCE, UPDATE_RUCHER_LOCATION } from '@/lib/graphql/mutations/transhumance.mutations';

describe('rucher mutations', () => {
  it('CREATE_RUCHER est défini', () => {
    expect(CREATE_RUCHER).toBeDefined();
    expect(CREATE_RUCHER.loc?.source.body).toContain('insert_ruchers_one');
  });

  it('UPDATE_RUCHER est défini', () => {
    expect(UPDATE_RUCHER).toBeDefined();
    expect(UPDATE_RUCHER.loc?.source.body).toContain('update_ruchers_by_pk');
  });

  it('DELETE_RUCHER est défini', () => {
    expect(DELETE_RUCHER).toBeDefined();
    expect(DELETE_RUCHER.loc?.source.body).toContain('delete_ruchers_by_pk');
  });
});

describe('ruche mutations', () => {
  it('CREATE_RUCHE est défini', () => {
    expect(CREATE_RUCHE).toBeDefined();
    expect(CREATE_RUCHE.loc?.source.body).toContain('insert_ruches_one');
  });

  it('CREATE_RUCHE_WITH_REINE est défini', () => {
    expect(CREATE_RUCHE_WITH_REINE).toBeDefined();
    expect(CREATE_RUCHE_WITH_REINE.loc?.source.body).toContain('insert_reines_one');
  });

  it('UPDATE_RUCHE est défini', () => {
    expect(UPDATE_RUCHE).toBeDefined();
  });

  it('DELETE_RUCHE est défini', () => {
    expect(DELETE_RUCHE).toBeDefined();
  });
});

describe('reine mutations', () => {
  it('CREATE_REINE est défini', () => {
    expect(CREATE_REINE).toBeDefined();
    expect(CREATE_REINE.loc?.source.body).toContain('insert_reines_one');
  });

  it('UPDATE_REINE est défini', () => {
    expect(UPDATE_REINE).toBeDefined();
  });

  it('UPDATE_TACHE_ELEVAGE est défini', () => {
    expect(UPDATE_TACHE_ELEVAGE).toBeDefined();
    expect(UPDATE_TACHE_ELEVAGE.loc?.source.body).toContain('update_taches_cycle_elevage_by_pk');
  });

  it('UPDATE_CYCLE_ELEVAGE est défini', () => {
    expect(UPDATE_CYCLE_ELEVAGE).toBeDefined();
  });

  it('DELETE_REINE est défini', () => {
    expect(DELETE_REINE).toBeDefined();
  });
});

describe('intervention mutations', () => {
  it('CREATE_INTERVENTION est défini', () => {
    expect(CREATE_INTERVENTION).toBeDefined();
    expect(CREATE_INTERVENTION.loc?.source.body).toContain('insert_interventions_one');
  });

  it('CREATE_BULK_INTERVENTIONS est défini', () => {
    expect(CREATE_BULK_INTERVENTIONS).toBeDefined();
    expect(CREATE_BULK_INTERVENTIONS.loc?.source.body).toContain('insert_interventions');
  });

  it('UPDATE_INTERVENTION est défini', () => {
    expect(UPDATE_INTERVENTION).toBeDefined();
  });

  it('DELETE_INTERVENTION est défini', () => {
    expect(DELETE_INTERVENTION).toBeDefined();
  });
});

describe('notification mutations', () => {
  it('MARK_NOTIFICATION_READ est défini', () => {
    expect(MARK_NOTIFICATION_READ).toBeDefined();
    expect(MARK_NOTIFICATION_READ.loc?.source.body).toContain('update_notifications_by_pk');
  });

  it('MARK_ALL_NOTIFICATIONS_READ est défini', () => {
    expect(MARK_ALL_NOTIFICATIONS_READ).toBeDefined();
  });

  it('DELETE_NOTIFICATION est défini', () => {
    expect(DELETE_NOTIFICATION).toBeDefined();
  });
});

describe('transhumance mutations', () => {
  it('CREATE_TRANSHUMANCE est défini', () => {
    expect(CREATE_TRANSHUMANCE).toBeDefined();
    expect(CREATE_TRANSHUMANCE.loc?.source.body).toContain('insert_transhumances_one');
  });

  it('UPDATE_RUCHER_LOCATION est défini', () => {
    expect(UPDATE_RUCHER_LOCATION).toBeDefined();
    expect(UPDATE_RUCHER_LOCATION.loc?.source.body).toContain('update_ruchers_by_pk');
  });
});
