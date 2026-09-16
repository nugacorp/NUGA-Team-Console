# MikroTik Control Plane — alcance técnico de Hermes

## Objetivo

NUGA Team Console coordina agentes técnicos, diagnósticos, marketing, administración y desarrollo. Para MikroTik, su responsabilidad es **observabilidad, diagnóstico, auditoría, mantenimiento y preparación segura de cambios técnicos**.

No es CRM ni sistema de facturación. La facturación, pagos, estado comercial, suspensión y reactivación de clientes pertenecen a NugaCore/CRM u otros sistemas especializados.

## Arquitectura de producción

```text
Hermes / Operaciones
  -> NUGA Console API
    -> Control Plane técnico
       observe -> diagnose -> plan -> approve -> execute -> verify -> rollback
    -> MikroMCP
      -> api-ssl / red privada
        -> RouterOS 7 real
```

No existe etapa `simulate` en el flujo técnico. Los diagnósticos provienen de lecturas reales del equipo de producción.

## Frontera de producto

El contrato declara explícitamente:

- `crm: false`
- `billing: false`
- `subscriberLifecycle: false`
- `commercialSuspension: false`
- `paymentCollection: false`
- `technicalOperations: true`
- `productionDiagnostics: true`
- `simulationEnabled: false`

## Principios

- MikroMCP es el único puente RouterOS autorizado desde NUGA Team Console.
- El navegador nunca recibe credenciales RouterOS ni el bearer token de MikroMCP.
- Los routers se alcanzan por red privada/overlay; el planner rechaza IP pública como host administrativo.
- El diagnóstico usa RouterOS 7 + REST sobre `api-ssl` en producción.
- La IA observa, correlaciona y diagnostica datos reales.
- Las escrituras RouterOS siguen separadas de esta fase de diagnóstico y requieren autorización explícita, evidencia previa, validación y rollback.
- Ninguna herramienta de este control plane opera facturación, cobranza o suspensión comercial.

## Capacidades técnicas

- inventario real de routers MikroMCP;
- salud y recursos del sistema;
- interfaces;
- routing;
- detección de anomalías técnicas;
- auditoría de firewall;
- diagnóstico de queues;
- comparación de configuración;
- planificación de mantenimiento;
- planificación de respaldo.

## Lecturas reales MikroMCP

El adapter de producción permite exclusivamente estas herramientas en esta fase:

- `list_routers`
- `check_router_health`
- `get_system_status`
- `list_interfaces`
- `list_routes`

No se usan respuestas simuladas en runtime de producción.

## Diagnóstico correlacionado

`getRouterDiagnostics()` combina en una sola observación:

- estado de salud;
- CPU;
- memoria;
- uptime;
- versión RouterOS;
- interfaces arriba/abajo/deshabilitadas;
- cantidad de rutas;
- rutas activas;
- rutas estáticas;
- BGP/OSPF observados;
- rutas por defecto y gateways activos.

La detección de anomalías reporta evidencia observable para casos como:

- router reportado no saludable;
- CPU crítica/elevada;
- memoria crítica/elevada;
- lecturas parciales de MikroMCP;
- interfaces habilitadas sin estado running;
- tabla de rutas vacía;
- ausencia total de rutas activas;
- ausencia de ruta por defecto activa, marcada como advertencia porque puede ser válida en routers internos o diseños con policy routing.

No infiere deuda, estado comercial ni acciones sobre clientes.

## API técnica

Todos los GET requieren sesión firmada del propietario.

- `GET /api/v1/wisp/control-plane`
- `GET /api/v1/wisp/inventory`
- `GET /api/v1/wisp/routers/:routerId/health`
- `GET /api/v1/wisp/routers/:routerId/system`
- `GET /api/v1/wisp/routers/:routerId/interfaces`
- `GET /api/v1/wisp/routers/:routerId/routes`
- `GET /api/v1/wisp/routers/:routerId/diagnostics`

Los planners técnicos permanecen separados:

- `POST /api/v1/wisp/routers/enrollment/plan`
- `POST /api/v1/wisp/technical-changes/plan`

Los POST requieren sesión, Origin autorizado y CSRF.

## Registro de routers

El planner recibe únicamente:

- `routerId`
- `displayName`
- `privateHost`
- `routerOsMajor` — producción MikroMCP requiere `7`
- `managementInterface` opcional
- `isEdgeRouter`

No recibe plan comercial, deuda, estado de servicio ni credenciales.

## Planes técnicos

Las categorías permitidas son:

- `routing`
- `firewall`
- `queues`
- `interfaces`
- `system`

Un plan técnico exige:

- evidencia del estado real actual;
- alcance;
- riesgo;
- efecto propuesto;
- aprobación humana;
- validación posterior;
- rollback.

No contiene `dryRun` ni etapa de simulación. `executionAllowed` sigue en `false` porque la fase actual habilita diagnóstico real, no escrituras RouterOS.

## Operaciones / Hermes

Operaciones puede consultar y correlacionar:

- inventario;
- salud;
- sistema;
- interfaces;
- rutas;
- diagnóstico consolidado y anomalías.

No puede:

- facturar o cobrar;
- cambiar estados comerciales;
- suspender/reactivar clientes por cobranza;
- almacenar credenciales en frontend, logs o repositorio;
- ejecutar escrituras RouterOS mientras el gate de escritura esté deshabilitado.

## Producción y rollback

La activación real usa MikroMCP en el host de producción y RouterOS 7 por `api-ssl` con identidad dedicada y alcance mínimo.

Rollback de la integración de diagnóstico:

1. establecer `NUGA_MIKROMCP_READ_ONLY_ENABLED=false` en el entorno del backend de producción;
2. reiniciar únicamente NUGA Console API;
3. validar que las rutas MikroMCP regresen `MIKROMCP_NOT_CONNECTED`;
4. no tocar tráfico, rutas ni configuración operativa del router como parte de ese rollback.

La remoción de una identidad RouterOS o de MikroMCP se trata como un cambio separado y autorizado.
