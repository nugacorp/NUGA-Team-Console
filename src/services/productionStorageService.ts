import type { AppSettings, User } from '../types';

const EMPTY_USER: User = {
  id: '',
  name: 'Usuario autenticado',
  email: '',
  role: 'viewer',
  title: '',
  avatar: '',
  isDemo: false
};

const SAFE_SETTINGS: AppSettings = {
  theme: 'dark',
  requireHumanApprovalAllHighRisk: true,
  allowWriteToolsGlobal: false,
  maskSensitiveData: true,
  retainLogsDays: 90,
  telegramNotificationsSimulated: false,
  maxAgentExecutionMinutes: 45,
  hermesEngineStatus: 'No conectado',
  mcpServerStatus: 'offline',
  mikrotikApiStatus: 'disconnected',
  higgsfieldApiStatus: 'disconnected',
  isDemo: false
};

const empty = () => [];
const forbidden = () => {
  throw new Error('LOCAL_STORAGE_DISABLED_IN_PRODUCTION');
};

/**
 * Production replacement for the local DEMO store. It contains no fixtures,
 * never reads browser persistence and fails closed on local mutations.
 */
export const storageService = {
  getUser: () => ({ ...EMPTY_USER }),
  getSettings: () => ({ ...SAFE_SETTINGS }),
  getAgents: empty,
  getProjects: empty,
  getTasks: empty,
  getDecisions: empty,
  getTowers: empty,
  getRouters: empty,
  getLinks: empty,
  getIncidents: empty,
  getCampaigns: empty,
  getMediaAssets: empty,
  getDeliverables: empty,
  getAdminItems: empty,
  getAuditEvents: empty,
  getConversations: empty,
  getNotifications: empty,
  getMessages: empty,
  createTask: forbidden,
  updateTask: forbidden,
  addTaskComment: forbidden,
  executeDecisionAction: forbidden,
  createIncident: forbidden,
  createCampaign: forbidden,
  createAdminItem: forbidden,
  updateDeliverableStatus: forbidden,
  updateAgent: forbidden,
  createNotification: forbidden,
  deleteNotification: forbidden,
  clearAllNotifications: forbidden,
  toggleNotificationRead: forbidden,
  markNotificationRead: forbidden,
  markAllNotificationsRead: forbidden,
  updateSettings: forbidden,
  saveProjects: forbidden,
  saveIncidents: forbidden,
  saveMediaAssets: forbidden,
  saveAdminItems: forbidden,
  logAuditEvent: forbidden,
  sendMessage: forbidden,
  resetToInitial: forbidden
} as unknown as typeof import('./storageService').storageService;
