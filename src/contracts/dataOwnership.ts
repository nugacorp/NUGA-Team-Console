export type DataAuthority =
  | 'hermes'
  | 'nuga_console'
  | 'derived'
  | 'external_adapter'
  | 'demo_only';

export type IntegrationState = 'active' | 'planned' | 'disconnected';

export interface DomainOwnershipContract {
  authority: DataAuthority;
  source: string;
  integrationState: IntegrationState;
  duplicateWritesAllowed: false;
}

export const DOMAIN_OWNERSHIP = {
  agents: {
    authority: 'hermes',
    source: 'Hermes profiles',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  boards: {
    authority: 'hermes',
    source: 'Hermes Kanban',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  tasks: {
    authority: 'hermes',
    source: 'Hermes Kanban',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  taskRuns: {
    authority: 'hermes',
    source: 'Hermes Kanban',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  taskComments: {
    authority: 'hermes',
    source: 'Hermes Kanban',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  projects: {
    authority: 'nuga_console',
    source: 'NUGA Console database with optional Hermes project reference',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  decisions: {
    authority: 'nuga_console',
    source: 'NUGA Console database',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  deliverables: {
    authority: 'nuga_console',
    source: 'NUGA Console database with optional Hermes attachment reference',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  incidents: {
    authority: 'nuga_console',
    source: 'NUGA Console database',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  campaigns: {
    authority: 'nuga_console',
    source: 'NUGA Console database',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  mediaAssets: {
    authority: 'nuga_console',
    source: 'NUGA Console database and future storage adapter',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  administration: {
    authority: 'nuga_console',
    source: 'NUGA Console database',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  notifications: {
    authority: 'nuga_console',
    source: 'NUGA Console database',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  consoleAudit: {
    authority: 'nuga_console',
    source: 'NUGA Console append-only audit',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  dashboardMetrics: {
    authority: 'derived',
    source: 'NUGA Console API aggregation',
    integrationState: 'planned',
    duplicateWritesAllowed: false
  },
  routerTelemetry: {
    authority: 'external_adapter',
    source: 'Future read-only MikroMCP or RouterOS adapter',
    integrationState: 'disconnected',
    duplicateWritesAllowed: false
  }
} as const satisfies Record<string, DomainOwnershipContract>;

export type DomainName = keyof typeof DOMAIN_OWNERSHIP;

export type TaskFieldResolution = 'direct' | 'mapped' | 'derived' | 'console_extension' | 'unavailable';

export interface TaskFieldContract {
  resolution: TaskFieldResolution;
  sourceField?: string;
  rule: string;
}

export const TASK_FIELD_OWNERSHIP = {
  id: { resolution: 'direct', sourceField: 'id', rule: 'Use the immutable Hermes task id.' },
  code: { resolution: 'mapped', sourceField: 'id', rule: 'Display a sanitized short form of the Hermes id.' },
  title: { resolution: 'direct', sourceField: 'title', rule: 'Use the Hermes title.' },
  description: { resolution: 'mapped', sourceField: 'body', rule: 'Use the sanitized Hermes body.' },
  projectId: { resolution: 'direct', sourceField: 'project_id', rule: 'Keep the Hermes project reference when present.' },
  assignedAgent: { resolution: 'mapped', sourceField: 'assignee', rule: 'Accept only the five approved NUGA profiles.' },
  priority: { resolution: 'direct', sourceField: 'priority', rule: 'Map only known priority values.' },
  status: { resolution: 'mapped', sourceField: 'status', rule: 'Map Hermes states to the frontend TaskStatus union.' },
  dependencies: { resolution: 'mapped', sourceField: 'task_links', rule: 'Resolve parent task ids from Hermes.' },
  attachments: { resolution: 'mapped', sourceField: 'task_attachments', rule: 'Return metadata only; never expose arbitrary paths.' },
  comments: { resolution: 'mapped', sourceField: 'task_comments', rule: 'Sanitize author and body.' },
  runs: { resolution: 'mapped', sourceField: 'task_runs', rule: 'Return summaries and status; full logs remain unavailable initially.' },
  createdAt: { resolution: 'mapped', sourceField: 'created_at', rule: 'Normalize to ISO 8601.' },
  updatedAt: { resolution: 'derived', rule: 'Use the latest safe task event timestamp.' },
  progressPercent: { resolution: 'derived', rule: 'Calculate from status; label the value as derived.' },
  loggedHours: { resolution: 'derived', rule: 'Sum completed run durations when available.' },
  blockedReason: { resolution: 'mapped', sourceField: 'last_failure_error', rule: 'Expose only a sanitized reason for blocked tasks.' },
  requiresHumanApproval: { resolution: 'derived', rule: 'True for review state or a linked NUGA decision.' },
  deliverableIds: { resolution: 'console_extension', rule: 'Store references in NUGA Console, never backfill Hermes.' },
  deliverablesIds: { resolution: 'console_extension', rule: 'Legacy alias; migrate to deliverableIds without writing to Hermes.' },
  deadline: { resolution: 'console_extension', rule: 'Store in NUGA Console until Hermes exposes a canonical deadline.' },
  estimatedHours: { resolution: 'console_extension', rule: 'Store in NUGA Console as planning metadata.' },
  plan: { resolution: 'console_extension', rule: 'Store structured UI planning data in NUGA Console.' }
} as const satisfies Record<string, TaskFieldContract>;

export function getDomainAuthority(domain: DomainName): DataAuthority {
  return DOMAIN_OWNERSHIP[domain].authority;
}

export function assertHermesOwnsOperationalTasks(): boolean {
  return DOMAIN_OWNERSHIP.tasks.authority === 'hermes'
    && DOMAIN_OWNERSHIP.taskRuns.authority === 'hermes'
    && DOMAIN_OWNERSHIP.taskComments.authority === 'hermes';
}
