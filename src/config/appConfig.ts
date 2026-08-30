import { AppMode, ServerStatusContract, BackendCapabilities, AppConfig } from '../types';

export class ConfigurationError extends Error {
  constructor(message: string, public readonly code: string = 'CONFIG_INVALID') {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates the raw app mode from environment.
 * Throws ConfigurationError if an unrecognized or unsafe value is passed.
 * Fails closed: Never falls back to 'production' on unrecognized values.
 */
export function validateAndResolveAppMode(rawMode?: string | null): AppMode {
  // If undefined, empty or whitespace, default safely to 'demo'
  if (!rawMode || rawMode.trim() === '') {
    return 'demo';
  }

  const normalized = rawMode.trim().toLowerCase();

  if (normalized === 'demo') {
    return 'demo';
  }

  if (normalized === 'staging') {
    return 'staging';
  }

  if (normalized === 'production') {
    return 'production';
  }

  throw new ConfigurationError(
    `[Security / Config] Valor inválido para VITE_APP_MODE: "${rawMode}". Los modos permitidos son exclusivamente: 'demo' | 'staging' | 'production'. No se asume producción por defecto.`,
    'INVALID_APP_MODE'
  );
}

/**
 * Validates that production cannot be activated or simulated through localStorage,
 * query parameters, or public selectors.
 */
export function assertSafeModeActivation(mode: AppMode, origin: 'env' | 'user_ui'): AppMode {
  if (origin === 'user_ui' && mode === 'production') {
    throw new ConfigurationError(
      'Activación bloqueada: El modo producción sólo puede establecerse mediante variables de entorno de despliegue y nunca desde la interfaz o almacenamiento local.',
      'UNAUTHORIZED_PRODUCTION_ACTIVATION'
    );
  }
  return mode;
}

/**
 * Default backend capabilities per mode.
 * The backend MUST always re-validate every operation; these are strictly for UI enablement.
 */
export const DEFAULT_MODE_CAPABILITIES: Record<AppMode, BackendCapabilities> = {
  demo: {
    canReadRealData: false,
    canRequestDryRun: true,
    canSubmitApproval: true,
    canExecuteAuthorizedOperation: false
  },
  staging: {
    canReadRealData: true,
    canRequestDryRun: true,
    canSubmitApproval: true,
    canExecuteAuthorizedOperation: false
  },
  production: {
    canReadRealData: true,
    canRequestDryRun: true,
    canSubmitApproval: true,
    canExecuteAuthorizedOperation: true
  }
};

/**
 * Build-time and runtime application configuration
 */
export function getAppConfig(): AppConfig {
  const rawEnvMode = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_APP_MODE : undefined;
  const rawApiUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_NUGA_API_URL : undefined;

  const mode = validateAndResolveAppMode(rawEnvMode);
  const apiUrl = rawApiUrl && rawApiUrl.trim() !== '' ? rawApiUrl.trim() : 'http://localhost:3000';

  return {
    mode,
    apiUrl,
    isDemo: mode === 'demo',
    isStaging: mode === 'staging',
    isProduction: mode === 'production',
    capabilities: DEFAULT_MODE_CAPABILITIES[mode]
  };
}

/**
 * Validates whether the frontend mode and the effective backend status match.
 * If there is a mismatch (e.g. frontend staging vs backend production),
 * operations must be blocked to prevent split-brain states or data corruption.
 */
export function validateModeCompatibility(
  frontendMode: AppMode,
  serverStatus?: ServerStatusContract | null
): { compatible: boolean; reason?: string } {
  if (!serverStatus) {
    // In demo mode, server status might not be available or connected yet
    if (frontendMode === 'demo') {
      return { compatible: true };
    }
    // In staging or production, missing server status requires warning
    return {
      compatible: false,
      reason: `El backend en ${frontendMode.toUpperCase()} no ha reportado su estado de salud o no está disponible.`
    };
  }

  if (serverStatus.mode !== frontendMode) {
    return {
      compatible: false,
      reason: `Incompatibilidad detectada: Frontend configurado en modo '${frontendMode}' pero el backend reporta modo '${serverStatus.mode}'. Operaciones bloqueadas por seguridad.`
    };
  }

  return { compatible: true };
}
