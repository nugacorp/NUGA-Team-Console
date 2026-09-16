import type { MikroTikInterface, MikroTikRouter } from '../src/types';

const MCP_PROTOCOL_VERSION = '2025-06-18';
const ROUTER_ID_PATTERN = /^[A-Za-z0-9._-]{1,96}$/;

export type MikroMcpReadOnlyErrorCode = 'DENIED' | 'UNAVAILABLE' | 'INVALID_RESPONSE';

export class MikroMcpReadOnlyError extends Error {
  constructor(
    public readonly code: MikroMcpReadOnlyErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'MikroMcpReadOnlyError';
  }
}

export interface MikroMcpReadOnlyAdapterConfig {
  endpoint: string;
  token: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readPath(value: unknown, ...paths: string[][]): unknown {
  for (const path of paths) {
    let current: unknown = value;
    let found = true;
    for (const segment of path) {
      if (!isRecord(current) || !(segment in current)) {
        found = false;
        break;
      }
      current = current[segment];
    }
    if (found && current !== undefined && current !== null) return current;
  }
  return undefined;
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.+-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function memoryUsagePercent(value: unknown): number {
  const total = asNumber(readPath(
    value,
    ['totalMemory'],
    ['total-memory'],
    ['memory', 'total'],
    ['resource', 'totalMemory'],
    ['resource', 'total-memory']
  ));
  const free = asNumber(readPath(
    value,
    ['freeMemory'],
    ['free-memory'],
    ['memory', 'free'],
    ['resource', 'freeMemory'],
    ['resource', 'free-memory']
  ));
  if (total <= 0) return 0;
  return clampPercent(((total - free) / total) * 100);
}

function normalizeInterfaceType(value: unknown, name: string): MikroTikInterface['type'] {
  const type = asString(value).toLowerCase();
  const lowerName = name.toLowerCase();
  if (type.includes('vlan')) return 'vlan';
  if (type.includes('wireguard')) return 'wireguard';
  if (type.includes('bridge')) return 'bridge';
  if (type.includes('sfp') || lowerName.startsWith('sfp')) return 'sfp';
  return 'ethernet';
}

function extractArray(value: unknown, keys: string[]): JsonRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }
  return [];
}

function unwrapRecord(value: unknown, keys: string[]): JsonRecord {
  if (!isRecord(value)) return {};
  for (const key of keys) {
    if (isRecord(value[key])) return value[key] as JsonRecord;
  }
  return value;
}

export class MikroMcpReadOnlyAdapter {
  private readonly endpoint: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly fetchImpl: typeof fetch;
  private sessionId: string | null = null;
  private initializePromise: Promise<void> | null = null;
  private requestId = 0;

