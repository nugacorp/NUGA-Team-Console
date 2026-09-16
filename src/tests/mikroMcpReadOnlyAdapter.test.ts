import { describe, expect, it } from 'vitest';
import {
  MikroMcpReadOnlyAdapter,
  MikroMcpReadOnlyError
} from '../../server/mikroMcpReadOnlyAdapter';
import {
  ServerConfigurationError,
  loadServerConfig
} from '../../server/config';

const BASE_ENV = {
  NUGA_SERVER_MODE: 'staging',
  NUGA_PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
  NUGA_SESSION_SECRET: 'x'.repeat(32),
  NUGA_OWNER_USERNAME: 'ramiro',
  NUGA_OWNER_PASSWORD_HASH: 'scrypt-v1$test-only'
};

describe('MikroMCP read-only integration', () => {
  it('remains disabled by default and keeps the token server-side', () => {
    const config = loadServerConfig(BASE_ENV);
    expect(config.mikroMcpReadOnlyEnabled).toBe(false);
    expect(config.mikroMcpUrl).toBe('http://127.0.0.1:3000/mcp');
    expect(config.mikroMcpToken).toBe('');
  });

  it('rejects plaintext non-loopback endpoints and weak tokens when enabled', () => {
    expect(() => loadServerConfig({
      ...BASE_ENV,
      NUGA_MIKROMCP_READ_ONLY_ENABLED: 'true',
      NUGA_MIKROMCP_URL: 'http://10.0.0.10:3000/mcp',
      NUGA_MIKROMCP_TOKEN: 'x'.repeat(32)
    })).toThrow(ServerConfigurationError);

    expect(() => loadServerConfig({
      ...BASE_ENV,
      NUGA_MIKROMCP_READ_ONLY_ENABLED: 'true',
      NUGA_MIKROMCP_URL: 'http://127.0.0.1:3000/mcp',
      NUGA_MIKROMCP_TOKEN: 'too-short'
    })).toThrow(/32 caracteres/);

    expect(loadServerConfig({
      ...BASE_ENV,
      NUGA_MIKROMCP_READ_ONLY_ENABLED: 'true',
      NUGA_MIKROMCP_URL: 'http://127.0.0.1:3000/mcp',
      NUGA_MIKROMCP_TOKEN: 'x'.repeat(32)
    })).toMatchObject({
      mikroMcpReadOnlyEnabled: true,
      mikroMcpUrl: 'http://127.0.0.1:3000/mcp'
    });
  });

  it('maps authenticated read tools into the existing WISP router contract', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const token = 'server-only-token-that-is-long-enough';

    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      calls.push(body);
      expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${token}`);

      if (body.method === 'initialize') {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            serverInfo: { name: 'mikromcp', version: 'test' }
          }
        }), {
          headers: {
            'content-type': 'application/json',
            'mcp-session-id': 'test-session'
          }
        });
      }

      if (body.method === 'notifications/initialized') {
        return new Response(null, { status: 202 });
      }

      const params = body.params as Record<string, unknown>;
      const toolName = String(params.name);
      const structuredContent = toolName === 'list_routers'
        ? { routers: [{ id: 'core-01', rosVersion: '7.20.6', tags: ['lab'] }] }
        : toolName === 'check_router_health'
          ? {
              healthy: true,
              firmwareVersion: '7.20.6',
              uptime: '1d2h',
              cpuLoad: 12,
              totalMemory: 1_000,
              freeMemory: 400
            }
          : toolName === 'get_system_status'
            ? {
                identity: { name: 'CORE-01' },
                routerboard: { model: 'RB5009UG+S+' },
                resource: {
                  version: '7.20.6',
                  'cpu-load': 12,
                  'total-memory': 1_000,
                  'free-memory': 400,
                  'free-hdd-space': 104_857_600,
                  uptime: '1d2h'
                }
              }
            : toolName === 'list_interfaces'
              ? {
                  interfaces: [
                    { name: 'sfp-sfpplus1', type: 'ether', running: true },
                    { name: 'bridge1', type: 'bridge', running: true }
                  ]
                }
              : {};

      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: { structuredContent }
      }), { headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    const adapter = new MikroMcpReadOnlyAdapter({
      endpoint: 'http://127.0.0.1:3000/mcp',
      token,
      fetchImpl
    });

    const routers = await adapter.listWispRouters();
    expect(routers).toHaveLength(1);
    expect(routers[0]).toMatchObject({
      id: 'core-01',
      identity: 'CORE-01',
      model: 'RB5009UG+S+',
      routerOsVersion: '7.20.6',
      cpuPercent: 12,
      ramUsagePercent: 60,
      freeDiskMb: 100,
      status: 'optimal',
      isDemo: false
    });
    expect(routers[0].interfaces).toMatchObject([
      { name: 'sfp-sfpplus1', type: 'sfp', status: 'up' },
      { name: 'bridge1', type: 'bridge', status: 'up' }
    ]);
    expect(JSON.stringify(routers)).not.toContain(token);
    expect(calls.some(call => call.method === 'tools/call')).toBe(true);
  });

  it('rejects invalid router identifiers before making a network call', async () => {
    let called = false;
    const adapter = new MikroMcpReadOnlyAdapter({
      endpoint: 'http://127.0.0.1:3000/mcp',
      token: 'x'.repeat(32),
      fetchImpl: (async () => {
        called = true;
        throw new Error('should not run');
      }) as typeof fetch
    });

    await expect(adapter.getSystemStatus('../escape')).rejects.toMatchObject({
      code: 'DENIED'
    } satisfies Partial<MikroMcpReadOnlyError>);
    expect(called).toBe(false);
  });
});
