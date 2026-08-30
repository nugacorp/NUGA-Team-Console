import { AppMode, User } from '../types';

export interface AuthSession {
  user: User;
  csrfToken: string;
  expiresAt: string;
}

export type AuthFailure = 'unauthorized' | 'unavailable' | 'invalid_response' | 'error';

export class AuthClientError extends Error {
  constructor(message: string, public readonly failure: AuthFailure) {
    super(message);
    this.name = 'AuthClientError';
  }
}

function apiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = normalizedBase.endsWith('/api') && path.startsWith('/api/')
    ? path.slice('/api'.length)
    : path;
  return `${normalizedBase}${normalizedPath}`;
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<User>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && candidate.role === 'owner';
}

function parseSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const user = body.user ?? body;
  const csrfToken = body.csrfToken;
  const expiresAt = body.expiresAt ?? body.sessionExpiresAt;

  if (!isUser(user) || typeof csrfToken !== 'string' || typeof expiresAt !== 'string') {
    return null;
  }

  return { user, csrfToken, expiresAt };
}

export class AuthClient {
  constructor(private readonly baseUrl: string, private readonly mode: AppMode) {}

  private async request(path: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(apiUrl(this.baseUrl, path), {
        ...init,
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Nuga-Mode': this.mode,
          ...(init?.headers ?? {})
        }
      });
    } catch {
      throw new AuthClientError('No fue posible conectar con NUGA Console API.', 'unavailable');
    }
  }

  private async requireSession(response: Response): Promise<AuthSession> {
    if (response.status === 401 || response.status === 403) {
      throw new AuthClientError('La sesión no es válida o las credenciales son incorrectas.', 'unauthorized');
    }
    if (!response.ok) {
      throw new AuthClientError(`El servidor respondió con HTTP ${response.status}.`, 'error');
    }

    const session = parseSession(await response.json().catch(() => null));
    if (!session || Number.isNaN(Date.parse(session.expiresAt))) {
      throw new AuthClientError('El servidor devolvió una sesión incompleta.', 'invalid_response');
    }
    return session;
  }

  async restore(): Promise<AuthSession> {
    return this.requireSession(await this.request('/api/v1/auth/me'));
  }

  async login(username: string, password: string): Promise<AuthSession> {
    return this.requireSession(await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }));
  }

  async logout(csrfToken: string): Promise<void> {
    const response = await this.request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken }
    });
    if (!response.ok && response.status !== 401) {
      throw new AuthClientError(`No fue posible cerrar la sesión (HTTP ${response.status}).`, 'error');
    }
  }
}
