import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
}));

import { useElevageStats, useUpdateTache, useUpdateCycle } from '@/hooks/useElevage';

describe('useElevageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne des stats vides sans donnees', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: undefined, loading: false })
      .mockReturnValueOnce({ data: undefined, loading: false });

    const { result } = renderHook(() => useElevageStats());

    expect(result.current.totalRacles).toBe(0);
    expect(result.current.totalReines).toBe(0);
    expect(result.current.cyclesEnCours).toBe(0);
    expect(result.current.tachesAFaire).toEqual([]);
    expect(result.current.tachesFaites).toEqual([]);
    expect(result.current.tachesEnRetard).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('calcule totalRacles et totalReines', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          racles_elevage: [
            { id: 'r1', reines: [{ id: 're1' }, { id: 're2' }], cycles_elevage_reines: [] },
            { id: 'r2', reines: [{ id: 're3' }], cycles_elevage_reines: [] },
          ],
        },
        loading: false,
      })
      .mockReturnValueOnce({ data: { taches_cycle_elevage: [] }, loading: false });

    const { result } = renderHook(() => useElevageStats());

    expect(result.current.totalRacles).toBe(2);
    expect(result.current.totalReines).toBe(3);
  });

  it('calcule cyclesEnCours', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          racles_elevage: [
            {
              id: 'r1',
              reines: [],
              cycles_elevage_reines: [
                { id: 'c1', statut: 'EnCours' },
                { id: 'c2', statut: 'Termine' },
                { id: 'c3', statut: 'EnCours' },
              ],
            },
          ],
        },
        loading: false,
      })
      .mockReturnValueOnce({ data: { taches_cycle_elevage: [] }, loading: false });

    const { result } = renderHook(() => useElevageStats());

    expect(result.current.cyclesEnCours).toBe(2);
  });

  it('separe tachesAFaire, tachesFaites et tachesEnRetard', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { racles_elevage: [] },
        loading: false,
      })
      .mockReturnValueOnce({
        data: {
          taches_cycle_elevage: [
            { id: 't1', statut: 'AFaire', cycles_elevage_reine: { id: 'c1' }, jourTheorique: 0 },
            { id: 't2', statut: 'Faite', cycles_elevage_reine: { id: 'c1' }, jourTheorique: 1 },
            { id: 't3', statut: 'EnRetard', cycles_elevage_reine: { id: 'c1' }, jourTheorique: 2 },
          ],
        },
        loading: false,
      });

    const { result } = renderHook(() => useElevageStats());

    expect(result.current.tachesAFaire).toHaveLength(1);
    expect(result.current.tachesFaites).toHaveLength(1);
    expect(result.current.tachesEnRetard).toHaveLength(1);
    expect(result.current.tachesEnRetardCount).toBe(1);
  });

  it('verrouille les taches dont la precedente n\'est pas faite', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { racles_elevage: [] },
        loading: false,
      })
      .mockReturnValueOnce({
        data: {
          taches_cycle_elevage: [
            { id: 't1', statut: 'AFaire', cycles_elevage_reine: { id: 'c1' }, jourTheorique: 0 },
            { id: 't2', statut: 'AFaire', cycles_elevage_reine: { id: 'c1' }, jourTheorique: 5 },
          ],
        },
        loading: false,
      });

    const { result } = renderHook(() => useElevageStats());

    const t2 = result.current.allTaches.find((t: any) => t.id === 't2');
    expect(t2._locked).toBe(true);
  });

  it('indique loading quand les requetes chargent', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: undefined, loading: true })
      .mockReturnValueOnce({ data: undefined, loading: false });

    const { result } = renderHook(() => useElevageStats());
    expect(result.current.loading).toBe(true);
  });
});

describe('useUpdateTache', () => {
  it('retourne updateTache et loading', () => {
    const mockMutate = vi.fn();
    mockUseMutation.mockReturnValue([mockMutate, { loading: false }]);

    const { result } = renderHook(() => useUpdateTache());

    expect(result.current.updateTache).toBe(mockMutate);
    expect(result.current.loading).toBe(false);
  });
});

describe('useUpdateCycle', () => {
  it('retourne updateCycle et loading', () => {
    const mockMutate = vi.fn();
    mockUseMutation.mockReturnValue([mockMutate, { loading: false }]);

    const { result } = renderHook(() => useUpdateCycle());

    expect(result.current.updateCycle).toBe(mockMutate);
    expect(result.current.loading).toBe(false);
  });
});
