import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AgentProfile,
  Project,
  Task,
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
  AppNotification,
  AppSettings,
  User,
  AgentRole,
  AppMode,
  AppConfig,
  ServerStatusContract,
  BackendCapabilities
} from '../types';
import { storageService } from '../services/storageService';
import { getAppConfig, validateModeCompatibility } from '../config/appConfig';
import { createProviders, AppProviders } from '../providers';
import { checkServerHealth } from '../services/healthCheckService';
import { IncompatibleConfigScreen } from '../components/layout/IncompatibleConfigScreen';

export type ScreenId =
  | 'resumen'
  | 'decisiones'
  | 'equipo-ia'
  | 'conversaciones'
  | 'tareas'
  | 'proyectos'
  | 'operaciones-wisp'
  | 'nugacore'
  | 'marketing'
  | 'administracion'
  | 'entregables'
  | 'auditoria'
  | 'configuracion';

const VALID_SCREENS: ScreenId[] = [
  'resumen',
  'decisiones',
  'equipo-ia',
  'conversaciones',
  'tareas',
  'proyectos',
  'operaciones-wisp',
  'nugacore',
  'marketing',
  'administracion',
  'entregables',
  'auditoria',
  'configuracion'
];

const normalizeScreenFromUrl = (): ScreenId => {
  try {
    if (typeof window === 'undefined') return 'resumen';

    // Check hash first: #/tareas, #tareas, #/operaciones-wisp, etc.
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (rawHash) {
      if (rawHash === 'resumen-ejecutivo') return 'resumen';
      if (VALID_SCREENS.includes(rawHash as ScreenId)) {
        return rawHash as ScreenId;
      }
    }

    // Check path: /tareas, /operaciones-wisp, etc.
    const rawPath = window.location.pathname.replace(/^\//, '').trim().toLowerCase();
    if (rawPath) {
      if (rawPath === 'resumen-ejecutivo') return 'resumen';
      if (VALID_SCREENS.includes(rawPath as ScreenId)) {
        return rawPath as ScreenId;
      }
    }
  } catch {
    // fallback
  }
  return 'resumen';
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  user: User;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Environment & Mode Architecture
  appMode: AppMode;
  appConfig: AppConfig;
  providers: AppProviders;
  serverStatus: ServerStatusContract | null;
  capabilities: BackendCapabilities;
  isCompatible: boolean;
  incompatibilityReason?: string;
  demoDataset: string;
  setDemoDataset: (datasetId: string) => void;
  refreshData: () => Promise<void>;
  loadTaskDetail: (taskId: string) => Promise<void>;
  taskDetailLoading: boolean;
  taskDetailError?: string;

  // Data
  agents: AgentProfile[];
  projects: Project[];
  tasks: Task[];
  decisions: Decision[];
  towers: WispTower[];
  routers: MikroTikRouter[];
  links: WispLink[];
  incidents: WispIncident[];
  campaigns: Campaign[];
  mediaAssets: MediaAsset[];
  deliverables: Deliverable[];
  adminItems: AdminItem[];
  auditEvents: AuditEvent[];
  conversations: Conversation[];
  notifications: AppNotification[];

  // Selection state across screens
  selectedAgentId?: AgentRole;
  setSelectedAgentId: (agentId?: AgentRole) => void;
  selectedProjectId?: string;
  setSelectedProjectId: (projectId?: string) => void;
  selectedTaskId?: string;
  setSelectedTaskId: (taskId?: string) => void;
  selectedDecisionId?: string;
  setSelectedDecisionId: (decisionId?: string) => void;
  selectedRouterId?: string;
  setSelectedRouterId: (routerId?: string) => void;
  selectedDeliverableId?: string;
  setSelectedDeliverableId: (deliverableId?: string) => void;
  selectedMediaAsset?: MediaAsset | null;
  setSelectedMediaAsset: (asset: MediaAsset | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  // Actions & Mutations
  createTask: (task: any) => void;
  updateTask: (id: string, partial: Partial<Task>) => void;
  addTaskComment: (taskId: string, comment: string) => void;
  executeDecisionAction: (
    id: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ) => void;
  createIncident: (incident: any) => void;
  createProject: (project: any) => void;
  createCampaign: (campaign: any) => void;
  createAdminItem: (item: any) => void;
  updateDeliverableStatus: (id: string, status: Deliverable['status']) => void;
  updateAgent: (agentId: string, partial: Partial<AgentProfile>) => Promise<boolean>;
  createNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleNotificationRead: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllDemoData: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Modals
  activeModal: string | null;
  openModal: (modalName: string, modalProps?: any) => void;
  closeModal: () => void;
  modalProps: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // App Configuration and Mode resolution
  const [appConfig] = useState<AppConfig>(() => getAppConfig());
  const [appMode] = useState<AppMode>(() => appConfig.mode);
  const [providers] = useState<AppProviders>(() => createProviders(appConfig.mode, appConfig));

  const [serverStatus, setServerStatus] = useState<ServerStatusContract | null>(() => ({
    mode: appConfig.mode,
    source: appConfig.mode === 'demo' ? 'client' : 'server',
    hermes: 'not_connected',
    writesEnabled: appConfig.mode === 'production',
    integrations: { nugacore: false, mikromcp: false, google: false }
  }));

  const [capabilities, setCapabilities] = useState<BackendCapabilities>(() => appConfig.capabilities);
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [incompatibilityReason, setIncompatibilityReason] = useState<string | undefined>(undefined);
  const [demoDataset, setDemoDataset] = useState<string>('standard');

  const [currentScreen, setCurrentScreenState] = useState<ScreenId>(() => normalizeScreenFromUrl());
  const [user, setUser] = useState<User>(() => storageService.getUser());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageService.getSettings().theme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);

  // Entities initialized from storage (in demo) or empty (in staging/production until loaded)
  const [agents, setAgents] = useState<AgentProfile[]>(() => (appConfig.isDemo ? storageService.getAgents() : []));
  const [projects, setProjects] = useState<Project[]>(() => (appConfig.isDemo ? storageService.getProjects() : []));
  const [tasks, setTasks] = useState<Task[]>(() => (appConfig.isDemo ? storageService.getTasks() : []));
  const [decisions, setDecisions] = useState<Decision[]>(() => (appConfig.isDemo ? storageService.getDecisions() : []));
  const [towers, setTowers] = useState<WispTower[]>(() => (appConfig.isDemo ? storageService.getTowers() : []));
  const [routers, setRouters] = useState<MikroTikRouter[]>(() => (appConfig.isDemo ? storageService.getRouters() : []));
  const [links, setLinks] = useState<WispLink[]>(() => (appConfig.isDemo ? storageService.getLinks() : []));
  const [incidents, setIncidents] = useState<WispIncident[]>(() => (appConfig.isDemo ? storageService.getIncidents() : []));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => (appConfig.isDemo ? storageService.getCampaigns() : []));
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => (appConfig.isDemo ? storageService.getMediaAssets() : []));
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => (appConfig.isDemo ? storageService.getDeliverables() : []));
  const [adminItems, setAdminItems] = useState<AdminItem[]>(() => (appConfig.isDemo ? storageService.getAdminItems() : []));
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => (appConfig.isDemo ? storageService.getAuditEvents() : []));
  const [conversations, setConversations] = useState<Conversation[]>(() => (appConfig.isDemo ? storageService.getConversations() : []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => (appConfig.isDemo ? storageService.getNotifications() : []));

  // Selections
  const [selectedAgentId, setSelectedAgentId] = useState<AgentRole | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskDetailError, setTaskDetailError] = useState<string | undefined>(undefined);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | undefined>(undefined);
  const [selectedRouterId, setSelectedRouterId] = useState<string | undefined>(undefined);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | undefined>(undefined);
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<MediaAsset | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalProps, setModalProps] = useState<any>(null);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openModal = useCallback((modalName: string, props?: any) => {
    setActiveModal(modalName);
    setModalProps(props || null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalProps(null);
  }, []);

  const setCurrentScreen = useCallback((screen: ScreenId) => {
    setCurrentScreenState(screen);
    try {
      if (typeof window !== 'undefined') {
        const targetHash = `#/${screen}`;
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Health check and mode verification
  const verifyHealth = useCallback(async () => {
    const health = await checkServerHealth(appMode, appConfig.apiUrl);
    setServerStatus(health.serverContract);
    setCapabilities(health.capabilities);

    const compatibility = validateModeCompatibility(appMode, health.serverContract);
    if (!compatibility.compatible) {
      setIsCompatible(false);
      setIncompatibilityReason(compatibility.reason);
    } else {
      setIsCompatible(true);
      setIncompatibilityReason(undefined);
    }
  }, [appMode, appConfig.apiUrl]);

  useEffect(() => {
    verifyHealth();
  }, [verifyHealth]);

  // Refresh data from active providers
  const refreshData = useCallback(async () => {
    if (!isCompatible) return;

    try {
      const [
        agentsRes,
        projectsRes,
        tasksRes,
        decisionsRes,
        towersRes,
        routersRes,
        linksRes,
        incidentsRes,
        campaignsRes,
        mediaRes,
        deliverablesRes,
        adminRes,
        auditRes,
        convsRes,
        notifsRes,
        settingsRes,
        userRes
      ] = await Promise.all([
        providers.agents.getAgents(),
        providers.projects.getProjects(),
        providers.tasks.getTasks(),
        providers.decisions.getDecisions(),
        providers.wisp.getTowers(),
        providers.wisp.getRouters(),
        providers.wisp.getLinks(),
        providers.wisp.getIncidents(),
        providers.marketing.getCampaigns(),
        providers.marketing.getMediaAssets(),
        providers.deliverables.getDeliverables(),
        providers.administration.getAdminItems(),
        providers.audit.getAuditEvents(),
        providers.conversations.getConversations(),
        providers.configuration.getNotifications(),
        providers.configuration.getSettings(),
        providers.configuration.getUser()
      ]);

      if (agentsRes.data) setAgents(agentsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (decisionsRes.data) setDecisions(decisionsRes.data);
      if (towersRes.data) setTowers(towersRes.data);
      if (routersRes.data) setRouters(routersRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (incidentsRes.data) setIncidents(incidentsRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
      if (mediaRes.data) setMediaAssets(mediaRes.data);
      if (deliverablesRes.data) setDeliverables(deliverablesRes.data);
      if (adminRes.data) setAdminItems(adminRes.data);
      if (auditRes.data) setAuditEvents(auditRes.data);
      if (convsRes.data) setConversations(convsRes.data);
      if (notifsRes.data) setNotifications(notifsRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
        setTheme(settingsRes.data.theme);
      }
      if (userRes.data) setUser(userRes.data);
    } catch {
      // In staging/production when disconnected, state remains empty rather than fake fixtures
    }
  }, [providers, isCompatible]);

  useEffect(() => {
    if (appMode !== 'demo') {
      refreshData();
    }
  }, [refreshData, appMode]);

  // Listen for hash/url changes for direct reload and back/forward navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const screen = normalizeScreenFromUrl();
      setCurrentScreenState(screen);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    // Ensure URL hash reflects initial screen
    const initialScreen = normalizeScreenFromUrl();
    if (typeof window !== 'undefined' && window.location.hash !== `#/${initialScreen}`) {
      window.history.replaceState(null, '', `#/${initialScreen}`);
    }

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Synchronize HTML theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    providers.configuration.updateSettings({ theme: next });
    setSettings(prev => ({ ...prev, theme: next }));
    addToast({
      type: 'info',
      title: 'Preferencia de Tema',
      message: `Tema cambiado a modo ${next === 'dark' ? 'Oscuro' : 'Claro'}.`
    });
  }, [theme, addToast, providers]);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const res = await providers.configuration.updateSettings(partial);
    if (res.data) {
      setSettings(res.data);
      if (partial.theme) setTheme(partial.theme);
    }
    const auditRes = await providers.audit.getAuditEvents();
    if (auditRes.data) setAuditEvents(auditRes.data);
    addToast({
      type: 'success',
      title: 'Configuración Guardada',
      message: appMode === 'demo' ? 'Los parámetros han sido actualizados en almacenamiento local DEMO.' : 'Configuración guardada en el servidor.'
    });
  }, [addToast, providers, appMode]);

  const updateAgent = useCallback(async (agentId: string, partial: Partial<AgentProfile>) => {
    const res = await providers.agents.updateAgent(agentId, partial);
    if (res.data) {
      setAgents(prev => prev.map(a => (a.id === agentId ? res.data! : a)));
      const auditRes = await providers.audit.getAuditEvents();
      if (auditRes.data) setAuditEvents(auditRes.data);
      addToast({
        type: 'success',
        title: 'Perfil actualizado',
        message: `La configuración de ${agentId} fue guardada.`
      });
      return true;
    }
    addToast({
      type: 'error',
      title: 'No se pudo actualizar el perfil',
      message: res.error ?? 'El servidor rechazó la actualización.'
    });
    return false;
  }, [addToast, providers]);

  const createTask = useCallback(async (taskData: any) => {
    const res = await providers.tasks.createTask(taskData);
    if (res.data) {
      setTasks(prev => [res.data!, ...prev]);
      addToast({
        type: 'success',
        title: 'Tarea Creada',
        message: `La tarea ${res.data.code} se agregó al tablero Kanban.`
      });
    } else if (res.error) {
      addToast({
        type: 'error',
        title: 'Error al Crear Tarea',
        message: res.error
      });
    }
    const auditRes = await providers.audit.getAuditEvents();
    if (auditRes.data) setAuditEvents(auditRes.data);
  }, [addToast, providers]);

  const updateTask = useCallback(async (id: string, partial: Partial<Task>) => {
    const res = await providers.tasks.updateTask(id, partial);
    if (res.data) {
      setTasks(prev => prev.map(t => (t.id === id ? res.data! : t)));
    }
  }, [providers]);

  const loadTaskDetail = useCallback(async (taskId: string) => {
    if (appMode === 'demo') return;
    setTaskDetailLoading(true);
    setTaskDetailError(undefined);
    const res = await providers.tasks.getTaskById(taskId);
    if (res.data) {
      setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...res.data! } : task));
    } else {
      setTaskDetailError(res.error ?? 'No fue posible cargar el detalle desde Hermes.');
    }
    setTaskDetailLoading(false);
  }, [appMode, providers]);

  const addTaskComment = useCallback(async (taskId: string, commentText: string) => {
    const res = await providers.tasks.addTaskComment(taskId, {
      authorName: user.name,
      text: commentText,
      isAgent: false
    });
    if (res.data) {
      setTasks(prev =>
        prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              comments: [...(t.comments || []), res.data!]
            };
          }
          return t;
        })
      );
      addToast({
        type: 'success',
        title: 'Comentario Registrado',
        message: 'Tu nota ha sido agregada al historial de la tarea.'
      });
    }
  }, [addToast, providers, user]);

  const executeDecisionAction = useCallback(async (
    id: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ) => {
    const res = await providers.decisions.executeDecisionAction(id, action, comment, confirmationText);
    if (res.data) {
      setDecisions(prev => prev.map(d => (d.id === id ? res.data! : d)));
    }
    const auditRes = await providers.audit.getAuditEvents();
    if (auditRes.data) setAuditEvents(auditRes.data);

    const actionText =
      action === 'approve'
        ? 'Aprobada formalmente'
        : action === 'reject'
        ? 'Rechazada'
        : action === 'needs_info'
        ? 'Marcada como Necesita Información'
        : action === 'simulate'
        ? 'Simulación enviada a cola'
        : 'Pospuesta';

    addToast({
      type: action === 'approve' ? 'success' : action === 'reject' ? 'warning' : 'info',
      title: `Decisión ${res.data?.code || id}`,
      message: `Acción ejecutada: ${actionText}. Registro guardado en auditoría.`
    });
  }, [addToast, providers]);

  const createIncident = useCallback(async (incidentData: any) => {
    const res = await providers.wisp.createIncident(incidentData);
    if (res.data) {
      setIncidents(prev => [res.data!, ...prev]);
      addToast({
        type: 'warning',
        title: 'Incidente Registrado',
        message: `Ticket ${res.data.code} abierto para ${res.data.assignedSpecialist}.`
      });
    }
    const auditRes = await providers.audit.getAuditEvents();
    if (auditRes.data) setAuditEvents(auditRes.data);
  }, [addToast, providers]);

  const createCampaign = useCallback(async (campaignData: any) => {
    const res = await providers.marketing.createCampaign(campaignData);
    if (res.data) {
      setCampaigns(prev => [res.data!, ...prev]);
      addToast({
        type: 'success',
        title: 'Campaña Creada',
        message: `Campaña ${res.data.code} agregada en fase de Brief creativo.`
      });
    } else {
      addToast({ type: 'error', title: 'No se guardó la campaña', message: res.error || 'La API rechazó el registro.' });
    }
  }, [addToast, providers]);

  const createProject = useCallback(async (projectData: any) => {
    const res = await providers.projects.createProject(projectData);
    if (res.data) {
      setProjects(prev => [res.data!, ...prev]);
      addToast({ type: 'success', title: 'Proyecto Creado', message: `${res.data.code} fue guardado en producción.` });
    } else {
      addToast({ type: 'error', title: 'No se guardó el proyecto', message: res.error || 'La API rechazó el registro.' });
    }
  }, [addToast, providers]);

  const createAdminItem = useCallback(async (itemData: any) => {
    const res = await providers.administration.createAdminItem(itemData);
    if (res.data) {
      setAdminItems(prev => [res.data!, ...prev]);
      addToast({
        type: 'success',
        title: 'Registro Administrativo Creado',
        message: `"${res.data.title}" guardado en seguimiento.`
      });
    } else {
      addToast({ type: 'error', title: 'No se guardó el registro', message: res.error || 'La API rechazó el registro.' });
    }
  }, [addToast, providers]);

  const updateDeliverableStatus = useCallback(async (id: string, status: Deliverable['status']) => {
    const res = await providers.deliverables.updateDeliverableStatus(id, status);
    if (res.data) {
      setDeliverables(prev => prev.map(d => (d.id === id ? res.data! : d)));
      addToast({
        type: status === 'approved' ? 'success' : 'info',
        title: status === 'approved' ? 'Entregable Aprobado' : 'Estado Actualizado',
        message:
          status === 'approved'
            ? 'El entregable fue validado formalmente por Ramiro y archivado como definitivo.'
            : 'Se notificó al agente para realizar los ajustes solicitados.'
      });
    }
  }, [addToast, providers]);

  const createNotification = useCallback((notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (appMode === 'demo') {
      const newNotif = storageService.createNotification(notifData);
      setNotifications(storageService.getNotifications());
      addToast({
        type: notifData.priority === 'urgente' ? 'error' : notifData.priority === 'alta' ? 'warning' : 'info',
        title: 'Nueva Notificación',
        message: notifData.title
      });
      return newNotif;
    }
  }, [addToast, appMode]);

  const deleteNotification = useCallback(async (id: string) => {
    if (appMode === 'demo') {
      const updated = storageService.deleteNotification(id);
      setNotifications(updated);
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, [appMode]);

  const clearAllNotifications = useCallback(async () => {
    await providers.configuration.clearNotifications();
    setNotifications([]);
    addToast({
      type: 'info',
      title: 'Notificaciones Limpiadas',
      message: 'Se han eliminado todas las notificaciones.'
    });
  }, [addToast, providers]);

  const toggleNotificationRead = useCallback((id: string) => {
    if (appMode === 'demo') {
      const updated = storageService.toggleNotificationRead(id);
      setNotifications(updated);
    } else {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: !n.read } : n)));
    }
  }, [appMode]);

  const markNotificationRead = useCallback(async (id: string) => {
    await providers.configuration.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, [providers]);

  const markAllNotificationsRead = useCallback(() => {
    if (appMode === 'demo') {
      const updated = storageService.markAllNotificationsRead();
      setNotifications(updated);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    addToast({
      type: 'info',
      title: 'Notificaciones',
      message: 'Todas las alertas marcadas como leídas.'
    });
  }, [addToast, appMode]);

  const resetAllDemoData = useCallback(async () => {
    if (appMode !== 'demo') {
      addToast({
        type: 'error',
        title: 'Operación no permitida',
        message: 'El restablecimiento de datos DEMO no está permitido en este entorno.'
      });
      return;
    }

    await providers.configuration.resetDemoData();
    setUser(storageService.getUser());
    setSettings(storageService.getSettings());
    setTheme(storageService.getSettings().theme);
    setAgents(storageService.getAgents());
    setProjects(storageService.getProjects());
    setTasks(storageService.getTasks());
    setDecisions(storageService.getDecisions());
    setTowers(storageService.getTowers());
    setRouters(storageService.getRouters());
    setLinks(storageService.getLinks());
    setIncidents(storageService.getIncidents());
    setCampaigns(storageService.getCampaigns());
    setMediaAssets(storageService.getMediaAssets());
    setDeliverables(storageService.getDeliverables());
    setAdminItems(storageService.getAdminItems());
    setAuditEvents(storageService.getAuditEvents());
    setConversations(storageService.getConversations());
    setNotifications(storageService.getNotifications());

    addToast({
      type: 'success',
      title: 'Datos DEMO Restablecidos',
      message: 'Se ha restaurado la base de datos simulada inicial.'
    });
  }, [addToast, appMode, providers]);

  // If environment configuration is incompatible, block unsafe operations
  if (!isCompatible) {
    return (
      <IncompatibleConfigScreen
        reason={incompatibilityReason || 'Incompatibilidad de entorno detectada.'}
        frontendMode={appMode}
        serverMode={serverStatus?.mode}
        onRetry={verifyHealth}
      />
    );
  }

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        user,
        settings,
        updateSettings,
        theme,
        toggleTheme,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        appMode,
        appConfig,
        providers,
        serverStatus,
        capabilities,
        isCompatible,
        incompatibilityReason,
        demoDataset,
        setDemoDataset,
        refreshData,
        loadTaskDetail,
        taskDetailLoading,
        taskDetailError,
        agents,
        projects,
        tasks,
        decisions,
        towers,
        routers,
        links,
        incidents,
        campaigns,
        mediaAssets,
        deliverables,
        adminItems,
        auditEvents,
        conversations,
        notifications,
        selectedAgentId,
        setSelectedAgentId,
        selectedProjectId,
        setSelectedProjectId,
        selectedTaskId,
        setSelectedTaskId,
        selectedDecisionId,
        setSelectedDecisionId,
        selectedRouterId,
        setSelectedRouterId,
        selectedDeliverableId,
        setSelectedDeliverableId,
        selectedMediaAsset,
        setSelectedMediaAsset,
        searchQuery,
        setSearchQuery,
        isSearchModalOpen,
        setIsSearchModalOpen,
        createTask,
        updateTask,
        addTaskComment,
        executeDecisionAction,
        createIncident,
        createProject,
        createCampaign,
        createAdminItem,
        updateDeliverableStatus,
        updateAgent,
        createNotification,
        deleteNotification,
        clearAllNotifications,
        toggleNotificationRead,
        markNotificationRead,
        markAllNotificationsRead,
        resetAllDemoData,
        toasts,
        addToast,
        removeToast,
        activeModal,
        openModal,
        closeModal,
        modalProps
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
