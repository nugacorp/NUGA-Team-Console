# Arquitectura de Modos Intercambiables: NUGA Team Console

Este documento detalla la arquitectura de modos de ejecución implementada en el repositorio `nugacorp/NUGA-Team-Console` para permitir que la misma aplicación funcione de forma desacoplada y segura en tres entornos: **`demo`**, **`staging`** y **`production`**.

---

## 1. Definición de Modos (`AppMode`)

```typescript
export type AppMode = 'demo' | 'staging' | 'production';
```

No se utiliza ningún indicador booleano binario (`demo=true/false`). Cada entorno posee características y contratos bien diferenciados:

| Modo | Propósito | Almacenamiento / Fuente de Datos | Hermes / Agentes | Escrituras Reales |
| :--- | :--- | :--- | :--- | :--- |
| **`demo`** | Demostración visual e interactiva local | Almacenamiento local del navegador (`localStorage`) con todas las entidades marcadas con `isDemo: true` | Motor simulado local (no conectado a backend) | No |
| **`staging`** | Pruebas de integración en laboratorio | Backend REST API de laboratorio (`VITE_NUGA_API_URL`) | Conectado a sandbox de laboratorio | Controladas / Sandbox |
| **`production`** | Entorno productivo empresarial | Backend REST API productivo seguro | Conectado a infraestructura productiva | Reales bajo autorización y doble factor |

---

## 2. Inyección de Dependencias y Factoría de Proveedores

Todos los componentes de la interfaz de usuario consumen contratos de datos homogéneos a través de la factoría de proveedores:

```typescript
export function createProviders(appMode: AppMode, config: AppConfig): AppProviders {
  if (appMode === 'demo') {
    return createDemoProviders();
  }

  if (appMode === 'staging' || appMode === 'production') {
    return createApiProviders({
      baseUrl: config.apiUrl,
      mode: appMode,
      timeoutMs: 10000
    });
  }

  throw new Error(`[Factory] Modo desconocido "${appMode}". No se pueden inicializar providers.`);
}
```

### Contratos de Datos Homologados (13 Proveedores)

1. `DashboardProvider`: Métricas y visión ejecutiva.
2. `TasksProvider`: Tablero Kanban, tareas técnicas y corridas.
3. `DecisionsProvider`: Decisiones ejecutivas, acciones y dry-runs.
4. `AgentsProvider`: Perfiles, directivas de autonomía y herramientas de los 5 agentes.
5. `ConversationsProvider`: Canales de comunicación e historial de mensajes.
6. `ProjectsProvider`: Hitos y proyectos estratégicos.
7. `WispProvider`: Topología de red, torres, routers MikroTik RouterOS v7 e incidentes.
8. `NugaCoreProvider`: Repositorios, arquitectura y pipelines CI/CD.
9. `MarketingProvider`: Campañas y biblioteca multimedia.
10. `AdministrationProvider`: Documentos administrativos, cotizaciones y minutas.
11. `DeliverablesProvider`: Informes ejecutivos y validación formal.
12. `AuditProvider`: Registro inmutable de auditoría con correlación de trazas.
13. `ConfigurationProvider`: Ajustes de consola, perfiles de usuario y comprobaciones de estado.

---

## 3. Invariantes de Seguridad y Aislamiento

1. **Sin Fallback Silencioso**: En `staging` o `production`, si el backend no responde o no está disponible, la consola reporta el estado de error/no disponible (`unavailable` / `unauthorized`). **Bajo ninguna circunstancia se cargan datos de prueba (fixtures) simulando una respuesta real**.
2. **Prohibición de Activación de Producción por Cliente**: La activación del modo `production` es exclusiva de las variables de entorno de compilación/despliegue (`VITE_APP_MODE=production`). Queda terminantemente bloqueada la activación mediante `localStorage`, parámetros de URL (`?mode=production`), o la consola de DevTools.
3. **Bloqueo por Incompatibilidad (Split-Brain Prevention)**: Al iniciar, la aplicación verifica el contrato de estado del servidor (`ServerStatusContract`). Si existe una discrepancia entre el frontend (ej. `staging`) y el backend reportado (ej. `production`), la interfaz bloquea las operaciones de escritura y muestra la pantalla de **Configuración Incompatible**.
4. **Validación Obligatoria en Backend**: Las capacidades reportadas en el frontend (`BackendCapabilities`) sirven únicamente para ajustar la visibilidad y estados en UI; el backend siempre vuelve a validar permisos, tokens y firmas criptográficas en cada petición.

---

## 4. Variables de Entorno y Despliegue

### Archivo `.env.example`
```bash
# VITE_APP_MODE: Target operating environment ('demo' | 'staging' | 'production')
VITE_APP_MODE="demo"

# VITE_NUGA_API_URL: Base URL for NUGA backend services in staging and production
VITE_NUGA_API_URL="http://localhost:3000"
```

### Comandos de Construcción por Entorno

- **Compilación DEMO:**
  ```bash
  VITE_APP_MODE=demo npm run build
  ```
- **Compilación STAGING:**
  ```bash
  VITE_APP_MODE=staging VITE_NUGA_API_URL=https://staging-api.nuga.internal npm run build
  ```
- **Compilación PRODUCCIÓN:**
  ```bash
  VITE_APP_MODE=production VITE_NUGA_API_URL=https://api.nuga.corp npm run build
  ```

---

## 5. Procedimiento de Rollback

En caso de requerir un retroceso inmediato:
1. Re-desplegar la imagen de contenedor o artefacto compilado con la versión previa estable.
2. Comprobar que el endpoint `/api/v1/status` reporte el modo correspondiente de forma sincronizada.
3. La interfaz reanudará la operación normal automáticamente al detectar la compatibilidad de contratos.
