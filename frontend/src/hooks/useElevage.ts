'use client';

import { useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_REINES_ELEVAGE, GET_TACHES_ELEVAGE_OVERVIEW } from '@/lib/graphql/queries/reine.queries';
import { UPDATE_TACHE_ELEVAGE, UPDATE_CYCLE_ELEVAGE } from '@/lib/graphql/mutations/reine.mutations';

export function useElevageStats() {
  const { data: reinesData, loading: reinesLoading } = useQuery<any>(GET_REINES_ELEVAGE);
  const { data: tachesData, loading: tachesLoading } = useQuery<any>(GET_TACHES_ELEVAGE_OVERVIEW);

  const stats = useMemo(() => {
    const reines = reinesData?.reines ?? [];
    const allTaches = tachesData?.taches_cycle_elevage ?? [];

    const totalReines = reines.length;

    const cyclesEnCours = reines.reduce((count: number, reine: any) => {
      return count + (reine.cycles_elevage_reines?.filter((c: any) => c.statut === 'EnCours').length ?? 0);
    }, 0);

    const tachesAFaire = allTaches.filter((t: any) => t.statut === 'AFaire');
    const tachesFaites = allTaches.filter((t: any) => t.statut === 'Faite');
    const tachesEnRetard = allTaches.filter((t: any) => t.statut === 'EnRetard');

    const prochaineTache = tachesAFaire.length > 0 ? tachesAFaire[0] : null;

    return {
      totalReines,
      cyclesEnCours,
      tachesEnRetardCount: tachesEnRetard.length,
      prochaineTache,
      allTaches,
      tachesAFaire,
      tachesFaites,
      tachesEnRetard,
      reines,
    };
  }, [reinesData, tachesData]);

  return {
    ...stats,
    loading: reinesLoading || tachesLoading,
  };
}

export function useUpdateTache() {
  const [updateTache, { loading }] = useMutation(UPDATE_TACHE_ELEVAGE, {
    refetchQueries: [
      { query: GET_REINES_ELEVAGE },
      { query: GET_TACHES_ELEVAGE_OVERVIEW },
    ],
  });

  return { updateTache, loading };
}

export function useUpdateCycle() {
  const [updateCycle, { loading }] = useMutation(UPDATE_CYCLE_ELEVAGE, {
    refetchQueries: [
      { query: GET_REINES_ELEVAGE },
      { query: GET_TACHES_ELEVAGE_OVERVIEW },
    ],
  });

  return { updateCycle, loading };
}
