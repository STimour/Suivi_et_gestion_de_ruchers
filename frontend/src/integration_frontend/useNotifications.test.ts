import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
}));

import { useNotifications } from '@/hooks/useNotifications';

describe('useNotifications', () => {
  const mockRefetchNotifications = vi.fn();
  const mockRefetchCount = vi.fn();
  const mockMarkRead = vi.fn().mockResolvedValue({});
  const mockMarkAllRead = vi.fn().mockResolvedValue({});
  const mockDelete = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue([mockMarkRead, {}]);
  });

  function setupQueries(notifData: any = undefined, countData: any = undefined) {
    mockUseQuery
      .mockReturnValueOnce({
        data: notifData,
        loading: false,
        refetch: mockRefetchNotifications,
      })
      .mockReturnValueOnce({
        data: countData,
        refetch: mockRefetchCount,
      });
    mockUseMutation
      .mockReturnValueOnce([mockMarkRead, {}])
      .mockReturnValueOnce([mockMarkAllRead, {}])
      .mockReturnValueOnce([mockDelete, {}]);
  }

  it('retourne des notifications vides par defaut', () => {
    setupQueries();
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('retourne les notifications depuis la query', () => {
    const notifs = [
      { id: '1', type: 'alerte', titre: 'Test', message: 'msg', lue: false, date: '2024-01-01' },
    ];
    setupQueries({ notifications: notifs });
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual(notifs);
  });

  it('retourne unreadCount depuis l\'aggregat', () => {
    setupQueries(undefined, {
      notifications_aggregate: { aggregate: { count: 5 } },
    });
    const { result } = renderHook(() => useNotifications());
    expect(result.current.unreadCount).toBe(5);
  });

  it('markRead appelle la mutation et refetch', async () => {
    setupQueries();
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.markRead('n1');
    });
    expect(mockMarkRead).toHaveBeenCalledWith({ variables: { id: 'n1' } });
    expect(mockRefetchNotifications).toHaveBeenCalled();
    expect(mockRefetchCount).toHaveBeenCalled();
  });

  it('markAllRead appelle la mutation et refetch', async () => {
    setupQueries();
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.markAllRead();
    });
    expect(mockMarkAllRead).toHaveBeenCalled();
    expect(mockRefetchNotifications).toHaveBeenCalled();
    expect(mockRefetchCount).toHaveBeenCalled();
  });

  it('deleteNotification appelle la mutation et refetch', async () => {
    setupQueries();
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.deleteNotification('n2');
    });
    expect(mockDelete).toHaveBeenCalledWith({ variables: { id: 'n2' } });
    expect(mockRefetchNotifications).toHaveBeenCalled();
    expect(mockRefetchCount).toHaveBeenCalled();
  });
});
