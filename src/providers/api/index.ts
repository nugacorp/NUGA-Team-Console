import {
  DashboardProvider,
  TasksProvider,
  DecisionsProvider,
  AgentsProvider,
  ConversationsProvider,
  ProjectsProvider,
  WispProvider,
  NugaCoreProvider,
  MarketingProvider,
  AdministrationProvider,
  DeliverablesProvider,
  AuditProvider,
  ConfigurationProvider,
  AppProviders
} from '../contracts';
import {
  AgentProfile,
  AgentRole,
  Project,
  Task,
  TaskRun,
  TaskComment,
  Decision,
  WispTower,
  MikroTikRouter,
  WispLink,
  WispIncident,
  Campaign,
  MediaAsset,
  Deliverable,
  AdminItem,
  AuditEvent,
  Conversation,
  Message,
  MessageAttachment,
  AppNotification,
  AppSettings,
  User,
  ProviderResult,
  ServerStatusContract,
  BackendCapabilities,
  AuditRecordPayload,
  AppMode
} from '../../types';
import { getApiCsrfToken } from '../../auth/apiCsrf';
import {
  parseBackendCapabilities,
  parseServerStatusContract,
  toDecisionActionRequest
} from './contracts';
import {
  HermesTaskExtension,
  mapAuditEvent,
  mapDecision,
  mapDeliverable,
  mappedResult,
  mapHermesTask
} from './mappers';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code: string = 'API_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkUnavailableError extends ApiError {
  constructor(message = 'No fue posible conectar con el servidor backend NUGA.') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'NetworkUnavailableError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Acceso no autorizado. Se requiere token o sesión válida en el backend.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export interface HttpClientConfig {
  baseUrl: string;
  mode: AppMode;
  timeoutMs?: number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly mode: AppMode;
  private readonly timeoutMs: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.mode = config.mode;
    this.timeoutMs = config.timeoutMs || 8000;
  }

  getEffectiveMode(): AppMode {
    return this.mode;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ProviderResult<T>> {
    const requestedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const normalizedPath =
      this.baseUrl.endsWith('/api') && requestedPath.startsWith('/api/')
        ? requestedPath.slice('/api'.length)
        : requestedPath;
    const url = `${this.baseUrl}${normalizedPath}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Nuga-Mode': this.mode,
        ...(options.headers as Record<string, string> || {})
      };
      const method = (options.method ?? 'GET').toUpperCase();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfToken = getApiCsrfToken();
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.status === 401 || response.status === 403) {
        return {
          status: 'unauthorized',
          error: `Error de autorización (${response.status}): ${response.statusText}`,
          isDemo: false
        };
      }

      if (response.status === 404) {
        return {
          status: 'empty',
          error: 'Recurso no encontrado en el servidor.',
          isDemo: false
        };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          status: 'error',
          error: `Error del servidor HTTP ${response.status}: ${errorText || response.statusText}`,
          isDemo: false
        };
      }

      const data = (await response.json()) as T;
      return {
        data,
        status: 'success',
        isDemo: false,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';
      const msg = isAbort
        ? `Tiempo de espera agotado al conectar con el backend (${this.baseUrl})`
        : `Servidor no disponible en ${this.baseUrl}: ${err.message || 'Error de red'}`;

      return {
        status: 'unavailable',
        error: msg,
        isDemo: false
      };
    }
  }
}

export class ApiDashboardProvider implements DashboardProvider {
  constructor(private readonly client: HttpClient) {}

  async getSummaryMetrics() {
    return this.client.request<{
      activeTasks: number;
      pendingDecisions: number;
      criticalDecisions: number;
      openIncidents: number;
      teamCount: number;
      activeProjects: number;
      systemHealthPercent: number;
    }>('/api/v1/dashboard/metrics');
  }

  async getExecutiveOverview() {
    return this.client.request<{
      summary: string;
      priorities: string[];
      risks: string[];
    }>('/api/v1/dashboard/overview');
  }
}

export class ApiTasksProvider implements TasksProvider {
  constructor(private readonly client: HttpClient) {}

  async getTasks(): Promise<ProviderResult<Task[]>> {
    const tasksResult = await this.client.request<unknown>('/api/v1/hermes/tasks');
    if (tasksResult.status !== 'success') return tasksResult as ProviderResult<Task[]>;
    if (!Array.isArray(tasksResult.data)) {
      return { status: 'error', error: 'Hermes devolvió una lista de tareas inválida.', isDemo: false };
    }
    const extensionsResult = await this.client.request<unknown>('/api/v1/console/task-extensions');
    const extensions = extensionsResult.status === 'success' && Array.isArray(extensionsResult.data)
      ? extensionsResult.data.filter((value): value is HermesTaskExtension => {
          if (!value || typeof value !== 'object') return false;
          const candidate = value as Partial<HermesTaskExtension>;
          return typeof candidate.hermes_board_slug === 'string'
            && typeof candidate.hermes_task_id === 'string';
        })
      : [];
    const byTask = new Map(
      extensions.map(extension => [
        `${extension.hermes_board_slug}:${extension.hermes_task_id}`,
        extension
      ])
    );
    const mapped = tasksResult.data.map(value => {
      if (!value || typeof value !== 'object') return null;
      const task = value as { id?: unknown; board?: unknown };
      const key = `${String(task.board ?? '')}:${String(task.id ?? '')}`;
      return mapHermesTask(value, byTask.get(key));
    });
    if (mapped.some(task => task === null)) {
      return { status: 'error', error: 'Hermes devolvió una tarea incompleta.', isDemo: false };
    }
    return { ...tasksResult, data: mapped as Task[] };
  }

  async getTaskById(id: string): Promise<ProviderResult<Task | null>> {
    const separator = id.indexOf(':');
    if (separator < 1 || separator === id.length - 1) {
      return { status: 'error', error: 'Identificador Hermes inválido.', isDemo: false };
    }
    const board = id.slice(0, separator);
    const taskId = id.slice(separator + 1);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(board) || !/^[A-Za-z0-9_-]{1,128}$/.test(taskId)) {
      return { status: 'error', error: 'Identificador Hermes fuera del alcance permitido.', isDemo: false };
    }
    const result = await this.client.request<unknown>(
      `/api/v1/hermes/boards/${encodeURIComponent(board)}/tasks/${encodeURIComponent(taskId)}`
    );
    if (result.status !== 'success') return result as ProviderResult<Task | null>;
    if (!result.data || typeof result.data !== 'object') {
      return { status: 'error', error: 'Hermes devolvió un detalle inválido.', isDemo: false };
    }
    const detail = result.data as Record<string, unknown>;
    const mapped = mapHermesTask(detail.task);
    if (!mapped) {
      return { status: 'error', error: 'Hermes devolvió una tarea incompleta.', isDemo: false };
    }
    const epoch = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
      ? new Date(value * 1000).toISOString()
      : new Date(0).toISOString();
    const comments = Array.isArray(detail.comments) ? detail.comments.flatMap((value, index) => {
      if (!value || typeof value !== 'object') return [];
      const item = value as Record<string, unknown>;
      if (typeof item.author !== 'string' || typeof item.body !== 'string') return [];
      return [{
        id: `${mapped.id}:comment:${index}`,
        authorName: item.author,
        timestamp: epoch(item.createdAt),
        text: item.body,
        isDemo: false
      } satisfies TaskComment];
    }) : [];
    const events = Array.isArray(detail.events) ? detail.events.flatMap((value, index) => {
      if (!value || typeof value !== 'object') return [];
      const item = value as Record<string, unknown>;
      if (typeof item.kind !== 'string') return [];
      return [{
        id: `${mapped.id}:event:${index}`,
        kind: item.kind,
        timestamp: epoch(item.createdAt),
        ...(typeof item.runId === 'string' ? { runId: item.runId } : {})
      }];
    }) : [];
    const runs = Array.isArray(detail.runs) ? detail.runs.flatMap((value, index) => {
      if (!value || typeof value !== 'object') return [];
      const item = value as Record<string, unknown>;
      const id = typeof item.id === 'string' ? item.id
        : typeof item.run_id === 'string' ? item.run_id
        : `${mapped.id}:run:${index}`;
      const rawStatus = typeof item.status === 'string' ? item.status : '';
      const status: TaskRun['status'] = rawStatus === 'running'
        ? 'running'
        : rawStatus === 'failed' || rawStatus === 'error'
          ? 'failed'
          : 'success';
      return [{
        id,
        timestamp: epoch(item.createdAt ?? item.created_at ?? item.started_at),
        status,
        outputSummary: typeof item.summary === 'string' ? item.summary
          : typeof item.output_summary === 'string' ? item.output_summary
          : undefined,
        isDemo: false
      } satisfies TaskRun];
    }) : [];
    return {
      ...result,
      data: {
        ...mapped,
        comments,
        runs,
        events,
        parentTaskIds: Array.isArray(detail.parents) ? detail.parents.filter((v): v is string => typeof v === 'string') : [],
        childTaskIds: Array.isArray(detail.children) ? detail.children.filter((v): v is string => typeof v === 'string') : [],
        latestSummary: typeof detail.latestSummary === 'string' ? detail.latestSummary : undefined
      }
    };
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderResult<Task>> {
    return this.client.request<Task>('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  }

  async updateTask(id: string, partial: Partial<Task>): Promise<ProviderResult<Task>> {
    return this.client.request<Task>(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
  }

  async addTaskComment(taskId: string, comment: Omit<TaskComment, 'id' | 'timestamp'>): Promise<ProviderResult<TaskComment>> {
    return this.client.request<TaskComment>(`/api/v1/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment)
    });
  }

  async getTaskRuns(taskId: string): Promise<ProviderResult<TaskRun[]>> {
    const separator = taskId.indexOf(':');
    if (separator < 1 || separator === taskId.length - 1) {
      return { status: 'error', error: 'Identificador Hermes inválido.', isDemo: false };
    }
    const board = taskId.slice(0, separator);
    const id = taskId.slice(separator + 1);
    return this.client.request<TaskRun[]>(
      `/api/v1/hermes/boards/${encodeURIComponent(board)}/tasks/${encodeURIComponent(id)}/runs`
    );
  }
}

