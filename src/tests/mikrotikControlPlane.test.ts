import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createSessionToken } from '../../server/auth';
import type { ServerConfig } from '../../server/config';
import {
  createMikrotikControlPlaneRouter,
  type MikroMcpDiagnosticsReader
} from '../../server/mikrotikControlPlaneRouter';
import {
  buildMikroTikRouterEnrollmentPlan,
  buildMikroTikTechnicalChangePlan,
  MIKROTIK_CONTROL_PLANE_POLICY,
  MikroTikControlPlaneValidationError
} from '../networkControl';

const config: ServerConfig = {
  mode: 'staging',
  host: '127.0.0.1',
  port: 8787,
  publicOrigin: 'http://127.0.0.1:3000',
  sessionSecret: 'session-secret-for-tests-0123456789abcdef',
  ownerUsername: 'ramiro',
  ownerPasswordHash: 'unused-in-this-router-test',
  hermesReadOnlyEnabled: false,
  hermesBinary: 'hermes',
  hermesBoards: [],
  mikroMcpReadOnlyEnabled: false,
  supabaseEnabled: false,
  supabaseUrl: '',
  supabaseSecretKey: '',
  supabaseSchema: 'nuga_console',
  aiWritingEnabled: false,
  minimaxPythonBinary: 'python3',
  hermesSourceDirectory: '/tmp/hermes',
  minimaxModel: 'MiniMax-M3'
};

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  })));
});

async function startRouter(mikroMcpAdapter?: MikroMcpDiagnosticsReader) {
  const app = express();
  app.use('/api/v1/wisp', createMikrotikControlPlaneRouter(config, { mikroMcpAdapter }));
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server did not expose a port');
  return `http://127.0.0.1:${address.port}`;
}

function sessionHeaders() {
  const { token, session } = createSessionToken(config.ownerUsername, config.sessionSecret);
  return {
    token,
    session,
    cookie: `nuga_session=${token}`
  };
}

