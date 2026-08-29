import { AgentProfile, Project } from '../types';

export const INITIAL_AGENTS: AgentProfile[] = [
  {
    id: 'director',
    name: 'Director',
    roleTitle: 'Director Ejecutivo & Coordinador Estratégico',
    department: 'Dirección y Orquestación',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    currentTask: 'Supervisión de entregables WISP y balance de prioridades ejecutivas',
    lastActivity: 'Hace 2 minutos',
    model: 'Director Core / Claude 3.5 Sonnet (Simulado)',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 30,
    defaultPriority: 'alta',
    responsibilities: [
      'Orquestar y delegar tareas a los especialistas técnicos',
      'Sintetizar reportes complejos en resúmenes ejecutivos para Ramiro',
      'Detectar bloqueos interdisciplinarios y riesgos operacionales',
      'Filtrar y preparar propuestas de decisión con análisis de riesgo'
    ],
    limits: [
      'No puede ejecutar cambios de configuración en infraestructura sin aprobación explícita',
      'No puede comprometer presupuestos o publicar campañas directamente'
    ],
    skills: ['Gestión de proyectos', 'Síntesis ejecutiva', 'Orquestación multi-agente', 'Análisis de riesgo'],
    allowedTools: ['read_task_board', 'assign_agent', 'generate_executive_summary', 'request_human_approval', 'list_deliverables'],
    stats: {
      activeTasks: 3,
      completedTasks: 42,
      successRate: 98.5,
      recentErrors: 0,
      totalRuns: 184,
      tokensConsumedEstimate: '1.2M tokens'
    },
    systemInstructions: 'Actúa como el Director Ejecutivo del equipo de agentes para NUGA. Tu foco es el rigor ejecutivo, claridad extrema para Ramiro, delegación estricta y protección de la infraestructura.',
    isDemo: true
  },
  {
    id: 'nugacore',
    name: 'NugaCore',
    roleTitle: 'Ingeniería de Software & Arquitectura',
    department: 'Tecnología y Desarrollo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    currentTask: 'Refactorización de adapters para desacoplar APIs de simulación',
    lastActivity: 'Hace 5 minutos',
    model: 'NugaCore Engine / DeepSeek-Coder-V2 (Simulado)',
    autonomyLevel: 'semi-autonomo',
    requiresApproval: true,
    maxExecutionTimeMinutes: 45,
    defaultPriority: 'media',
    responsibilities: [
      'Mantenimiento de la base de código y pipelines CI/CD',
      'Revisión de pull requests, análisis estático y suites de pruebas',
      'Optimización de rendimiento y modularidad de la arquitectura',
      'Gestión de migraciones y esquemas de base de datos'
    ],
    limits: [
      'Prohibido mergear directo a rama main/producción sin dry-run y aprobación humana',
      'Herramientas de escritura desactivadas por defecto'
    ],
    skills: ['TypeScript', 'React 19', 'Node.js', 'Clean Architecture', 'Docker / K8s', 'Seguridad de API'],
    allowedTools: ['git_read_repo', 'run_tests_dry', 'analyze_ast', 'draft_pr_proposal', 'check_vulnerabilities'],
    stats: {
      activeTasks: 4,
      completedTasks: 38,
      successRate: 96.2,
      recentErrors: 1,
      totalRuns: 142,
      tokensConsumedEstimate: '850K tokens'
    },
    systemInstructions: 'Eres el especialista de ingeniería de software e infraestructura de NugaCore. Prioriza la tipificación estricta, la separación de responsabilidades y la seguridad.',
    isDemo: true
  },
  {
    id: 'operaciones',
    name: 'Operaciones',
    roleTitle: 'Infraestructura de Redes & Operaciones WISP',
    department: 'Telecomunicaciones y Redes',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'warning',
    currentTask: 'Monitoreo de latencia en Torre Norte y auditoría de firewall CHR-LAB-01',
    lastActivity: 'Hace 1 minuto',
    model: 'NetOps Core / GPT-4o Mini (Simulado)',
    autonomyLevel: 'supervisado',
    requiresApproval: true,
    maxExecutionTimeMinutes: 20,
    defaultPriority: 'urgente',
    responsibilities: [
      'Monitoreo continuo de 4 torres, 6 routers y 12 enlaces de transporte WISP',
      'Diagnóstico de saturación de interfaces, latencia y pérdida de paquetes',
      'Auditoría de configuraciones RouterOS (BGP, OSPF, WireGuard, Firewall, Simple Queues)',
      'Generación de propuestas de cambio con planes de rollback verificados'
    ],
    limits: [
      'ESTRICTAMENTE PROHIBIDO aplicar scripts en caliente sin simulación de dry-run y confirmación formal',
      'Solo utiliza rangos de documentación RFC 5737'
    ],
    skills: ['RouterOS v7', 'MikroTik Certified', 'WireGuard', 'BGP / OSPF', 'QoS / Mangle', 'Diagnóstico RF'],
    allowedTools: ['mikrotik_read_status', 'ping_traceroute_sim', 'generate_dryrun_script', 'draft_change_ticket'],
    stats: {
      activeTasks: 5,
      completedTasks: 51,
      successRate: 94.0,
      recentErrors: 2,
      totalRuns: 210,
      tokensConsumedEstimate: '1.5M tokens'
    },
    systemInstructions: 'Especialista en redes WISP y RouterOS. Enfatiza la tolerancia a fallos, redundancia de enlaces, monitoreo proactivo y seguridad perimetral.',
    isDemo: true
  },
  {
    id: 'marketing',
    name: 'Marketing',
    roleTitle: 'Estrategia Creativa & Producción Visual',
    department: 'Crecimiento y Marketing',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    currentTask: 'Generación de storyboards para Campaña Fibra + WISP 200Mbps',
    lastActivity: 'Hace 12 minutos',
    model: 'Media Core / Claude 3.5 Sonnet (Simulado)',
    autonomyLevel: 'semi-autonomo',
    requiresApproval: true,
    maxExecutionTimeMinutes: 60,
    defaultPriority: 'media',
    responsibilities: [
      'Planificación y diseño de campañas de captación de clientes residenciales y PYME',
      'Elaboración de guiones, storyboards y prompts para activos multimedia (Higgsfield/MiniMax)',
      'Análisis de métricas de adquisición (CTR, CPA, leads, tasa de conversión)',
      'Aseguramiento de la coherencia visual y narrativa de marca NUGA'
    ],
    limits: [
      'No puede publicar anuncios ni gastar créditos sin aprobación de Ramiro',
      'Todo activo generado requiere visto bueno estético'
    ],
    skills: ['Copywriting B2B/B2C', 'Prompt Engineering Visual', 'Storyboarding', 'Analítica de Campañas', 'Video Direction'],
    allowedTools: ['draft_campaign_brief', 'generate_prompt_higgsfield_mock', 'review_metrics_sim', 'render_storyboard'],
    stats: {
      activeTasks: 3,
      completedTasks: 29,
      successRate: 97.0,
      recentErrors: 0,
      totalRuns: 95,
      tokensConsumedEstimate: '920K tokens'
    },
    systemInstructions: 'Director creativo de NUGA. Diseña campañas visuales impactantes, orientadas a la propuesta de valor de velocidad y confiabilidad.',
    isDemo: true
  },
  {
    id: 'administracion',
    name: 'Administración',
    roleTitle: 'Gestión Operativa, Minutas & Seguimiento',
    department: 'Operaciones Administrativas',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'idle',
    currentTask: 'Consolidación de acuerdos de proveedores de fibra y minutas de auditoría',
    lastActivity: 'Hace 25 minutos',
    model: 'Admin Core / GPT-4o (Simulado)',
    autonomyLevel: 'supervisado',
    requiresApproval: false,
    maxExecutionTimeMinutes: 20,
    defaultPriority: 'baja',
    responsibilities: [
      'Redacción de minutas ejecutivas, registro de acuerdos y seguimiento de compromisos',
      'Organización de cotizaciones preliminares y registro informativo de pagos recibidos',
      'Control de calendario de revisiones, vencimientos y checklist de contratos',
      'Generación de reportes de control administrativo sin ejecución bancaria real'
    ],
    limits: [
      'Estrictamente informativo y de registro: no efectúa transacciones financieras reales',
      'No tiene acceso a cuentas bancarias'
    ],
    skills: ['Redacción ejecutiva', 'Seguimiento de acuerdos', 'Organización documental', 'Control presupuestal'],
    allowedTools: ['log_meeting_minutes', 'create_followup_reminder', 'draft_cost_comparison', 'export_admin_report'],
    stats: {
      activeTasks: 2,
      completedTasks: 34,
      successRate: 99.1,
      recentErrors: 0,
      totalRuns: 88,
      tokensConsumedEstimate: '450K tokens'
    },
    systemInstructions: 'Especialista administrativo. Garantiza que ningún acuerdo o fecha límite se pierda, manteniendo registros claros y trazables.',
    isDemo: true
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-wisp-ops',
    code: 'PRJ-WISP-01',
    name: 'Documentación Operativa y Modernización WISP',
    category: 'wisp',
    objective: 'Estandarizar topologías, auditar configuraciones de 6 routers MikroTik y asegurar disponibilidad >99.5% en las 4 torres.',
    owner: 'Ramiro (Propietario)',
    team: ['director', 'operaciones'],
    status: 'active',
    progressPercent: 68,
    startDate: '2026-08-01',
    targetEndDate: '2026-09-15',
    risks: [
      { description: 'Saturación en enlace inalámbrico Torre Norte - Torre Este en horas pico', level: 'high', mitigation: 'Habilitar agregación de canales o migración a banda 60GHz' },
      { description: 'Reglas de firewall heredadas sin documentación en EDGE-DEMO-01', level: 'medium', mitigation: 'Auditoría exhaustiva y propuesta de rollback por etapas' }
    ],
    milestones: [
      { id: 'm1', title: 'Inventario físico y lógico de 4 torres', dueDate: '2026-08-10', completed: true },
      { id: 'm2', title: 'Auditoría de seguridad RouterOS v7', dueDate: '2026-08-25', completed: true },
      { id: 'm3', title: 'Plan de contingencia y failover BGP', dueDate: '2026-09-05', completed: false },
      { id: 'm4', title: 'Topología definitiva y monitoreo de latencia', dueDate: '2026-09-15', completed: false }
    ],
    budgetEstimateUsd: 4200,
    summaryExecutive: 'Proyecto central de infraestructura de telecomunicaciones con 287 clientes activos. En fase de optimización de rutas y hardening de firewall.',
    deliverablesCount: 5,
    isDemo: true
  },
  {
    id: 'proj-chr-lab',
    code: 'PRJ-CHR-02',
    name: 'Auditoría CHR de Laboratorio y Pruebas WireGuard',
    category: 'wisp',
    objective: 'Implementar túneles cifrados seguros para gestión remota de routers de borde sin exponer puertos Winbox/SSH a Internet.',
    owner: 'Ramiro (Propietario)',
    team: ['operaciones', 'nugacore'],
    status: 'active',
    progressPercent: 82,
    startDate: '2026-08-10',
    targetEndDate: '2026-08-30',
    risks: [
      { description: 'Bloqueo accidental de acceso administrativo en caso de error de firewall', level: 'critical', mitigation: 'Safe Mode activado y script de watchdog con auto-reversión' }
    ],
    milestones: [
      { id: 'm1', title: 'Despliegue de CHR-LAB-01 en entorno aislado', dueDate: '2026-08-12', completed: true },
      { id: 'm2', title: 'Configuración de WireGuard con llaves rotativas', dueDate: '2026-08-20', completed: true },
      { id: 'm3', title: 'Pruebas de penetración y escaneo nmap simulado', dueDate: '2026-08-28', completed: true },
      { id: 'm4', title: 'Pase a aprobación de Ramiro para despliegue en borde', dueDate: '2026-08-30', completed: false }
    ],
    budgetEstimateUsd: 1500,
    summaryExecutive: 'Pruebas en CHR concluidas exitosamente. Esperando decisión ejecutiva para aplicar la política de gestión WireGuard en nodos de producción.',
    deliverablesCount: 4,
    isDemo: true
  },
  {
    id: 'proj-nugacore-pilot',
    code: 'PRJ-CORE-03',
    name: 'Piloto Interno de NugaCore y Consola de Agentes',
    category: 'nugacore',
    objective: 'Desarrollar la consola administrativa desacoplada para gestión de agentes, toma de decisiones y visualización ejecutiva.',
    owner: 'Ramiro (Propietario)',
    team: ['director', 'nugacore', 'administracion'],
    status: 'active',
    progressPercent: 90,
    startDate: '2026-08-05',
    targetEndDate: '2026-09-01',
    risks: [
      { description: 'Sobrecarga de información técnica en la interfaz del usuario', level: 'medium', mitigation: 'Separar vista ejecutiva de evidencia expandible y estandarizar lenguaje claro' }
    ],
    milestones: [
      { id: 'm1', title: 'Definición de contratos y modelo de datos TypeScript', dueDate: '2026-08-12', completed: true },
      { id: 'm2', title: 'Implementación del Centro de Decisiones con confirmación estricta', dueDate: '2026-08-22', completed: true },
      { id: 'm3', title: 'Módulos WISP, Marketing y Entregables', dueDate: '2026-08-28', completed: true },
      { id: 'm4', title: 'Validación de persistencia local y empaque de release', dueDate: '2026-09-01', completed: false }
    ],
    budgetEstimateUsd: 6500,
    summaryExecutive: 'Consola operativa lista para demostración ejecutiva integral, con 13 pantallas funcionales y persistencia local.',
    deliverablesCount: 6,
    isDemo: true
  },
  {
    id: 'proj-mkt-hogar',
    code: 'PRJ-MKT-04',
    name: 'Campaña Internet Hogar Alta Velocidad 2026',
    category: 'marketing',
    objective: 'Captar 60 nuevos abonados residenciales en zonas de cobertura de Torre Norte y Torre Sur con oferta de 100Mbps simétricos.',
    owner: 'Ramiro (Propietario)',
    team: ['director', 'marketing'],
    status: 'active',
    progressPercent: 55,
    startDate: '2026-08-15',
    targetEndDate: '2026-09-30',
    risks: [
      { description: 'Capacidad de instalación de cuadrillas limitada a 4 servicios diarios', level: 'medium', mitigation: 'Coordinar con Operaciones y escalonar pauta publicitaria' }
    ],
    milestones: [
      { id: 'm1', title: 'Definición de propuesta de valor y segmentación geográfica', dueDate: '2026-08-18', completed: true },
      { id: 'm2', title: 'Generación de guiones y biblioteca de video para redes', dueDate: '2026-08-26', completed: true },
      { id: 'm3', title: 'Aprobación de presupuesto simulado ($1,800 USD)', dueDate: '2026-09-02', completed: false },
      { id: 'm4', title: 'Lanzamiento de pauta digital y seguimiento de leads', dueDate: '2026-09-30', completed: false }
    ],
    budgetEstimateUsd: 1800,
    summaryExecutive: 'Creatividades y piezas de video listas para revisión ejecutiva. Storyboard evaluado con alta puntuación de impacto.',
    deliverablesCount: 5,
    isDemo: true
  }
];