  constructor(config: MikroMcpReadOnlyAdapterConfig) {
    this.endpoint = config.endpoint;
    this.token = config.token;
    this.timeoutMs = config.timeoutMs ?? 8_000;
    this.maxResponseBytes = config.maxResponseBytes ?? 1_048_576;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async listRouters(tags?: string[]): Promise<JsonRecord[]> {
    const result = await this.callReadTool('list_routers', tags?.length ? { tags } : {});
    const routers = extractArray(result, ['routers', 'items', 'data', 'result']);
    return routers.filter(router => ROUTER_ID_PATTERN.test(asString(router.id)));
  }

  async checkRouterHealth(routerId: string): Promise<JsonRecord> {
    this.assertRouterId(routerId);
    const result = await this.callReadTool('check_router_health', { routerId });
    return unwrapRecord(result, ['health', 'data', 'result']);
  }

  async getSystemStatus(routerId: string): Promise<JsonRecord> {
    this.assertRouterId(routerId);
    const result = await this.callReadTool('get_system_status', {
      routerId,
      sections: ['resource', 'identity', 'routerboard', 'health']
    });
    return unwrapRecord(result, ['status', 'data', 'result']);
  }

  async listInterfaces(routerId: string): Promise<JsonRecord[]> {
    this.assertRouterId(routerId);
    const result = await this.callReadTool('list_interfaces', {
      routerId,
      type: 'all',
      status: 'all',
      includeCounters: true,
      limit: 500,
      offset: 0
    });
    return extractArray(result, ['interfaces', 'items', 'data', 'result']);
  }

  async listWispRouters(): Promise<MikroTikRouter[]> {
    const registry = await this.listRouters();
    const routers: MikroTikRouter[] = [];

    for (const registered of registry) {
      const id = asString(registered.id);
      if (!id) continue;

      const [healthResult, statusResult, interfacesResult] = await Promise.allSettled([
        this.checkRouterHealth(id),
        this.getSystemStatus(id),
        this.listInterfaces(id)
      ]);

      const health = healthResult.status === 'fulfilled' ? healthResult.value : {};
      const system = statusResult.status === 'fulfilled' ? statusResult.value : {};
      const rawInterfaces = interfacesResult.status === 'fulfilled' ? interfacesResult.value : [];

      const healthyValue = readPath(health, ['healthy'], ['status', 'healthy']);
      const healthy = healthyValue !== false;
      const cpuPercent = clampPercent(asNumber(readPath(
        system,
        ['cpuLoad'],
        ['cpu-load'],
        ['resource', 'cpuLoad'],
        ['resource', 'cpu-load'],
        health,
        ['cpuLoad']
      )));
      const ramPercent = memoryUsagePercent(Object.keys(system).length ? system : health);
      const partialRead = statusResult.status === 'rejected' || interfacesResult.status === 'rejected';

      const interfaces: MikroTikInterface[] = rawInterfaces.map(raw => {
        const name = asString(readPath(raw, ['name'], ['interface']));
        const running = readPath(raw, ['running'], ['status']);
        const disabled = readPath(raw, ['disabled']);
        return {
          name: name || 'unknown',
          type: normalizeInterfaceType(readPath(raw, ['type'], ['default-name']), name),
          status: running === false || running === 'down' || disabled === true ? 'down' : 'up',
          ipAddress: asString(readPath(raw, ['ipAddress'], ['ip-address'], ['address'])),
          trafficRxMbps: 0,
          trafficTxMbps: 0
        };
      });

      const identity = asString(readPath(
        system,
        ['identity'],
        ['identity', 'name'],
        health,
        ['identity']
      ), id);
      const routerOsVersion = asString(readPath(
        health,
        ['firmwareVersion'],
        ['version'],
        system,
        ['version'],
        ['resource', 'version'],
        registered,
        ['rosVersion']
      ));
      const model = asString(readPath(
        system,
        ['model'],
        ['routerboard', 'model'],
        health,
        ['model']
      ));
      const uptime = asString(readPath(
        health,
        ['uptime'],
        system,
        ['uptime'],
        ['resource', 'uptime']
      ));
      const freeDiskBytes = asNumber(readPath(
        system,
        ['freeHddSpace'],
        ['free-hdd-space'],
        ['resource', 'freeHddSpace'],
        ['resource', 'free-hdd-space']
      ));

      routers.push({
        id,
        identity,
        model,
        routerOsVersion,
        cpuPercent,
        ramUsagePercent: ramPercent,
        freeDiskMb: Math.max(0, Math.round(freeDiskBytes / 1_048_576)),
        uptime,
        towerId: '',
        status: !healthy ? 'critical' : partialRead || cpuPercent >= 85 || ramPercent >= 90 ? 'warning' : 'optimal',
        interfaces,
        routeSummary: { total: 0, bgp: 0, ospf: 0, static: 0, defaultGateway: '' },
        dhcpLeasesCount: 0,
        dnsServers: [],
        firewallRulesCount: 0,
        wireguardPeersCount: 0,
        queuesSimpleCount: 0,
        servicesRunning: [],
        findings: [],
        auditHistory: [],
        isDemo: false
      });
    }

    return routers;
  }

  private assertRouterId(routerId: string): void {
    if (!ROUTER_ID_PATTERN.test(routerId)) {
      throw new MikroMcpReadOnlyError('DENIED', 'Identificador de router fuera del alcance permitido.');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = (async () => {
      const response = await this.postRpc({
        jsonrpc: '2.0',
        id: this.nextRequestId(),
        method: 'initialize',
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: {
            name: 'nuga-team-console',
            version: '1.0.0'
          }
        }
      });

      const record = isRecord(response) ? response : {};
      if (!isRecord(record.result)) {
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP no devolvió una inicialización MCP válida.');
      }

      await this.postRpc({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {}
      }, true);
    })().catch(error => {
      this.initializePromise = null;
      throw error;
    });

    return this.initializePromise;
  }

  private async callReadTool(name: string, args: JsonRecord): Promise<unknown> {
    const allowedTools = new Set([
      'list_routers',
      'check_router_health',
      'get_system_status',
      'list_interfaces'
    ]);
    if (!allowedTools.has(name)) {
      throw new MikroMcpReadOnlyError('DENIED', 'La herramienta MikroMCP solicitada no está permitida.');
    }

    await this.ensureInitialized();
    const response = await this.postRpc({
      jsonrpc: '2.0',
      id: this.nextRequestId(),
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    });

    if (!isRecord(response)) {
      throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió una respuesta MCP inválida.');
    }
    if (isRecord(response.error)) {
      this.throwRpcError(response.error);
    }
    if (!isRecord(response.result)) {
      throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP no devolvió un resultado de herramienta válido.');
    }

    const result = response.result;
    if (result.isError === true) {
      const message = this.extractContentText(result.content) || 'MikroMCP rechazó la operación de lectura.';
      this.throwToolError(message);
    }
    if ('structuredContent' in result) return result.structuredContent;

    const text = this.extractContentText(result.content);
    if (!text) return result;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { text };
    }
  }

