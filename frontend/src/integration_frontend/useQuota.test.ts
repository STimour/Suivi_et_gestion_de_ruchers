import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

const mockUseAuth = vi.fn();

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useQuota } from '@/hooks/useQuota';

describe('useQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('canCreateRucher est true quand pas de limite', () => {
    mockUseAuth.mockReturnValue({ user: { entreprise_typeOffre: 'Premium' } });
    mockUseQuery.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useQuota());

    expect(result.current.canCreateRucher).toBe(true);
  });

  it('canCreateRucher est true quand sous la limite', () => {
    mockUseAuth.mockReturnValue({
      user: { entreprise_nbRuchersMax: 5, entreprise_nbReinesMax: -1, entreprise_typeOffre: 'Freemium' },
    });
    mockUseQuery
      .mockReturnValueOnce({ data: { ruchers: [{ id: '1' }, { id: '2' }] } })
      .mockReturnValueOnce({ data: undefined });

    const { result } = renderHook(() => useQuota());

    expect(result.current.canCreateRucher).toBe(true);
  });

  it('canCreateRucher est false quand a la limite', () => {
    mockUseAuth.mockReturnValue({
      user: { entreprise_nbRuchersMax: 2, entreprise_nbReinesMax: -1, entreprise_typeOffre: 'Freemium' },
    });
    mockUseQuery
      .mockReturnValueOnce({ data: { ruchers: [{ id: '1' }, { id: '2' }] } })
      .mockReturnValueOnce({ data: undefined });

    const { result } = renderHook(() => useQuota());

    expect(result.current.canCreateRucher).toBe(false);
  });

  it('canCreateReine est true quand pas de limite', () => {
    mockUseAuth.mockReturnValue({ user: { entreprise_typeOffre: 'Premium' } });
    mockUseQuery.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useQuota());

    expect(result.current.canCreateReine).toBe(true);
  });

  it('canCreateReine est false quand a la limite', () => {
    mockUseAuth.mockReturnValue({
      user: { entreprise_nbRuchersMax: -1, entreprise_nbReinesMax: 1, entreprise_typeOffre: 'Freemium' },
    });
    mockUseQuery
      .mockReturnValueOnce({ data: undefined })
      .mockReturnValueOnce({ data: { reines: [{ id: 'r1' }] } });

    const { result } = renderHook(() => useQuota());

    expect(result.current.canCreateReine).toBe(false);
  });

  it('isFreemium est true pour offre non Premium', () => {
    mockUseAuth.mockReturnValue({
      user: { entreprise_typeOffre: 'Freemium' },
    });
    mockUseQuery.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useQuota());

    expect(result.current.isFreemium).toBe(true);
  });

  it('isFreemium est false pour offre Premium', () => {
    mockUseAuth.mockReturnValue({
      user: { entreprise_typeOffre: 'Premium' },
    });
    mockUseQuery.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useQuota());

    expect(result.current.isFreemium).toBe(false);
  });
});
