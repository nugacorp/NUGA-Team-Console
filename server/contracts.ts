import {
  BackendCapabilities,
  ServerStatusContract
} from '../src/types';
import { ServerConfig, ServerMode } from './config';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    correlationId?: string;
  };
}

export function createServerStatusContract(
  config: Pick<ServerConfig, 'mode' | 'hermesReadOnlyEnabled'>
): ServerStatusContract {
  return {
    mode: config.mode,
    source: 'server',
    hermes: config.hermesReadOnlyEnabled ? 'available' : 'unavailable',
    writesEnabled: false,
    integrations: {
      nugacore: false,
      mikromcp: false,
      google: false
    }
  };
}

export function createServerCapabilities(
  _mode: ServerMode,
  hermesReadOnlyEnabled = false
): BackendCapabilities {
  return {
    canReadRealData: hermesReadOnlyEnabled,
    canRequestDryRun: false,
    canSubmitApproval: false,
    canExecuteAuthorizedOperation: false
  };
}

export function validateModeHeader(
  expectedMode: ServerMode,
  receivedMode: string | undefined
): boolean {
  return receivedMode === expectedMode;
}

export function isMutationMethod(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

export function isAllowedOrigin(
  expectedOrigin: string,
  receivedOrigin: string | undefined
): boolean {
  return receivedOrigin === expectedOrigin;
}

export function apiError(
  code: string,
  message: string,
  correlationId?: string
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      ...(correlationId ? { correlationId } : {})
    }
  };
}