  private nextRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  private async postRpc(payload: JsonRecord, allowEmptyResponse = false): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = {
        authorization: `Bearer ${this.token}`,
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'mcp-protocol-version': MCP_PROTOCOL_VERSION
      };
      if (this.sessionId) headers['mcp-session-id'] = this.sessionId;

      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const returnedSession = response.headers.get('mcp-session-id');
      if (returnedSession) this.sessionId = returnedSession;

      if (response.status === 401 || response.status === 403) {
        throw new MikroMcpReadOnlyError('DENIED', 'MikroMCP rechazó la identidad configurada.');
      }
      if (!response.ok) {
        throw new MikroMcpReadOnlyError('UNAVAILABLE', `MikroMCP respondió HTTP ${response.status}.`);
      }

      const contentLength = Number(response.headers.get('content-length') ?? '0');
      if (contentLength > this.maxResponseBytes) {
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'La respuesta MikroMCP excede el tamaño permitido.');
      }

      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > this.maxResponseBytes) {
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'La respuesta MikroMCP excede el tamaño permitido.');
      }
      if (!text.trim()) {
        if (allowEmptyResponse) return null;
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió una respuesta vacía.');
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/event-stream')) {
        const events = text
          .split(/\r?\n/)
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())
          .filter(Boolean);
        for (let index = events.length - 1; index >= 0; index -= 1) {
          try {
            return JSON.parse(events[index]) as unknown;
          } catch {
            // Ignore non-JSON SSE frames and continue to the previous event.
          }
        }
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió un stream MCP sin JSON válido.');
      }

      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió JSON inválido.');
      }
    } catch (error) {
      if (error instanceof MikroMcpReadOnlyError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MikroMcpReadOnlyError('UNAVAILABLE', 'MikroMCP excedió el tiempo de espera.');
      }
      throw new MikroMcpReadOnlyError('UNAVAILABLE', 'MikroMCP no está disponible para lectura.');
    } finally {
      clearTimeout(timer);
    }
  }

  private extractContentText(content: unknown): string {
    if (!Array.isArray(content)) return '';
    return content
      .filter(isRecord)
      .filter(item => item.type === 'text' && typeof item.text === 'string')
      .map(item => item.text as string)
      .join('\n')
      .trim();
  }

  private throwRpcError(error: JsonRecord): never {
    const message = asString(error.message, 'MikroMCP devolvió un error MCP.');
    this.throwToolError(message);
  }

  private throwToolError(message: string): never {
    const normalized = message.toLowerCase();
    if (
      normalized.includes('forbidden') ||
      normalized.includes('unauthorized') ||
      normalized.includes('permission') ||
      normalized.includes('not allowed') ||
      normalized.includes('scope')
    ) {
      throw new MikroMcpReadOnlyError('DENIED', 'La identidad MikroMCP no tiene permiso para esa lectura.');
    }
    throw new MikroMcpReadOnlyError('UNAVAILABLE', 'MikroMCP no pudo completar la lectura solicitada.');
  }
}
