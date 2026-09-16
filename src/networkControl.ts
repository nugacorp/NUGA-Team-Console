export type RouterOsMajor = '6' | '7';
export type MikroTikTechnicalChangeCategory =
  | 'routing'
  | 'firewall'
  | 'queues'
  | 'interfaces'
  | 'system';

export type MikroTikTechnicalCapability =
  | 'inventory'
  | 'health'
  | 'interfaces'
  | 'routing_diagnostics'
  | 'firewall_audit'
  | 'queue_diagnostics'
  | 'configuration_diff'
  | 'maintenance_planning'
  | 'backup_planning';

export interface MikroTikControlPlanePolicy {
  version: 2;
  architecture: {
    managementPath: 'single-edge-private-overlay';
    routerTransport: 'mikromcp';
    directPublicRouterAccess: false;
    credentialsInBrowser: false;
    aiRole: 'technical_advisory';
    deterministicAutomation: true;
  };
  productBoundary: {
    crm: false;
    billing: false;
    subscriberLifecycle: false;
    commercialSuspension: false;
    paymentCollection: false;
    technicalOperations: true;
  };
  workflow: Array<'observe' | 'diagnose' | 'plan' | 'simulate' | 'approve' | 'execute' | 'verify' | 'rollback'>;
  execution: {
    enabled: false;
    dryRunRequired: true;
    humanApprovalRequired: true;
    rollbackRequired: true;
    reason: string;
  };
  technicalCapabilities: MikroTikTechnicalCapability[];
  scheduledAutomationTemplates: Array<{
    id: 'router-health-report' | 'node-health-check' | 'configuration-drift-report' | 'router-backup';
    mode: 'read_only' | 'future_write';
    purpose: string;
    executionEnabled: boolean;
  }>;
  networkPrerequisites: string[];
}

export interface MikroTikRouterEnrollmentPlanInput {
  routerId: string;
  displayName: string;
  privateHost: string;
  routerOsMajor: RouterOsMajor;
  managementInterface?: string;
  isEdgeRouter: boolean;
}

export interface MikroTikRouterEnrollmentPlan {
  id: string;
  routerId: string;
  displayName: string;
  privateHost: string;
  routerOsMajor: RouterOsMajor;
  managementInterface?: string;
  isEdgeRouter: boolean;
  scope: string;
  risk: 'high';
  evidence: string[];
  proposedEffects: string[];
  validation: string[];
  rollback: string[];
  requiresHumanApproval: true;
  executionAllowed: false;
  credentialsRequiredInPlan: false;
  blockedReason: string;
}

export interface MikroTikTechnicalChangePlanInput {
  routerId: string;
  category: MikroTikTechnicalChangeCategory;
  objective: string;
}

export interface MikroTikTechnicalChangePlan {
  id: string;
  routerId: string;
  category: MikroTikTechnicalChangeCategory;
  objective: string;
  scope: string;
  risk: 'high';
  evidence: string[];
  proposedEffects: string[];
  validation: string[];
  rollback: string[];
  requiresDryRun: true;
  requiresHumanApproval: true;
  executionAllowed: false;
  executionBinding: null;
  blockedReason: string;
}

const ROUTER_ID_PATTERN = /^[A-Za-z0-9._-]{1,96}$/;
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} ._()-]{1,120}$/u;
const INTERFACE_PATTERN = /^[A-Za-z0-9._:/+-]{1,96}$/;
const OBJECTIVE_PATTERN = /^[\p{L}\p{N} .,:;_()\-/+]{8,240}$/u;
const TECHNICAL_CHANGE_CATEGORIES = new Set<MikroTikTechnicalChangeCategory>([
  'routing',
  'firewall',
  'queues',
  'interfaces',
  'system'
]);

export class MikroTikControlPlaneValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MikroTikControlPlaneValidationError';
  }
}

