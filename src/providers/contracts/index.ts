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

export interface DashboardProvider {
  getSummaryMetrics(): Promise<
    ProviderResult<{
      activeTasks: number;
      pendingDecisions: number;
      criticalDecisions: number;
      openIncidents: number;
      teamCount: number;
      activeProjects: number;
      systemHealthPercent: number;
    }>
  >;
  getExecutiveOverview(): Promise<
    ProviderResult<{
      summary: string;
      priorities: string[];
      risks: string[];
    }>
  >;
}

export interface TasksProvider {
  getTasks(): Promise<ProviderResult<Task[]>>;
  getTaskById(id: string): Promise<ProviderResult<Task | null>>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderResult<Task>>;
  updateTask(id: string, partial: Partial<Task>): Promise<ProviderResult<Task>>;
  addTaskComment(taskId: string, comment: Omit<TaskComment, 'id' | 'timestamp'>): Promise<ProviderResult<TaskComment>>;
  getTaskRuns(taskId: string): Promise<ProviderResult<TaskRun[]>>;
}

export interface DecisionsProvider {
  getDecisions(): Promise<ProviderResult<Decision[]>>;
  getDecisionById(id: string): Promise<ProviderResult<Decision | null>>;
  executeDecisionAction(
    id: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ): Promise<ProviderResult<Decision>>;
  simulateDecision(
    id: string
  ): Promise<ProviderResult<{ simulatedLogs: string[]; riskSummary: string; rollbackVerified: boolean }>>;
}

export interface AgentsProvider {
  getAgents(): Promise<ProviderResult<AgentProfile[]>>;
  getAgentById(role: AgentRole): Promise<ProviderResult<AgentProfile | null>>;
  updateAgent(role: string, partial: Partial<AgentProfile>): Promise<ProviderResult<AgentProfile>>;
}

export interface ConversationsProvider {
  getConversations(): Promise<ProviderResult<Conversation[]>>;
  getConversationById(id: string): Promise<ProviderResult<Conversation | null>>;
  getMessages(conversationId: string): Promise<ProviderResult<Message[]>>;
  sendMessage(
    conversationId: string,
    content: string,
    sender: 'user' | AgentRole,
    attachments?: MessageAttachment[]
  ): Promise<ProviderResult<Message>>;
}

export interface ProjectsProvider {
  getProjects(): Promise<ProviderResult<Project[]>>;
  getProjectById(id: string): Promise<ProviderResult<Project | null>>;
  createProject(project: Omit<Project, 'id'>): Promise<ProviderResult<Project>>;
  updateProject(id: string, partial: Partial<Project>): Promise<ProviderResult<Project>>;
}

export interface WispProvider {
  getTowers(): Promise<ProviderResult<WispTower[]>>;
  getRouters(): Promise<ProviderResult<MikroTikRouter[]>>;
  getLinks(): Promise<ProviderResult<WispLink[]>>;
  getIncidents(): Promise<ProviderResult<WispIncident[]>>;
  createIncident(incident: Omit<WispIncident, 'id' | 'detectedAt'>): Promise<ProviderResult<WispIncident>>;
  resolveIncident(incidentId: string, resolutionEvidence?: string): Promise<ProviderResult<WispIncident>>;
}

export interface NugaCoreProvider {
  getArchitectureOverview(): Promise<
    ProviderResult<{
      systemHealth: number;
      activePipelines: number;
      openPullRequests: number;
      testCoveragePercent: number;
      lastDeployment: string;
      codeSmellsCount: number;
    }>
  >;
  getRepositories(): Promise<ProviderResult<any[]>>;
  getPipelines(): Promise<ProviderResult<any[]>>;
}

export interface MarketingProvider {
  getCampaigns(): Promise<ProviderResult<Campaign[]>>;
  getMediaAssets(): Promise<ProviderResult<MediaAsset[]>>;
  createCampaign(campaign: Omit<Campaign, 'id'>): Promise<ProviderResult<Campaign>>;
  createMediaAsset(asset: Omit<MediaAsset, 'id'>): Promise<ProviderResult<MediaAsset>>;
}

export interface AdministrationProvider {
  getAdminItems(): Promise<ProviderResult<AdminItem[]>>;
  createAdminItem(item: Omit<AdminItem, 'id'>): Promise<ProviderResult<AdminItem>>;
  updateAdminItem(id: string, partial: Partial<AdminItem>): Promise<ProviderResult<AdminItem>>;
  deleteAdminItem(id: string): Promise<ProviderResult<boolean>>;
}

export interface DeliverablesProvider {
  getDeliverables(): Promise<ProviderResult<Deliverable[]>>;
  getDeliverableById(id: string): Promise<ProviderResult<Deliverable | null>>;
  updateDeliverableStatus(id: string, status: Deliverable['status']): Promise<ProviderResult<Deliverable>>;
}

export interface AuditProvider {
  getAuditEvents(): Promise<ProviderResult<AuditEvent[]>>;
  logAuditEvent(payload: AuditRecordPayload): Promise<ProviderResult<AuditEvent>>;
}

export interface ConfigurationProvider {
  getSettings(): Promise<ProviderResult<AppSettings>>;
  updateSettings(partial: Partial<AppSettings>): Promise<ProviderResult<AppSettings>>;
  getUser(): Promise<ProviderResult<User>>;
  getServerStatus(): Promise<ProviderResult<ServerStatusContract>>;
  getCapabilities(): Promise<ProviderResult<BackendCapabilities>>;
  getNotifications(): Promise<ProviderResult<AppNotification[]>>;
  markNotificationRead(id: string): Promise<ProviderResult<boolean>>;
  clearNotifications(): Promise<ProviderResult<boolean>>;
  resetDemoData(): Promise<ProviderResult<boolean>>;
}

export interface AppProviders {
  dashboard: DashboardProvider;
  tasks: TasksProvider;
  decisions: DecisionsProvider;
  agents: AgentsProvider;
  conversations: ConversationsProvider;
  projects: ProjectsProvider;
  wisp: WispProvider;
  nugaCore: NugaCoreProvider;
  marketing: MarketingProvider;
  administration: AdministrationProvider;
  deliverables: DeliverablesProvider;
  audit: AuditProvider;
  configuration: ConfigurationProvider;
}
