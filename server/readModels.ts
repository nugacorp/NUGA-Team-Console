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
    lastActivity: 'Control plane MikroTik disponible; ejecución RouterOS bloqueada',
    model: 'Hermes',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 20,
    defaultPriority: 'urgente',
    responsibilities: [
      'Analizar la operación WISP y la salud de routers cuando MikroMCP esté conectado',
      'Preparar propuestas de registro de routers por red privada',
      'Preparar planes deterministas de suspensión y reactivación por servicio',
      'Entregar evidencia, alcance, riesgo, validación y rollback antes de cualquier cambio'
    ],
    limits: [
      'No ejecuta escrituras RouterOS en esta fase',
      'No usa SSH directo ni direcciones públicas como camino de administración',
      'No almacena credenciales RouterOS en navegador, VITE_*, logs ni repositorio',
      'Toda futura ejecución requiere dry-run, aprobación humana, verificación y rollback'
    ],
    skills: ['Redes', 'WISP', 'RouterOS', 'MikroMCP', 'Planeación segura de cambios'],
    allowedTools: [
      'read_task_board',
      'mikromcp_list_routers',
      'mikromcp_check_router_health',
      'mikromcp_get_system_status',
      'mikromcp_list_interfaces',
      'mikrotik_plan_router_enrollment',
      'mikrotik_plan_service_action',
      'request_human_approval'
    ],
    stats: emptyStats(),
    systemInstructions: 'Opera MikroTik con enfoque de control plane: observar y diagnosticar por MikroMCP; preparar planes deterministas y auditables; nunca ejecutar cambios RouterOS mientras el gate de escritura esté bloqueado.'
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
