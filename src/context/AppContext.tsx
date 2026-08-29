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
  AgentRole
} from '../types';
import { storageService } from '../services/storageService';

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
  createCampaign: (campaign: any) => void;
  createAdminItem: (item: any) => void;
  updateDeliverableStatus: (id: string, status: Deliverable['status']) => void;
  updateAgent: (agentId: string, partial: Partial<AgentProfile>) => void;
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
  const [currentScreen, setCurrentScreenState] = useState<ScreenId>(() => normalizeScreenFromUrl());
  const [user, setUser] = useState<User>(() => storageService.getUser());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageService.getSettings().theme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);

  // Entities
  const [agents, setAgents] = useState<AgentProfile[]>(() => storageService.getAgents());
  const [projects, setProjects] = useState<Project[]>(() => storageService.getProjects());
  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasks());
  const [decisions, setDecisions] = useState<Decision[]>(() => storageService.getDecisions());
  const [towers, setTowers] = useState<WispTower[]>(() => storageService.getTowers());
  const [routers, setRouters] = useState<MikroTikRouter[]>(() => storageService.getRouters());
  const [links, setLinks] = useState<WispLink[]>(() => storageService.getLinks());
  const [incidents, setIncidents] = useState<WispIncident[]>(() => storageService.getIncidents());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storageService.getCampaigns());
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => storageService.getMediaAssets());
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => storageService.getDeliverables());
  const [adminItems, setAdminItems] = useState<AdminItem[]>(() => storageService.getAdminItems());
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => storageService.getAuditEvents());
  const [conversations, setConversations] = useState<Conversation[]>(() => storageService.getConversations());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storageService.getNotifications());

  // Selections
  const [selectedAgentId, setSelectedAgentId] = useState<AgentRole | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
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
    const updated = storageService.updateSettings({ theme: next });
    setSettings(updated);
    addToast({
      type: 'info',
      title: 'Preferencia de Tema',
      message: `Tema cambiado a modo ${next === 'dark' ? 'Oscuro' : 'Claro'}.`
    });
  }, [theme, addToast]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    const updated = storageService.updateSettings(partial);
    setSettings(updated);
    if (partial.theme) setTheme(partial.theme);
    setAuditEvents(storageService.getAuditEvents());
    addToast({
      type: 'success',
      title: 'Configuración Guardada',
      message: 'Los parámetros han sido actualizados en almacenamiento local DEMO.'
    });
  }, [addToast]);

  const updateAgent = useCallback((agentId: string, partial: Partial<AgentProfile>) => {
    const updated = storageService.updateAgent(agentId, partial);
    setAgents(updated);
    setAuditEvents(storageService.getAuditEvents());
    addToast({
      type: 'success',
      title: 'Agente Actualizado',
      message: `Configuración de autonomía y herramientas para ${agentId} guardada.`
    });
  }, [addToast]);

  const createTask = useCallback((taskData: any) => {
    const newTask = storageService.createTask(taskData);
    setTasks(storageService.getTasks());
    setAuditEvents(storageService.getAuditEvents());
    addToast({
      type: 'success',
      title: 'Tarea Creada',
      message: `La tarea ${newTask.code} se agregó al tablero Kanban.`
    });
  }, [addToast]);

  const updateTask = useCallback((id: string, partial: Partial<Task>) => {
    const updated = storageService.updateTask(id, partial);
    setTasks(updated);
  }, []);

  const addTaskComment = useCallback((taskId: string, commentText: string) => {
    const updated = storageService.addTaskComment(taskId, commentText);
    setTasks(updated);
    addToast({
      type: 'success',
      title: 'Comentario Registrado',
      message: 'Tu nota ha sido agregada al historial de la tarea.'
    });
  }, [addToast]);

  const executeDecisionAction = useCallback((
    id: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ) => {
    const { decisions: updated, updatedDecision } = storageService.executeDecisionAction(id, action, comment, confirmationText);
    setDecisions(updated);
    setAuditEvents(storageService.getAuditEvents());

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
      title: `Decisión ${updatedDecision?.code || ''}`,
      message: `Acción ejecutada: ${actionText}. Registro guardado en auditoría.`
    });
  }, [addToast]);

  const createIncident = useCallback((incidentData: any) => {
    const newInc = storageService.createIncident(incidentData);
    setIncidents(storageService.getIncidents());
    setAuditEvents(storageService.getAuditEvents());
    addToast({
      type: 'warning',
      title: 'Incidente Registrado',
      message: `Ticket ${newInc.code} abierto para ${newInc.assignedSpecialist}.`
    });
  }, [addToast]);

  const createCampaign = useCallback((campaignData: any) => {
    const newCamp = storageService.createCampaign(campaignData);
    setCampaigns(storageService.getCampaigns());
    addToast({
      type: 'success',
      title: 'Campaña Creada',
      message: `Campaña ${newCamp.code} agregada en fase de Brief creativo.`
    });
  }, [addToast]);

  const createAdminItem = useCallback((itemData: any) => {
    const newItem = storageService.createAdminItem(itemData);
    setAdminItems(storageService.getAdminItems());
    addToast({
      type: 'success',
      title: 'Registro Administrativo Creado',
      message: `"${newItem.title}" guardado en seguimiento.`
    });
  }, [addToast]);

  const updateDeliverableStatus = useCallback((id: string, status: Deliverable['status']) => {
    const updated = storageService.updateDeliverableStatus(id, status);
    setDeliverables(updated);
    addToast({
      type: status === 'approved' ? 'success' : 'info',
      title: status === 'approved' ? 'Entregable Aprobado' : 'Estado Actualizado',
      message: status === 'approved'
        ? 'El entregable fue validado formalmente por Ramiro y archivado como definitivo.'
        : 'Se notificó al agente para realizar los ajustes solicitados.'
    });
  }, [addToast]);

  const createNotification = useCallback((notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif = storageService.createNotification(notifData);
    setNotifications(storageService.getNotifications());
    addToast({
      type: notifData.priority === 'urgente' ? 'error' : notifData.priority === 'alta' ? 'warning' : 'info',
      title: 'Nueva Notificación',
      message: notifData.title
    });
    return newNotif;
  }, [addToast]);

  const deleteNotification = useCallback((id: string) => {
    const updated = storageService.deleteNotification(id);
    setNotifications(updated);
  }, []);

  const clearAllNotifications = useCallback(() => {
    const updated = storageService.clearAllNotifications();
    setNotifications(updated);
    addToast({
      type: 'info',
      title: 'Notificaciones Limpiadas',
      message: 'Se han eliminado todas las notificaciones.'
    });
  }, [addToast]);

  const toggleNotificationRead = useCallback((id: string) => {
    const updated = storageService.toggleNotificationRead(id);
    setNotifications(updated);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    const updated = storageService.markNotificationAsRead(id);
    setNotifications(updated);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    const updated = storageService.markAllNotificationsRead();
    setNotifications(updated);
    addToast({
      type: 'info',
      title: 'Notificaciones',
      message: 'Todas las alertas marcadas como leídas.'
    });
  }, [addToast]);

  const resetAllDemoData = useCallback(() => {
    storageService.resetAllToDefault();
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
  }, [addToast]);

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
