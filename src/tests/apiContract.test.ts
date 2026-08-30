import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODE_CAPABILITIES } from '../config/appConfig';
import { createProviders } from '../providers';
import {
  ApiDecisionsProvider,
  HttpClient
} from '../providers/api';
import {
  parseBackendCapabilities,
  parseServerStatusContract,
  toDecisionActionRequest
} from '../providers/api/contracts';
import { checkServerHealth } from '../services/healthCheckService';

describe('NUGA API v1 staging boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps DEMO providers and health checks completely offline', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    const providers = createProviders('demo', {
      mode: 'demo',
      apiUrl: '/api',
      isDemo: true,
      isStaging: false,
      isProduction: false,
      capabilities: DEFAULT_MODE_CAPABILITIES.demo
    });

    await providers.tasks.getTasks();
    await providers.configuration.getServerStatus();
    await checkServerHealth('demo', '/api');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses same-origin session cookies and explicit mode headers for staging', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => []
    } as Response);

    const client = new HttpClient({ baseUrl: '/api', mode: 'staging' });
    await client.request('/api/v1/tasks');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/tasks',
      expect.objectContaining({
        credentials: 'include',
        cache: 'no-store',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Nuga-Mode': 'staging'
        })
      })
    );
  });

  it('never includes the typed confirmation phrase in a remote decision payload', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'decision-1' })
    } as Response);

    const provider = new ApiDecisionsProvider(
      new HttpClient({ baseUrl: '/api', mode: 'staging' })
    );

    await provider.executeDecisionAction(
      'decision-1',
      'approve',
      'Aprobado por Ramiro',
      'APROBAR DEC-001'
    );

    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    const body = String(request.body);

    expect(body).not.toContain('APROBAR DEC-001');
    expect(JSON.parse(body)).toEqual({
      action: 'approve',
      comment: 'Aprobado por Ramiro',
      confirmationVerified: true
    });
  });

  it('validates server status and capability contracts at runtime', () => {
    expect(parseServerStatusContract({
      mode: 'staging',
      source: 'server',
      hermes: 'available',
      writesEnabled: false,
      integrations: { nugacore: true, mikromcp: false, google: false }
    })).not.toBeNull();

    expect(parseServerStatusContract({
      mode: 'production',
      source: 'server',
      hermes: 'available',
      writesEnabled: 'yes',
      integrations: {}
    })).toBeNull();

    expect(parseBackendCapabilities({
      canReadRealData: true,
      canRequestDryRun: true,
      canSubmitApproval: true,
      canExecuteAuthorizedOperation: false
    })).not.toBeNull();

    expect(parseBackendCapabilities({
      canReadRealData: true,
      canRequestDryRun: true
    })).toBeNull();
  });

  it('fails closed when the status endpoint returns a malformed contract', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ mode: 'staging', hermes: 'available' })
    } as Response);

    const health = await checkServerHealth('staging', '/api');

    expect(health.status).toBe('unavailable');
    expect(health.serverContract.hermes).toBe('unavailable');
    expect(health.message).toContain('contrato');
  });

  it('builds a non-sensitive decision action DTO', () => {
    const dto = toDecisionActionRequest(
      'approve',
      '  Validado  ',
      'APROBAR DEC-999'
    );

    expect(dto).toEqual({
      action: 'approve',
      comment: 'Validado',
      confirmationVerified: true
    });
    expect(JSON.stringify(dto)).not.toContain('DEC-999');
  });
});