export class ApiDecisionsProvider implements DecisionsProvider {
  constructor(private readonly client: HttpClient) {}

  async getDecisions(): Promise<ProviderResult<Decision[]>> {
    return mappedResult(
      await this.client.request<unknown>('/api/v1/decisions'),
      mapDecision
    );
  }

  async getDecisionById(id: string): Promise<ProviderResult<Decision | null>> {
    return this.client.request<Decision | null>(`/api/v1/decisions/${id}`);
  }

  async executeDecisionAction(
    id: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ): Promise<ProviderResult<Decision>> {
    return this.client.request<Decision>(`/api/v1/decisions/${id}/action`, {
      method: 'POST',
      body: JSON.stringify(toDecisionActionRequest(action, comment, confirmationText))
    });
  }

  async simulateDecision(id: string): Promise<ProviderResult<{ simulatedLogs: string[]; riskSummary: string; rollbackVerified: boolean }>> {
    return this.client.request<{ simulatedLogs: string[]; riskSummary: string; rollbackVerified: boolean }>(
      `/api/v1/decisions/${id}/simulate`,
      { method: 'POST' }
    );
  }
}

export class ApiAgentsProvider implements AgentsProvider {
  constructor(private readonly client: HttpClient) {}

  async getAgents(): Promise<ProviderResult<AgentProfile[]>> {
    return this.client.request<AgentProfile[]>('/api/v1/agents');
  }

