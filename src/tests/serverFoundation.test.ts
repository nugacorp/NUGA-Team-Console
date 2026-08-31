import { afterEach, describe, expect, it } from 'vitest';
import { AddressInfo } from 'node:net';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppDependencies, createApp } from '../../server/app';
import { createPasswordHash } from '../../server/auth';
import {
  ServerConfigurationError,
  loadServerConfig,
  parseServerMode,
  ServerConfig
} from '../../server/config';

const TEST_PASSWORD = 'correct-horse-battery-staging';
const TEST_HASH = createPasswordHash(TEST_PASSWORD, Buffer.alloc(16, 7));
const activeServers: Array<ReturnType<ReturnType<typeof createApp>['listen']>> = [];
const temporaryDirectories: string[] = [];

function testConfig(): ServerConfig {
  return {
    mode: 'staging',
    host: '127.0.0.1',
    port: 8787,
    publicOrigin: 'http://127.0.0.1:3000',
    sessionSecret: 'test-only-secret-with-at-least-32-characters',
    ownerUsername: 'ramiro',
    ownerPasswordHash: TEST_HASH,
    hermesReadOnlyEnabled: false,
    hermesBinary: '/test/hermes',
    hermesBoards: [],
    supabaseEnabled: false,
    supabaseUrl: '',
    supabaseSecretKey: ''
  };
}

async function startTestServer(dependencies: AppDependencies = {}) {
  const server = createApp(testConfig(), dependencies).listen(0, '127.0.0.1');
  activeServers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function login(baseUrl: string, password = TEST_PASSWORD) {
  return fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://127.0.0.1:3000',
      'x-nuga-mode': 'staging'
    },
    body: JSON.stringify({ username: 'ramiro', password })
  });
}

afterEach(async () => {
  await Promise.all(
    activeServers.splice(0).map(
      server =>
        new Promise<void>(resolve => {
          server.close(() => resolve());
        })
    )
  );
  temporaryDirectories.splice(0).forEach(directory => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe('NUGA Console API staging foundation', () => {
  it('requires explicit mode, owner credentials and a strong session secret', () => {
    expect(() => parseServerMode(undefined)).toThrow(ServerConfigurationError);
    expect(() => parseServerMode('demo')).toThrow(ServerConfigurationError);

    expect(() =>
      loadServerConfig({
        NUGA_SERVER_MODE: 'staging',
        NUGA_PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
        NUGA_SESSION_SECRET: 'short',
        NUGA_OWNER_USERNAME: 'ramiro',
        NUGA_OWNER_PASSWORD_HASH: TEST_HASH
      })
    ).toThrow(ServerConfigurationError);
  });

  it('serves a fail-closed staging status without integrations', async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/api/v1/status`, {
      headers: { 'x-nuga-mode': 'staging' }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mode: 'staging',
      source: 'server',
      hermes: 'unavailable',
      writesEnabled: false,
      integrations: {
        nugacore: false,
        mikromcp: false,
        google: false
      }
    });
  });

  it('rejects requests when frontend and backend modes differ', async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/api/v1/status`, {
      headers: { 'x-nuga-mode': 'production' }
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'MODE_MISMATCH' }
    });
  });

  it('creates a signed HttpOnly owner session without returning a password', async () => {
    const baseUrl = await startTestServer();
    const response = await login(baseUrl);

    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('nuga_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');

    const body = await response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      user: { id: 'owner:ramiro', role: 'owner', name: 'Ramiro' }
    });
    expect(typeof body.csrfToken).toBe('string');
    expect(JSON.stringify(body)).not.toContain(TEST_PASSWORD);
    expect(JSON.stringify(body)).not.toContain(TEST_HASH);
  });

  it('rejects an invalid password without creating a cookie', async () => {
    const baseUrl = await startTestServer();
    const response = await login(baseUrl, 'incorrect-password');

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('protects owner and Hermes resources behind the signed session', async () => {
    const baseUrl = await startTestServer();

    const anonymous = await fetch(`${baseUrl}/api/v1/tasks`, {
      headers: { 'x-nuga-mode': 'staging' }
    });
    expect(anonymous.status).toBe(401);

    const loginResponse = await login(baseUrl);
    const cookie = loginResponse.headers.get('set-cookie') ?? '';

    const me = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        cookie,
        'x-nuga-mode': 'staging'
      }
    });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      id: 'owner:ramiro',
      role: 'owner'
    });

    const tasks = await fetch(`${baseUrl}/api/v1/tasks`, {
      headers: {
        cookie,
        'x-nuga-mode': 'staging'
      }
    });
    expect(tasks.status).toBe(503);
    expect(await tasks.json()).toMatchObject({
      error: { code: 'HERMES_NOT_CONNECTED' }
    });
  });

  it('requires the session CSRF token to log out', async () => {
    const baseUrl = await startTestServer();
    const loginResponse = await login(baseUrl);
    const cookie = loginResponse.headers.get('set-cookie') ?? '';
    const loginBody = await loginResponse.json() as { csrfToken: string };

    const denied = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        cookie,
        origin: 'http://127.0.0.1:3000',
        'x-nuga-mode': 'staging'
      }
    });
    expect(denied.status).toBe(403);

    const accepted = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        cookie,
        origin: 'http://127.0.0.1:3000',
        'x-csrf-token': loginBody.csrfToken,
        'x-nuga-mode': 'staging'
      }
    });
    expect(accepted.status).toBe(204);
    expect(accepted.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('serves the staging frontend and keeps API failures as JSON', async () => {
    const frontendDirectory = mkdtempSync(join(tmpdir(), 'nuga-frontend-'));
    temporaryDirectories.push(frontendDirectory);
    mkdirSync(join(frontendDirectory, 'assets'));
    writeFileSync(join(frontendDirectory, 'index.html'), '<!doctype html><title>NUGA staging</title>');
    writeFileSync(join(frontendDirectory, 'assets', 'app.js'), 'globalThis.__NUGA__ = true;');

    const baseUrl = await startTestServer({ frontendDirectory });
    const root = await fetch(`${baseUrl}/`);
    const spa = await fetch(`${baseUrl}/tareas`);
    const asset = await fetch(`${baseUrl}/assets/app.js`);
    const missingApi = await fetch(`${baseUrl}/api/v1/not-real`, {
      headers: { 'x-nuga-mode': 'staging' }
    });

    expect(root.status).toBe(200);
    expect(await root.text()).toContain('NUGA staging');
    expect(root.headers.get('content-security-policy')).toContain("connect-src 'self'");
    expect(root.headers.get('x-frame-options')).toBe('DENY');
    expect(spa.status).toBe(200);
    expect(await spa.text()).toContain('NUGA staging');
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain('__NUGA__');
    expect(missingApi.status).toBe(404);
    expect(missingApi.headers.get('content-type')).toContain('application/json');
    expect(await missingApi.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
