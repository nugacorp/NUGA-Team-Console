export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PriorityLevel = 'baja' | 'media' | 'alta' | 'urgente';

export type AgentRole = 'director' | 'nugacore' | 'operaciones' | 'marketing' | 'administracion';

export type HermesStatus = 'No conectado' | 'Disponible' | 'Sincronizando' | 'Procesando tarea' | 'Atención requerida' | 'Error';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  title: string;
  avatar: string;
  isDemo?: boolean;
}

export interface AgentProfile {
  id: AgentRole;
  name: string;
  roleTitle: string;
  department: string;
  avatar: string;
  status: 'active' | 'busy' | 'idle' | 'warning';
  currentTask?: string;
  lastActivity: string;
  model: string;
  autonomyLevel: 'supervisado' | 'semi-autonomo' | 'autonomo';
  requiresApproval: boolean;
  maxExecutionTimeMinutes: number;
  defaultPriority: PriorityLevel;
  responsibilities: string[];
  limits: string[];
  skills: string[];
  allowedTools: string[];
  stats: {
    activeTasks: number;
    completedTasks: number;
    successRate: number;
    recentErrors: number;
    totalRuns: number;
    tokensConsumedEstimate: string;
  };
  systemInstructions: string;
  isDemo?: boolean;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'json' | 'code';
  url?: string;
  size: string;
  isDemo?: boolean;
}

export interface ToolCallSummary {
  toolName: string;
  arguments: Record<string, any>;
  resultSummary: string;
  status: 'success' | 'failed' | 'requires_approval';
  risk: RiskLevel;
  isDemo?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | AgentRole;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  content: string;
  executiveSummary?: string;
  findings?: string[];
  requiredDecisionId?: string;
  technicalEvidence?: string;
  toolCalls?: ToolCallSummary[];
  attachments?: MessageAttachment[];
  createdTaskId?: string;
  isOnlyAnalysis?: boolean;
  isDemo?: boolean;
}

export interface Conversation {
  id: string;
  agentId: AgentRole;
  title: string;
  projectId?: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isProcessing?: boolean;
  isDemo?: boolean;
}

export type TaskStatus = 'triage' | 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'review' | 'completed' | 'done' | 'archived';

export interface TaskRun {
  id: string;
  timestamp: string;
  agentId?: AgentRole;
  durationSeconds?: number;
  status: 'success' | 'failed' | 'running';
  logSummary?: string;
  outputSummary?: string;
  toolsUsed?: string[];
  fullLogs?: string[];
  isDemo?: boolean;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  isAgent?: boolean;
  agentRole?: AgentRole;
  timestamp: string;
  text: string;
  isDemo?: boolean;
}

export interface Task {
  id: string;
  code: string; // e.g. "TSK-101"
  title: string;
  description: string;
  plan?: string[];
  projectId: string;
  assignedAgent: AgentRole;
  priority: PriorityLevel;
  status: TaskStatus;
  progressPercent: number;
  estimatedHours: number;
  loggedHours: number;
  blockedReason?: string;
  requiresHumanApproval: boolean;
  dependencies?: string[]; // Task codes
  deliverablesIds?: string[];
  deliverableIds?: string[];
  comments?: TaskComment[];
  attachments?: MessageAttachment[];
  runs?: TaskRun[];
  createdAt: string;
  updatedAt: string;
  deadline: string;
  isDemo?: boolean;
}

export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'needs_info' | 'postponed' | 'simulated';

export interface DecisionActionLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  comment?: string;
  scopeAdjusted?: string;
}

export interface Decision {
  id: string;
  code: string; // e.g. "DEC-004"
  title: string;
  specialist: AgentRole;
  projectId: string;
  priority: PriorityLevel;
  risk: RiskLevel;
  impact: string;
  riskOfAction: string;
  riskOfInaction: string;
  situation: string;
  evidence: string;
  proposal: string;
  exactChangeDiff: string;
  expectedValidation: string;
  rollbackPlan: string;
  affectedScope: string;
  recommendation: string;
  deadline: string;
  timePendingHours: number;
  status: DecisionStatus;
  /** Motivo explícito registrado si la decisión fue rechazada */
  rejectionReason?: string;
  /** Token o texto de confirmación reforzada si la decisión era de riesgo crítico */
  confirmationToken?: string;
  history: DecisionActionLog[];
  createdAt: string;
  isDemo?: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  category: 'wisp' | 'nugacore' | 'marketing' | 'admin';
  objective: string;
  owner: string;
  team: AgentRole[];
  status: 'active' | 'planning' | 'paused' | 'completed';
  progressPercent: number;
  startDate: string;
  targetEndDate: string;
  risks: { description: string; level: RiskLevel; mitigation: string }[];
  milestones: ProjectMilestone[];
  budgetEstimateUsd: number;
  summaryExecutive: string;
  deliverablesCount: number;
  isDemo?: boolean;
}

