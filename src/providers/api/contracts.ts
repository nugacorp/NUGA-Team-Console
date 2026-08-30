import {
  AppMode,
  BackendCapabilities,
  ServerStatusContract
} from '../../types';

export const API_V1_PREFIX = '/api/v1' as const;

export type DecisionAction =
  | 'approve'
  | 'reject'
  | 'needs_info'
  | 'postpone'
  | 'simulate'
  | 'adjust_scope';

export interface DecisionActionRequest {
  action: DecisionAction;
  comment?: string;
  confirmationVerified: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAppMode(value: unknown): value is AppMode {
  return value === 'demo' || value === 'staging' || value === 'production';
}

export function parseServerStatusContract(value: unknown): ServerStatusContract | null {
  if (!isRecord(value) || !isAppMode(value.mode)) return null;
  if (value.source !== 'server' && value.source !== 'client') return null;
  if (
    value.hermes !== 'not_connected' &&
    value.hermes !== 'available' &&
    value.hermes !== 'degraded' &&
    value.hermes !== 'unavailable'
  ) {
    return null;
  }
  if (typeof value.writesEnabled !== 'boolean' || !isRecord(value.integrations)) return null;

  const integrations = value.integrations;
  if (
    typeof integrations.nugacore !== 'boolean' ||
    typeof integrations.mikromcp !== 'boolean' ||
    typeof integrations.google !== 'boolean'
  ) {
    return null;
  }

  return {
    mode: value.mode,
    source: value.source,
    hermes: value.hermes,
    writesEnabled: value.writesEnabled,
    integrations: {
      nugacore: integrations.nugacore,
      mikromcp: integrations.mikromcp,
      google: integrations.google
    }
  };
}

export function parseBackendCapabilities(value: unknown): BackendCapabilities | null {
  if (!isRecord(value)) return null;

  const keys: Array<keyof BackendCapabilities> = [
    'canReadRealData',
    'canRequestDryRun',
    'canSubmitApproval',
    'canExecuteAuthorizedOperation'
  ];

  if (keys.some(key => typeof value[key] !== 'boolean')) return null;

  return {
    canReadRealData: value.canReadRealData as boolean,
    canRequestDryRun: value.canRequestDryRun as boolean,
    canSubmitApproval: value.canSubmitApproval as boolean,
    canExecuteAuthorizedOperation: value.canExecuteAuthorizedOperation as boolean
  };
}

/**
 * Converts the local typographic confirmation into non-sensitive audit state.
 * The typed phrase is intentionally never included in the remote payload.
 */
export function toDecisionActionRequest(
  action: DecisionAction,
  comment?: string,
  confirmationText?: string
): DecisionActionRequest {
  const normalizedComment = comment?.trim();

  return {
    action,
    ...(normalizedComment ? { comment: normalizedComment } : {}),
    confirmationVerified: Boolean(confirmationText?.trim())
  };
}
