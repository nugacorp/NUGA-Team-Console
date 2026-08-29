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
  Message,
  AppNotification,
  AppSettings,
  User
} from '../types';

import {
  INITIAL_AGENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_DECISIONS,
  INITIAL_TOWERS,
  INITIAL_ROUTERS,
  INITIAL_LINKS,
  INITIAL_INCIDENTS,
  INITIAL_CAMPAIGNS,
  INITIAL_MEDIA_ASSETS,
  INITIAL_DELIVERABLES,
  INITIAL_ADMIN_ITEMS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_USER
} from '../data/mockData';

const STORAGE_KEYS = {
  AGENTS: 'nuga_agents_v1',
  PROJECTS: 'nuga_projects_v1',
  TASKS: 'nuga_tasks_v1',
  DECISIONS: 'nuga_decisions_v1',
  TOWERS: 'nuga_towers_v1',
  ROUTERS: 'nuga_routers_v1',
  LINKS: 'nuga_links_v1',
  INCIDENTS: 'nuga_incidents_v1',
  CAMPAIGNS: 'nuga_campaigns_v1',
  MEDIA_ASSETS: 'nuga_media_assets_v1',
  DELIVERABLES: 'nuga_deliverables_v1',
  ADMIN_ITEMS: 'nuga_admin_items_v1',
  AUDIT_EVENTS: 'nuga_audit_events_v1',
  CONVERSATIONS: 'nuga_conversations_v1',
  MESSAGES: 'nuga_messages_v1',
  NOTIFICATIONS: 'nuga_notifications_v1',
  SETTINGS: 'nuga_settings_v1',
  USER: 'nuga_user_v1'
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[StorageService] Error loading ${key} from localStorage, using fallback.`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[StorageService] Error saving ${key} to localStorage:`, err);
  }
}

export class StorageService {
  // --- USER & SETTINGS ---
  getUser(): User {
    return getItem<User>(STORAGE_KEYS.USER, INITIAL_USER);
  }

  getSettings(): AppSettings {
    return getItem<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    setItem(STORAGE_KEYS.SETTINGS, updated);
    this.logAuditEvent({
      actorType: 'user',
      actorName: 'Ramiro',
      action: 'Actualización de Configuración',
      actionType: 'executed',
      resourceType: 'config',
      resourceId: 'settings-global',
      resourceLabel: 'Ajustes del Sistema',
      result: 'success',
      risk: 'medium',
      scopeImpact: 'Preferencias globales de la consola',
      humanExplanation: 'Ramiro modificó parámetros de configuración en la consola.',
      jsonPayload: partial
    });
    return updated;
  }

  // --- AGENTS ---
  getAgents(): AgentProfile[] {
    return getItem<AgentProfile[]>(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
  }

  updateAgent(agentId: string, partial: Partial<AgentProfile>): AgentProfile[] {
    const agents = this.getAgents();
    const updated = agents.map(a => a.id === agentId ? { ...a, ...partial } : a);
    setItem(STORAGE_KEYS.AGENTS, updated);
    this.logAuditEvent({
      actorType: 'user',
      actorName: 'Ramiro',
      action: 'Ajuste de Perfil de Agente',
      actionType: 'executed',
      resourceType: 'system',
      resourceId: agentId,
      resourceLabel: `Agente ${agentId}`,
      result: 'success',
      risk: 'low',
      scopeImpact: 'Instrucciones y herramientas de agente',
      humanExplanation: `Ramiro actualizó los parámetros de autonomía o herramientas para el agente ${agentId}.`,
      jsonPayload: partial
    });
    return updated;
  }

  // --- PROJECTS ---
  getProjects(): Project[] {
    return getItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  createProject(project: Omit<Project, 'id' | 'code'>): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      isDemo: true
    };
    const updated = [newProject, ...projects];
    setItem(STORAGE_KEYS.PROJECTS, updated);
    return newProject;
  }

  // --- TASKS ---
  getTasks(): Task[] {
    return getItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  }

  saveTasks(tasks: Task[]): void {
    setItem(STORAGE_KEYS.TASKS, tasks);
  }

