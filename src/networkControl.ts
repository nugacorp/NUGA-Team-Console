export type MikroTikServiceConnectionType =
  | 'pppoe'
  | 'static_ip'
  | 'queue'
  | 'hotspot'
  | 'address_list';

export type MikroTikServiceAction = 'suspend' | 'reactivate';
export type RouterOsMajor = '6' | '7';

export interface MikroTikControlPlanePolicy {
  version: 1;
  architecture: {
    managementPath: 'single-edge-private-overlay';
    routerTransport: 'mikromcp';
    directPublicRouterAccess: false;
    credentialsInBrowser: false;
    aiRole: 'advisory';
    deterministicAutomation: true;
  };
  workflow: Array<'observe' | 'plan' | 'simulate' | 'approve' | 'execute' | 'verify' | 'rollback'>;
  execution: {
    enabled: false;
    dryRunRequired: true;
    humanApprovalRequired: true;
    rollbackRequired: true;
    reason: string;
  };
  supportedConnectionTypes: Array<{
    type: MikroTikServiceConnectionType;
    suspendEffect: string;
    reactivateEffect: string;
  }>;
  scheduledAutomationTemplates: Array<{
    id: 'router-health-report' | 'node-health-check' | 'router-backup';
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
  defaultConnectionType: MikroTikServiceConnectionType;
  managementInterface?: string;
  isEdgeRouter: boolean;
}

export interface MikroTikRouterEnrollmentPlan {
  id: string;
  routerId: string;
  displayName: string;
  privateHost: string;
  routerOsMajor: RouterOsMajor;
  defaultConnectionType: MikroTikServiceConnectionType;
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

export interface MikroTikServiceActionPlanInput {
  routerId: string;
  serviceIdentifier: string;
  connectionType: MikroTikServiceConnectionType;
  action: MikroTikServiceAction;
}

export interface MikroTikServiceActionPlan {
  id: string;
  routerId: string;
  serviceIdentifier: string;
  connectionType: MikroTikServiceConnectionType;
  action: MikroTikServiceAction;
  scope: string;
  risk: 'medium' | 'high';
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
const SERVICE_ID_PATTERN = /^[A-Za-z0-9._:@/+-]{1,128}$/;
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} ._()-]{1,120}$/u;
const INTERFACE_PATTERN = /^[A-Za-z0-9._:/+-]{1,96}$/;
const CONNECTION_TYPES = new Set<MikroTikServiceConnectionType>([
  'pppoe',
  'static_ip',
  'queue',
  'hotspot',
  'address_list'
]);

export class MikroTikControlPlaneValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MikroTikControlPlaneValidationError';
  }
}

export const MIKROTIK_CONTROL_PLANE_POLICY: MikroTikControlPlanePolicy = {
  version: 1,
  architecture: {
    managementPath: 'single-edge-private-overlay',
    routerTransport: 'mikromcp',
    directPublicRouterAccess: false,
    credentialsInBrowser: false,
    aiRole: 'advisory',
    deterministicAutomation: true
  },
  workflow: ['observe', 'plan', 'simulate', 'approve', 'execute', 'verify', 'rollback'],
  execution: {
    enabled: false,
    dryRunRequired: true,
    humanApprovalRequired: true,
    rollbackRequired: true,
    reason: 'Las operaciones RouterOS reales permanecen bloqueadas hasta una fase de activación expresamente autorizada.'
  },
  supportedConnectionTypes: [
    {
      type: 'pppoe',
      suspendEffect: 'Deshabilitar la identidad PPPoE del servicio sin modificar perfiles globales.',
      reactivateEffect: 'Rehabilitar la identidad PPPoE del servicio y verificar que pueda restablecer sesión.'
    },
    {
      type: 'static_ip',
      suspendEffect: 'Aplicar el estado de corte a la IP del servicio mediante una lista de control, conservando su política de ancho de banda.',
      reactivateEffect: 'Retirar la IP del estado de corte y validar tráfico sin alterar su simple queue.'
    },
    {
      type: 'queue',
      suspendEffect: 'Aplicar el estado suspendido únicamente a la simple queue vinculada al servicio.',
      reactivateEffect: 'Restaurar la simple queue del servicio a su estado operativo previo.'
    },
    {
      type: 'hotspot',
      suspendEffect: 'Deshabilitar únicamente el usuario Hotspot vinculado al servicio.',
      reactivateEffect: 'Rehabilitar el usuario Hotspot y comprobar autenticación.'
    },
    {
      type: 'address_list',
      suspendEffect: 'Agregar el identificador del servicio a la lista de corte administrada.',
      reactivateEffect: 'Retirar el identificador del servicio de la lista de corte administrada.'
    }
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
      id: 'router-backup',
      mode: 'future_write',
      purpose: 'Preparar una propuesta de respaldo antes de cambios de riesgo; la creación real del backup sigue bloqueada.',
      executionEnabled: false
    }
  ],
  networkPrerequisites: [
    'Un único camino privado de gestión hacia el router de borde o gateway de administración.',
    'Los routers administrados deben ser alcanzables por direcciones privadas desde ese camino.',
    'MikroMCP es el único puente autorizado entre NUGA Console API y RouterOS.',
    'No se permiten credenciales RouterOS en VITE_*, localStorage, navegador, logs o repositorio.',
    'Toda escritura futura debe producir evidencia, alcance, riesgo, validación y rollback antes de ejecutar.'
  ]
};