export const MIKROTIK_CONTROL_PLANE_POLICY: MikroTikControlPlanePolicy = {
  version: 2,
  architecture: {
    managementPath: 'single-edge-private-overlay',
    routerTransport: 'mikromcp',
    directPublicRouterAccess: false,
    credentialsInBrowser: false,
    aiRole: 'technical_advisory',
    deterministicAutomation: true
  },
  productBoundary: {
    crm: false,
    billing: false,
    subscriberLifecycle: false,
    commercialSuspension: false,
    paymentCollection: false,
    technicalOperations: true
  },
  workflow: ['observe', 'diagnose', 'plan', 'simulate', 'approve', 'execute', 'verify', 'rollback'],
  execution: {
    enabled: false,
    dryRunRequired: true,
    humanApprovalRequired: true,
    rollbackRequired: true,
    reason: 'Las operaciones RouterOS reales permanecen bloqueadas hasta una fase de activación expresamente autorizada.'
  },
  technicalCapabilities: [
    'inventory',
    'health',
    'interfaces',
    'routing_diagnostics',
    'firewall_audit',
    'queue_diagnostics',
    'configuration_diff',
    'maintenance_planning',
    'backup_planning'
  ],
  scheduledAutomationTemplates: [
    {
      id: 'router-health-report',
      mode: 'read_only',
      purpose: 'Recolectar salud, recursos e interfaces y generar un resumen periódico sin mutar RouterOS.',
      executionEnabled: true
    },
    {
      id: 'node-health-check',
      mode: 'read_only',
      purpose: 'Verificar alcance y degradación de los routers registrados y elevar únicamente anomalías.',
      executionEnabled: true
    },
    {
      id: 'configuration-drift-report',
      mode: 'read_only',
      purpose: 'Comparar el estado técnico observado con una línea base aprobada y reportar desviaciones.',
      executionEnabled: true
    },
    {
      id: 'router-backup',
      mode: 'future_write',
      purpose: 'Preparar una propuesta de respaldo antes de cambios técnicos de riesgo; la creación real del backup sigue bloqueada.',
      executionEnabled: false
    }
  ],
  networkPrerequisites: [
    'Un único camino privado de gestión hacia el router de borde o gateway de administración.',
    'Los routers administrados deben ser alcanzables por direcciones privadas desde ese camino.',
    'MikroMCP es el único puente autorizado entre NUGA Console API y RouterOS.',
    'No se permiten credenciales RouterOS en VITE_*, localStorage, navegador, logs o repositorio.',
    'Toda escritura técnica futura debe producir evidencia, alcance, riesgo, validación y rollback antes de ejecutar.',
    'Estados comerciales, facturación, pagos, suspensión y reactivación de clientes pertenecen al CRM/NugaCore y quedan fuera de este control plane.'
  ]
};

