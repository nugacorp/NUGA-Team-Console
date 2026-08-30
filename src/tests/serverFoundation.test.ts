import { afterEach, describe, expect, it } from 'vitest';
import { AddressInfo } from 'node:net';
import { createApp } from '../../server/app';
import {
  ServerConfigurationError,
  loadServerConfig,
  parseServerMode,
  ServerConfig
} from '../../server/config';

const activeServers: Array<ReturnType<ReturnType<typeof createApp>['listen']>> = [];

function testConfig(): ServerConfig {
  return {
    mode: 'staging',
    host: '127.0.0.1',
    port: 8787,
    publicOrigin: 'http://127.0.0.1:3000',
    sessionSecret: 'test-only-secret-with-at-least-32-characters'
  };
}

async function startTestServer() {
  const server = createApp(testConfig()).listen(0, '127.0.0.1');
  activeServers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
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
});

describe('NUGA Console API staging foundation', () => {
  it('requires an explicit server mode and a strong session secret', () => {
    expect(() => parseServerMode(undefined)).toThrow(ServerConfigurationError);
    expect(() => parseServerMode('demo')).toThrow(ServerConfigurationError);

    expect(() =>
      loadServerConfig({
        NUGA_SERVER_MODE: 'staging',
        NUGA_PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
        NUGA_SESSION_SECRET: 'short'
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

  it('reports Hermes resources as unavailable instead of fabricating data', async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/api/v1/tasks`, {
      headers: { 'x-nuga-mode': 'staging' }
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: 'HERMES_NOT_CONNECTED' }
    });
  });
});
