import { describe, it, expect } from 'vitest';
import { GET_RUCHERS, GET_RUCHER_BY_ID, GET_USER_RUCHERS, GET_RUCHER_DETAILS } from '@/lib/graphql/queries/rucher.queries';
import { GET_RUCHES, GET_RUCHE_BY_ID, GET_RUCHES_BY_RUCHER } from '@/lib/graphql/queries/ruche.queries';
import { GET_REINES, GET_REINES_ELEVAGE, GET_TACHES_ELEVAGE_OVERVIEW, GET_REINE_BY_ID } from '@/lib/graphql/queries/reine.queries';
import { GET_INTERVENTIONS } from '@/lib/graphql/queries/intervention.queries';
import { GET_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT } from '@/lib/graphql/queries/notification.queries';
import { GET_ENUM_VALUES, GET_ALL_ENUMS } from '@/lib/graphql/queries/enums.queries';

describe('rucher queries', () => {
  it('GET_RUCHERS est défini', () => {
    expect(GET_RUCHERS).toBeDefined();
    expect(GET_RUCHERS.loc?.source.body).toContain('ruchers');
  });

  it('GET_RUCHER_BY_ID est défini', () => {
    expect(GET_RUCHER_BY_ID).toBeDefined();
    expect(GET_RUCHER_BY_ID.loc?.source.body).toContain('ruchers_by_pk');
  });

  it('GET_USER_RUCHERS est défini', () => {
    expect(GET_USER_RUCHERS).toBeDefined();
  });

  it('GET_RUCHER_DETAILS est défini', () => {
    expect(GET_RUCHER_DETAILS).toBeDefined();
  });
});

describe('ruche queries', () => {
  it('GET_RUCHES est défini', () => {
    expect(GET_RUCHES).toBeDefined();
    expect(GET_RUCHES.loc?.source.body).toContain('ruches');
  });

  it('GET_RUCHE_BY_ID est défini', () => {
    expect(GET_RUCHE_BY_ID).toBeDefined();
    expect(GET_RUCHE_BY_ID.loc?.source.body).toContain('ruches_by_pk');
  });

  it('GET_RUCHES_BY_RUCHER est défini', () => {
    expect(GET_RUCHES_BY_RUCHER).toBeDefined();
  });
});

describe('reine queries', () => {
  it('GET_REINES est défini', () => {
    expect(GET_REINES).toBeDefined();
    expect(GET_REINES.loc?.source.body).toContain('reines');
  });

  it('GET_REINES_ELEVAGE est défini', () => {
    expect(GET_REINES_ELEVAGE).toBeDefined();
    expect(GET_REINES_ELEVAGE.loc?.source.body).toContain('isElevage');
  });

  it('GET_TACHES_ELEVAGE_OVERVIEW est défini', () => {
    expect(GET_TACHES_ELEVAGE_OVERVIEW).toBeDefined();
  });

  it('GET_REINE_BY_ID est défini', () => {
    expect(GET_REINE_BY_ID).toBeDefined();
  });
});

describe('intervention queries', () => {
  it('GET_INTERVENTIONS est défini', () => {
    expect(GET_INTERVENTIONS).toBeDefined();
    expect(GET_INTERVENTIONS.loc?.source.body).toContain('interventions');
  });
});

describe('notification queries', () => {
  it('GET_NOTIFICATIONS est défini', () => {
    expect(GET_NOTIFICATIONS).toBeDefined();
    expect(GET_NOTIFICATIONS.loc?.source.body).toContain('notifications');
  });

  it('GET_UNREAD_NOTIFICATION_COUNT est défini', () => {
    expect(GET_UNREAD_NOTIFICATION_COUNT).toBeDefined();
  });
});

describe('enum queries', () => {
  it('GET_ENUM_VALUES est défini', () => {
    expect(GET_ENUM_VALUES).toBeDefined();
    expect(GET_ENUM_VALUES.loc?.source.body).toContain('__type');
  });

  it('GET_ALL_ENUMS est défini', () => {
    expect(GET_ALL_ENUMS).toBeDefined();
    expect(GET_ALL_ENUMS.loc?.source.body).toContain('TypeRuche_enum');
  });
});
