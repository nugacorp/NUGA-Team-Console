import { AppMode, AppConfig } from '../types';
import { AppProviders } from './contracts';
import { createDemoProviders } from './demo';
import { createApiProviders } from './api';

export * from './contracts';
export * from './demo';
export * from './api';

/**
 * Dependency injection factory:
 * Resolves the complete suite of providers according to the validated application mode.
 * - 'demo' -> DemoProviders (local, tagged with isDemo: true)
 * - 'staging' -> ApiProviders (against staging/lab backend)
 * - 'production' -> ApiProviders (against production backend)
 */
export function createProviders(appMode: AppMode, config: AppConfig): AppProviders {
  if (appMode === 'demo') {
    return createDemoProviders();
  }

  if (appMode === 'staging' || appMode === 'production') {
    return createApiProviders({
      baseUrl: config.apiUrl,
      mode: appMode,
      timeoutMs: 10000
    });
  }

  // Safety fallback: Never assume production if an unexpected mode arrives
  throw new Error(`[Factory] Modo desconocido "${appMode}". No se pueden inicializar providers.`);
}
