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

function productionReadFetch(token: string, overrides: Record<string, unknown> = {}) {
  const calls: Array<Record<string, unknown>> = [];
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
    const structuredContent = toolName in overrides
      ? overrides[toolName]
      : toolName === 'list_routers'
        ? { routers: [{ id: 'core-01', rosVersion: '7.20.6', tags: ['prod'] }] }
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
                    { name: 'sfp-sfpplus1', type: 'ether', running: true, disabled: false },
                    { name: 'bridge1', type: 'bridge', running: true, disabled: false }
                  ]
                }
              : toolName === 'list_routes'
                ? {
                    routes: [
                      {
                        'dst-address': '0.0.0.0/0',
                        gateway: '10.10.10.1',
                        active: true,
                        static: true,
                        protocol: 'static'
                      },
                      {
                        'dst-address': '10.20.0.0/16',
                        gateway: '10.10.10.2',
                        active: true,
                        protocol: 'ospf'
                      }
                    ]
                  }
                : {};

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id,
      result: { structuredContent }
    }), { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  return { fetchImpl, calls };
}

describe('MikroMCP production read integration', () => {
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

  it('maps authenticated production reads including routes into the WISP router contract', async () => {
    const token = 'server-only-token-that-is-long-enough';
    const { fetchImpl, calls } = productionReadFetch(token);
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
      routeSummary: {
        total: 2,
        static: 1,
        ospf: 1,
        defaultGateway: '10.10.10.1'
      },
      isDemo: false
    });
    expect(routers[0].interfaces).toMatchObject([
      { name: 'sfp-sfpplus1', type: 'sfp', status: 'up' },
      { name: 'bridge1', type: 'bridge', status: 'up' }
    ]);
    expect(JSON.stringify(routers)).not.toContain(token);
    expect(calls.some(call => {
      const params = call.params as Record<string, unknown> | undefined;
      return params?.name === 'list_routes';
    })).toBe(true);
  });

  it('produces evidence-based production diagnostics without simulation', async () => {
    const token = 'server-only-token-that-is-long-enough';
    const { fetchImpl } = productionReadFetch(token);
    const adapter = new MikroMcpReadOnlyAdapter({
      endpoint: 'http://127.0.0.1:3000/mcp',
      token,
      fetchImpl
    });

    const diagnostics = await adapter.getRouterDiagnostics('core-01');
    expect(diagnostics).toMatchObject({
      routerId: 'core-01',
      source: 'mikromcp_production',
      status: 'optimal',
      partial: false,
      health: {
        healthy: true,
        cpuPercent: 12,
        ramUsagePercent: 60,
        routerOsVersion: '7.20.6'
      },
      interfaces: { total: 2, up: 2, down: 0, disabled: 0 },
      routing: {
        total: 2,
        active: 2,
        static: 1,
        ospf: 1,
        activeDefaultRoutes: 1
      }
    });
    expect(diagnostics.findings).toEqual([]);
    expect(JSON.stringify(diagnostics)).not.toMatch(/dry[- ]?run|simulat/i);
  });

  it('flags real resource and routing anomalies from observed MikroMCP values', async () => {
    const token = 'server-only-token-that-is-long-enough';
    const { fetchImpl } = productionReadFetch(token, {
      check_router_health: {
        healthy: false,
        firmwareVersion: '7.20.6',
        uptime: '2h',
        cpuLoad: 97,
        totalMemory: 1000,
        freeMemory: 20
      },
      get_system_status: {
        identity: { name: 'CORE-01' },
        resource: {
          version: '7.20.6',
          'cpu-load': 97,
          'total-memory': 1000,
          'free-memory': 20,
          uptime: '2h'
        }
      },
      list_interfaces: {
        interfaces: [
          { name: 'ether1', type: 'ether', running: false, disabled: false },
          { name: 'ether2', type: 'ether', running: false, disabled: true }
        ]
      },
      list_routes: { routes: [] }
    });
    const adapter = new MikroMcpReadOnlyAdapter({
      endpoint: 'http://127.0.0.1:3000/mcp',
      token,
      fetchImpl
    });

    const diagnostics = await adapter.getRouterDiagnostics('core-01');
    expect(diagnostics.status).toBe('critical');
    expect(diagnostics.interfaces).toEqual({ total: 2, up: 0, down: 1, disabled: 1 });
    expect(diagnostics.findings.map(finding => finding.code)).toEqual(expect.arrayContaining([
      'ROUTER_UNHEALTHY',
      'CPU_CRITICAL',
      'MEMORY_CRITICAL',
      'INTERFACES_DOWN',
      'ROUTING_EMPTY'
    ]));
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
