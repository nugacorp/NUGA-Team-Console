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
  AuditRecordPayload
} from '../../types';
import { storageService } from '../../services/storageService';
import { DEFAULT_MODE_CAPABILITIES } from '../../config/appConfig';

/**
 * Ensures all entities in an array or single object have `isDemo: true`
 */
function tagDemo<T extends Record<string, any>>(item: T): T {
  return { ...item, isDemo: true };
}

function tagDemoList<T extends Record<string, any>>(items: T[]): T[] {
  return items.map(item => ({ ...item, isDemo: true }));
}

function demoSuccess<T>(data: T): ProviderResult<T> {
  return {
    data,
    status: 'success',
    isDemo: true,
    timestamp: new Date().toISOString()
  };
}

export class DemoDashboardProvider implements DashboardProvider {
  async getSummaryMetrics() {
    const tasks = storageService.getTasks();
    const decisions = storageService.getDecisions();
    const incidents = storageService.getIncidents();
    const agents = storageService.getAgents();
    const projects = storageService.getProjects();

    const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;
    const pendingDecisions = decisions.filter(d => d.status === 'pending').length;
    const criticalDecisions = decisions.filter(d => d.status === 'pending' && (d.risk === 'critical' || d.risk === 'high')).length;
    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating' || i.status === 'mitigating').length;

    return demoSuccess({
      activeTasks,
      pendingDecisions,
      criticalDecisions,
      openIncidents,
      teamCount: agents.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      systemHealthPercent: 96.4
    });
  }

  async getExecutiveOverview() {
    return demoSuccess({
      summary: 'Operaciones estables en simulación DEMO. 5 perfiles del equipo activos y supervisados.',
      priorities: [
        'Mitigar saturación en enlace troncal DEMO Torre Norte',
        'Validar propuesta de decisión DEC-004 de enrutamiento OSPF',
        'Supervisar lanzamiento de campaña multimedia Fibra Óptica'
      ],
      risks: [
        'Congestión en hora pico (Simulado)',
        'Caducidad de certificados en 14 días (Simulado)'
      ]
    });
  }
}

export class DemoTasksProvider implements TasksProvider {
  async getTasks(): Promise<ProviderResult<Task[]>> {
    const tasks = storageService.getTasks();
    return demoSuccess(tagDemoList(tasks));
  }

  async getTaskById(id: string): Promise<ProviderResult<Task | null>> {
    const tasks = storageService.getTasks();
    const found = tasks.find(t => t.id === id);
    return demoSuccess(found ? tagDemo(found) : null);
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderResult<Task>> {
    const created = storageService.createTask(task);
    return demoSuccess(tagDemo(created));
  }

  async updateTask(id: string, partial: Partial<Task>): Promise<ProviderResult<Task>> {
    const tasks = storageService.updateTask(id, partial);
    const updated = tasks.find(t => t.id === id) || ({} as Task);
    return demoSuccess(tagDemo(updated));
  }

  async addTaskComment(taskId: string, comment: Omit<TaskComment, 'id' | 'timestamp'>): Promise<ProviderResult<TaskComment>> {
    const tasks = storageService.addTaskComment(taskId, comment.text || (comment as any).content || '');
    const task = tasks.find(t => t.id === taskId);
    const newComment = task?.comments?.[task.comments.length - 1] || {
      id: `c-${Date.now()}`,
      authorName: comment.authorName || 'Ramiro (Propietario)',
      isAgent: false,
      timestamp: 'Justo ahora',
      text: comment.text || ''
    };
    return demoSuccess(tagDemo(newComment));
  }

  async getTaskRuns(taskId: string): Promise<ProviderResult<TaskRun[]>> {
    const tasks = storageService.getTasks();
    const task = tasks.find(t => t.id === taskId);
    return demoSuccess(tagDemoList(task?.runs || []));
  }
}

export class DemoDecisionsProvider implements DecisionsProvider {
  async getDecisions(): Promise<ProviderResult<Decision[]>> {
    const decisions = storageService.getDecisions();
    return demoSuccess(tagDemoList(decisions));
  }

  async getDecisionById(id: string): Promise<ProviderResult<Decision | null>> {
    const decisions = storageService.getDecisions();
    const found = decisions.find(d => d.id === id);
    return demoSuccess(found ? tagDemo(found) : null);
  }

