import { AdminItem, AuditEvent, Conversation, Message, AppNotification, AppSettings, User } from '../types';

export const INITIAL_USER: User = {
  id: 'user-ramiro',
  name: 'Ramiro',
  email: 'ramiro@nuga.network',
  role: 'owner',
  title: 'Propietario & Director Ejecutivo',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isDemo: true
};

const RAW_ADMIN_ITEMS: AdminItem[] = [
  {
    id: 'adm-01',
    title: 'Renovación de Contrato de Arrendamiento de Predio Torre Sur',
    category: 'acuerdo',
    responsible: 'Ramiro / Especialista Administración',
    agentAssigned: 'administracion',
    deadline: '2026-09-30',
    status: 'in_progress',
    priority: 'alta',
    amountUsd: 350,
    evidenceRef: 'CONTRATO-ARREND-SUR-2025.pdf',
    notes: 'Negociación para extensión de 24 meses con cláusula de acceso 24/7 para cuadrillas técnicas.'
  },
  {
    id: 'adm-02',
    title: 'Cotización Preliminar: Banco de Baterías de Litio 48V para Torre Centro',
    category: 'cotizacion',
    responsible: 'Especialista Administración',
    agentAssigned: 'administracion',
    deadline: '2026-09-05',
    status: 'pending',
    priority: 'media',
    amountUsd: 1450,
    evidenceRef: 'COTIZ-SOLAR-LITIO-48V.pdf',
    notes: 'Comparativa de 2 proveedores para reemplazar baterías AGM por LiFePO4 de 100Ah.'
  },
  {
    id: 'adm-03',
    title: 'Minuta de Sesión de Revisión Trimestral de Objetivos y Capacidad WISP',
    category: 'minuta',
    responsible: 'Director IA / Ramiro',
    agentAssigned: 'director',
    deadline: '2026-08-30',
    status: 'completed',
    priority: 'media',
    evidenceRef: 'MINUTA-REV-Q3-2026.md',
    notes: 'Acuerdos clave: migrar enlaces a 60GHz en Q4 y priorizar captación de clientes residenciales.'
  },
  {
    id: 'adm-04',
    title: 'Registro Informativo: Pago de Servicio de Enlace Dedicado Carrier Metro',
    category: 'pago_reportado',
    responsible: 'Administración',
    agentAssigned: 'administracion',
    deadline: '2026-09-01',
    status: 'completed',
    priority: 'alta',
    amountUsd: 600,
    evidenceRef: 'FACTURA-CARRIER-METRO-AGOSTO.pdf',
    notes: 'Registro informativo de facturación. No efectúa movimientos bancarios reales desde la consola.'
  },
  {
    id: 'adm-05',
    title: 'Checklist de Pólizas de Seguro para Equipamiento en Torres',
    category: 'documento',
    responsible: 'Especialista Administración',
    agentAssigned: 'administracion',
    deadline: '2026-09-15',
    status: 'in_progress',
    priority: 'baja',
    amountUsd: 480,
    evidenceRef: 'POLIZA-SEGURO-INFRA-2026.pdf',
    notes: 'Verificación de cobertura por descargas atmosféricas y vandalismo.'
  },
  {
    id: 'adm-06',
    title: 'Conciliación de Cobranza Mensual de 287 Clientes WISP',
    category: 'pendiente',
    responsible: 'Administración / Ramiro',
    agentAssigned: 'administracion',
    deadline: '2026-09-05',
    status: 'in_progress',
    priority: 'alta',
    amountUsd: 8610,
    evidenceRef: 'REPORTE-COBRANZA-AGO-2026.xlsx',
    notes: 'Tasa de cumplimiento en fecha: 94.2%. 16 clientes en periodo de gracia.'
  },
  {
    id: 'adm-07',
    title: 'Presupuesto Preliminar para Pauta Publicitaria Q4 ($5,500 USD)',
    category: 'cotizacion',
    responsible: 'Especialista Marketing / Administración',
    agentAssigned: 'marketing',
    deadline: '2026-09-20',
    status: 'pending',
    priority: 'media',
    amountUsd: 5500,
    evidenceRef: 'PRESUPUESTO-MKT-Q4.md',
    notes: 'Distribución prevista: 60% Meta Ads, 25% Google Search, 15% eventos locales.'
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-director',
    agentId: 'director',
    title: 'Dirección General & Resumen de Operaciones',
    lastMessageTimestamp: 'Hace 2 minutos',
    unreadCount: 1,
    isDemo: true
  },
  {
    id: 'conv-operaciones',
    agentId: 'operaciones',
    title: 'Monitoreo WISP & Auditoría MikroTik',
    lastMessageTimestamp: 'Hace 8 minutos',
    unreadCount: 2,
    isDemo: true
  },
  {
    id: 'conv-nugacore',
    agentId: 'nugacore',
    title: 'Ingeniería NugaCore & CI/CD',
    lastMessageTimestamp: 'Hace 25 minutos',
    unreadCount: 0,
    isDemo: true
  },
  {
    id: 'conv-marketing',
    agentId: 'marketing',
    title: 'Estrategia de Campañas & Storyboards',
    lastMessageTimestamp: 'Hace 45 minutos',
    unreadCount: 0,
    isDemo: true
  },
  {
    id: 'conv-administracion',
    agentId: 'administracion',
    title: 'Acuerdos, Minutas & Seguimiento',
    lastMessageTimestamp: 'Hace 1 hora',
    unreadCount: 0,
    isDemo: true
  }
];

