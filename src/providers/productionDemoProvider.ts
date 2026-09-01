import type { AppProviders } from './contracts';

/** Production builds must never instantiate or bundle the local DEMO provider. */
export function createDemoProviders(): AppProviders {
  throw new Error('DEMO_PROVIDER_EXCLUDED_FROM_PRODUCTION');
}
