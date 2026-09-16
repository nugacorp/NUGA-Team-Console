# MikroMCP integration — producción diagnóstica

## Alcance

Esta integración conecta NUGA Team Console con MikroMCP para realizar **lecturas reales de producción** sobre MikroTik RouterOS 7, sin convertir Team Console en CRM ni habilitar todavía escrituras RouterOS.

No existe una fase de diagnóstico simulada. Cuando la integración está habilitada, los datos vienen de MikroMCP y del router real.

## Herramientas autorizadas

Allowlist explícita del adapter:

- `list_routers`
- `check_router_health`
- `get_system_status`
- `list_interfaces`
- `list_routes`

No se exponen herramientas `manage_*`, `apply_*`, `rollback_*`, `run_command`, reboot, upgrade ni otras escrituras en esta fase.

## Arquitectura

```text
Browser
  -> NUGA Console API
    -> MikroMCP HTTP /mcp en loopback o red privada
      -> RouterOS 7 api-ssl
```

El navegador nunca habla directamente con MikroMCP ni recibe credenciales RouterOS o el token bearer de MikroMCP.

DEMO conserva cero llamadas de red. La activación real corresponde al backend de producción.

## Configuración server-only

Nunca usar prefijo `VITE_` y nunca guardar valores reales en GitHub:

```dotenv
NUGA_MIKROMCP_READ_ONLY_ENABLED=false
NUGA_MIKROMCP_URL=http://127.0.0.1:3000/mcp
NUGA_MIKROMCP_TOKEN=
```

Reglas de NUGA API:

- deshabilitado por defecto;
- token mínimo de 32 caracteres cuando está habilitado;
- URL absoluta apuntando a `/mcp`;
- HTTP permitido exclusivamente sobre loopback;
- endpoints remotos requieren HTTPS;
- credenciales embebidas en la URL se rechazan.

## Producción MikroMCP

La documentación oficial actual de MikroMCP requiere RouterOS 7.x para REST y recomienda `api-ssl` en producción. El servicio HTTP de MikroMCP debe protegerse con bearer token y RBAC, preferentemente ligado a `127.0.0.1` cuando comparte host con NUGA Console API.

La identidad NUGA debe permitir exclusivamente los routers que Hermes/Operaciones necesite diagnosticar y estas cinco herramientas de lectura.

## API NUGA

Rutas existentes del adapter base:

- `GET /api/v1/mikromcp/routers`
- `GET /api/v1/mikromcp/routers/:routerId/health`
- `GET /api/v1/mikromcp/routers/:routerId/system`
- `GET /api/v1/mikromcp/routers/:routerId/interfaces`
- `GET /api/v1/wisp/routers`

Superficie técnica consolidada para Operaciones:

- `GET /api/v1/wisp/inventory`
- `GET /api/v1/wisp/routers/:routerId/health`
- `GET /api/v1/wisp/routers/:routerId/system`
- `GET /api/v1/wisp/routers/:routerId/interfaces`
- `GET /api/v1/wisp/routers/:routerId/routes`
- `GET /api/v1/wisp/routers/:routerId/diagnostics`

Todas requieren sesión NUGA válida.

## Diagnóstico

`getRouterDiagnostics()` correlaciona salud, recursos, interfaces y rutas y genera hallazgos con evidencia observable. No toma decisiones comerciales ni ejecuta cambios.

Posibles hallazgos:

- `ROUTER_UNHEALTHY`
- `CPU_HIGH` / `CPU_CRITICAL`
- `MEMORY_HIGH` / `MEMORY_CRITICAL`
- `INTERFACES_DOWN`
- `ROUTING_EMPTY`
- `NO_ACTIVE_ROUTES`
- `NO_ACTIVE_DEFAULT_ROUTE`
- fallos parciales de lectura MikroMCP

La ausencia de ruta por defecto se maneja como advertencia, no como conclusión definitiva, porque puede ser válida en routers internos o diseños con policy routing.

## Frontera CRM

Team Console no factura, cobra, suspende ni reactiva clientes por estado comercial. Eso pertenece a NugaCore/CRM.

## Activación real

Destino previsto: `ramiro@hermes-team-lab`.

Antes de modificar RouterOS se inspeccionará:

1. sistema operativo, hostname y reloj del servidor;
2. Node/npm instalados;
3. versión/instalación MikroMCP actual;
4. puertos locales ocupados;
5. estado del servicio `nuga-console-api-production`;
6. commit desplegado de NUGA Team Console;
7. presencia de variables MikroMCP por **nombre**, nunca sus valores;
8. existencia/permisos de archivos de entorno, sin imprimir secretos.

Después, y únicamente tras analizar esa evidencia, se preparará la instalación/configuración real de MikroMCP y el acceso `api-ssl` al primer router de producción.

## Rollback

Para retirar el diagnóstico sin tocar RouterOS:

1. `NUGA_MIKROMCP_READ_ONLY_ENABLED=false`;
2. reiniciar NUGA Console API;
3. validar que MikroMCP deje de estar disponible desde NUGA.

Cualquier remoción posterior de usuarios RouterOS, certificados o servicio MikroMCP será un cambio separado con su propio alcance y validación.