  async executeDecisionAction(
    id: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ): Promise<ProviderResult<Decision>> {
    const result = storageService.executeDecisionAction(id, action, comment, confirmationText);
    const updated = result.updatedDecision || result.decisions.find(d => d.id === id) || ({} as Decision);
    return demoSuccess(tagDemo(updated));
  }

  async simulateDecision(id: string): Promise<ProviderResult<{ simulatedLogs: string[]; riskSummary: string; rollbackVerified: boolean }>> {
    const decisions = storageService.getDecisions();
    const dec = decisions.find(d => d.id === id);
    return demoSuccess({
      simulatedLogs: [
        `[DRY-RUN DEMO] Validando propuesta para ${dec?.code || id}...`,
        `[DRY-RUN DEMO] Comprobando sintaxis y consistencia de topología RouterOS v7...`,
        `[DRY-RUN DEMO] Comprobando aislamiento de tabla de enrutamiento...`,
        `[DRY-RUN DEMO] Prueba de rollback generada: script revert_diff_${dec?.code || 'run'}.rsc verificado con éxito.`
      ],
      riskSummary: `Simulación completada sin anomalías sintácticas. Riesgo evaluado: ${dec?.risk || 'medio'}.`,
      rollbackVerified: true
    });
  }
}

export class DemoAgentsProvider implements AgentsProvider {
  async getAgents(): Promise<ProviderResult<AgentProfile[]>> {
    const agents = storageService.getAgents();
    return demoSuccess(tagDemoList(agents));
  }

  async getAgentById(role: AgentRole): Promise<ProviderResult<AgentProfile | null>> {
    const agents = storageService.getAgents();
    const found = agents.find(a => a.id === role);
    return demoSuccess(found ? tagDemo(found) : null);
  }

  async updateAgent(role: string, partial: Partial<AgentProfile>): Promise<ProviderResult<AgentProfile>> {
    const updatedList = storageService.updateAgent(role, partial);
    const updated = updatedList.find(a => a.id === role) || ({} as AgentProfile);
    return demoSuccess(tagDemo(updated));
  }
}

export class DemoConversationsProvider implements ConversationsProvider {
  async getConversations(): Promise<ProviderResult<Conversation[]>> {
    const convs = storageService.getConversations();
    return demoSuccess(tagDemoList(convs));
  }

  async getConversationById(id: string): Promise<ProviderResult<Conversation | null>> {
    const convs = storageService.getConversations();
    const found = convs.find(c => c.id === id);
    return demoSuccess(found ? tagDemo(found) : null);
  }

  async getMessages(conversationId: string): Promise<ProviderResult<Message[]>> {
    const messages = storageService.getMessages(conversationId);
    return demoSuccess(tagDemoList(messages));
  }

  async sendMessage(
    conversationId: string,
    content: string,
    _sender: 'user' | AgentRole,
    attachments?: MessageAttachment[]
  ): Promise<ProviderResult<Message>> {
    const { botMessage } = storageService.sendMessage(conversationId, content, { attachments });
    return demoSuccess(tagDemo(botMessage));
  }
}

export class DemoProjectsProvider implements ProjectsProvider {
  async getProjects(): Promise<ProviderResult<Project[]>> {
    const projects = storageService.getProjects();
    return demoSuccess(tagDemoList(projects));
  }

  async getProjectById(id: string): Promise<ProviderResult<Project | null>> {
    const projects = storageService.getProjects();
    const found = projects.find(p => p.id === id);
    return demoSuccess(found ? tagDemo(found) : null);
  }

  async createProject(project: Omit<Project, 'id'>): Promise<ProviderResult<Project>> {
    const current = storageService.getProjects();
    const newProj: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      isDemo: true
    };
    storageService.saveProjects([newProj, ...current]);
    return demoSuccess(newProj);
  }

  async updateProject(id: string, partial: Partial<Project>): Promise<ProviderResult<Project>> {
    const current = storageService.getProjects();
    const updated = current.map(p => (p.id === id ? { ...p, ...partial, isDemo: true } : p));
    storageService.saveProjects(updated);
    const found = updated.find(p => p.id === id)!;
    return demoSuccess(found);
  }
}

