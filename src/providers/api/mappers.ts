import {
  AgentRole,
  AuditEvent,
  Decision,
  Deliverable,
  PriorityLevel,
  ProviderResult,
  Task,
  TaskStatus
} from '../../types';

type Row = Record<string, unknown>;

const agents = new Set<AgentRole>([
  'director', 'nugacore', 'operaciones', 'marketing', 'administracion'
]);
const priorities = new Set<PriorityLevel>(['baja', 'media', 'alta', 'urgente']);

function row(value: unknown): Row | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Row
    : null;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isoFromEpoch(value: unknown): string {
  const epoch = number(value);
  return epoch > 0 ? new Date(epoch * 1000).toISOString() : new Date(0).toISOString();
}

function agent(value: unknown): AgentRole {
  return typeof value === 'string' && agents.has(value as AgentRole)
    ? value as AgentRole
    : 'director';
}

function priority(value: unknown): PriorityLevel {
  if (typeof value === 'string' && priorities.has(value as PriorityLevel)) {
    return value as PriorityLevel;
  }
  const numeric = number(value);
  if (numeric >= 3) return 'urgente';
  if (numeric === 2) return 'alta';
  if (numeric === 1) return 'media';
  return 'baja';
}

function taskStatus(value: unknown): TaskStatus {
  const status = text(value);
  const aliases: Record<string, TaskStatus> = {
    todo: 'backlog', triage: 'backlog', backlog: 'backlog', ready: 'ready',
    running: 'in_progress', in_progress: 'in_progress', blocked: 'blocked',
    review: 'review', completed: 'done', done: 'done', archived: 'archived'
  };
  return aliases[status] ?? 'backlog';
}

export interface HermesTaskExtension {
  hermes_board_slug: string;
  hermes_task_id: string;
  deadline?: string | null;
  estimated_minutes?: number | null;
  plan?: unknown[];
}

export function mapHermesTask(value: unknown, extension?: HermesTaskExtension): Task | null {
  const source = row(value);
  if (!source) return null;
  const id = text(source.id);
  const board = text(source.board);
  const title = text(source.title);
  if (!id || !board || !title) return null;
  const createdAt = isoFromEpoch(source.createdAt);
  const status = taskStatus(source.status);
  const plan = Array.isArray(extension?.plan)
    ? extension.plan.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    id: `${board}:${id}`,
    code: `HMS-${id.slice(0, 8).toUpperCase()}`,
    title,
    description: text(source.body, 'Sin descripción registrada en Hermes.'),
    plan,
    projectId: board,
    assignedAgent: agent(source.assignee),
    priority: priority(source.priority),
    status,
    progressPercent: status === 'done' ? 100 : status === 'in_progress' ? 50 : 0,
    estimatedHours: Math.round(number(extension?.estimated_minutes) / 6) / 10,
    loggedHours: 0,
    requiresHumanApproval: false,
    comments: [],
    runs: [],
    createdAt,
    updatedAt: isoFromEpoch(source.completedAt ?? source.startedAt ?? source.createdAt),
    deadline: text(extension?.deadline, 'Sin plazo'),
    hermesBoard: board,
    dataSource: 'hermes',
    isDemo: false
  };
}

export function mapDecision(value: unknown): Decision | null {
  const source = row(value);
  if (!source || !text(source.id) || !text(source.code) || !text(source.title)) return null;
  const createdAt = text(source.created_at, new Date(0).toISOString());
  return {
    id: text(source.id), code: text(source.code), title: text(source.title),
    specialist: agent(source.specialist), projectId: text(source.project_id, 'general'),
    priority: priority(source.priority), risk: ['low', 'medium', 'high', 'critical'].includes(text(source.risk)) ? text(source.risk) as Decision['risk'] : 'low',
    status: ['pending', 'approved', 'rejected', 'needs_info', 'postponed'].includes(text(source.status)) ? text(source.status) as Decision['status'] : 'pending',
    impact: text(source.impact), riskOfAction: text(source.risk_of_action),
    riskOfInaction: text(source.risk_of_inaction), situation: text(source.situation),
    evidence: text(source.evidence), proposal: text(source.proposal),
    exactChangeDiff: text(source.exact_change_diff), expectedValidation: text(source.expected_validation),
    rollbackPlan: text(source.rollback_plan), affectedScope: text(source.affected_scope),
    recommendation: text(source.recommendation), deadline: text(source.deadline, 'Sin plazo'),
    timePendingHours: Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 3_600_000)),
    rejectionReason: text(source.rejection_reason) || undefined,
    confirmationVerified: source.confirmation_verified === true,
    confirmationVerifiedAt: text(source.confirmation_verified_at) || undefined,
    confirmationVerifiedBy: text(source.confirmation_verified_by) || undefined,
    history: [], createdAt, isDemo: false
  };
}

export function mapDeliverable(value: unknown): Deliverable | null {
  const source = row(value);
  if (!source || !text(source.id) || !text(source.code) || !text(source.title)) return null;
  return {
    id: text(source.id), code: text(source.code), title: text(source.title),
    type: text(source.kind, 'report') as Deliverable['type'],
    taskId: text(source.hermes_task_id) || undefined,
    projectId: text(source.project_id, 'general'), agentId: agent(source.agent_id),
    createdAt: text(source.created_at, new Date(0).toISOString()), fileSize: 'No disponible',
    simulatedSha256: text(source.sha256), status: text(source.status, 'draft') as Deliverable['status'],
    version: text(source.version, '1'), executiveSummary: text(source.executive_summary),
    keyIndicators: [], findings: [], recommendations: [], pendingDecisions: [], limitations: [],
    isDemo: false
  };
}

export function mapAuditEvent(value: unknown): AuditEvent | null {
  const source = row(value);
  if (!source || !text(source.id) || !text(source.actor) || !text(source.action)) return null;
  const outcome = text(source.outcome);
  const details = row(source.details) ?? {};
  return {
    id: text(source.id), timestamp: text(source.occurred_at, new Date(0).toISOString()),
    actorType: text(source.actor).startsWith('owner:') ? 'user' : 'system',
    actorName: text(source.actor), action: text(source.action), actionType: 'executed',
    resourceType: 'system', resourceId: text(source.resource_id, text(source.id)),
    resourceLabel: text(source.resource_type, 'system'),
    result: outcome === 'success' ? 'success' : outcome === 'denied' ? 'warning' : 'failure',
    risk: ['low', 'medium', 'high', 'critical'].includes(text(source.risk)) ? text(source.risk) as AuditEvent['risk'] : 'low',
    scopeImpact: text(details.scopeImpact), humanExplanation: text(details.humanExplanation, text(source.action)),
    correlationId: text(source.correlation_id), jsonPayload: details,
    dataSource: 'api_staging', mode: 'staging', isDemo: false
  };
}

export function mappedResult<T>(
  result: ProviderResult<unknown>,
  mapper: (value: unknown) => T | null
): ProviderResult<T[]> {
  if (result.status !== 'success') return result as ProviderResult<T[]>;
  if (!Array.isArray(result.data)) {
    return { status: 'error', error: 'El backend devolvió un contrato de lista inválido.', isDemo: false };
  }
  const mapped = result.data.map(mapper);
  if (mapped.some(item => item === null)) {
    return { status: 'error', error: 'El backend devolvió una entidad incompleta.', isDemo: false };
  }
  return { ...result, data: mapped as T[] };
}