const RAW_MESSAGES: Record<string, Message[]> = {
  'conv-director': [
    {
      id: 'm-dir-1',
      conversationId: 'conv-director',
      sender: 'user',
      senderName: 'Ramiro (Propietario)',
      timestamp: '2026-08-28 14:00:00',
      content: 'Resume las decisiones pendientes más críticas y el estado del equipo hoy.'
    },
    {
      id: 'm-dir-2',
      conversationId: 'conv-director',
      sender: 'director',
      senderName: 'Director IA',
      timestamp: '2026-08-28 14:02:00',
      content: 'He consolidado el estado general del equipo y las decisiones prioritarias que requieren tu visto bueno:',
      executiveSummary: 'El equipo opera al 99.4% de disponibilidad con 287 clientes activos. Tienes 5 decisiones pendientes en bandeja, siendo DEC-001 (cerrar Winbox público en router principal) la de mayor severidad.',
      findings: [
        'DEC-001 (Operaciones): Cerrar Winbox público en EDGE-DEMO-01. Riesgo crítico si no se restringe a WireGuard.',
        'DEC-002 (Marketing): Autorizar presupuesto escalonado de $1,800 USD para Campaña Internet Hogar.',
        'DEC-003 (Operaciones): Habilitar Burst en colas simples de Torre Norte para optimizar streaming.',
        'DEC-004 (Operaciones): Migrar frecuencia de enlace a 5680 MHz para resolver ruido en Torre Este.',
        'DEC-005 (Administración): Formalizar contrato de 500Mbps simétricos con Carrier Metro.'
      ],
      requiredDecisionId: 'dec-001',
      technicalEvidence: 'Telemetría consolidada: CPU promedio en routers 24%, tráfico pico 420 Mbps, 0 caídas totales registradas en las últimas 48 horas.',
      toolCalls: [
        {
          toolName: 'list_pending_decisions',
          arguments: { filter: 'pending', limit: 5 },
          resultSummary: '5 decisiones recuperadas ordenadas por riesgo descendente.',
          status: 'success',
          risk: 'low'
        },
        {
          toolName: 'get_team_status',
          arguments: {},
          resultSummary: '4 especialistas activos, 1 en estado de atención (Operaciones).',
          status: 'success',
          risk: 'low'
        }
      ]
    }
  ],
  'conv-operaciones': [
    {
      id: 'm-ops-1',
      conversationId: 'conv-operaciones',
      sender: 'user',
      senderName: 'Ramiro (Propietario)',
      timestamp: '2026-08-28 11:00:00',
      content: 'Revisa el estado del piloto WISP y el hallazgo de firewall en EDGE-DEMO-01.'
    },
    {
      id: 'm-ops-2',
      conversationId: 'conv-operaciones',
      sender: 'operaciones',
      senderName: 'Especialista Operaciones WISP',
      timestamp: '2026-08-28 11:04:00',
      content: 'Análisis de infraestructura completado. Se generó la propuesta de remediación inmediata:',
      executiveSummary: 'Detectamos 42 intentos de conexión externa en el puerto 8291 (Winbox) de la IP pública 198.51.100.2. La propuesta DEC-001 aislará el acceso exclusivamente a través de la VPN WireGuard.',
      findings: [
        'Puerto 8291 abierto en ether1-WAN sin lista blanca.',
        'Túnel WireGuard 192.0.2.254/24 operativo y verificado en laboratorio CHR-LAB-01.',
        'La aplicación del script cuenta con rollback automático por watchdog de 120s.'
      ],
      requiredDecisionId: 'dec-001',
      technicalEvidence: `/ip firewall filter
add chain=input action=accept in-interface=wireguard1 comment="Permitir Winbox solo por WireGuard" dst-port=8291 protocol=tcp
add chain=input action=drop in-interface=ether1-WAN comment="Bloquear Winbox en WAN publica" dst-port=8291 protocol=tcp`,
      toolCalls: [
        {
          toolName: 'mikrotik_audit_ports',
          arguments: { routerId: 'EDGE-DEMO-01' },
          resultSummary: 'Puerto 8291 expuesto en WAN ether1.',
          status: 'requires_approval',
          risk: 'critical'
        }
      ]
    }
  ],
  'conv-nugacore': [
    {
      id: 'm-core-1',
      conversationId: 'conv-nugacore',
      sender: 'user',
      senderName: 'Ramiro (Propietario)',
      timestamp: '2026-08-28 10:15:00',
      content: '¿Cómo va la arquitectura desacoplada de la consola?'
    },
    {
      id: 'm-core-2',
      conversationId: 'conv-nugacore',
      sender: 'nugacore',
      senderName: 'Especialista NugaCore',
      timestamp: '2026-08-28 10:18:00',
      content: 'La capa de servicios está 100% desacoplada y validada en TypeScript estricto:',
      executiveSummary: 'Todos los componentes leen desde storageService con fallback a mockData. La consola funciona de manera fluida y autónoma sin dependencias externas.',
      findings: [
        '100% de los métodos de lectura y escritura tipados con interfaces de dominio.',
        'Soporte completo para persistencia local y botón de restablecer datos DEMO.',
        'Cero errores en suite de compilación estricta.'
      ]
    }
  ],
  'conv-marketing': [
    {
      id: 'm-mkt-1',
      conversationId: 'conv-marketing',
      sender: 'user',
      senderName: 'Ramiro (Propietario)',
      timestamp: '2026-08-28 09:30:00',
      content: 'Prepara una campaña de Internet Hogar con creatividades de video.'
    },
    {
      id: 'm-mkt-2',
      conversationId: 'conv-marketing',
      sender: 'marketing',
      senderName: 'Especialista Marketing & Medios',
      timestamp: '2026-08-28 09:35:00',
      content: 'He preparado el plan integral de medios y los videos en la Biblioteca Multimedia:',
      executiveSummary: 'Campaña "Internet Hogar 100Mbps Simétricos" lista con 4 variantes de video vertical y 3 banners. Se solicita aprobación de presupuesto en DEC-002.',
      findings: [
        'Videos optimizados para Instagram Reels y TikTok con gancho de teletrabajo.',
        'Presupuesto propuesto: $1,800 USD con CPA proyectado < $28 USD.',
        'Integración con Higgsfield simulada para generación de variantes.'
      ],
      requiredDecisionId: 'dec-002'
    }
  ],
  'conv-administracion': [
    {
      id: 'm-adm-1',
      conversationId: 'conv-administracion',
      sender: 'user',
      senderName: 'Ramiro (Propietario)',
      timestamp: '2026-08-28 08:45:00',
      content: 'Organiza los pendientes administrativos y el contrato de Carrier Metro.'
    },
    {
      id: 'm-adm-2',
      conversationId: 'conv-administracion',
      sender: 'administracion',
      senderName: 'Especialista Administración',
      timestamp: '2026-08-28 08:50:00',
      content: 'Pendientes actualizados y minuta consolidada en el Entregable DEL-2026-06:',
      executiveSummary: 'Se negoció la tarifa de 500Mbps a $1.20 USD/Mbps ($600 USD mensuales). El acuerdo está registrado y listo para decisión ejecutiva en DEC-005.',
      findings: [
        'Ahorro del 33.3% por Mbps contratado.',
        'Renovación de arrendamiento de Torre Sur programada para septiembre.',
        'Cobranza mensual con 94.2% de efectividad.'
      ],
      requiredDecisionId: 'dec-005'
    }
  ]
};

