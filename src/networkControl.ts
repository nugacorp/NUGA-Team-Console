export type MikroTikServiceConnectionType =
  | 'pppoe'
  | 'static_ip'
  | 'queue'
  | 'hotspot'
  | 'address_list';

export type MikroTikServiceAction = 'suspend' | 'reactivate';

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
  networkPrerequisites: string[];
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

function planId(input: MikroTikServiceActionPlanInput): string {
  const raw = `${input.routerId}:${input.serviceIdentifier}:${input.connectionType}:${input.action}`;
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mikrotik-plan-${(hash >>> 0).toString(16).padStart(8, '0')}`;
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
  if (!CONNECTION_TYPES.has(input.connectionType)) {
    throw new MikroTikControlPlaneValidationError('Tipo de conexión no soportado.');
  }
  if (input.action !== 'suspend' && input.action !== 'reactivate') {
    throw new MikroTikControlPlaneValidationError('Acción de servicio no soportada.');
  }

  const proposedEffect = effectFor(input.connectionType, input.action);
  const oppositeAction: MikroTikServiceAction = input.action === 'suspend' ? 'reactivate' : 'suspend';
  const rollbackEffect = effectFor(input.connectionType, oppositeAction);

  return {
    id: planId(input),
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