export class DemoWispProvider implements WispProvider {
  async getTowers(): Promise<ProviderResult<WispTower[]>> {
    return demoSuccess(tagDemoList(storageService.getTowers()));
  }

  async getRouters(): Promise<ProviderResult<MikroTikRouter[]>> {
    return demoSuccess(tagDemoList(storageService.getRouters()));
  }

  async getLinks(): Promise<ProviderResult<WispLink[]>> {
    return demoSuccess(tagDemoList(storageService.getLinks()));
  }

  async getIncidents(): Promise<ProviderResult<WispIncident[]>> {
    return demoSuccess(tagDemoList(storageService.getIncidents()));
  }

  async createIncident(incident: Omit<WispIncident, 'id' | 'detectedAt'>): Promise<ProviderResult<WispIncident>> {
    const created = storageService.createIncident(incident);
    return demoSuccess(tagDemo(created));
  }

  async resolveIncident(incidentId: string, resolutionEvidence?: string): Promise<ProviderResult<WispIncident>> {
    const incidents = storageService.getIncidents();
    const updated = incidents.map(i =>
      i.id === incidentId
        ? {
            ...i,
            status: 'resolved' as const,
            resolvedAt: new Date().toISOString(),
            resolutionEvidence: resolutionEvidence || 'Incidente resuelto satisfactoriamente en simulación DEMO.',
            isDemo: true
          }
        : i
    );
    storageService.saveIncidents(updated);
    const found = updated.find(i => i.id === incidentId)!;
    return demoSuccess(found);
  }
}

export class DemoNugaCoreProvider implements NugaCoreProvider {
  async getArchitectureOverview() {
    return demoSuccess({
      systemHealth: 98.2,
      activePipelines: 4,
      openPullRequests: 2,
      testCoveragePercent: 88.6,
      lastDeployment: 'Hace 45 min (Simulado CI/CD)',
      codeSmellsCount: 0
    });
  }

  async getRepositories() {
    return demoSuccess([
      {
        id: 'repo-1',
        name: 'nugacorp/NUGA-Team-Console',
        branch: 'main',
        status: 'clean',
        tests: 'passed',
        isDemo: true
      },
      {
        id: 'repo-2',
        name: 'nugacorp/nuga-core-engine',
        branch: 'v2-dev',
        status: 'clean',
        tests: 'passed',
        isDemo: true
      }
    ]);
  }

  async getPipelines() {
    return demoSuccess([
      {
        id: 'pipe-1',
        name: 'Build & Unit Tests',
        status: 'success',
        duration: '1m 24s',
        commit: 'a9f82d1',
        isDemo: true
      },
      {
        id: 'pipe-2',
        name: 'Security Static Audit',
        status: 'success',
        duration: '45s',
        commit: 'a9f82d1',
        isDemo: true
      }
    ]);
  }
}

export class DemoMarketingProvider implements MarketingProvider {
  async getCampaigns(): Promise<ProviderResult<Campaign[]>> {
    return demoSuccess(tagDemoList(storageService.getCampaigns()));
  }

  async getMediaAssets(): Promise<ProviderResult<MediaAsset[]>> {
    return demoSuccess(tagDemoList(storageService.getMediaAssets()));
  }

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<ProviderResult<Campaign>> {
    const created = storageService.createCampaign(campaign);
    return demoSuccess(tagDemo(created));
  }