// 50 realistic audit events
export const INITIAL_AUDIT_EVENTS: AuditEvent[] = Array.from({ length: 50 }).map((_, index) => {
  const baseMinutesAgo = index * 24 + 5;
  const date = new Date(Date.now() - baseMinutesAgo * 60 * 1000);
  const timeStr = date.toISOString().replace('T', ' ').substring(0, 19);

  const eventPool = [
    {
      actorType: 'user' as const,
      actorName: 'Ramiro (Propietario)',
      action: 'Aprobación de Decisión Ejecutiva',
      actionType: 'approved' as const,
      resourceType: 'decision' as const,
      resourceId: 'DEC-006',
      resourceLabel: 'Despliegue Release v1.4.0',
      result: 'success' as const,
      risk: 'high' as const,
      scopeImpact: 'Ambiente de producción NugaCore',
      humanExplanation: 'Ramiro confirmó el despliegue del release v1.4.0 tras verificar el paso exitoso de 142 pruebas en staging.',
      jsonPayload: { decisionCode: 'DEC-006', approver: 'ramiro@nuga.network', confirmationType: 'explicit_typed' }
    },
    {
      actorType: 'agent' as const,
      actorName: 'Operaciones',
      action: 'Auditoría de Seguridad RouterOS',
      actionType: 'executed' as const,
      resourceType: 'router' as const,
      resourceId: 'EDGE-DEMO-01',
      resourceLabel: 'Router de Borde Principal',
      result: 'warning' as const,
      risk: 'critical' as const,
      scopeImpact: 'Tabla /ip firewall filter en WAN',
      humanExplanation: 'Escaneo identificó el puerto Winbox 8291 expuesto en la interfaz ether1-WAN sin control de acceso por IP.',
      jsonPayload: { findingsCount: 2, criticalFindings: ['WINBOX_WAN_EXPOSED'], routerModel: 'CCR2004-16G-2S+' }
    },
    {
      actorType: 'agent' as const,
      actorName: 'Marketing',
      action: 'Generación de Activos Audiovisuales (Simulado)',
      actionType: 'executed' as const,
      resourceType: 'campaign' as const,
      resourceId: 'CMP-2026-HOGAR',
      resourceLabel: 'Campaña Internet Hogar',
      result: 'success' as const,
      risk: 'low' as const,
      scopeImpact: 'Biblioteca de Medios (4 Videos Generados)',
      humanExplanation: 'El agente de Marketing estructuró 4 variantes de video vertical y storyboards para revisión de Ramiro.',
      jsonPayload: { variants: 4, modelEngine: 'Higgsfield (Simulado)', simulatedCreditCost: 40 }
    },
    {
      actorType: 'agent' as const,
      actorName: 'Operaciones',
      action: 'Detección y Apertura de Incidente',
      actionType: 'requested' as const,
      resourceType: 'tower' as const,
      resourceId: 'tower-norte',
      resourceLabel: 'Torre Norte - Sector 2',
      result: 'warning' as const,
      risk: 'medium' as const,
      scopeImpact: '35 clientes atendidos por radioenlace',
      humanExplanation: 'Monitoreo SNMP registró aumento de retransmisiones (18%) e interferencia en canal 5500 MHz.',
      jsonPayload: { incidentCode: 'INC-2026-081', snrFloorDbm: -82, proposedChannelMhz: 5680 }
    },
    {
      actorType: 'system' as const,
      actorName: 'Hermes Watchdog',
      action: 'Verificación de Integridad de Persistencia',
      actionType: 'executed' as const,
      resourceType: 'system' as const,
      resourceId: 'sys-storage-01',
      resourceLabel: 'Consola Local DB',
      result: 'success' as const,
      risk: 'low' as const,
      scopeImpact: 'Almacenamiento Local de Estado',
      humanExplanation: 'Sincronización de datos DEMO ejecutada correctamente. Todos los esquemas son válidos.',
      jsonPayload: { tasksCount: 20, decisionsCount: 8, auditEventsCount: 50 }
    },
    {
      actorType: 'user' as const,
      actorName: 'Ramiro (Propietario)',
      action: 'Rechazo de Propuesta de Bloqueo SSH Estricto',
      actionType: 'reverted' as const,
      resourceType: 'decision' as const,
      resourceId: 'DEC-007',
      resourceLabel: 'Auto-bloqueo SSH sin Whitelist',
      result: 'success' as const,
      risk: 'high' as const,
      scopeImpact: 'Acceso de gestión de técnicos',
      humanExplanation: 'Ramiro rechazó la propuesta solicitando agregar lista blanca de IPs seguras y timeout de desbloqueo.',
      jsonPayload: { rejectionReason: 'Riesgo de aislamiento de técnicos de guardia', requestedChanges: ['WHITELIST', '60MIN_EXPIRY'] }
    },
    {
      actorType: 'agent' as const,
      actorName: 'NugaCore',
      action: 'Ejecución de Suite de Pruebas Unitarias',
      actionType: 'executed' as const,
      resourceType: 'system' as const,
      resourceId: 'nugacore-ci-runner',
      resourceLabel: 'Pipeline CI / CD',
      result: 'success' as const,
      risk: 'low' as const,
      scopeImpact: '34 archivos TypeScript validados',
      humanExplanation: 'Suite de 142 tests unitarios finalizada con 100% de éxito en 4.2 segundos.',
      jsonPayload: { totalTests: 142, passed: 142, failed: 0, durationMs: 4210 }
    },
    {
      actorType: 'agent' as const,
      actorName: 'Administración',
      action: 'Registro de Minuta y Factura Informativa',
      actionType: 'executed' as const,
      resourceType: 'deliverable' as const,
      resourceId: 'DEL-2026-06',
      resourceLabel: 'Cuadro Comparativo Carrier Metro',
      result: 'success' as const,
      risk: 'low' as const,
      scopeImpact: 'Control presupuestal administrativo',
      humanExplanation: 'Registrado informe de negociación con Carrier Metro para ampliación de 500Mbps simétricos.',
      jsonPayload: { negotiatedRateUsdPerMbps: 1.20, monthlyTotalUsd: 600 }
    }
  ];

  const template = eventPool[index % eventPool.length];

  return {
    id: `audit-${index + 1}`,
    timestamp: timeStr,
    actorType: template.actorType,
    actorName: template.actorName,
    action: template.action,
    actionType: template.actionType,
    resourceType: template.resourceType,
    resourceId: template.resourceId,
    resourceLabel: template.resourceLabel,
    result: template.result,
    risk: template.risk,
    scopeImpact: template.scopeImpact,
    humanExplanation: template.humanExplanation,
    correlationId: `CORR-${1000 + index}`,
    relatedApprovalId: index % 4 === 0 ? `APP-${200 + index}` : undefined,
    jsonPayload: template.jsonPayload,
    isDemo: true
  };
});

