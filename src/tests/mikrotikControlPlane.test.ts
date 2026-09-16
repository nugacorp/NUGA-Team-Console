import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createSessionToken } from '../../server/auth';
import type { ServerConfig } from '../../server/config';
import { createMikrotikControlPlaneRouter } from '../../server/mikrotikControlPlaneRouter';
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

async function startRouter() {
  const app = express();
  app.use('/api/v1/wisp', createMikrotikControlPlaneRouter(config));
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server did not expose a port');
  return `http://127.0.0.1:${address.port}`;
}

describe('MikroTik technical control plane', () => {
  it('keeps CRM and subscriber lifecycle explicitly outside its scope', () => {
    expect(MIKROTIK_CONTROL_PLANE_POLICY.architecture).toMatchObject({
      managementPath: 'single-edge-private-overlay',
      routerTransport: 'mikromcp',
      directPublicRouterAccess: false,
      credentialsInBrowser: false,
      aiRole: 'technical_advisory'
    });
    expect(MIKROTIK_CONTROL_PLANE_POLICY.productBoundary).toEqual({
      crm: false,
      billing: false,
      subscriberLifecycle: false,
      commercialSuspension: false,
      paymentCollection: false,
      technicalOperations: true
    });
    expect(MIKROTIK_CONTROL_PLANE_POLICY.execution).toMatchObject({
      enabled: false,
      dryRunRequired: true,
      humanApprovalRequired: true,
      rollbackRequired: true
    });
    expect(MIKROTIK_CONTROL_PLANE_POLICY.technicalCapabilities).toEqual(expect.arrayContaining([
      'health',
      'routing_diagnostics',
      'firewall_audit',
      'queue_diagnostics',
      'maintenance_planning'
    ]));
  });

  it('prepares private router enrollment without commercial service metadata', () => {
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

  it('rejects public router management addresses', () => {
    expect(() => buildMikroTikRouterEnrollmentPlan({
      routerId: 'edge-01',
      displayName: 'Router de Borde',
      privateHost: '8.8.8.8',
      routerOsMajor: '7',
      isEdgeRouter: true
    })).toThrow(MikroTikControlPlaneValidationError);
  });

  it('builds deterministic non-executable technical change plans with rollback', () => {
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
      requiresDryRun: true,
      requiresHumanApproval: true,
      executionAllowed: false,
      executionBinding: null
    });
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

  it('requires owner session and CSRF for technical planning API', async () => {
    const baseUrl = await startRouter();

    const unauthorized = await fetch(`${baseUrl}/api/v1/wisp/control-plane`, {
      headers: { 'x-nuga-mode': 'staging' }
    });
    expect(unauthorized.status).toBe(401);

    const { token, session } = createSessionToken(config.ownerUsername, config.sessionSecret);
    const cookie = `nuga_session=${token}`;

    const policy = await fetch(`${baseUrl}/api/v1/wisp/control-plane`, {
      headers: { cookie, 'x-nuga-mode': 'staging' }
    });
    expect(policy.status).toBe(200);
    await expect(policy.json()).resolves.toMatchObject({
      productBoundary: { crm: false, billing: false, technicalOperations: true },
      execution: { enabled: false }
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

    const enrollment = await fetch(`${baseUrl}/api/v1/wisp/routers/enrollment/plan`, {
      method: 'POST',
      headers: {
        cookie,
        origin: config.publicOrigin,
        'content-type': 'application/json',
        'x-nuga-mode': 'staging',
        'x-csrf-token': session.csrfToken
      },
      body: JSON.stringify({
        routerId: 'edge-01',
        displayName: 'Router de Borde',
        privateHost: '192.168.88.1',
        routerOsMajor: '7',
        isEdgeRouter: true
      })
    });
    expect(enrollment.status).toBe(200);
    await expect(enrollment.json()).resolves.toMatchObject({
      executionAllowed: false,
      credentialsRequiredInPlan: false,
      isEdgeRouter: true
    });

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
      category: 'firewall'
    });
  });
});
