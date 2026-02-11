import { describe, it, expect, beforeEach, vi } from 'vitest';
import { capteurService } from '@/lib/services/capteurService';

describe('CapteurService - associateCapteur', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('associe un capteur avec succes', async () => {
    localStorage.setItem('access_token', 'test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'c1', type: 'Poids' }), { status: 200 })
    );

    const result = await capteurService.associateCapteur({
      ruche_id: 'r1',
      type: 'Poids',
      identifiant: 'CAP-001',
    });

    expect(result.id).toBe('c1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/capteurs/associate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('lance une erreur 409 capteur deja existant', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'capteur_already_exists' }), { status: 409 })
    );

    await expect(
      capteurService.associateCapteur({
        ruche_id: 'r1',
        type: 'Poids',
        identifiant: 'CAP-001',
      })
    ).rejects.toThrow('déjà associé');
  });

  it('lance une erreur generique', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'server error' }), { status: 500 })
    );

    await expect(
      capteurService.associateCapteur({
        ruche_id: 'r1',
        type: 'Poids',
        identifiant: 'CAP-001',
      })
    ).rejects.toThrow('server error');
  });
});

describe('CapteurService - deleteCapteur', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('supprime un capteur avec succes', async () => {
    localStorage.setItem('access_token', 'test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );

    await expect(capteurService.deleteCapteur('c1')).resolves.toBeUndefined();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/capteurs/c1/delete'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('lance une erreur en cas d\'echec', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'not_found' }), { status: 404 })
    );

    await expect(capteurService.deleteCapteur('c1')).rejects.toThrow('not_found');
  });
});

describe('CapteurService - activateGpsAlert', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('active l\'alerte GPS avec succes', async () => {
    localStorage.setItem('access_token', 'test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'active' }), { status: 200 })
    );

    const result = await capteurService.activateGpsAlert('c1', 200);
    expect(result.status).toBe('active');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/capteurs/c1/gps-alert/activate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('lance une erreur si position GPS indisponible', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'gps_position_unavailable' }), { status: 400 })
    );

    await expect(capteurService.activateGpsAlert('c1')).rejects.toThrow('Position GPS indisponible');
  });

  it('lance une erreur generique', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'internal error' }), { status: 500 })
    );

    await expect(capteurService.activateGpsAlert('c1')).rejects.toThrow('internal error');
  });
});

describe('CapteurService - deactivateGpsAlert', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('desactive l\'alerte GPS avec succes', async () => {
    localStorage.setItem('access_token', 'test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'inactive' }), { status: 200 })
    );

    const result = await capteurService.deactivateGpsAlert('c1');
    expect(result.status).toBe('inactive');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/capteurs/c1/gps-alert/deactivate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('lance une erreur en cas d\'echec', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
    );

    await expect(capteurService.deactivateGpsAlert('c1')).rejects.toThrow('server_error');
  });
});
