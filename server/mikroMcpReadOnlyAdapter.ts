import type { MikroTikInterface, MikroTikRouter } from '../src/types';

const MCP_PROTOCOL_VERSION = '2025-06-18';
const ROUTER_ID_PATTERN = /^[A-Za-z0-9._-]{1,96}$/;
const READ_TOOLS = new Set([
  'list_routers',
  'check_router_health',
  'get_system_status',
  'list_interfaces'
]);

type JsonRecord = Record<string, unknown>;

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

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nested(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current) || !(key in current)) return undefined;
    current = current[key];
  }
  return current;
}

function first(...values: unknown[]): unknown {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.+-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function percent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function records(value: unknown, keys: string[]): JsonRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of keys) {
    if (Array.isArray(value[key])) return (value[key] as unknown[]).filter(isRecord);
  }
  return [];
}

function record(value: unknown, keys: string[]): JsonRecord {
  if (!isRecord(value)) return {};
  for (const key of keys) {
    if (isRecord(value[key])) return value[key] as JsonRecord;
  }
  return value;
}

function memoryPercent(system: JsonRecord, health: JsonRecord): number {
  const source = Object.keys(system).length ? system : health;
  const total = numberValue(first(
    nested(source, ['totalMemory']),
    nested(source, ['total-memory']),
    nested(source, ['memory', 'total']),
    nested(source, ['resource', 'totalMemory']),
    nested(source, ['resource', 'total-memory'])
  ));
  const free = numberValue(first(
    nested(source, ['freeMemory']),
    nested(source, ['free-memory']),
    nested(source, ['memory', 'free']),
    nested(source, ['resource', 'freeMemory']),
    nested(source, ['resource', 'free-memory'])
  ));
  return total > 0 ? percent(((total - free) / total) * 100) : 0;
}

