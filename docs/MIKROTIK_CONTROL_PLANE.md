# MikroTik Control Plane — alcance técnico de Hermes

## Objetivo

Usar patrones operativos útiles observados en herramientas de gestión MikroTik, incluido PlenoAgent, sin convertir NUGA Team Console en CRM, sistema de cobranza o plataforma de ciclo de vida comercial de clientes.

NUGA Team Console coordina agentes técnicos, diagnósticos, marketing, administración y desarrollo. Para MikroTik, su responsabilidad es **observabilidad, diagnóstico, auditoría, mantenimiento y preparación segura de cambios técnicos**.

La facturación, pagos, estado comercial, suspensión y reactivación de clientes pertenecen a NugaCore/CRM u otros sistemas especializados.

## Arquitectura

```text
Hermes / Operaciones
  -> NUGA Console API
    -> Control Plane técnico
       observe -> diagnose -> plan -> simulate -> approve -> execute -> verify -> rollback
    -> MikroMCP
      -> red privada / overlay
        -> RouterOS
```

### Frontera de producto

El contrato del control plane declara explícitamente:

- `crm: false`
- `billing: false`
- `subscriberLifecycle: false`
- `commercialSuspension: false`
- `paymentCollection: false`
- `technicalOperations: true`

Esto evita que una capacidad técnica de RouterOS sea confundida con una autorización para operar el CRM.

## Principios de seguridad

- No se añade SSH directo desde NUGA a los routers.
- MikroMCP sigue siendo el único puente RouterOS autorizado.
- No se almacenan contraseñas RouterOS en navegador, `VITE_*`, `localStorage`, logs o repositorio.
- El host de administración propuesto debe ser una IP privada/overlay; una IP pública se rechaza.
- La IA tiene rol `technical_advisory`: observa, diagnostica y prepara planes.
- Toda escritura RouterOS real permanece bloqueada hasta una fase expresamente autorizada.
- Ninguna herramienta de este control plane suspende o reactiva clientes por cobranza, pagos o estado comercial.

## Capacidades técnicas

`src/networkControl.ts` declara estas capacidades:

- inventario de routers;
- salud y recursos;
- interfaces;
- diagnóstico de routing;
- auditoría de firewall;
- diagnóstico de queues;
- comparación de configuración;
- planificación de mantenimiento;
- planificación de respaldo.

## Registro seguro de routers

El endpoint de planificación de enrolamiento recibe solamente metadatos técnicos:

- `routerId`
- `displayName`
- `privateHost`
- `routerOsMajor` (`6` o `7`)
- `managementInterface` opcional
- `isEdgeRouter`

No recibe tipo de cliente, plan comercial, deuda, estado de servicio ni credenciales RouterOS.

El planner rechaza direcciones públicas y no ejecuta aprovisionamiento.

## Planes de cambios técnicos

Los cambios potenciales se clasifican exclusivamente como:

- `routing`
- `firewall`
- `queues`
- `interfaces`
- `system`

Un plan técnico recibe:

- `routerId`
- `category`
- `objective`

Y devuelve obligatoriamente:

- evidencia requerida;
- alcance;
- riesgo;
- efectos propuestos;
- validación;
- rollback;
- `requiresDryRun: true`;
- `requiresHumanApproval: true`;
- `executionAllowed: false`.

No genera comandos RouterOS ejecutables en esta fase.

## Endpoints

Montados bajo `/api/v1/wisp`:

- `GET /api/v1/wisp/control-plane`
- `POST /api/v1/wisp/routers/enrollment/plan`
- `POST /api/v1/wisp/technical-changes/plan`

Se eliminó deliberadamente el endpoint anterior de acciones de servicio comercial.

Controles:

- sesión firmada del propietario;
- validación de `X-Nuga-Mode`;
- POST protegido por Origin + CSRF;
- JSON limitado a 32 KB;
- identificadores allowlisted;
- cero llamadas RouterOS en estos endpoints de planificación.

## Operaciones / Hermes

El agente Operaciones puede:

- consultar inventario MikroMCP;
- revisar salud del router;
- consultar recursos del sistema;
- consultar interfaces;
- preparar un registro técnico de router;
- preparar un cambio técnico para revisión;
- solicitar aprobación humana.

No puede:

- facturar o cobrar;
- cambiar estados comerciales;
- suspender o reactivar clientes por cobranza;
- ejecutar RouterOS en esta fase;
- usar SSH directo;
- almacenar credenciales RouterOS en frontend, logs o repositorio.

## Automatizaciones técnicas

Plantillas declaradas:

- `router-health-report`: lectura.
- `node-health-check`: lectura.
- `configuration-drift-report`: lectura.
- `router-backup`: futura escritura técnica; permanece bloqueada.

No se crea ningún cron real en esta fase.

## Seguridad y rollback

### Alcance actual

- no instala túneles;
- no crea usuarios RouterOS;
- no habilita SSH/API/API-SSL;
- no registra secretos;
- no modifica CRM, facturación, pagos ni estados de clientes;
- no crea backups reales;
- no despliega a staging/production.

### Rollback de este cambio de software

Revertir el PR restaura el comportamiento anterior. Como esta fase no modifica RouterOS ni infraestructura, no existe rollback de red que ejecutar.

## Siguiente gate operativo

Una fase posterior, con autorización explícita, podrá ampliar herramientas **técnicas** de MikroMCP. Antes de habilitar cualquier `execute` será obligatorio validar:

1. red privada/overlay y router de borde;
2. identidad MikroMCP con RBAC mínimo;
3. inventario y salud de routers;
4. dry-run de la operación técnica;
5. captura del estado previo;
6. aprobación humana;
7. verificación posterior;
8. rollback probado.

El CRM/NugaCore conserva de forma separada cualquier lógica de clientes, facturación, cobranza o suspensión comercial.
