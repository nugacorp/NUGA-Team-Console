export type ConsoleTable =
  | 'task_extensions'
  | 'agent_profiles'
  | 'decisions'
  | 'deliverables'
  | 'audit_events'
  | 'projects'
  | 'campaigns'
  | 'admin_items';

export interface SupabaseConsoleAdapterOptions {
  url: string;
  secretKey: string;
  schema: 'nuga_console' | 'nuga_console_production';
  timeoutMs: number;
  maxResponseBytes: number;
}

export type SupabaseFetch = typeof fetch;

export class SupabaseConsoleError extends Error {
  constructor(
    public readonly code: 'UNAVAILABLE' | 'INVALID_RESPONSE' | 'DENIED',
    message: string
  ) {
    super(message);
    this.name = 'SupabaseConsoleError';
  }
}

function assertIdentifier(value: string, label: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)) {
    throw new SupabaseConsoleError('DENIED', `${label} no es válido.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const forbiddenKey = /(password|secret|token|credential|authorization|cookie|confirmation[_-]?(phrase|token))/i;

function assertNoSensitiveKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoSensitiveKeys);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKey.test(key)) {
      throw new SupabaseConsoleError('DENIED', 'El payload contiene un campo sensible.');
    }
    assertNoSensitiveKeys(nested);
  }
}

const writableKeys = {
  projects: ['code', 'name', 'category', 'objective', 'owner', 'team', 'status', 'progress_percent', 'start_date', 'target_end_date', 'risks', 'milestones', 'budget_estimate_usd', 'summary_executive', 'deliverables_count'],
  campaigns: ['code', 'name', 'objective', 'target_audience', 'value_proposition', 'channels', 'budget_usd', 'spent_budget_usd', 'schedule_date_range', 'status', 'creative_stage', 'variants_count', 'metrics', 'requires_approval', 'assigned_agent'],
  admin_items: ['title', 'category', 'responsible', 'agent_assigned', 'deadline', 'status', 'priority', 'amount_usd', 'evidence_ref', 'notes'],
  decisions: [
    'code', 'title', 'specialist', 'project_id', 'hermes_board_slug',
    'hermes_task_id', 'priority', 'risk', 'status', 'impact',
    'risk_of_action', 'risk_of_inaction', 'situation', 'evidence', 'proposal',
    'exact_change_diff', 'expected_validation', 'rollback_plan',
    'affected_scope', 'recommendation', 'deadline', 'rejection_reason',
    'confirmation_verified', 'confirmation_verified_at',
    'confirmation_verified_by', 'history'
  ],
  deliverables: [
    'code', 'title', 'kind', 'project_id', 'agent_id', 'hermes_board_slug',
    'hermes_task_id', 'status', 'version', 'executive_summary',
    'storage_path', 'sha256'
  ],
  audit_events: [
    'actor', 'action', 'resource_type', 'resource_id', 'outcome', 'risk',
    'correlation_id', 'details'
  ]
} as const;

function allowlistedPayload(
  table: keyof typeof writableKeys,
  value: Record<string, unknown>
): Record<string, unknown> {
  assertNoSensitiveKeys(value);
  const allowed = new Set<string>(writableKeys[table]);
  const unexpected = Object.keys(value).filter(key => !allowed.has(key));
  if (unexpected.length) {
    throw new SupabaseConsoleError('DENIED', 'El payload contiene campos no permitidos.');
  }
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => allowed.has(key))
  );
}

export class SupabaseConsoleAdapter {
  private readonly baseUrl: URL;

  constructor(
    private readonly options: SupabaseConsoleAdapterOptions,
    private readonly request: SupabaseFetch = fetch
  ) {
    this.baseUrl = new URL('/rest/v1/', options.url);
  }

  list(table: Exclude<ConsoleTable, 'task_extensions'>, limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
    const order = table === 'audit_events' ? 'occurred_at.desc' : 'created_at.desc';
    return this.call('GET', table, {
      query: { select: '*', order, limit: String(safeLimit) }
    });
  }

  listTaskExtensions(limit = 500) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
    return this.call('GET', 'task_extensions', {
      query: { select: '*', order: 'updated_at.desc', limit: String(safeLimit) }
    });
  }

  getTaskExtension(board: string, taskId: string) {
    return this.call('GET', 'task_extensions', {
      query: {
        select: '*',
        hermes_board_slug: `eq.${assertIdentifier(board, 'board')}`,
        hermes_task_id: `eq.${assertIdentifier(taskId, 'taskId')}`,
        limit: '1'
      }
    });
  }

  upsertTaskExtension(value: Record<string, unknown>) {
    assertNoSensitiveKeys(value);
    const allowed = new Set([
      'hermes_board_slug', 'hermes_task_id', 'deadline',
      'estimated_minutes', 'plan'
    ]);
    if (Object.keys(value).some(key => !allowed.has(key))) {
      throw new SupabaseConsoleError('DENIED', 'La extensión contiene campos no permitidos.');
    }
    const board = assertIdentifier(String(value.hermes_board_slug ?? ''), 'board');
    const taskId = assertIdentifier(String(value.hermes_task_id ?? ''), 'taskId');
    return this.call('POST', 'task_extensions', {
      query: { on_conflict: 'hermes_board_slug,hermes_task_id' },
      prefer: 'resolution=merge-duplicates,return=representation',
      body: { ...value, hermes_board_slug: board, hermes_task_id: taskId }
    });
  }

  listAgentProfiles() {
    return this.call('GET', 'agent_profiles', {
      query: {
        select: 'role,avatar_data_url,autonomy_level,system_instructions,updated_at',
        order: 'role.asc',
        limit: '5'
      }
    });
  }

  upsertAgentProfile(value: Record<string, unknown>) {
    assertNoSensitiveKeys(value);
    const allowed = new Set([
      'role', 'avatar_data_url', 'autonomy_level', 'system_instructions'
    ]);
    if (Object.keys(value).some(key => !allowed.has(key))) {
      throw new SupabaseConsoleError('DENIED', 'El perfil contiene campos no permitidos.');
    }
    const role = assertIdentifier(String(value.role ?? ''), 'role');
    return this.call('POST', 'agent_profiles', {
      query: { on_conflict: 'role' },
      prefer: 'resolution=merge-duplicates,return=representation',
      body: { ...value, role }
    });
  }

  create(table: Exclude<ConsoleTable, 'task_extensions' | 'agent_profiles'>, value: Record<string, unknown>) {
    return this.call('POST', table, {
      prefer: 'return=representation',
      body: allowlistedPayload(table, value)
    });
  }

  private async call(
    method: 'GET' | 'POST',
    table: ConsoleTable,
    options: {
      query?: Record<string, string>;
      prefer?: string;
      body?: Record<string, unknown>;
    } = {}
  ): Promise<Record<string, unknown>[]> {
    const url = new URL(table, this.baseUrl);
    for (const [name, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(name, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
    let response: Response;
    try {
      response = await this.request(url, {
        method,
        signal: controller.signal,
        headers: {
          apikey: this.options.secretKey,
          'accept-profile': this.options.schema,
          'content-profile': this.options.schema,
          'content-type': 'application/json',
          ...(options.prefer ? { prefer: options.prefer } : {})
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
      });
    } catch {
      throw new SupabaseConsoleError('UNAVAILABLE', 'Supabase no está disponible.');
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    if (!response.ok) {
      throw new SupabaseConsoleError('UNAVAILABLE', `Supabase respondió HTTP ${response.status}.`);
    }
    if (text.length > this.options.maxResponseBytes) {
      throw new SupabaseConsoleError('INVALID_RESPONSE', 'La respuesta excede el límite permitido.');
    }

    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : [];
    } catch {
      throw new SupabaseConsoleError('INVALID_RESPONSE', 'Supabase devolvió JSON inválido.');
    }
    if (!Array.isArray(parsed) || !parsed.every(isRecord)) {
      throw new SupabaseConsoleError('INVALID_RESPONSE', 'Supabase devolvió un contrato inválido.');
    }
    return parsed;
  }
}