function stableId(prefix: string, raw: string): string {
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  const octets = parts.map(part => Number(part));
  if (octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [a, b] = octets;
  return a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 127;
}

function isPrivateManagementHost(value: string): boolean {
  const host = value.trim().toLowerCase();
  if (isPrivateIpv4(host)) return true;
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd')) return true;
  return false;
}

export function buildMikroTikRouterEnrollmentPlan(
  input: MikroTikRouterEnrollmentPlanInput
): MikroTikRouterEnrollmentPlan {
  if (!ROUTER_ID_PATTERN.test(input.routerId)) {
    throw new MikroTikControlPlaneValidationError('Identificador de router inválido.');
  }
  if (!DISPLAY_NAME_PATTERN.test(input.displayName.trim())) {
    throw new MikroTikControlPlaneValidationError('Nombre de router inválido.');
  }
  if (!isPrivateManagementHost(input.privateHost)) {
    throw new MikroTikControlPlaneValidationError('El host de gestión debe ser una dirección IP privada o de overlay, nunca una IP pública.');
  }
  if (input.routerOsMajor !== '6' && input.routerOsMajor !== '7') {
    throw new MikroTikControlPlaneValidationError('Versión mayor de RouterOS no soportada.');
  }
  if (input.managementInterface && !INTERFACE_PATTERN.test(input.managementInterface)) {
    throw new MikroTikControlPlaneValidationError('Interfaz de gestión inválida.');
  }

  const raw = [
    input.routerId,
    input.privateHost,
    input.routerOsMajor,
    input.managementInterface ?? '',
    input.isEdgeRouter ? 'edge' : 'node'
  ].join(':');

  return {
    id: stableId('mikrotik-enroll', raw),
    routerId: input.routerId,
    displayName: input.displayName.trim(),
    privateHost: input.privateHost.trim(),
    routerOsMajor: input.routerOsMajor,
    managementInterface: input.managementInterface?.trim() || undefined,
    isEdgeRouter: input.isEdgeRouter,
    scope: input.isEdgeRouter
      ? `Registrar ${input.routerId} como router de borde del camino privado de gestión técnica.`
      : `Registrar ${input.routerId} como nodo técnico alcanzable por IP privada desde el camino de gestión existente.`,
    risk: 'high',
    evidence: [
      `Verificar alcance de ${input.privateHost} desde el gateway privado antes de cualquier aprovisionamiento.`,
      `Confirmar RouterOS ${input.routerOsMajor}.x mediante lectura de sistema.`,
      'Confirmar que no se usa una IP pública ni se almacenan credenciales RouterOS en el navegador o repositorio.',
      ...(input.managementInterface
        ? [`Confirmar que ${input.managementInterface} es la interfaz prevista y que su uso no afecta tráfico existente.`]
        : [])
    ],
    proposedEffects: [
      'Registrar únicamente metadatos técnicos de gestión y capacidades del router en el control plane.',
      'Mantener MikroMCP como único puente de acceso a RouterOS.',
      'No crear usuarios, túneles, direcciones, bridges, VLANs, servidores ni perfiles en esta fase.',
      'No crear ni modificar clientes, servicios comerciales, facturación, pagos o estados de suspensión.'
    ],
    validation: [
      'El router debe aparecer en el inventario MikroMCP y responder a lecturas de salud.',
      'La identidad y versión RouterOS observadas deben coincidir con el registro propuesto.',
      input.isEdgeRouter
        ? 'El router de borde debe poder alcanzar por red privada a los nodos técnicos que se registren detrás de él.'
        : 'El nodo debe ser alcanzable desde el camino privado sin exposición pública adicional.'
    ],
    rollback: [
      'Descartar el registro propuesto del control plane; esta fase no modifica RouterOS.',
      'Si una futura activación falla, deshabilitar la integración antes de retirar cualquier identidad o túnel por un cambio separado y autorizado.'
    ],
    requiresHumanApproval: true,
    executionAllowed: false,
    credentialsRequiredInPlan: false,
    blockedReason: MIKROTIK_CONTROL_PLANE_POLICY.execution.reason
  };
}

export function buildMikroTikTechnicalChangePlan(
  input: MikroTikTechnicalChangePlanInput
): MikroTikTechnicalChangePlan {
  if (!ROUTER_ID_PATTERN.test(input.routerId)) {
    throw new MikroTikControlPlaneValidationError('Identificador de router inválido.');
  }
  if (!TECHNICAL_CHANGE_CATEGORIES.has(input.category)) {
    throw new MikroTikControlPlaneValidationError('Categoría de cambio técnico no soportada.');
  }
  const objective = input.objective.trim();
  if (!OBJECTIVE_PATTERN.test(objective)) {
    throw new MikroTikControlPlaneValidationError('Objetivo técnico inválido.');
  }

  const raw = `${input.routerId}:${input.category}:${objective}`;
  return {
    id: stableId('mikrotik-tech-plan', raw),
    routerId: input.routerId,
    category: input.category,
    objective,
    scope: `Cambio técnico propuesto en ${input.category} para el router ${input.routerId}. No incluye CRM, facturación, pagos ni ciclo comercial de clientes.`,
    risk: 'high',
    evidence: [
      'Confirmar que el router existe en MikroMCP y está saludable.',
      `Capturar el estado actual relacionado con ${input.category} antes de preparar cualquier futura escritura.`,
      'Documentar dependencias, interfaces, rutas o políticas potencialmente afectadas.'
    ],
    proposedEffects: [
      `Preparar una propuesta técnica para: ${objective}.`,
      'No generar ni ejecutar comandos RouterOS en esta fase.',
      'No alterar estados comerciales ni administrativos de clientes.'
    ],
    validation: [
      'Ejecutar primero dry-run cuando exista una herramienta de escritura expresamente autorizada.',
      'Comparar estado previo y posterior contra el objetivo técnico.',
      'Verificar salud, conectividad y ausencia de regresiones fuera del alcance aprobado.'
    ],
    rollback: [
      'Restaurar exactamente el estado técnico previo capturado antes de ejecutar.',
      'Si la verificación falla, detener nuevas acciones y elevar el incidente con evidencia.'
    ],
    requiresDryRun: true,
    requiresHumanApproval: true,
    executionAllowed: false,
    executionBinding: null,
    blockedReason: MIKROTIK_CONTROL_PLANE_POLICY.execution.reason
  };
}
