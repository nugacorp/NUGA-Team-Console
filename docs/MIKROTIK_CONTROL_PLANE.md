# MikroTik Control Plane — patrón operativo inspirado en PlenoAgent

## Objetivo

Adoptar los patrones operativos útiles publicados por PlenoAgent para la gestión de MikroTik, sin copiar su implementación propietaria y sin introducir acceso SSH paralelo, credenciales en frontend ni escrituras RouterOS no autorizadas.

Fuentes públicas revisadas:

- https://www.plenoagent.com/docs/finanzas
- https://www.plenoagent.com/

## Qué hace PlenoAgent según su documentación pública

1. Usa un único camino VPN por empresa que termina en un router de borde.
2. Los demás routers se administran por direcciones privadas alcanzables desde el borde.
3. Cada router se registra con nombre, host privado, versión RouterOS y tipo de conexión de clientes.
4. Soporta PPPoE, IP fija, simple queue, Hotspot y address-list para el ciclo de suspensión/reactivación.
5. Mantiene automatizaciones programadas para salud de red, chequeos de nodos y respaldos.
6. El ciclo de servicio (vencimiento, suspensión, pago, reactivación) es determinista y no depende de que la IA genere una decisión en tiempo real.

## Adaptación NUGA

NUGA conserva una frontera más restrictiva:

```text
Hermes / Operaciones
  -> NUGA Console API
    -> Control Plane
       observe -> plan -> simulate -> approve -> execute -> verify -> rollback
    -> MikroMCP
      -> red privada / overlay
        -> RouterOS
```

### Diferencias deliberadas

- No se añade SSH directo desde NUGA a los routers.
- MikroMCP sigue siendo el único puente RouterOS autorizado.
- No se almacenan contraseñas RouterOS en navegador, VITE_*, localStorage, logs o repositorio.
- El host de administración propuesto debe ser una IP privada/overlay; una IP pública se rechaza.
- La IA tiene rol consultivo: observa, diagnostica y prepara planes.
- La automatización de servicio es determinista, pero la ejecución real continúa bloqueada en esta fase.

## Implementado

### 1. Política del control plane

`src/networkControl.ts`

Declara:

- arquitectura `single-edge-private-overlay`;
- transporte `mikromcp`;
- acceso público directo deshabilitado;
- IA en modo `advisory`;
- flujo obligatorio `observe -> plan -> simulate -> approve -> execute -> verify -> rollback`;
- dry-run, aprobación humana y rollback obligatorios;
- ejecución RouterOS deshabilitada.

### 2. Tipos de servicio

El planner conoce cinco mecanismos:

| Tipo | Suspensión propuesta | Reactivación propuesta |
| --- | --- | --- |
| PPPoE | deshabilitar identidad del servicio | rehabilitar identidad |
| IP fija | aplicar estado de corte mediante lista de control | retirar estado de corte |
| Queue | aplicar estado suspendido a la queue del servicio | restaurar estado previo |
| Hotspot | deshabilitar usuario | rehabilitar usuario |
| Address-list | agregar a lista de corte | retirar de lista de corte |

No se generan comandos RouterOS ejecutables todavía.

### 3. Registro seguro de routers

El endpoint de planificación de enrolamiento recibe solamente metadatos:

- `routerId`
- `displayName`
- `privateHost`
- `routerOsMajor` (`6` o `7`)
- `defaultConnectionType`
- `managementInterface` opcional
- `isEdgeRouter`

El planner rechaza direcciones públicas y no acepta ni solicita credenciales.

### 4. Endpoints

Montados antes del API principal bajo `/api/v1/wisp`:

- `GET /api/v1/wisp/control-plane`
- `POST /api/v1/wisp/routers/enrollment/plan`
- `POST /api/v1/wisp/service-actions/plan`

Controles:

- sesión firmada del propietario;
- validación de `X-Nuga-Mode`;
- POST protegido por Origin + CSRF;
- JSON limitado a 32 KB;
- identificadores allowlisted;
- cero llamadas RouterOS en estos endpoints.

### 5. Operaciones / Hermes

El perfil `Operaciones` ahora declara capacidades de lectura MikroMCP y herramientas de planificación, pero conserva el límite explícito de no escribir RouterOS.

Herramientas declaradas:

- `mikromcp_list_routers`
- `mikromcp_check_router_health`
- `mikromcp_get_system_status`
- `mikromcp_list_interfaces`
- `mikrotik_plan_router_enrollment`
- `mikrotik_plan_service_action`
- `request_human_approval`

## Automatizaciones

Plantillas declaradas en la política:

- `router-health-report`: lectura, habilitable cuando MikroMCP esté conectado.
- `node-health-check`: lectura, habilitable cuando MikroMCP esté conectado.
- `router-backup`: futura escritura; permanece bloqueada.

No se crea ningún cron real en esta fase.

## Seguridad y rollback

### Alcance actual

- no instala túneles;
- no crea usuarios RouterOS;
- no habilita SSH/API/API-SSL;
- no registra secretos;
- no suspende/reactiva clientes reales;
- no crea backups reales;
- no despliega a staging/production.

### Rollback de este cambio de software

Revertir el PR restaura el comportamiento anterior. Como esta fase no modifica RouterOS ni infraestructura, no existe rollback de red que ejecutar.

## Siguiente gate operativo

Una fase posterior, con autorización explícita, podrá enlazar estos planes a herramientas de escritura MikroMCP. Antes de habilitar `execute` será obligatorio validar:

1. red privada/overlay y router de borde;
2. identidad MikroMCP con RBAC mínimo;
3. inventario y salud de routers;
4. dry-run real del tipo de operación;
5. captura del estado previo;
6. aprobación humana;
7. verificación posterior;
8. rollback probado.
