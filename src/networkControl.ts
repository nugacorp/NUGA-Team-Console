import { isIP } from 'node:net';

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
  | 'anomaly_detection'
  | 'firewall_audit'
  | 'queue_diagnostics'
  | 'configuration_diff'
  | 'maintenance_planning'
  | 'backup_planning';

export interface MikroTikControlPlanePolicy {
  version: 3;
  architecture: {
    managementPath: 'single-edge-private-overlay';
    routerTransport: 'mikromcp';
    directPublicRouterAccess: false;
    credentialsInBrowser: false;
    aiRole: 'technical_advisory';
    deterministicAutomation: true;
    productionDiagnostics: true;
    simulationEnabled: false;
  };
  productBoundary: {
    crm: false;
    billing: false;
    subscriberLifecycle: false;
    commercialSuspension: false;
    paymentCollection: false;
    technicalOperations: true;
  };
  workflow: Array<'observe' | 'diagnose' | 'plan' | 'approve' | 'execute' | 'verify' | 'rollback'>;
  execution: {
    writesEnabled: false;
    humanApprovalRequired: true;
    currentStateEvidenceRequired: true;
    rollbackRequired: true;
    reason: string;
  };
  technicalCapabilities: MikroTikTechnicalCapability[];
  scheduledAutomationTemplates: Array<{
    id: 'router-health-report' | 'node-health-check' | 'configuration-drift-report' | 'router-backup';
    mode: 'production_read' | 'future_write';
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
  requiresCurrentStateEvidence: true;
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
  version: 3,
  architecture: {
    managementPath: 'single-edge-private-overlay',
    routerTransport: 'mikromcp',
    directPublicRouterAccess: false,
    credentialsInBrowser: false,
    aiRole: 'technical_advisory',
    deterministicAutomation: true,
    productionDiagnostics: true,
    simulationEnabled: false
  },
  productBoundary: {
    crm: false,
    billing: false,
    subscriberLifecycle: false,
    commercialSuspension: false,
    paymentCollection: false,
    technicalOperations: true
  },
  workflow: ['observe', 'diagnose', 'plan', 'approve', 'execute', 'verify', 'rollback'],
  execution: {
    writesEnabled: false,
    humanApprovalRequired: true,
    currentStateEvidenceRequired: true,
    rollbackRequired: true,
    reason: 'Los diagnósticos son lecturas reales de producción. Las escrituras RouterOS se habilitan solo en una fase técnica expresamente autorizada y con evidencia del estado actual, aprobación, verificación y rollback.'
  },
  technicalCapabilities: [
    'inventory',
    'health',
    'interfaces',
    'routing_diagnostics',
    'anomaly_detection',
    'firewall_audit',
    'queue_diagnostics',
    'configuration_diff',
    'maintenance_planning',
    'backup_planning'
  ],
  scheduledAutomationTemplates: [
    {
      id: 'router-health-report',
      mode: 'production_read',
      purpose: 'Recolectar salud, recursos e interfaces reales y generar un resumen periódico sin mutar RouterOS.',
      executionEnabled: true
    },
    {
      id: 'node-health-check',
      mode: 'production_read',
      purpose: 'Verificar alcance y degradación real de los routers registrados y elevar únicamente anomalías.',
      executionEnabled: true
    },
    {
      id: 'configuration-drift-report',
      mode: 'production_read',
      purpose: 'Comparar el estado técnico real observado con una línea base aprobada y reportar desviaciones.',
      executionEnabled: true
    },
    {
      id: 'router-backup',
      mode: 'future_write',
      purpose: 'Preparar una propuesta de respaldo antes de cambios técnicos de riesgo; la creación real del backup requiere una fase de escritura autorizada.',
      executionEnabled: false
    }
  ],
  networkPrerequisites: [
    'Un único camino privado de gestión hacia el router de borde o gateway de administración.',
    'Los routers administrados deben ser alcanzables por direcciones privadas desde ese camino.',
    'MikroMCP es el único puente autorizado entre NUGA Console API y RouterOS.',
    'Producción debe usar RouterOS 7 con api-ssl para las lecturas REST de MikroMCP.',
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
  if (isIP(value) !== 4) return false;
  const [a, b] = value.split('.').map(part => Number(part));
  return a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 127;
}

function isPrivateManagementHost(value: string): boolean {
  const host = value.trim().toLowerCase();
  if (isPrivateIpv4(host)) return true;
  if (host === '::1') return true;
  return isIP(host) === 6 && (host.startsWith('fc') || host.startsWith('fd'));
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
  if (input.routerOsMajor !== '7') {
    throw new MikroTikControlPlaneValidationError('El diagnóstico MikroMCP de producción requiere RouterOS 7.x por su REST API.');
  }
  if (typeof input.isEdgeRouter !== 'boolean') {
    throw new MikroTikControlPlaneValidationError('isEdgeRouter debe ser booleano.');
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
      `Verificar alcance de ${input.privateHost} desde el host MikroMCP de producción.`,
      'Confirmar RouterOS 7.x mediante lectura real de sistema.',
      'Confirmar api-ssl y restricción de origen al host de MikroMCP.',
      'Confirmar que no se usa una IP pública ni se almacenan credenciales RouterOS en el navegador o repositorio.',
      ...(input.managementInterface
        ? [`Confirmar que ${input.managementInterface} es la interfaz prevista y que su uso no afecta tráfico existente.`]
        : [])
    ],
    proposedEffects: [
      'Registrar únicamente metadatos técnicos de gestión y capacidades del router en el control plane.',
      'Mantener MikroMCP como único puente de acceso a RouterOS.',
      'Usar el router real de producción para inventario y diagnóstico una vez activada la identidad MikroMCP.',
      'No crear ni modificar clientes, servicios comerciales, facturación, pagos o estados de suspensión.'
    ],
    validation: [
      'El router debe aparecer en el inventario MikroMCP y responder a lecturas reales de salud.',
      'La identidad y versión RouterOS observadas deben coincidir con el registro propuesto.',
      input.isEdgeRouter
        ? 'El router de borde debe poder alcanzar por red privada a los nodos técnicos que se registren detrás de él.'
        : 'El nodo debe ser alcanzable desde el camino privado sin exposición pública adicional.'
    ],
    rollback: [
      'Retirar el registro del control plane y deshabilitar la identidad MikroMCP si la validación real falla.',
      'No modificar la configuración de tráfico del router durante el rollback de esta fase de diagnóstico.'
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
      'Confirmar que el router existe en MikroMCP y está saludable en producción.',
      `Capturar el estado real actual relacionado con ${input.category} antes de cualquier escritura.`,
      'Documentar dependencias, interfaces, rutas o políticas potencialmente afectadas.'
    ],
    proposedEffects: [
      `Preparar una propuesta técnica para: ${objective}.`,
      'La futura ejecución debe aplicarse al router real solamente después de aprobación explícita.',
      'No alterar estados comerciales ni administrativos de clientes.'
    ],
    validation: [
      'Comparar el estado real previo y posterior contra el objetivo técnico.',
      'Verificar salud, conectividad y ausencia de regresiones fuera del alcance aprobado.',
      'Registrar evidencia del resultado real de producción.'
    ],
    rollback: [
      'Restaurar exactamente el estado técnico previo capturado antes de ejecutar.',
      'Si la verificación falla, detener nuevas acciones y elevar el incidente con evidencia.'
    ],
    requiresCurrentStateEvidence: true,
    requiresHumanApproval: true,
    executionAllowed: false,
    executionBinding: null,
    blockedReason: MIKROTIK_CONTROL_PLANE_POLICY.execution.reason
  };
}