  async getAgentById(role: AgentRole): Promise<ProviderResult<AgentProfile | null>> {
    return this.client.request<AgentProfile | null>(`/api/v1/agents/${role}`);
  }

  async updateAgent(role: string, partial: Partial<AgentProfile>): Promise<ProviderResult<AgentProfile>> {
    return this.client.request<AgentProfile>(`/api/v1/agents/${role}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
  }
}

export class ApiConversationsProvider implements ConversationsProvider {
  constructor(private readonly client: HttpClient) {}

  async getConversations(): Promise<ProviderResult<Conversation[]>> {
    return this.client.request<Conversation[]>('/api/v1/conversations');
  }

  async getConversationById(id: string): Promise<ProviderResult<Conversation | null>> {
    return this.client.request<Conversation | null>(`/api/v1/conversations/${id}`);
  }

  async getMessages(conversationId: string): Promise<ProviderResult<Message[]>> {
    return this.client.request<Message[]>(`/api/v1/conversations/${conversationId}/messages`);
  }

  async sendMessage(
    conversationId: string,
    content: string,
    sender: 'user' | AgentRole,
    attachments?: MessageAttachment[]
  ): Promise<ProviderResult<Message>> {
    return this.client.request<Message>(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, sender, attachments })
    });
  }
}

export class ApiProjectsProvider implements ProjectsProvider {
  constructor(private readonly client: HttpClient) {}

  async getProjects(): Promise<ProviderResult<Project[]>> {
    return this.client.request<Project[]>('/api/v1/projects');
  }

  async getProjectById(id: string): Promise<ProviderResult<Project | null>> {
    return this.client.request<Project | null>(`/api/v1/projects/${id}`);
  }

  async createProject(project: Omit<Project, 'id'>): Promise<ProviderResult<Project>> {
    return this.client.request<Project>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  }

  async updateProject(id: string, partial: Partial<Project>): Promise<ProviderResult<Project>> {
    return this.client.request<Project>(`/api/v1/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
  }
}

export class ApiWispProvider implements WispProvider {
  constructor(private readonly client: HttpClient) {}