export type DeliverableType = 'markdown' | 'pdf' | 'image' | 'video' | 'json' | 'report' | 'checklist' | 'tech_evidence';

export interface Deliverable {
  id: string;
  code: string;
  title: string;
  type: DeliverableType;
  taskId?: string;
  projectId: string;
  agentId: AgentRole;
  createdAt: string;
  fileSize: string;
  simulatedSha256: string;
  status: 'draft' | 'ready_for_review' | 'approved' | 'rejected';
  version: string;
  executiveSummary: string;
  keyIndicators: { label: string; value: string; status?: 'ok' | 'warn' | 'crit' }[];
  findings: { title: string; severity: RiskLevel; detail: string }[];
  recommendations: string[];
  pendingDecisions: string[];
  limitations: string[];
  rawContentMarkdown?: string;
  mediaUrl?: string;
  isDemo?: boolean;
}

export interface WispTower {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'warning' | 'critical' | 'maintenance';
  independentUplink: boolean;
  uplinkProvider: string;
  routerIdentity: string;
  switchModel: string;
  sectorsCount: number;
  connectedClients: number;
  avgSignalDbm: number;
  avgLatencyMs: number;
  currentTrafficMbps: number;
  maxCapacityMbps: number;
  alerts: string[];
  coordinates: { x: number; y: number }; // For visual topology canvas
  isDemo?: boolean;
}

export interface MikroTikFinding {
  id: string;
  title: string;
  severity: RiskLevel;
  category: 'firewall' | 'routing' | 'wireguard' | 'dhcp_dns' | 'queues' | 'security';
  description: string;
  impact: string;
  recommendation: string;
  requiredDecisionCode?: string;
  commandSnippet: string;
}

export interface MikroTikInterface {
  name: string;
  type: 'ethernet' | 'sfp' | 'vlan' | 'wireguard' | 'bridge';
  status: 'up' | 'down';
  ipAddress: string;
  trafficRxMbps: number;
  trafficTxMbps: number;
}

export interface MikroTikRouter {
  id: string;
  identity: string; // e.g. "EDGE-DEMO-01"
  model: string;
  routerOsVersion: string;
  cpuPercent: number;
  ramUsagePercent: number;
  freeDiskMb: number;
  uptime: string;
  towerId: string;
  status: 'optimal' | 'warning' | 'critical';
  interfaces: MikroTikInterface[];
  routeSummary: { total: number; bgp: number; ospf: number; static: number; defaultGateway: string };
  dhcpLeasesCount: number;
  dnsServers: string[];
  firewallRulesCount: number;
  wireguardPeersCount: number;
  queuesSimpleCount: number;
  servicesRunning: { name: string; port: number; status: 'enabled' | 'disabled' }[];
  findings: MikroTikFinding[];
  auditHistory: { date: string; auditorAgent: AgentRole; scorePercent: number; findingsCount: number }[];
  isDemo?: boolean;
}

export interface WispLink {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  frequency: string;
  status: 'optimal' | 'degraded' | 'down';
  bandwidthMbps: number;
  capacityMbps: number;
  snrDb: number;
  distanceKm: number;
  isDemo?: boolean;
}

export interface WispIncident {
  id: string;
  code: string;
  title: string;
  priority: PriorityLevel;
  severity: RiskLevel;
  status: 'open' | 'investigating' | 'mitigating' | 'resolved';
  assignedSpecialist: AgentRole;
  relatedTowerId?: string;
  relatedRouterId?: string;
  affectedClients: number;
  detectedAt: string;
  resolvedAt?: string;
  timeline: { time: string; event: string; author: string }[];
  diagnosis: string;
  proposedActions: string[];
  customerCommunicationPlan: string;
  resolutionEvidence?: string;
  isDemo?: boolean;
}

export type CreativeStep = 'idea' | 'brief' | 'script' | 'storyboard' | 'generation' | 'review' | 'approved' | 'scheduled' | 'published';

export interface Campaign {
  id: string;
  code: string;
  name: string;
  objective: string;
  targetAudience: string;
  valueProposition: string;
  channels: string[];
  simulatedBudgetUsd: number;
  spentBudgetUsd: number;
  scheduleDateRange: string;
  status: 'draft' | 'in_creative' | 'awaiting_approval' | 'active' | 'completed';
  creativeStage: CreativeStep;
  variantsCount: number;
  metrics: {
    impressions: number;
    clicks: number;
    ctrPercent: number;
    leadsGenerated: number;
    cpaUsd: number;
  };
  requiresApproval: boolean;
  assignedAgent: AgentRole;
  isDemo?: boolean;
}