  async createMediaAsset(asset: Omit<MediaAsset, 'id'>): Promise<ProviderResult<MediaAsset>> {
    const current = storageService.getMediaAssets();
    const newAsset: MediaAsset = {
      ...asset,
      id: `asset-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isDemo: true
    };
    storageService.saveMediaAssets([newAsset, ...current]);
    return demoSuccess(newAsset);
  }
}

export class DemoAdministrationProvider implements AdministrationProvider {
  async getAdminItems(): Promise<ProviderResult<AdminItem[]>> {
    return demoSuccess(tagDemoList(storageService.getAdminItems()));
  }

  async createAdminItem(item: Omit<AdminItem, 'id'>): Promise<ProviderResult<AdminItem>> {
    const created = storageService.createAdminItem(item);
    return demoSuccess(tagDemo(created));
  }

  async updateAdminItem(id: string, partial: Partial<AdminItem>): Promise<ProviderResult<AdminItem>> {
    const current = storageService.getAdminItems();
    const updated = current.map(item => (item.id === id ? { ...item, ...partial, isDemo: true } : item));
    storageService.saveAdminItems(updated);
    const found = updated.find(item => item.id === id)!;
    return demoSuccess(found);
  }

  async deleteAdminItem(id: string): Promise<ProviderResult<boolean>> {
    const current = storageService.getAdminItems();
    const filtered = current.filter(item => item.id !== id);
    storageService.saveAdminItems(filtered);
    return demoSuccess(true);
  }
}

export class DemoDeliverablesProvider implements DeliverablesProvider {
  async getDeliverables(): Promise<ProviderResult<Deliverable[]>> {
    return demoSuccess(tagDemoList(storageService.getDeliverables()));
  }

  async getDeliverableById(id: string): Promise<ProviderResult<Deliverable | null>> {
    const list = storageService.getDeliverables();
    const found = list.find(d => d.id === id);
    return demoSuccess(found ? tagDemo(found) : null);
  }

  async updateDeliverableStatus(id: string, status: Deliverable['status']): Promise<ProviderResult<Deliverable>> {
    const updated = storageService.updateDeliverableStatus(id, status);
    return demoSuccess(tagDemo(updated));
  }
}

export class DemoAuditProvider implements AuditProvider {
  async getAuditEvents(): Promise<ProviderResult<AuditEvent[]>> {
    return demoSuccess(tagDemoList(storageService.getAuditEvents()));
  }

  async logAuditEvent(payload: AuditRecordPayload): Promise<ProviderResult<AuditEvent>> {
    const logged = storageService.logAuditEvent({
      ...payload,
      jsonPayload: payload.jsonPayload || {},
      dataSource: 'local_demo',
      mode: 'demo'
    });
    return demoSuccess(tagDemo(logged));
  }
}

export class DemoConfigurationProvider implements ConfigurationProvider {
  async getSettings(): Promise<ProviderResult<AppSettings>> {
    return demoSuccess(tagDemo(storageService.getSettings()));
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<ProviderResult<AppSettings>> {
    const updated = storageService.updateSettings(partial);
    return demoSuccess(tagDemo(updated));
  }

  async getUser(): Promise<ProviderResult<User>> {
    return demoSuccess(tagDemo(storageService.getUser()));
  }

  async getServerStatus(): Promise<ProviderResult<ServerStatusContract>> {
    return demoSuccess({
      mode: 'demo',
      source: 'client',
      hermes: 'not_connected',
      writesEnabled: false,
      integrations: {
        nugacore: false,
        mikromcp: false,
        google: false
      }
    });
  }

  async getCapabilities(): Promise<ProviderResult<BackendCapabilities>> {
    return demoSuccess(DEFAULT_MODE_CAPABILITIES.demo);
  }

  async getNotifications(): Promise<ProviderResult<AppNotification[]>> {
    return demoSuccess(tagDemoList(storageService.getNotifications()));
  }

  async markNotificationRead(id: string): Promise<ProviderResult<boolean>> {
    storageService.markNotificationRead(id);
    return demoSuccess(true);
  }

  async clearNotifications(): Promise<ProviderResult<boolean>> {
    storageService.clearAllNotifications();
    return demoSuccess(true);
  }

  async resetDemoData(): Promise<ProviderResult<boolean>> {
    storageService.resetToInitial();
    return demoSuccess(true);
  }
}

export function createDemoProviders(): AppProviders {
  return {
    dashboard: new DemoDashboardProvider(),
    tasks: new DemoTasksProvider(),
    decisions: new DemoDecisionsProvider(),
    agents: new DemoAgentsProvider(),
    conversations: new DemoConversationsProvider(),
    projects: new DemoProjectsProvider(),
    wisp: new DemoWispProvider(),
    nugaCore: new DemoNugaCoreProvider(),
    marketing: new DemoMarketingProvider(),
    administration: new DemoAdministrationProvider(),
    deliverables: new DemoDeliverablesProvider(),
    audit: new DemoAuditProvider(),
    configuration: new DemoConfigurationProvider()
  };
}