  async getTowers(): Promise<ProviderResult<WispTower[]>> {
    return this.client.request<WispTower[]>('/api/v1/wisp/towers');
  }

  async getRouters(): Promise<ProviderResult<MikroTikRouter[]>> {
    return this.client.request<MikroTikRouter[]>('/api/v1/wisp/routers');
  }

  async getLinks(): Promise<ProviderResult<WispLink[]>> {
    return this.client.request<WispLink[]>('/api/v1/wisp/links');
  }

  async getIncidents(): Promise<ProviderResult<WispIncident[]>> {
    return this.client.request<WispIncident[]>('/api/v1/wisp/incidents');
  }

  async createIncident(incident: Omit<WispIncident, 'id' | 'detectedAt'>): Promise<ProviderResult<WispIncident>> {
    return this.client.request<WispIncident>('/api/v1/wisp/incidents', {
      method: 'POST',
      body: JSON.stringify(incident)
    });
  }

  async resolveIncident(incidentId: string, resolutionEvidence?: string): Promise<ProviderResult<WispIncident>> {
    return this.client.request<WispIncident>(`/api/v1/wisp/incidents/${incidentId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionEvidence })
    });
  }
}

export class ApiNugaCoreProvider implements NugaCoreProvider {
  constructor(private readonly client: HttpClient) {}

  async getArchitectureOverview() {
    return this.client.request<{
      systemHealth: number;
      activePipelines: number;
      openPullRequests: number;
      testCoveragePercent: number;
      lastDeployment: string;
      codeSmellsCount: number;
    }>('/api/v1/nugacore/overview');
  }

  async getRepositories() {
    return this.client.request<any[]>('/api/v1/nugacore/repositories');
  }

  async getPipelines() {
    return this.client.request<any[]>('/api/v1/nugacore/pipelines');
  }
}

export class ApiMarketingProvider implements MarketingProvider {
  constructor(private readonly client: HttpClient) {}

  async getCampaigns(): Promise<ProviderResult<Campaign[]>> {
    return this.client.request<Campaign[]>('/api/v1/marketing/campaigns');
  }

  async getMediaAssets(): Promise<ProviderResult<MediaAsset[]>> {
    return this.client.request<MediaAsset[]>('/api/v1/marketing/media-assets');
  }

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<ProviderResult<Campaign>> {
    return this.client.request<Campaign>('/api/v1/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign)
    });
  }

  async createMediaAsset(asset: Omit<MediaAsset, 'id'>): Promise<ProviderResult<MediaAsset>> {
    return this.client.request<MediaAsset>('/api/v1/marketing/media-assets', {
      method: 'POST',
      body: JSON.stringify(asset)
    });
  }
}

export class ApiAdministrationProvider implements AdministrationProvider {
  constructor(private readonly client: HttpClient) {}

  async getAdminItems(): Promise<ProviderResult<AdminItem[]>> {
    return this.client.request<AdminItem[]>('/api/v1/admin/items');
  }

  async createAdminItem(item: Omit<AdminItem, 'id'>): Promise<ProviderResult<AdminItem>> {
    return this.client.request<AdminItem>('/api/v1/admin/items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async updateAdminItem(id: string, partial: Partial<AdminItem>): Promise<ProviderResult<AdminItem>> {
    return this.client.request<AdminItem>(`/api/v1/admin/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
  }

  async deleteAdminItem(id: string): Promise<ProviderResult<boolean>> {
    const res = await this.client.request<{ success: boolean }>(`/api/v1/admin/items/${id}`, {
      method: 'DELETE'
    });
    return {
      status: res.status,
      data: res.data?.success ?? false,
      error: res.error,
      isDemo: false
    };
  }
}

export class ApiDeliverablesProvider implements DeliverablesProvider {
  constructor(private readonly client: HttpClient) {}

