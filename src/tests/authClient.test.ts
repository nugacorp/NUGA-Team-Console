import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient, AuthClientError } from '../auth/authClient';

const owner = {
  id: 'owner:ramiro',
  name: 'Ramiro',
  email: '',
  role: 'owner' as const,
  title: 'Propietario',
  avatar: ''
};

describe('Frontend owner session client', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('restores the HttpOnly cookie session and keeps CSRF in the returned in-memory contract', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      ...owner,
      csrfToken: 'csrf-memory-only',
      sessionExpiresAt: '2030-01-01T00:00:00.000Z'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const session = await new AuthClient('/api', 'staging').restore();

    expect(session.user).toEqual(owner);
    expect(session.csrfToken).toBe('csrf-memory-only');
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({
      credentials: 'include',
      cache: 'no-store'
    }));
    expect(localStorage.length).toBe(0);
  });

  it('posts credentials only to the same-origin login endpoint', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      user: owner,
      csrfToken: 'csrf-login',
      expiresAt: '2030-01-01T00:00:00.000Z'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await new AuthClient('/api', 'staging').login('ramiro', 'temporary-test-password');

    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'ramiro', password: 'temporary-test-password' })
    }));
    expect(localStorage.length).toBe(0);
  });

  it('fails closed when the backend returns an incomplete session', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(owner), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await expect(new AuthClient('/api', 'staging').restore()).rejects.toMatchObject<AuthClientError>({
      failure: 'invalid_response'
    });
  });

  it('classifies a network failure as unavailable', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('offline'));

    await expect(new AuthClient('/api', 'staging').restore()).rejects.toMatchObject<AuthClientError>({
      failure: 'unavailable'
    });
  });
});
