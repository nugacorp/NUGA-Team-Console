import { ServerStatusContract, AppMode, BackendCapabilities } from '../types';
import { DEFAULT_MODE_CAPABILITIES } from '../config/appConfig';
import { parseServerStatusContract } from '../providers/api/contracts';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unavailable' | 'incompatible';
  serverContract: ServerStatusContract;
  capabilities: BackendCapabilities;
  message?: string;
}

/**
 * Checks the effective backend server status and capabilities.
 * In DEMO mode or when backend is unreachable, returns the safe offline contract.
 */
export async function checkServerHealth(
  mode: AppMode,
  apiUrl: string
): Promise<HealthCheckResult> {
  if (mode === 'demo') {
    return {
      status: 'ok',
      serverContract: {
        mode: 'demo',
        source: 'client',
        hermes: 'not_connected',
        writesEnabled: false,
        integrations: {
          nugacore: false,
          mikromcp: false,
          google: false
        }
      },
      capabilities: DEFAULT_MODE_CAPABILITIES.demo,
      message: 'Modo DEMO local activo. No conectado a servidores externos.'
    };
  }

  try {
    const normalizedApiUrl = apiUrl.replace(/\/$/, '');
    const statusPath = normalizedApiUrl.endsWith('/api')
      ? '/v1/status'
      : '/api/v1/status';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${normalizedApiUrl}${statusPath}`, {
      signal: controller.signal,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'X-Nuga-Mode': mode
      }
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        status: 'unavailable',
        serverContract: {
          mode,
          source: 'server',
          hermes: 'unavailable',
          writesEnabled: false,
          integrations: { nugacore: false, mikromcp: false, google: false }
        },
        capabilities: DEFAULT_MODE_CAPABILITIES[mode],
        message: `Servidor respondió con código HTTP ${res.status}`
      };
    }

    const data = parseServerStatusContract(await res.json());

    if (!data || data.source !== 'server') {
      return {
        status: 'unavailable',
        serverContract: {
          mode,
          source: 'server',
          hermes: 'unavailable',
          writesEnabled: false,
          integrations: { nugacore: false, mikromcp: false, google: false }
        },
        capabilities: DEFAULT_MODE_CAPABILITIES[mode],
        message: 'El servidor devolvió un contrato de estado inválido.'
      };
    }

    if (data.mode !== mode) {
      return {
        status: 'incompatible',
        serverContract: data,
        capabilities: DEFAULT_MODE_CAPABILITIES[mode],
        message: `Incompatibilidad detectada: frontend en '${mode}', servidor en '${data.mode}'`
      };
    }

    return {
      status: data.hermes === 'degraded' ? 'degraded' : 'ok',
      serverContract: data,
      capabilities: DEFAULT_MODE_CAPABILITIES[mode],
      message: 'Servidor verificado correctamente'
    };
  } catch (err: any) {
    return {
      status: 'unavailable',
      serverContract: {
        mode,
        source: 'server',
        hermes: 'unavailable',
        writesEnabled: false,
        integrations: { nugacore: false, mikromcp: false, google: false }
      },
      capabilities: DEFAULT_MODE_CAPABILITIES[mode],
      message: err.name === 'AbortError' ? 'Tiempo de espera agotado al verificar servidor' : 'No se pudo contactar el servidor backend'
    };
  }
}