function effectFor(connectionType: MikroTikServiceConnectionType, action: MikroTikServiceAction): string {
  const definition = MIKROTIK_CONTROL_PLANE_POLICY.supportedConnectionTypes.find(
    candidate => candidate.type === connectionType
  );
  if (!definition) throw new MikroTikControlPlaneValidationError('Tipo de conexión no soportado.');
  return action === 'suspend' ? definition.suspendEffect : definition.reactivateEffect;
}

function stableId(prefix: string, raw: string): string {
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function assertConnectionType(value: MikroTikServiceConnectionType): void {
  if (!CONNECTION_TYPES.has(value)) {
    throw new MikroTikControlPlaneValidationError('Tipo de conexión no soportado.');
  }
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
  assertConnectionType(input.defaultConnectionType);
  if (input.managementInterface && !INTERFACE_PATTERN.test(input.managementInterface)) {
    throw new MikroTikControlPlaneValidationError('Interfaz de gestión inválida.');
  }

  const raw = [
    input.routerId,
    input.privateHost,
    input.routerOsMajor,
    input.defaultConnectionType,
    input.managementInterface ?? '',
    input.isEdgeRouter ? 'edge' : 'node'
  ].join(':');

  return {
    id: stableId('mikrotik-enroll', raw),
    routerId: input.routerId,
    displayName: input.displayName.trim(),
    privateHost: input.privateHost.trim(),
    routerOsMajor: input.routerOsMajor,
    defaultConnectionType: input.defaultConnectionType,
    managementInterface: input.managementInterface?.trim() || undefined,
    isEdgeRouter: input.isEdgeRouter,
    scope: input.isEdgeRouter
      ? `Registrar ${input.routerId} como router de borde del camino privado de gestión.`
      : `Registrar ${input.routerId} como nodo alcanzable por IP privada desde el camino de gestión existente.`,
    risk: 'high',
    evidence: [
      `Verificar alcance de ${input.privateHost} desde el gateway privado antes de cualquier aprovisionamiento.`,
      `Confirmar RouterOS ${input.routerOsMajor}.x mediante lectura de sistema.`,
      'Confirmar que no se usa una IP pública ni se almacenan credenciales RouterOS en el navegador o repositorio.',
      ...(input.managementInterface
        ? [`Confirmar que ${input.managementInterface} es la interfaz prevista y que su uso no afecta clientes existentes.`]
        : [])
    ],
    proposedEffects: [
      'Registrar únicamente metadatos de gestión y capacidades del router en el control plane.',
      'Mantener MikroMCP como único puente de acceso a RouterOS.',
      'No crear usuarios, túneles, direcciones, bridges, VLANs, PPPoE servers ni perfiles en esta fase.'
    ],
    validation: [
      'El router debe aparecer en el inventario MikroMCP y responder a lecturas de salud.',
      'La identidad y versión RouterOS observadas deben coincidir con el registro propuesto.',
      input.isEdgeRouter
        ? 'El router de borde debe poder alcanzar por red privada a los nodos que se registren detrás de él.'
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

export function buildMikroTikServiceActionPlan(
  input: MikroTikServiceActionPlanInput
): MikroTikServiceActionPlan {
  if (!ROUTER_ID_PATTERN.test(input.routerId)) {
    throw new MikroTikControlPlaneValidationError('Identificador de router inválido.');
  }
  if (!SERVICE_ID_PATTERN.test(input.serviceIdentifier)) {
    throw new MikroTikControlPlaneValidationError('Identificador de servicio inválido.');
  }
  assertConnectionType(input.connectionType);
  if (input.action !== 'suspend' && input.action !== 'reactivate') {
    throw new MikroTikControlPlaneValidationError('Acción de servicio no soportada.');
  }

  const proposedEffect = effectFor(input.connectionType, input.action);
  const oppositeAction: MikroTikServiceAction = input.action === 'suspend' ? 'reactivate' : 'suspend';
  const rollbackEffect = effectFor(input.connectionType, oppositeAction);
  const raw = `${input.routerId}:${input.serviceIdentifier}:${input.connectionType}:${input.action}`;

  return {
    id: stableId('mikrotik-plan', raw),
    routerId: input.routerId,
    serviceIdentifier: input.serviceIdentifier,
    connectionType: input.connectionType,
    action: input.action,
    scope: `Un solo servicio (${input.serviceIdentifier}) en el router ${input.routerId}. No incluye cambios globales, interfaces, rutas, firewall general ni otros clientes.`,
    risk: input.action === 'suspend' ? 'high' : 'medium',
    evidence: [
      'Confirmar que el router existe en el registro MikroMCP y está saludable.',
      `Confirmar que ${input.serviceIdentifier} identifica exactamente un servicio del tipo ${input.connectionType}.`,
      'Capturar el estado previo del objeto RouterOS afectado antes de cualquier futura escritura.'
    ],
    proposedEffects: [proposedEffect],
    validation: [
      'Ejecutar primero una simulación/dry-run cuando exista una herramienta de escritura autorizada.',
      'Verificar que el cambio propuesto afecta exactamente un servicio.',
      input.action === 'suspend'
        ? 'Después de una futura ejecución, comprobar que el servicio queda bloqueado sin afectar otros clientes.'
        : 'Después de una futura ejecución, comprobar que el servicio recupera conectividad y su política de velocidad.'
    ],
    rollback: [
      rollbackEffect,
      'Restaurar el estado previo capturado si la validación posterior no coincide con el resultado esperado.'
    ],
    requiresDryRun: true,
    requiresHumanApproval: true,
    executionAllowed: false,
    executionBinding: null,
    blockedReason: MIKROTIK_CONTROL_PLANE_POLICY.execution.reason
  };
}