  createTask(taskData: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'runs' | 'comments' | 'attachments' | 'deliverableIds'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      code: `TSK-${Math.floor(200 + Math.random() * 800)}`,
      progressPercent: 0,
      loggedHours: 0,
      dependencies: taskData.dependencies || [],
      deliverableIds: [],
      comments: [],
      attachments: [],
      runs: [],
      isDemo: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newTask, ...tasks];
    setItem(STORAGE_KEYS.TASKS, updated);
    this.logAuditEvent({
      actorType: 'user',
      actorName: 'Ramiro',
      action: 'Creación de Tarea',
      actionType: 'executed',
      resourceType: 'task',
      resourceId: newTask.code,
      resourceLabel: newTask.title,
      result: 'success',
      risk: newTask.priority === 'urgente' ? 'high' : 'low',
      scopeImpact: `Asignada a ${newTask.assignedAgent}`,
      humanExplanation: `Ramiro creó la tarea ${newTask.code}: "${newTask.title}".`,
      jsonPayload: { taskCode: newTask.code, priority: newTask.priority, assignedTo: newTask.assignedAgent }
    });
    return newTask;
  }

  updateTask(taskId: string, partial: Partial<Task>): Task[] {
    const tasks = this.getTasks();
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...partial, updatedAt: new Date().toISOString().split('T')[0] } : t);
    setItem(STORAGE_KEYS.TASKS, updated);
    return updated;
  }

  addTaskComment(taskId: string, commentText: string): Task[] {
    const tasks = this.getTasks();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const newComment = {
          id: `c-${Date.now()}`,
          authorName: 'Ramiro (Propietario)',
          isAgent: false,
          timestamp: 'Justo ahora',
          text: commentText
        };
        return { ...t, comments: [...t.comments, newComment] };
      }
      return t;
    });
    setItem(STORAGE_KEYS.TASKS, updated);
    return updated;
  }

  // --- DECISIONS ---
  getDecisions(): Decision[] {
    return getItem<Decision[]>(STORAGE_KEYS.DECISIONS, INITIAL_DECISIONS);
  }

  saveDecisions(decisions: Decision[]): void {
    setItem(STORAGE_KEYS.DECISIONS, decisions);
  }

  executeDecisionAction(
    decisionId: string,
    action: 'approve' | 'reject' | 'needs_info' | 'postpone' | 'simulate' | 'adjust_scope',
    comment?: string,
    confirmationText?: string
  ): { decisions: Decision[]; updatedDecision?: Decision } {
    const decisions = this.getDecisions();
    let updatedDecision: Decision | undefined;

    const updated = decisions.map(d => {
      if (d.id === decisionId) {
        let newStatus = d.status;
        let actionLabel = '';

        if (action === 'approve') {
          newStatus = 'approved';
          actionLabel = 'Aprobada por Ramiro';
        } else if (action === 'reject') {
          newStatus = 'rejected';
          actionLabel = 'Rechazada por Ramiro';
        } else if (action === 'needs_info') {
          newStatus = 'needs_info';
          actionLabel = 'Solicitud de Información Adicional';
        } else if (action === 'postpone') {
          newStatus = 'postponed';
          actionLabel = 'Pospuesta para posterior análisis';
        } else if (action === 'simulate') {
          newStatus = 'simulated';
          actionLabel = 'Simulación de Dry-run Solicitada';
        } else if (action === 'adjust_scope') {
          actionLabel = 'Alcance corregido';
        }

        const logEntry = {
          id: `h-${Date.now()}`,
          action: actionLabel,
          user: 'Ramiro (Propietario)',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          comment: comment || (confirmationText ? `Confirmación requerida: "${confirmationText}"` : undefined)
        };

        updatedDecision = {
          ...d,
          status: newStatus,
          rejectionReason: action === 'reject' ? comment : d.rejectionReason,
          history: [logEntry, ...d.history]
        };
        return updatedDecision;
      }
      return d;
    });

    setItem(STORAGE_KEYS.DECISIONS, updated);

    if (updatedDecision) {
      this.logAuditEvent({
        actorType: 'user',
        actorName: 'Ramiro',
        action: `Acción sobre Decisión (${action.toUpperCase()})`,
        actionType: action === 'approve' ? 'approved' : action === 'reject' ? 'reverted' : 'executed',
        resourceType: 'decision',
        resourceId: (updatedDecision as Decision).code,
        resourceLabel: (updatedDecision as Decision).title,
        result: 'success',
        risk: (updatedDecision as Decision).risk,
        scopeImpact: (updatedDecision as Decision).affectedScope,
        humanExplanation: `Ramiro ejecutó la acción "${action}" sobre la decisión ${(updatedDecision as Decision).code}.`,
        jsonPayload: {
          decisionCode: (updatedDecision as Decision).code,
          action,
          comment,
          risk: (updatedDecision as Decision).risk
        }
      });
    }

    return { decisions: updated, updatedDecision };
  }

  // --- WISP INFRASTRUCTURE ---
  getTowers(): WispTower[] {
    return getItem<WispTower[]>(STORAGE_KEYS.TOWERS, INITIAL_TOWERS);
  }

  getRouters(): MikroTikRouter[] {
    return getItem<MikroTikRouter[]>(STORAGE_KEYS.ROUTERS, INITIAL_ROUTERS);
  }

  getLinks(): WispLink[] {
    return getItem<WispLink[]>(STORAGE_KEYS.LINKS, INITIAL_LINKS);
  }

  getIncidents(): WispIncident[] {
    return getItem<WispIncident[]>(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
  }

  createIncident(incidentData: Omit<WispIncident, 'id' | 'code' | 'detectedAt' | 'timeline'>): WispIncident {
    const incidents = this.getIncidents();
    const newInc: WispIncident = {
      ...incidentData,
      id: `inc-${Date.now()}`,
      code: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      detectedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      timeline: [
        {
          time: new Date().toLocaleTimeString().substring(0, 5),
          event: `Incidente registrado manualmente por Ramiro`,
          author: 'Ramiro'
        }
      ]
    };
    const updated = [newInc, ...incidents];
    setItem(STORAGE_KEYS.INCIDENTS, updated);
    this.logAuditEvent({
      actorType: 'user',
      actorName: 'Ramiro',
      action: 'Apertura de Incidente Operativo',
      actionType: 'requested',
      resourceType: 'tower',
      resourceId: newInc.code,
      resourceLabel: newInc.title,
      result: 'warning',
      risk: newInc.severity,
      scopeImpact: `${newInc.affectedClients} clientes afectados reportados`,
      humanExplanation: `Ramiro abrió el incidente ${newInc.code} asignado a ${newInc.assignedSpecialist}.`,
      jsonPayload: { incidentCode: newInc.code, priority: newInc.priority }
    });
    return newInc;
  }

  // --- MARKETING & DELIVERABLES ---
  getCampaigns(): Campaign[] {
    return getItem<Campaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
  }

  createCampaign(campaignData: Omit<Campaign, 'id' | 'code' | 'spentBudgetUsd' | 'metrics'>): Campaign {
    const campaigns = this.getCampaigns();
    const newCampaign: Campaign = {
      ...campaignData,
      id: `camp-${Date.now()}`,
      code: `CMP-2026-${Math.floor(100 + Math.random() * 900)}`,
      spentBudgetUsd: 0,
      metrics: { impressions: 0, clicks: 0, ctrPercent: 0, leadsGenerated: 0, cpaUsd: 0 }
    };
    const updated = [newCampaign, ...campaigns];
    setItem(STORAGE_KEYS.CAMPAIGNS, updated);
    return newCampaign;
  }

  getMediaAssets(): MediaAsset[] {
    return getItem<MediaAsset[]>(STORAGE_KEYS.MEDIA_ASSETS, INITIAL_MEDIA_ASSETS);
  }

  getDeliverables(): Deliverable[] {
    return getItem<Deliverable[]>(STORAGE_KEYS.DELIVERABLES, INITIAL_DELIVERABLES);
  }

  updateDeliverableStatus(id: string, status: Deliverable['status']): Deliverable[] {
    const deliverables = this.getDeliverables();
    const updated = deliverables.map(d => d.id === id ? { ...d, status } : d);
    setItem(STORAGE_KEYS.DELIVERABLES, updated);
    return updated;
  }

  // --- ADMIN & AUDIT ---
  getAdminItems(): AdminItem[] {
    return getItem<AdminItem[]>(STORAGE_KEYS.ADMIN_ITEMS, INITIAL_ADMIN_ITEMS);
  }

  createAdminItem(itemData: Omit<AdminItem, 'id'>): AdminItem {
    const items = this.getAdminItems();
    const newItem: AdminItem = {
      ...itemData,
      id: `adm-${Date.now()}`
    };
    const updated = [newItem, ...items];
    setItem(STORAGE_KEYS.ADMIN_ITEMS, updated);
    return newItem;
  }

  getAuditEvents(): AuditEvent[] {
    return getItem<AuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
  }

  logAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'correlationId'>): AuditEvent {
    const events = this.getAuditEvents();
    const newEvent: AuditEvent = {
      ...eventData,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      correlationId: `CORR-${Math.floor(1000 + Math.random() * 9000)}`
    };
    const updated = [newEvent, ...events.slice(0, 99)]; // Keep latest 100
    setItem(STORAGE_KEYS.AUDIT_EVENTS, updated);
    return newEvent;
  }

  // --- CONVERSATIONS & CHAT ---
  getConversations(): Conversation[] {
    return getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
  }

  getMessages(conversationId: string): Message[] {
    const all = getItem<Record<string, Message[]>>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    return all[conversationId] || [];
  }

  sendMessage(
    conversationId: string,
    text: string,
    options?: {
      isOnlyAnalysis?: boolean;
      createTask?: boolean;
      priority?: string;
      projectId?: string;
      attachments?: any[];
    }
  ): { userMessage: Message; botMessage: Message } {
    const all = getItem<Record<string, Message[]>>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const existing = all[conversationId] || [];
    const convs = this.getConversations();
    const targetConv = convs.find(c => c.id === conversationId);
    const agentId = targetConv?.agentId || 'director';

    const userMessage: Message = {
      id: `m-usr-${Date.now()}`,
      conversationId,
      sender: 'user',
      senderName: 'Ramiro (Propietario)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      content: text,
      isOnlyAnalysis: options?.isOnlyAnalysis
    };

    // Simulate intelligent agent response based on context & agent role
    let botContent: string;
    let executiveSummary: string;
    let findings: string[];
    let technicalEvidence = '';
    let toolCalls: any[] = [];
    let createdTaskId: string | undefined;

    if (agentId === 'operaciones') {
      botContent = `He procesado tu consulta sobre la infraestructura de red WISP.`;
      executiveSummary = `Diagnóstico de 4 torres y 6 routers MikroTik completado. La red opera al 99.4% con 287 clientes activos.`;
      findings = [
        'Enlace troncal Torre Norte - Torre Este requiere cambio de canal DFS a 5680 MHz.',
        'Regla de drop para Winbox en WAN ether1 lista para aplicación en DEC-001.',
        'Consumo de ancho de banda pico en Torre Centro: 420 Mbps.'
      ];
      technicalEvidence = `/ip firewall filter print where chain=input\n[Simulado: 48 reglas analizadas - 0 paquetes perdidos en túnel WireGuard]`;
      toolCalls = [
        { toolName: 'mikrotik_status_check', arguments: { target: 'all_nodes' }, resultSummary: 'Todos los routers alcanzables vía WireGuard.', status: 'success', risk: 'low' }
      ];
    } else if (agentId === 'marketing') {
      botContent = `Análisis de la campaña y biblioteca multimedia finalizado.`;
      executiveSummary = `Campañas activas generando 42 leads con CPA promedio de $15.2 USD. Activos de video para Instagram Reels listos.`;
      findings = [
        'Variantes de video vertical con gancho de teletrabajo muestran 92% de retención estimada.',
        'Presupuesto publicitario simulado de $1,800 USD listo para aprobación en DEC-002.'
      ];
      toolCalls = [
        { toolName: 'render_higgsfield_mock', arguments: { prompt: text }, resultSummary: 'Asset renderizado en entorno de pruebas.', status: 'success', risk: 'low' }
      ];
    } else if (agentId === 'nugacore') {
      botContent = `Revisión de arquitectura y código completada.`;
      executiveSummary = `Pipeline CI/CD 100% verde con 142 pruebas pasadas. La consola opera desacoplada de APIs externas.`;
      findings = [
        'StorageService encapsula persistencia local sin fugas de memoria.',
        'Cero errores en compilación TypeScript estricta.'
      ];
      technicalEvidence = `tsc --noEmit -> 0 errors in 34 files. Bundle size optimizado.`;
    } else if (agentId === 'administracion') {
      botContent = `Seguimiento de acuerdos y control presupuestal actualizado.`;
      executiveSummary = `14 acuerdos vigentes. Minuta de negociación con Carrier Metro ($1.20 USD/Mbps) registrada en DEL-2026-06.`;
      findings = [
        'Renovación de predio Torre Sur agendada para el 30 de septiembre.',
        'Conciliación de cobranza mensual completada al 94.2%.'
      ];
    } else {
      // Director General
      botContent = `He coordinado a los 4 especialistas para responder a tu solicitud.`;
      executiveSummary = `Visión general consolidada: Operaciones WISP requiere aprobación en DEC-001 y DEC-004; Marketing espera visto bueno en DEC-002.`;
      findings = [
        '5 decisiones prioritarias pendientes en bandeja humana.',
        'Disponibilidad global de red: 99.4% en 4 torres.',
        'Todas las tareas críticas cuentan con plan de rollback.'
      ];
      technicalEvidence = `Hermes Engine v2.4 (Simulado) - Latencia de respuesta: 180ms - Tokens consumidos: 450 tokens.`;
    }

    if (options?.createTask) {
      const newTask = this.createTask({
        title: `Tarea derivada: ${text.substring(0, 50)}...`,
        description: text,
        projectId: options?.projectId || 'proj-wisp-ops',
        assignedAgent: agentId,
        priority: (options?.priority as any) || 'media',
        status: 'ready',
        progressPercent: 0,
        loggedHours: 0,
        estimatedHours: 4,
        requiresHumanApproval: true,
        dependencies: [],
        deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
      });
      createdTaskId = newTask.code;
      findings.push(`Se ha creado automáticamente la tarea ${newTask.code} en el tablero Kanban.`);
    }

    const botMessage: Message = {
      id: `m-bot-${Date.now()}`,
      conversationId,
      sender: agentId,
      senderName: (targetConv?.title?.split(' & ')[0]) || 'Agente Hermes',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      content: botContent,
      executiveSummary,
      findings,
      technicalEvidence,
      toolCalls,
      createdTaskId
    };

    all[conversationId] = [...existing, userMessage, botMessage];
    setItem(STORAGE_KEYS.MESSAGES, all);

    // Update conversation timestamp
    const updatedConvs = convs.map(c => c.id === conversationId ? { ...c, lastMessageTimestamp: 'Justo ahora' } : c);
    setItem(STORAGE_KEYS.CONVERSATIONS, updatedConvs);

    return { userMessage, botMessage };
  }

  // --- NOTIFICATIONS ---
  getNotifications(): AppNotification[] {
    return getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  createNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const notifs = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Justo ahora',
      read: false
    };
    const updated = [newNotif, ...notifs];
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return newNotif;
  }

  markNotificationAsRead(id: string): AppNotification[] {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }

  toggleNotificationRead(id: string): AppNotification[] {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: !n.read } : n);
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }

  deleteNotification(id: string): AppNotification[] {
    const notifs = this.getNotifications();
    const updated = notifs.filter(n => n.id !== id);
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }

  clearAllNotifications(): AppNotification[] {
    const updated: AppNotification[] = [];
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }

  markAllNotificationsRead(): AppNotification[] {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }

  // --- RESET ALL DATA ---
  resetAllToDefault(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AGENTS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.DECISIONS);
      localStorage.removeItem(STORAGE_KEYS.TOWERS);
      localStorage.removeItem(STORAGE_KEYS.ROUTERS);
      localStorage.removeItem(STORAGE_KEYS.LINKS);
      localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
      localStorage.removeItem(STORAGE_KEYS.MEDIA_ASSETS);
      localStorage.removeItem(STORAGE_KEYS.DELIVERABLES);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_EVENTS);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (err) {
      console.warn('Error clearing localStorage:', err);
    }
  }
}

export const storageService = new StorageService();
