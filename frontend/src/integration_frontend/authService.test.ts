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

  it('login stocke le refresh_token', async () => {
    const mockResponse = {
      access_token: 'jwt',
      refresh_token: 'refresh-jwt',
      user: { id: '1', email: 'a@b.com', nom: 'A', prenom: 'B' },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );
    await authService.login({ email: 'a@b.com', password: 'pass' });
    expect(authService.getRefreshToken()).toBe('refresh-jwt');
  });

  it('login extrait entreprise_id depuis entreprises', async () => {
    const mockResponse = {
      access_token: 'jwt',
      user: {
        id: '1', email: 'a@b.com', nom: 'A', prenom: 'B',
        entreprises: [{ id: 'e1', nom: 'Ent', role: 'Admin' }],
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );
    const result = await authService.login({ email: 'a@b.com', password: 'pass' });
    expect(result.user.entreprise_id).toBe('e1');
  });
});

describe('AuthService - verifyAccount', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifyAccount succès', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    );
    const result = await authService.verifyAccount('token123');
    expect(result.message).toBe('ok');
  });

  it('verifyAccount erreur', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401 })
    );
    await expect(authService.verifyAccount('bad')).rejects.toThrow();
  });
});

describe('AuthService - resetPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resetPassword succès', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    );
    const result = await authService.resetPassword('token', 'newpass');
    expect(result.message).toBe('ok');
  });

  it('resetPassword token invalide', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401 })
    );
    await expect(authService.resetPassword('bad', 'pass')).rejects.toThrow('invalide');
  });

  it('resetPassword token déjà utilisé', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'token_already_used' }), { status: 409 })
    );
    await expect(authService.resetPassword('used', 'pass')).rejects.toThrow('déjà été utilisé');
  });

  it('resetPassword token expiré', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'token_expired' }), { status: 410 })
    );
    await expect(authService.resetPassword('expired', 'pass')).rejects.toThrow('expiré');
  });
});

describe('AuthService - requestPasswordReset', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requestPasswordReset succès', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok', email_sent: true }), { status: 200 })
    );
    const result = await authService.requestPasswordReset('test@test.com');
    expect(result.email_sent).toBe(true);
  });

  it('requestPasswordReset user_not_found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404 })
    );
    await expect(authService.requestPasswordReset('x@x.com')).rejects.toThrow('Aucun compte');
  });
});

describe('AuthService - resendVerificationEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resendVerification succès', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok', email_sent: true }), { status: 200 })
    );
    const result = await authService.resendVerificationEmail('a@b.com');
    expect(result.email_sent).toBe(true);
  });

  it('resendVerification erreur avec retry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'too_soon', retry_after_seconds: 60 }), { status: 429 })
    );
    try {
      await authService.resendVerificationEmail('a@b.com');
    } catch (e: any) {
      expect(e.retryAfterSeconds).toBe(60);
    }
  });
});

describe('AuthService - register', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('register email déjà existant', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'email_already_exists' }), { status: 409 })
    );
    await expect(
      authService.register({
        email: 'dup@test.com', password: 'pass', nom: 'A', prenom: 'B',
        entreprise_nom: 'Co', entreprise_adresse: 'Addr',
      })
    ).rejects.toThrow('existe déjà');
  });

  it('registerUser succès', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        message: 'ok', email_sent: true,
        user: { id: '1', email: 'a@b.com', nom: 'A', prenom: 'B', actif: false },
      }), { status: 200 })
    );
    const result = await authService.registerUser({
      email: 'a@b.com', password: 'pass', nom: 'A', prenom: 'B',
    });
    expect(result.email_sent).toBe(true);
  });

  it('registerUser email dupliqué', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'email_already_exists' }), { status: 409 })
    );
    await expect(
      authService.registerUser({ email: 'dup@test.com', password: 'p', nom: 'A', prenom: 'B' })
    ).rejects.toThrow('existe déjà');
  });
});

describe('AuthService - switchEntreprise', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('switchEntreprise sans token', async () => {
    await expect(authService.switchEntreprise('e1')).rejects.toThrow('Non authentifié');
  });

  it('switchEntreprise succès', async () => {
    authService.setToken('old-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'new-token', entreprise: { id: 'e1' } }), { status: 200 })
    );
    const result = await authService.switchEntreprise('e1');
    expect(result.access_token).toBe('new-token');
    expect(authService.getToken()).toBe('new-token');
  });
});