export const INITIAL_ADMIN_ITEMS: AdminItem[] = RAW_ADMIN_ITEMS.map(item => ({
  ...item,
  isDemo: true
}));

export const INITIAL_MESSAGES: Record<string, Message[]> = Object.fromEntries(
  Object.entries(RAW_MESSAGES).map(([convId, messages]) => [
    convId,
    messages.map(msg => ({
      ...msg,
      isDemo: true,
      toolCalls: msg.toolCalls?.map(tc => ({ ...tc, isDemo: true }))
    }))
  ])
);

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Decisión Crítica Pendiente (DEC-001)',
    message: 'Operaciones solicita cerrar Winbox público en router EDGE-DEMO-01.',
    timestamp: 'Hace 10 minutos',
    type: 'decision',
    priority: 'urgente',
    read: false,
    linkScreen: 'decisiones',
    linkItemId: 'dec-001',
    isDemo: true
  },
  {
    id: 'notif-2',
    title: 'Alerta de Ruido en Torre Norte',
    message: 'Interferencia en canal 5500 MHz afectando enlace a Torre Este.',
    timestamp: 'Hace 35 minutos',
    type: 'alert',
    priority: 'alta',
    read: false,
    linkScreen: 'operaciones-wisp',
    linkItemId: 'inc-001',
    isDemo: true
  },
  {
    id: 'notif-3',
    title: 'Nuevos Activos Multimedia Listos',
    message: 'Marketing generó 4 variantes de video para Campaña Internet Hogar.',
    timestamp: 'Hace 1 hora',
    type: 'task',
    priority: 'media',
    read: true,
    linkScreen: 'marketing',
    linkItemId: 'med-01',
    isDemo: true
  },
  {
    id: 'notif-4',
    title: 'Entrega de Auditoría MikroTik',
    message: 'Entregable DEL-2026-01 listo para revisión ejecutiva.',
    timestamp: 'Hace 2 horas',
    type: 'task',
    priority: 'media',
    read: true,
    linkScreen: 'entregables',
    linkItemId: 'deliv-01',
    isDemo: true
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'dark',
  requireHumanApprovalAllHighRisk: true,
  allowWriteToolsGlobal: false, // Default false strictly
  maskSensitiveData: true,
  retainLogsDays: 90,
  telegramNotificationsSimulated: true,
  maxAgentExecutionMinutes: 45,
  hermesEngineStatus: 'No conectado',
  mcpServerStatus: 'connected_demo',
  mikrotikApiStatus: 'mock_sandbox',
  higgsfieldApiStatus: 'mock_sandbox',
  isDemo: true
};