export type IncidentSeverity = RiskLevel;

export interface MediaAsset {
  id: string;
  code?: string;
  title: string;
  campaignId?: string;
  type: 'image' | 'video' | 'storyboard' | 'script';
  format: string; // 'PNG', 'MP4', 'PDF', 'TXT', '9:16', '16:9', '1:1'
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  version?: string;
  status?: 'draft' | 'in_review' | 'approved' | 'published';
  thumbnailUrl: string;
  mediaUrl?: string;
  promptUsed: string;
  modelEngine?: 'Higgsfield (Simulado)' | 'MiniMax (Simulado)' | 'Midjourney (Simulado)' | string;
  engine?: string;
  authorAgent?: AgentRole;
  durationSeconds?: number;
  hook?: string;
  cta?: string;
  scriptTranscript?: string;
  scriptContent?: string;
  storyboardFrames?: string[];
  storyboardScenes?: { sceneNumber: number; visualPrompt: string; audioPrompt: string }[];
  createdAt?: string;
  isDemo?: boolean;
}

export type AdminCategory = 'acuerdo' | 'minuta' | 'cotizacion' | 'pago_reportado' | 'documento' | 'pendiente';

export interface AdminItem {
  id: string;
  title: string;
  category: AdminCategory;
  responsible: string;
  agentAssigned?: AgentRole;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority?: PriorityLevel;
  amountUsd?: number;
  evidenceRef?: string;
  notes?: string;
  isDemo?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorType: 'user' | 'agent' | 'system';
  actorName: string;
  action: string;
  actionType: 'requested' | 'approved' | 'executed' | 'failed' | 'reverted';
  resourceType: 'router' | 'decision' | 'task' | 'campaign' | 'config' | 'tower' | 'deliverable' | 'system';
  resourceId: string;
  resourceLabel: string;
  result: 'success' | 'warning' | 'failure';
  risk: RiskLevel;
  scopeImpact: string;
  humanExplanation: string;
  correlationId: string;
  relatedApprovalId?: string;
  jsonPayload: Record<string, any>;
  dataSource?: 'local_demo' | 'api_staging' | 'api_production';
  mode?: AppMode;
  isDemo?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'alert' | 'decision' | 'task' | 'system' | 'incident';
  priority: PriorityLevel;
  read: boolean;
  linkScreen?: string;
  linkItemId?: string;
  isDemo?: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  requireHumanApprovalAllHighRisk: boolean;
  allowWriteToolsGlobal: boolean; // default false
  maskSensitiveData: boolean;
  retainLogsDays: number;
  telegramNotificationsSimulated: boolean;
  maxAgentExecutionMinutes: number;
  hermesEngineStatus: HermesStatus;
  mcpServerStatus: 'connected_demo' | 'offline';
  mikrotikApiStatus: 'mock_sandbox' | 'disconnected';
  higgsfieldApiStatus: 'mock_sandbox' | 'disconnected';
  isDemo?: boolean;
}

export type AppMode = 'demo' | 'staging' | 'production';

export interface ServerStatusContract {
  mode: AppMode;
  source: 'server' | 'client';
  hermes: 'not_connected' | 'available' | 'degraded' | 'unavailable';
  writesEnabled: boolean;
  integrations: {
    nugacore: boolean;
    mikromcp: boolean;
    google: boolean;
  };
}

export interface BackendCapabilities {
  canReadRealData: boolean;
  canRequestDryRun: boolean;
  canSubmitApproval: boolean;
  canExecuteAuthorizedOperation: boolean;
}

export interface AppConfig {
  mode: AppMode;
  apiUrl: string;
  isDemo: boolean;
  isStaging: boolean;
  isProduction: boolean;
  capabilities: BackendCapabilities;
}

export type ProviderStatus = 'idle' | 'loading' | 'success' | 'empty' | 'unavailable' | 'unauthorized' | 'error';

export interface ProviderResult<T> {
  data?: T;
  status: ProviderStatus;
  error?: string;
  isDemo?: boolean;
  timestamp?: string;
}

export interface AuditRecordPayload {
  actorType: 'user' | 'agent' | 'system';
  actorName: string;
  action: string;
  actionType: 'requested' | 'approved' | 'executed' | 'failed' | 'reverted';
  resourceType: 'router' | 'decision' | 'task' | 'campaign' | 'config' | 'tower' | 'deliverable' | 'system';
  resourceId: string;
  resourceLabel: string;
  result: 'success' | 'warning' | 'failure';
  risk: RiskLevel;
  scopeImpact: string;
  humanExplanation: string;
  jsonPayload?: Record<string, any>;
  dataSource?: 'local_demo' | 'api_staging' | 'api_production';
  mode?: AppMode;
  correlationId?: string;
}
