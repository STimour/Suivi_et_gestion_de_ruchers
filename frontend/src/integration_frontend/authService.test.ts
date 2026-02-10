import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/lib/auth/authService';

describe('AuthService - gestion des tokens', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setToken et getToken fonctionnent', () => {
    authService.setToken('abc123');
    expect(authService.getToken()).toBe('abc123');
  });

  it('setRefreshToken et getRefreshToken fonctionnent', () => {
    authService.setRefreshToken('refresh123');
    expect(authService.getRefreshToken()).toBe('refresh123');
  });

  it('clearTokens supprime tous les tokens', () => {
    authService.setToken('abc');
    authService.setRefreshToken('ref');
    authService.clearTokens();
    expect(authService.getToken()).toBeNull();
    expect(authService.getRefreshToken()).toBeNull();
  });

  it('isAuthenticated retourne true avec un token', () => {
    authService.setToken('abc');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated retourne false sans token', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });
});

describe('AuthService - logout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('logout supprime les tokens', async () => {
    authService.setToken('abc');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await authService.logout();
    expect(authService.getToken()).toBeNull();
  });

  it('logout fonctionne sans token', async () => {
    await authService.logout();
    expect(authService.getToken()).toBeNull();
  });
});

describe('AuthService - login', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('login stocke le token en cas de succès', async () => {
    const mockResponse = {
      access_token: 'jwt-token',
      user: { id: '1', email: 'test@test.com', nom: 'Test', prenom: 'User' },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );
    const result = await authService.login({ email: 'test@test.com', password: 'pass' });
    expect(result.access_token).toBe('jwt-token');
    expect(authService.getToken()).toBe('jwt-token');
  });

  it('login lance une erreur si la réponse est ko', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid' }), { status: 401 })
    );
    await expect(
      authService.login({ email: 'bad@test.com', password: 'wrong' })
    ).rejects.toThrow();
  });

  it('login gère user_inactive', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'user_inactive' }), { status: 403 })
    );
    await expect(
      authService.login({ email: 'test@test.com', password: 'pass' })
    ).rejects.toThrow('Votre compte n\'est pas encore validé');
  });
});
