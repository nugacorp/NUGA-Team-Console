# NUGA Team Console — Documentación de Arquitectura de Modos y Aislamiento DEMO

**Versión de la Línea Base:** 1.0.0-demo-baseline  
**Estado:** `DEMO_MODE_ISOLATION_PASS`  
**Fecha de Congelamiento:** 2026-08-29  

---

## 1. Arquitectura de Modos (DEMO / STAGING / PRODUCTION)

NUGA Team Console cuenta con una arquitectura de entornos trifásica desacoplada mediante un patrón de **Proveedores Abstractos (Provider Pattern)** y un principio de seguridad **Fail-Closed**.

```
                           [ import.meta.env.VITE_APP_MODE ]
                                          │
                         ┌────────────────┴────────────────┐
                         ▼                                 ▼
               [ VITE_APP_MODE='demo' ]       [ 'staging' | 'production' ]
                         │                                 │
                         ▼                                 ▼
               createDemoProviders()             createApiProviders()
                         │                                 │
           ┌─────────────┴─────────────┐                   ▼
           ▼                           ▼              Fetch HTTP API
    StorageService               Entidades DEMO      (/api/v1/*) con
   (localStorage nuga_)          (isDemo: true)      Bearer Auth Token
           │                           │
           └─────────────┬─────────────┘
                         ▼
                 [ AppContext ]
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      [ 13 Pantallas ]        [ Componentes ]
    (useApp() Provider)     (useApp() Provider)
```

### 1.1 Modos Soportados
1. **`demo` (Predeterminado)**: Entorno local 100% desconectado y autónomo. Todos los datos provienen de `StorageService` inicializado con semillas (`INITIAL_*`) y marcados con `isDemo: true`. No se realizan conexiones de red (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`).
2. **`staging`**: Modo laboratorio conectado a endpoints no productivos de prueba (`/api/v1/*`).
3. **`production`**: Modo productivo estricto. Requiere backend validado mediante health check real. **No puede activarse desde el navegador.**

---

## 2. Variables de Entorno y Reglas de Seguridad

### 2.1 Variables Permitidas (`.env.example`)
```env
VITE_APP_MODE=demo
VITE_NUGA_API_URL=/api
```

### 2.2 Reglas Inviolables de Secretos y Configuración
- **Prohibición Absoluta de Secretos en Frontend**: Ningún token de acceso, credencial de base de datos, clave de API, contraseña o private key puede incluirse en el bundle cliente, en variables `VITE_*`, en `localStorage` o en los modelos de TypeScript.
- **Fail-Closed**: Si `VITE_APP_MODE` contiene un valor no reconocido, la aplicación detiene su inicialización (`ConfigurationError: INVALID_APP_MODE`) y **nunca** asume `production`.
- **Inmunidad a Manipulación del Cliente**: Ni `localStorage`, ni query parameters (`?mode=production`), ni cookies, ni llamadas en consola de DevTools pueden elevar la aplicación a modo productivo.

---

## 3. Aislamiento del Modo DEMO

### 3.1 Capacidades Deshabilitadas en DEMO
- **Cero Red Saliente**: Las llamadas de red están completamente desactivadas. `healthCheckService.ts` resuelve un contrato estático local sin contactar `VITE_NUGA_API_URL`.
- **Motor Hermes**: Aparece explícitamente como `DEMO · No conectado`. No se efectúan llamadas a brokers ni APIs de LLM externas; las conversaciones operan de forma reactiva local simulada.
- **MikroTik RouterOS / MCP**: Las consultas y terminales RouterOS operan en modo simulador (sandbox estático).
- **Mutaciones Seguras**: Las decisiones críticas con confirmación reforzada no persisten tokens ni contraseñas, registrando únicamente flags booleanas de verificación (`confirmationVerified: true`, `confirmationVerifiedBy`, `confirmationVerifiedAt`).

---

## 4. Deuda Técnica y Línea Base de Advertencias (Linting)

### 4.1 Estado Actual del Linter
- **Errores de ESLint:** `0 errores`
- **Advertencias de ESLint:** `133 advertencias`
- **Naturaleza de las Advertencias:** Parámetros de interfaces no utilizados (ej. destructuraciones de props o funciones de actualización) e iconos importados para pantallas secundarias.
- **Regla de Gobernanza de CI:** El pipeline de CI/CD debe fallar si las advertencias superan las **133**, permitiendo reducciones progresivas sin ocultar advertencias mediante reglas permisivas.

---

## 5. Procedimiento Futuro de Integración Real (Checklist de Despliegue)

Cuando se implemente el backend real y el motor Hermes, se deberá seguir este procedimiento controlado:

1. **Despliegue del Backend Real**: Publicar el servicio API de NUGA en el endpoint correspondiente (`/api/v1`).
2. **Implementación de Health Check Real**: Exponer `/api/v1/status` con soporte para `{ status: 'ok', mode: 'production', hermes: 'available' }`.
3. **Inyección Segura de Variables**: Configurar en el entorno de despliegue (Cloud Run / Servidor):
   - `VITE_APP_MODE=production`
   - `VITE_NUGA_API_URL=/api`
4. **Validación de Split-Brain**: Verificar que `appConfig.validateServerCompatibility()` valide la coincidencia de modo entre frontend y backend antes de permitir operaciones con privilegios.
