import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateAndResolveAppMode,
  assertSafeModeActivation,
  validateModeCompatibility,
  DEFAULT_MODE_CAPABILITIES,
  ConfigurationError
} from '../config/appConfig';
import { createProviders } from '../providers';
import { DemoTasksProvider, DemoDecisionsProvider } from '../providers/demo';
import { ApiTasksProvider, ApiDecisionsProvider, HttpClient } from '../providers/api';
import { checkServerHealth } from '../services/healthCheckService';
import { ServerStatusContract } from '../types';

describe('Architecture of Interchangeable Modes (demo, staging, production)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Mode Validation & Fail-Closed Logic', () => {
    it('defaults safely to "demo" when environment mode is undefined or empty', () => {
      expect(validateAndResolveAppMode(undefined)).toBe('demo');
      expect(validateAndResolveAppMode(null)).toBe('demo');
      expect(validateAndResolveAppMode('')).toBe('demo');
      expect(validateAndResolveAppMode('   ')).toBe('demo');
    });

    it('resolves valid modes correctly: demo, staging, production', () => {
      expect(validateAndResolveAppMode('demo')).toBe('demo');
      expect(validateAndResolveAppMode('DEMO')).toBe('demo');
      expect(validateAndResolveAppMode('staging')).toBe('staging');
      expect(validateAndResolveAppMode('STAGING')).toBe('staging');
      expect(validateAndResolveAppMode('production')).toBe('production');
      expect(validateAndResolveAppMode('PRODUCTION')).toBe('production');
    });

    it('fails closed and throws ConfigurationError on unknown or malicious mode values without assuming production', () => {
      expect(() => validateAndResolveAppMode('dev')).toThrow(ConfigurationError);
      expect(() => validateAndResolveAppMode('test')).toThrow(ConfigurationError);
      expect(() => validateAndResolveAppMode('local_admin')).toThrow(ConfigurationError);
      expect(() => validateAndResolveAppMode('production_bypass')).toThrow(ConfigurationError);
    });

    it('blocks activation of production from user UI or client storage', () => {
      expect(() => assertSafeModeActivation('production', 'user_ui')).toThrow(ConfigurationError);
      expect(assertSafeModeActivation('demo', 'user_ui')).toBe('demo');
      expect(assertSafeModeActivation('production', 'env')).toBe('production');
    });
  });

  describe('2. Provider Factory (createProviders)', () => {
    it('creates DemoProviders when appMode is "demo"', () => {
      const providers = createProviders('demo', {
        mode: 'demo',
        apiUrl: 'http://localhost:3000',
        isDemo: true,
        isStaging: false,
        isProduction: false,
        capabilities: DEFAULT_MODE_CAPABILITIES.demo
      });

      expect(providers.tasks).toBeInstanceOf(DemoTasksProvider);
      expect(providers.decisions).toBeInstanceOf(DemoDecisionsProvider);
    });

    it('creates ApiProviders when appMode is "staging" or "production"', () => {
      const stagingProviders = createProviders('staging', {
        mode: 'staging',
        apiUrl: 'https://staging.api.nuga',
        isDemo: false,
        isStaging: true,
        isProduction: false,
        capabilities: DEFAULT_MODE_CAPABILITIES.staging
      });

      expect(stagingProviders.tasks).toBeInstanceOf(ApiTasksProvider);
      expect(stagingProviders.decisions).toBeInstanceOf(ApiDecisionsProvider);

      const prodProviders = createProviders('production', {
        mode: 'production',
        apiUrl: 'https://api.nuga.corp',
        isDemo: false,
        isStaging: false,
        isProduction: true,
        capabilities: DEFAULT_MODE_CAPABILITIES.production
      });

      expect(prodProviders.tasks).toBeInstanceOf(ApiTasksProvider);
      expect(prodProviders.decisions).toBeInstanceOf(ApiDecisionsProvider);
    });

    it('fails when an unsupported mode is passed to createProviders', () => {
      expect(() => createProviders('unknown' as any, {} as any)).toThrow();
    });
  });

  describe('3. Demo Provider Invariant: All entities tagged isDemo: true', () => {
    it('returns data with isDemo: true and status: success in DemoTasksProvider', async () => {
      const provider = new DemoTasksProvider();
      const res = await provider.getTasks();

      expect(res.status).toBe('success');
      expect(res.isDemo).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data!.every(t => t.isDemo === true)).toBe(true);
    });

    it('returns decisions with isDemo: true in DemoDecisionsProvider', async () => {
      const provider = new DemoDecisionsProvider();
      const res = await provider.getDecisions();

      expect(res.status).toBe('success');
      expect(res.isDemo).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data!.every(d => d.isDemo === true)).toBe(true);
    });
  });

  describe('4. ApiProvider Invariant: No silent fallback to demo fixtures on failure', () => {
    it('returns status "unavailable" and does not fallback to mock fixtures when backend is down', async () => {
      // Mock fetch failure
      vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

      const client = new HttpClient({
        baseUrl: 'https://staging.api.nuga',
        mode: 'staging'
      });
      const provider = new ApiTasksProvider(client);

      const res = await provider.getTasks();

      expect(res.status).toBe('unavailable');
      expect(res.data).toBeUndefined();
      expect(res.isDemo).toBe(false);
      expect(res.error).toContain('Servidor no disponible');
    });

    it('returns status "unauthorized" on 401 response without fake data', async () => {
      vi.spyOn(window, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Missing token'
      } as any);

      const client = new HttpClient({
        baseUrl: 'https://api.nuga.corp',
        mode: 'production'
      });
      const provider = new ApiDecisionsProvider(client);

      const res = await provider.getDecisions();

      expect(res.status).toBe('unauthorized');
      expect(res.data).toBeUndefined();
      expect(res.isDemo).toBe(false);
    });
  });

  describe('5. Mode Compatibility and Split-Brain Prevention', () => {
    it('marks demo as compatible by default', () => {
      const comp = validateModeCompatibility('demo', null);
      expect(comp.compatible).toBe(true);
    });

    it('detects server mismatch (frontend staging vs backend production) and blocks operations', () => {
      const mismatchedServer: ServerStatusContract = {
        mode: 'production',
        source: 'server',
        hermes: 'available',
        writesEnabled: true,
        integrations: { nugacore: true, mikromcp: true, google: true }
      };

      const comp = validateModeCompatibility('staging', mismatchedServer);
      expect(comp.compatible).toBe(false);
      expect(comp.reason).toContain('Incompatibilidad detectada');
    });

    it('validates matching modes successfully', () => {
      const validServer: ServerStatusContract = {
        mode: 'staging',
        source: 'server',
        hermes: 'available',
        writesEnabled: false,
        integrations: { nugacore: true, mikromcp: false, google: false }
      };

      const comp = validateModeCompatibility('staging', validServer);
      expect(comp.compatible).toBe(true);
    });
  });

  describe('6. Capabilities Matrix', () => {
    it('restricts authorized execution in demo and staging modes', () => {
      expect(DEFAULT_MODE_CAPABILITIES.demo.canExecuteAuthorizedOperation).toBe(false);
      expect(DEFAULT_MODE_CAPABILITIES.staging.canExecuteAuthorizedOperation).toBe(false);
      expect(DEFAULT_MODE_CAPABILITIES.production.canExecuteAuthorizedOperation).toBe(true);
    });

    it('disallows real data reads in demo mode', () => {
      expect(DEFAULT_MODE_CAPABILITIES.demo.canReadRealData).toBe(false);
      expect(DEFAULT_MODE_CAPABILITIES.staging.canReadRealData).toBe(true);
      expect(DEFAULT_MODE_CAPABILITIES.production.canReadRealData).toBe(true);
    });
  });

  describe('7. Server Health Check Service', () => {
    it('returns offline demo contract in demo mode without network requests', async () => {
      const fetchSpy = vi.spyOn(window, 'fetch');
      const health = await checkServerHealth('demo', 'http://localhost:3000');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(health.status).toBe('ok');
      expect(health.serverContract.mode).toBe('demo');
      expect(health.serverContract.hermes).toBe('not_connected');
    });
  });
});