function interfaceType(rawType: unknown, name: string): MikroTikInterface['type'] {
  const type = text(rawType).toLowerCase();
  const lowerName = name.toLowerCase();
  if (type.includes('vlan')) return 'vlan';
  if (type.includes('wireguard')) return 'wireguard';
  if (type.includes('bridge')) return 'bridge';
  if (type.includes('sfp') || lowerName.startsWith('sfp')) return 'sfp';
  return 'ethernet';
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
    return records(result, ['routers', 'items', 'data', 'result'])
      .filter(router => ROUTER_ID_PATTERN.test(text(router.id)));
  }

  async checkRouterHealth(routerId: string): Promise<JsonRecord> {
    this.assertRouterId(routerId);
    return record(await this.callReadTool('check_router_health', { routerId }), ['health', 'data', 'result']);
  }

  async getSystemStatus(routerId: string): Promise<JsonRecord> {
    this.assertRouterId(routerId);
    return record(await this.callReadTool('get_system_status', {
      routerId,
      sections: ['resource', 'identity', 'routerboard', 'health']
    }), ['status', 'data', 'result']);
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
    return records(result, ['interfaces', 'items', 'data', 'result']);
  }

  async listWispRouters(): Promise<MikroTikRouter[]> {
    const registry = await this.listRouters();
    const output: MikroTikRouter[] = [];

    for (const registered of registry) {
      const id = text(registered.id);
      if (!id) continue;

      const [healthResult, systemResult, interfacesResult] = await Promise.allSettled([
        this.checkRouterHealth(id),
        this.getSystemStatus(id),
        this.listInterfaces(id)
      ]);
      const health = healthResult.status === 'fulfilled' ? healthResult.value : {};
      const system = systemResult.status === 'fulfilled' ? systemResult.value : {};
      const rawInterfaces = interfacesResult.status === 'fulfilled' ? interfacesResult.value : [];

      const healthy = first(nested(health, ['healthy']), nested(health, ['status', 'healthy'])) !== false;
      const cpuPercent = percent(numberValue(first(
        nested(system, ['cpuLoad']),
        nested(system, ['cpu-load']),
        nested(system, ['resource', 'cpuLoad']),
        nested(system, ['resource', 'cpu-load']),
        nested(health, ['cpuLoad']),
        nested(health, ['cpu-load'])
      )));
      const ramUsagePercent = memoryPercent(system, health);
      const partialRead = systemResult.status === 'rejected' || interfacesResult.status === 'rejected';

      const interfaces: MikroTikInterface[] = rawInterfaces.map(raw => {
        const name = text(first(nested(raw, ['name']), nested(raw, ['interface'])), 'unknown');
        const running = first(nested(raw, ['running']), nested(raw, ['status']));
        return {
          name,
          type: interfaceType(first(nested(raw, ['type']), nested(raw, ['default-name'])), name),
          status: running === false || running === 'down' || nested(raw, ['disabled']) === true ? 'down' : 'up',
          ipAddress: text(first(nested(raw, ['ipAddress']), nested(raw, ['ip-address']), nested(raw, ['address']))),
          // MikroMCP exposes counters here, not an instantaneous Mbps rate.
          trafficRxMbps: 0,
          trafficTxMbps: 0
        };
      });

      const freeDiskBytes = numberValue(first(
        nested(system, ['freeHddSpace']),
        nested(system, ['free-hdd-space']),
        nested(system, ['resource', 'freeHddSpace']),
        nested(system, ['resource', 'free-hdd-space'])
      ));

      output.push({
        id,
        identity: text(first(
          nested(system, ['identity', 'name']),
          nested(system, ['identity']),
          nested(health, ['identity'])
        ), id),
        model: text(first(
          nested(system, ['routerboard', 'model']),
          nested(system, ['model']),
          nested(health, ['model'])
        )),
        routerOsVersion: text(first(
          nested(health, ['firmwareVersion']),
          nested(health, ['version']),
          nested(system, ['resource', 'version']),
          nested(system, ['version']),
          nested(registered, ['rosVersion'])
        )),
        cpuPercent,
        ramUsagePercent,
        freeDiskMb: Math.max(0, Math.round(freeDiskBytes / 1_048_576)),
        uptime: text(first(
          nested(health, ['uptime']),
          nested(system, ['resource', 'uptime']),
          nested(system, ['uptime'])
        )),
        towerId: '',
        status: !healthy
          ? 'critical'
          : partialRead || cpuPercent >= 85 || ramUsagePercent >= 90
            ? 'warning'
            : 'optimal',
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

    return output;
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
        id: this.nextId(),
        method: 'initialize',
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: 'nuga-team-console', version: '1.0.0' }
        }
      });
      if (!isRecord(response) || !isRecord(response.result)) {
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
    if (!READ_TOOLS.has(name)) {
      throw new MikroMcpReadOnlyError('DENIED', 'La herramienta MikroMCP solicitada no está permitida.');
    }
    await this.ensureInitialized();
    const response = await this.postRpc({
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'tools/call',
      params: { name, arguments: args }
    });
    if (!isRecord(response)) {
      throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió una respuesta MCP inválida.');
    }
    if (isRecord(response.error)) this.throwToolError(text(response.error.message, 'Error MCP.'));
    if (!isRecord(response.result)) {
      throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP no devolvió un resultado de herramienta válido.');
    }

    const result = response.result;
    const contentText = this.contentText(result.content);
    if (result.isError === true) this.throwToolError(contentText || 'La lectura MikroMCP falló.');
    if ('structuredContent' in result) return result.structuredContent;
    if (!contentText) return result;
    try {
      return JSON.parse(contentText) as unknown;
    } catch {
      return { text: contentText };
    }
  }

  private nextId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  private async postRpc(payload: JsonRecord, allowEmpty = false): Promise<unknown> {
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
      const sessionId = response.headers.get('mcp-session-id');
      if (sessionId) this.sessionId = sessionId;

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
      const body = await response.text();
      if (Buffer.byteLength(body, 'utf8') > this.maxResponseBytes) {
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'La respuesta MikroMCP excede el tamaño permitido.');
      }
      if (!body.trim()) {
        if (allowEmpty) return null;
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió una respuesta vacía.');
      }

      if ((response.headers.get('content-type') ?? '').includes('text/event-stream')) {
        const frames = body
          .split(/\r?\n/)
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())
          .filter(Boolean);
        for (let index = frames.length - 1; index >= 0; index -= 1) {
          try {
            return JSON.parse(frames[index]) as unknown;
          } catch {
            // Continue until a valid JSON-RPC frame is found.
          }
        }
        throw new MikroMcpReadOnlyError('INVALID_RESPONSE', 'MikroMCP devolvió un stream MCP inválido.');
      }

      try {
        return JSON.parse(body) as unknown;
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

  private contentText(content: unknown): string {
    if (!Array.isArray(content)) return '';
    return content
      .filter(isRecord)
      .filter(item => item.type === 'text' && typeof item.text === 'string')
      .map(item => item.text as string)
      .join('\n')
      .trim();
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
