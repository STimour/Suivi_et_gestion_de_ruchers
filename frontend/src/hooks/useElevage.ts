'use client';

import { useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_RACLES_ELEVAGE, GET_TACHES_ELEVAGE_OVERVIEW } from '@/lib/graphql/queries/reine.queries';
import { UPDATE_TACHE_ELEVAGE, UPDATE_CYCLE_ELEVAGE } from '@/lib/graphql/mutations/reine.mutations';

export function useElevageStats() {
  const { data: raclesData, loading: raclesLoading } = useQuery<any>(GET_RACLES_ELEVAGE);
  const { data: tachesData, loading: tachesLoading } = useQuery<any>(GET_TACHES_ELEVAGE_OVERVIEW);

  const stats = useMemo(() => {
    const racles = raclesData?.racles_elevage ?? [];
    const allTaches = tachesData?.taches_cycle_elevage ?? [];

    const totalRacles = racles.length;

    const totalReines = racles.reduce((count: number, racle: any) => {
      return count + (racle.reines?.length ?? 0);
    }, 0);

    const cyclesEnCours = racles.reduce((count: number, racle: any) => {
      return count + (racle.cycles_elevage_reines?.filter((c: any) => c.statut === 'EnCours').length ?? 0);
    }, 0);

    // Compute locked status per tache
    const byCycle: Record<string, any[]> = {};
    for (const t of allTaches) {
      const cycleId = t.cycles_elevage_reine?.id;
      if (!cycleId) continue;
      if (!byCycle[cycleId]) byCycle[cycleId] = [];
      byCycle[cycleId].push(t);
    }

    const lockedIds = new Set<string>();
    const today = new Date().toISOString().split('T')[0];

    for (const taches of Object.values(byCycle)) {
      const sorted = [...taches].sort(
        (a: any, b: any) => (a.jourTheorique ?? 0) - (b.jourTheorique ?? 0)
      );
      for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i];
        if (t.statut === 'Faite') continue;
        const prevNotDone = i > 0 && sorted[i - 1].statut !== 'Faite';
        const dateNotReached = t.datePrevue && t.datePrevue > today;
        if (prevNotDone || dateNotReached) {
          lockedIds.add(t.id);
        }
      }
    }

    const enriched = allTaches.map((t: any) => ({ ...t, _locked: lockedIds.has(t.id) }));

    const tachesAFaire = enriched.filter((t: any) => t.statut === 'AFaire');
    const tachesFaites = enriched.filter((t: any) => t.statut === 'Faite');
    const tachesEnRetard = enriched.filter((t: any) => t.statut === 'EnRetard');

    const prochaineTache = tachesAFaire.length > 0 ? tachesAFaire[0] : null;

    return {
      totalRacles,
      totalReines,
      cyclesEnCours,
      tachesEnRetardCount: tachesEnRetard.length,
      prochaineTache,
      allTaches: enriched,
      tachesAFaire,
      tachesFaites,
      tachesEnRetard,
      racles,
    };
  }, [raclesData, tachesData]);

  return {
    ...stats,
    loading: raclesLoading || tachesLoading,
  };
}

export function useUpdateTache() {
  const [updateTache, { loading }] = useMutation(UPDATE_TACHE_ELEVAGE, {
    refetchQueries: [
      { query: GET_RACLES_ELEVAGE },
      { query: GET_TACHES_ELEVAGE_OVERVIEW },
    ],
  });

  return { updateTache, loading };
}

export function useUpdateCycle() {
  const [updateCycle, { loading }] = useMutation(UPDATE_CYCLE_ELEVAGE, {
    refetchQueries: [
      { query: GET_RACLES_ELEVAGE },
      { query: GET_TACHES_ELEVAGE_OVERVIEW },
    ],
  });

  return { updateCycle, loading };
}
