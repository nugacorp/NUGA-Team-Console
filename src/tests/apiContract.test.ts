import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODE_CAPABILITIES } from '../config/appConfig';
import { createProviders } from '../providers';
import {
  ApiDecisionsProvider,
  ApiTasksProvider,
  HttpClient
} from '../providers/api';
import {
  parseBackendCapabilities,
  parseServerStatusContract,
  toDecisionActionRequest
} from '../providers/api/contracts';
import { checkServerHealth } from '../services/healthCheckService';
import { setApiCsrfToken } from '../auth/apiCsrf';

describe('NUGA API v1 staging boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setApiCsrfToken();
  });

  it('keeps CSRF in memory and attaches it only to mutations', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );
    setApiCsrfToken('csrf-in-memory');
    const client = new HttpClient({ baseUrl: '/api', mode: 'production' });

    await client.request('/api/v1/agents/director', {
      method: 'PATCH',
      body: JSON.stringify({ avatar: '' })
    });

    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(request.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-in-memory' });
    expect(localStorage.length).toBe(0);
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

  it('maps Hermes tasks and Supabase extensions into the visual task contract', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: 'task-9',
        board: 'nuga-team-lab',
        title: 'Validar integración',
        body: 'Comprobar el contrato real',
        assignee: 'nugacore',
        status: 'ready',
        priority: 2,
        createdAt: 1_788_000_000,
        source: 'hermes'
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        hermes_board_slug: 'nuga-team-lab',
        hermes_task_id: 'task-9',
        deadline: '2026-09-01T00:00:00Z',
        estimated_minutes: 90,
        plan: ['Validar CI']
      }]), { status: 200 }));

    const provider = new ApiTasksProvider(
      new HttpClient({ baseUrl: '/api', mode: 'staging' })
    );
    const result = await provider.getTasks();

    expect(result.status).toBe('success');
    expect(result.data?.[0]).toMatchObject({
      id: 'nuga-team-lab:task-9',
      projectId: 'nuga-team-lab',
      hermesBoard: 'nuga-team-lab',
      assignedAgent: 'nugacore',
      priority: 'alta',
      status: 'ready',
      estimatedHours: 1.5,
      deadline: '2026-09-01T00:00:00Z',
      plan: ['Validar CI'],
      dataSource: 'hermes',
      isDemo: false
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/v1/hermes/tasks');
    expect(fetchSpy.mock.calls[1][0]).toBe('/api/v1/console/task-extensions');
  });

  it('fails closed instead of rendering malformed Hermes tasks', async () => {
    vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce(new Response('[{"id":"missing-contract"}]', { status: 200 }))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    const result = await new ApiTasksProvider(
      new HttpClient({ baseUrl: '/api', mode: 'staging' })
    ).getTasks();

    expect(result.status).toBe('error');
    expect(result.data).toBeUndefined();
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