  async getDeliverables(): Promise<ProviderResult<Deliverable[]>> {
    return mappedResult(
      await this.client.request<unknown>('/api/v1/deliverables'),
      mapDeliverable
    );
  }

  async getDeliverableById(id: string): Promise<ProviderResult<Deliverable | null>> {
    return this.client.request<Deliverable | null>(`/api/v1/deliverables/${id}`);
  }

  async updateDeliverableStatus(id: string, status: Deliverable['status']): Promise<ProviderResult<Deliverable>> {
    return this.client.request<Deliverable>(`/api/v1/deliverables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
}

export class ApiAuditProvider implements AuditProvider {
  constructor(private readonly client: HttpClient) {}

  async getAuditEvents(): Promise<ProviderResult<AuditEvent[]>> {
    return mappedResult(
      await this.client.request<unknown>('/api/v1/audit/events'),
      mapAuditEvent
    );
  }

  async logAuditEvent(payload: AuditRecordPayload): Promise<ProviderResult<AuditEvent>> {
    return this.client.request<AuditEvent>('/api/v1/audit/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export class ApiConfigurationProvider implements ConfigurationProvider {
  constructor(private readonly client: HttpClient) {}

  async getSettings(): Promise<ProviderResult<AppSettings>> {
    return this.client.request<AppSettings>('/api/v1/config/settings');
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<ProviderResult<AppSettings>> {
    return this.client.request<AppSettings>('/api/v1/config/settings', {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
  }

  async getUser(): Promise<ProviderResult<User>> {
    return this.client.request<User>('/api/v1/auth/me');
  }

  async getServerStatus(): Promise<ProviderResult<ServerStatusContract>> {
    const response = await this.client.request<unknown>('/api/v1/status');
    if (response.status !== 'success') return response as ProviderResult<ServerStatusContract>;

    const contract = parseServerStatusContract(response.data);
    if (!contract || contract.source !== 'server') {
      return {
        status: 'error',
        error: 'El backend devolvió un contrato de estado inválido.',
        isDemo: false
      };
    }

    return { ...response, data: contract };
  }

  async getCapabilities(): Promise<ProviderResult<BackendCapabilities>> {
    const response = await this.client.request<unknown>('/api/v1/capabilities');
    if (response.status !== 'success') return response as ProviderResult<BackendCapabilities>;

    const capabilities = parseBackendCapabilities(response.data);
    if (!capabilities) {
      return {
        status: 'error',
        error: 'El backend devolvió un contrato de capacidades inválido.',
        isDemo: false
      };
    }

    return { ...response, data: capabilities };
  }

  async getNotifications(): Promise<ProviderResult<AppNotification[]>> {
    return this.client.request<AppNotification[]>('/api/v1/notifications');
  }

  async markNotificationRead(id: string): Promise<ProviderResult<boolean>> {
    const res = await this.client.request<{ success: boolean }>(`/api/v1/notifications/${id}/read`, {
      method: 'POST'
    });
    return {
      status: res.status,
      data: res.data?.success ?? false,
      error: res.error,
      isDemo: false
    };
  }

  async clearNotifications(): Promise<ProviderResult<boolean>> {
    const res = await this.client.request<{ success: boolean }>('/api/v1/notifications/clear', {
      method: 'POST'
    });
    return {
      status: res.status,
      data: res.data?.success ?? false,
      error: res.error,
      isDemo: false
    };
  }

  async resetDemoData(): Promise<ProviderResult<boolean>> {
    // In staging and production, resetting demo data is not supported or allowed
    return {
      status: 'error',
      error: 'Operación no permitida: El restablecimiento de datos DEMO no aplica en entornos remotos.',
      isDemo: false
    };
  }
}

export function createApiProviders(config: HttpClientConfig): AppProviders {
  const client = new HttpClient(config);

  return {
    dashboard: new ApiDashboardProvider(client),
    tasks: new ApiTasksProvider(client),
    decisions: new ApiDecisionsProvider(client),
    agents: new ApiAgentsProvider(client),
    conversations: new ApiConversationsProvider(client),
    projects: new ApiProjectsProvider(client),
    wisp: new ApiWispProvider(client),
    nugaCore: new ApiNugaCoreProvider(client),
    marketing: new ApiMarketingProvider(client),
    administration: new ApiAdministrationProvider(client),
    deliverables: new ApiDeliverablesProvider(client),
    audit: new ApiAuditProvider(client),
    configuration: new ApiConfigurationProvider(client)
  };
}