describe('MikroTik technical control plane', () => {
  it('uses real production diagnostics and contains no simulation stage', () => {
    expect(MIKROTIK_CONTROL_PLANE_POLICY.architecture).toMatchObject({
      managementPath: 'single-edge-private-overlay',
      routerTransport: 'mikromcp',
      directPublicRouterAccess: false,
      credentialsInBrowser: false,
      aiRole: 'technical_advisory',
      productionDiagnostics: true,
      simulationEnabled: false
    });
    expect(MIKROTIK_CONTROL_PLANE_POLICY.workflow).toEqual([
      'observe', 'diagnose', 'plan', 'approve', 'execute', 'verify', 'rollback'
    ]);
    expect(MIKROTIK_CONTROL_PLANE_POLICY.workflow).not.toContain('simulate');
    expect(MIKROTIK_CONTROL_PLANE_POLICY.productBoundary).toEqual({
      crm: false,
      billing: false,
      subscriberLifecycle: false,
      commercialSuspension: false,
      paymentCollection: false,
      technicalOperations: true
    });
    expect(MIKROTIK_CONTROL_PLANE_POLICY.execution).toMatchObject({
      writesEnabled: false,
      humanApprovalRequired: true,
      currentStateEvidenceRequired: true,
      rollbackRequired: true
    });
    expect(MIKROTIK_CONTROL_PLANE_POLICY.technicalCapabilities).toEqual(expect.arrayContaining([
      'health',
      'routing_diagnostics',
      'anomaly_detection',
      'firewall_audit',
      'queue_diagnostics',
      'maintenance_planning'
    ]));
  });

  it('prepares RouterOS 7 private enrollment without commercial service metadata', () => {
    const plan = buildMikroTikRouterEnrollmentPlan({
      routerId: 'edge-01',
      displayName: 'Router de Borde',
      privateHost: '10.147.20.1',
      routerOsMajor: '7',
      managementInterface: 'mgmt-vlan',
      isEdgeRouter: true
    });

    expect(plan).toMatchObject({
      routerId: 'edge-01',
      privateHost: '10.147.20.1',
      routerOsMajor: '7',
      isEdgeRouter: true,
      risk: 'high',
      credentialsRequiredInPlan: false,
      executionAllowed: false
    });
    expect(JSON.stringify(plan)).not.toMatch(/billing|payment|suspend|reactivate/i);
  });

  it('rejects public management addresses and RouterOS 6 for MikroMCP production REST diagnostics', () => {
    expect(() => buildMikroTikRouterEnrollmentPlan({
      routerId: 'edge-01',
      displayName: 'Router de Borde',
      privateHost: '8.8.8.8',
      routerOsMajor: '7',
      isEdgeRouter: true
    })).toThrow(MikroTikControlPlaneValidationError);

    expect(() => buildMikroTikRouterEnrollmentPlan({
      routerId: 'edge-01',
      displayName: 'Router de Borde',
      privateHost: '192.168.88.1',
      routerOsMajor: '6',
      isEdgeRouter: true
    })).toThrow(/RouterOS 7/);
  });

  it('rejects malformed IPv4 and IPv6 management hosts instead of coercing them', () => {
    const malformedHosts = [
      '10.0.0.',
      '10.0..1',
      '10.0.+1.1',
      '10.0.0x1.1',
      'fd',
      'fd-not-an-address'
    ];

    for (const privateHost of malformedHosts) {
      expect(() => buildMikroTikRouterEnrollmentPlan({
        routerId: 'edge-01',
        displayName: 'Router de Borde',
        privateHost,
        routerOsMajor: '7',
        isEdgeRouter: true
      })).toThrow(MikroTikControlPlaneValidationError);
    }

    expect(() => buildMikroTikRouterEnrollmentPlan({
      routerId: 'edge-01',
      displayName: 'Router de Borde',
      privateHost: 'fd12:3456:789a::1',
      routerOsMajor: '7',
      isEdgeRouter: true
    })).not.toThrow();
  });

  it('builds deterministic technical change plans from current-state evidence without dry-run semantics', () => {
    const input = {
      routerId: 'core-01',
      category: 'routing' as const,
      objective: 'Corregir una ruta de respaldo degradada'
    };
    const plan = buildMikroTikTechnicalChangePlan(input);

    expect(plan).toMatchObject({
      routerId: 'core-01',
      category: 'routing',
      risk: 'high',
      requiresCurrentStateEvidence: true,
      requiresHumanApproval: true,
      executionAllowed: false,
      executionBinding: null
    });
    expect(JSON.stringify(plan)).not.toMatch(/dry[- ]?run|simulat/i);
    expect(plan.evidence.length).toBeGreaterThan(0);
    expect(plan.validation.length).toBeGreaterThan(0);
    expect(plan.rollback.length).toBeGreaterThan(0);
    expect(buildMikroTikTechnicalChangePlan(input).id).toBe(plan.id);
  });

  it('rejects unsafe technical plan identifiers and objectives', () => {
    expect(() => buildMikroTikTechnicalChangePlan({
      routerId: 'core-01; /system reboot',
      category: 'system',
      objective: 'Revisar recursos del router'
    })).toThrow(MikroTikControlPlaneValidationError);

    expect(() => buildMikroTikTechnicalChangePlan({
      routerId: 'core-01',
      category: 'system',
      objective: '/system reboot\n:delay 1'
    })).toThrow(MikroTikControlPlaneValidationError);
  });

  it('requires owner session and returns 503 until the real MikroMCP production adapter is connected', async () => {
    const baseUrl = await startRouter();
    const unauthorized = await fetch(`${baseUrl}/api/v1/wisp/inventory`, {
      headers: { 'x-nuga-mode': 'staging' }
    });
    expect(unauthorized.status).toBe(401);

    const { cookie } = sessionHeaders();
    const unavailable = await fetch(`${baseUrl}/api/v1/wisp/inventory`, {
      headers: { cookie, 'x-nuga-mode': 'staging' }
    });
    expect(unavailable.status).toBe(503);
  });

  it('serves real diagnostic reader results through the authenticated WISP API', async () => {
    const reader: MikroMcpDiagnosticsReader = {
      async listRouters() { return [{ id: 'edge-01', rosVersion: '7.20.6', tags: ['prod'] }]; },
      async checkRouterHealth() { return { healthy: true, cpuLoad: 17 }; },
      async getSystemStatus() { return { identity: { name: 'EDGE-01' } }; },
      async listInterfaces() { return [{ name: 'sfp-sfpplus1', running: true }]; },
      async listRoutes() { return [{ 'dst-address': '0.0.0.0/0', gateway: '10.0.0.1', active: true }]; },
      async getRouterDiagnostics(routerId) {
        return {
          routerId,
          source: 'mikromcp_production',
          status: 'optimal',
          partial: false,
          findings: []
        };
      }
    };
    const baseUrl = await startRouter(reader);
    const { cookie } = sessionHeaders();

    const inventory = await fetch(`${baseUrl}/api/v1/wisp/inventory`, {
      headers: { cookie, 'x-nuga-mode': 'staging' }
    });
    expect(inventory.status).toBe(200);
    await expect(inventory.json()).resolves.toEqual([
      expect.objectContaining({ id: 'edge-01', rosVersion: '7.20.6' })
    ]);

    const routes = await fetch(`${baseUrl}/api/v1/wisp/routers/edge-01/routes`, {
      headers: { cookie, 'x-nuga-mode': 'staging' }
    });
    expect(routes.status).toBe(200);
    await expect(routes.json()).resolves.toEqual([
      expect.objectContaining({ gateway: '10.0.0.1', active: true })
    ]);

    const diagnostics = await fetch(`${baseUrl}/api/v1/wisp/routers/edge-01/diagnostics`, {
      headers: { cookie, 'x-nuga-mode': 'staging' }
    });
    expect(diagnostics.status).toBe(200);
    await expect(diagnostics.json()).resolves.toMatchObject({
      routerId: 'edge-01',
      source: 'mikromcp_production',
      status: 'optimal'
    });
  });

  it('requires CSRF for technical planning API', async () => {
    const baseUrl = await startRouter();
    const { cookie, session } = sessionHeaders();

    const policy = await fetch(`${baseUrl}/api/v1/wisp/control-plane`, {
      headers: { cookie, 'x-nuga-mode': 'staging' }
    });
    expect(policy.status).toBe(200);
    await expect(policy.json()).resolves.toMatchObject({
      architecture: { productionDiagnostics: true, simulationEnabled: false },
      productBoundary: { crm: false, billing: false, technicalOperations: true },
      execution: { writesEnabled: false }
    });

    const denied = await fetch(`${baseUrl}/api/v1/wisp/technical-changes/plan`, {
      method: 'POST',
      headers: {
        cookie,
        origin: config.publicOrigin,
        'content-type': 'application/json',
        'x-nuga-mode': 'staging'
      },
      body: JSON.stringify({
        routerId: 'core-01',
        category: 'routing',
        objective: 'Revisar ruta de respaldo degradada'
      })
    });
    expect(denied.status).toBe(403);

    const accepted = await fetch(`${baseUrl}/api/v1/wisp/technical-changes/plan`, {
      method: 'POST',
      headers: {
        cookie,
        origin: config.publicOrigin,
        'content-type': 'application/json',
        'x-nuga-mode': 'staging',
        'x-csrf-token': session.csrfToken
      },
      body: JSON.stringify({
        routerId: 'core-01',
        category: 'firewall',
        objective: 'Auditar una regla con alcance inesperado'
      })
    });
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toMatchObject({
      executionAllowed: false,
      requiresHumanApproval: true,
      requiresCurrentStateEvidence: true,
      category: 'firewall'
    });
  });

  it('requires an explicit boolean isEdgeRouter in enrollment requests', async () => {
    const baseUrl = await startRouter();
    const { cookie, session } = sessionHeaders();
    const headers = {
      cookie,
      origin: config.publicOrigin,
      'content-type': 'application/json',
      'x-nuga-mode': 'staging',
      'x-csrf-token': session.csrfToken
    };
    const enrollment = {
      routerId: 'edge-01',
      displayName: 'Router de Borde',
      privateHost: '10.147.20.1',
      routerOsMajor: '7'
    };

    for (const isEdgeRouter of [undefined, 'false', 0, null]) {
      const body = isEdgeRouter === undefined
        ? enrollment
        : { ...enrollment, isEdgeRouter };
      const response = await fetch(`${baseUrl}/api/v1/wisp/routers/enrollment/plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      expect(response.status).toBe(400);
    }

    const accepted = await fetch(`${baseUrl}/api/v1/wisp/routers/enrollment/plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...enrollment, isEdgeRouter: false })
    });
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toMatchObject({
      routerId: 'edge-01',
      isEdgeRouter: false,
      executionAllowed: false
    });
  });

  it('returns 400 when enrollment JSON is missing or not parsed', async () => {
    const baseUrl = await startRouter();
    const { cookie, session } = sessionHeaders();
    const headers = {
      cookie,
      origin: config.publicOrigin,
      'x-nuga-mode': 'staging',
      'x-csrf-token': session.csrfToken
    };

    const noBody = await fetch(`${baseUrl}/api/v1/wisp/routers/enrollment/plan`, {
      method: 'POST',
      headers
    });
    expect(noBody.status).toBe(400);
    await expect(noBody.json()).resolves.toMatchObject({
      error: {
        code: 'INVALID_MIKROTIK_ENROLLMENT_PLAN'
      }
    });

    const unsupportedContentType = await fetch(`${baseUrl}/api/v1/wisp/routers/enrollment/plan`, {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'text/plain'
      },
      body: JSON.stringify({
        routerId: 'edge-01',
        displayName: 'Router de Borde',
        privateHost: '10.147.20.1',
        routerOsMajor: '7'
      })
    });
    expect(unsupportedContentType.status).toBe(400);
    await expect(unsupportedContentType.json()).resolves.toMatchObject({
      error: {
        code: 'INVALID_MIKROTIK_ENROLLMENT_PLAN'
      }
    });
  });
});
