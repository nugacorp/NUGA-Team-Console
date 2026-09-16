import type { AgentProfile, AppSettings } from '../src/types';

const emptyStats = () => ({
  activeTasks: 0,
  completedTasks: 0,
  successRate: 0,
  recentErrors: 0,
  totalRuns: 0,
  tokensConsumedEstimate: 'No disponible'
});

export const TEAM_PROFILES: AgentProfile[] = [
  {
    id: 'director',
    name: 'Director',
    roleTitle: 'Director Ejecutivo y Coordinador Estratégico',
    department: 'Dirección y Orquestación',
    avatar: '',
    status: 'idle',
    lastActivity: 'Sin actividad reportada',
    model: 'Hermes',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 30,
    defaultPriority: 'alta',
    responsibilities: ['Coordinar el equipo', 'Preparar decisiones para Ramiro'],
    limits: ['No ejecuta cambios reales sin autorización'],
    skills: ['Orquestación', 'Síntesis ejecutiva'],
    allowedTools: ['read_task_board', 'request_human_approval'],
    stats: emptyStats(),
    systemInstructions: 'Perfil organizacional administrado por NUGA Console.'
  },
  {
    id: 'nugacore',
    name: 'NugaCore',
    roleTitle: 'Ingeniería de Software y Arquitectura',
    department: 'Tecnología y Desarrollo',
    avatar: '',
    status: 'idle',
    lastActivity: 'Sin actividad reportada',
    model: 'Hermes',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 45,
    defaultPriority: 'media',
    responsibilities: ['Mantener software y arquitectura'],
    limits: ['No despliega ni fusiona cambios sin validación'],
    skills: ['Desarrollo de software', 'Infraestructura'],
    allowedTools: ['git_read_repo', 'run_tests_dry'],
    stats: emptyStats(),
    systemInstructions: 'Perfil organizacional administrado por NUGA Console.'
  },
  {
    id: 'operaciones',
    name: 'Operaciones',
    roleTitle: 'Infraestructura de Redes y Operaciones WISP',
    department: 'Telecomunicaciones y Redes',
    avatar: '',
    status: 'idle',
    lastActivity: 'Control plane técnico MikroTik disponible; ejecución RouterOS bloqueada',
    model: 'Hermes',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 20,
    defaultPriority: 'urgente',
    responsibilities: [
      'Analizar la operación WISP y la salud de routers cuando MikroMCP esté conectado',
      'Diagnosticar interfaces, routing, firewall, queues y degradaciones de red',
      'Preparar propuestas de registro de routers por red privada',
      'Preparar planes técnicos de mantenimiento y cambios de red con evidencia, alcance, riesgo, validación y rollback'
    ],
    limits: [
      'No es un CRM y no administra facturación, pagos ni estados comerciales de clientes',
      'No suspende ni reactiva clientes por motivos comerciales o de cobranza',
      'No ejecuta escrituras RouterOS en esta fase',
      'No usa SSH directo ni direcciones públicas como camino de administración',
      'No almacena credenciales RouterOS en navegador, VITE_*, logs ni repositorio',
      'Toda futura ejecución técnica requiere dry-run, aprobación humana, verificación y rollback'
    ],
    skills: ['Redes', 'WISP', 'RouterOS', 'MikroMCP', 'Diagnóstico', 'Planeación segura de cambios'],
    allowedTools: [
      'read_task_board',
      'mikromcp_list_routers',
      'mikromcp_check_router_health',
      'mikromcp_get_system_status',
      'mikromcp_list_interfaces',
      'mikrotik_plan_router_enrollment',
      'mikrotik_plan_technical_change',
      'request_human_approval'
    ],
    stats: emptyStats(),
    systemInstructions: 'Opera MikroTik como agente técnico: observar, diagnosticar y preparar cambios de red auditables mediante MikroMCP. CRM, facturación, pagos, suspensión y reactivación comercial de clientes pertenecen a NugaCore u otros sistemas especializados y están fuera de su alcance.'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    roleTitle: 'Estrategia Creativa y Producción Visual',
    department: 'Crecimiento y Marketing',
    avatar: '',
    status: 'idle',
    lastActivity: 'Sin actividad reportada',
    model: 'Hermes',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 60,
    defaultPriority: 'media',
    responsibilities: ['Preparar campañas y activos para revisión'],
    limits: ['No publica ni compra publicidad sin autorización'],
    skills: ['Marketing', 'Producción visual'],
    allowedTools: ['read_task_board'],
    stats: emptyStats(),
    systemInstructions: 'Perfil organizacional administrado por NUGA Console.'
  },
  {
    id: 'administracion',
    name: 'Administración',
    roleTitle: 'Gestión Operativa, Minutas y Seguimiento',
    department: 'Operaciones Administrativas',
    avatar: '',
    status: 'idle',
    lastActivity: 'Sin actividad reportada',
    model: 'Hermes',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 20,
    defaultPriority: 'baja',
    responsibilities: ['Registrar acuerdos y seguimiento'],
    limits: ['No realiza transacciones financieras'],
    skills: ['Administración', 'Control documental'],
    allowedTools: ['read_task_board'],
    stats: emptyStats(),
    systemInstructions: 'Perfil organizacional administrado por NUGA Console.'
  }
];

export const SERVER_SETTINGS: AppSettings = {
  theme: 'dark',
  requireHumanApprovalAllHighRisk: true,
  allowWriteToolsGlobal: false,
  maskSensitiveData: true,
  retainLogsDays: 90,
  telegramNotificationsSimulated: false,
  maxAgentExecutionMinutes: 45,
  hermesEngineStatus: 'Disponible',
  mcpServerStatus: 'offline',
  mikrotikApiStatus: 'disconnected',
  higgsfieldApiStatus: 'disconnected',
  isDemo: false
};
