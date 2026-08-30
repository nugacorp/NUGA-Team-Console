# Contrato NUGA Console API v1

**Estado:** contrato de frontend listo; backend aún no conectado  
**Base canónica:** `/api/v1`  
**Modos:** `staging` y `production`

## 1. Límite de confianza

El navegador solo se comunica con **NUGA Console API**. Está prohibido conectar el frontend directamente con Hermes, la base Kanban, MikroMCP, RouterOS o APIs de Google.

La API intermedia es responsable de:

- autenticación y autorización;
- protección CSRF y validación de origen;
- custodia de credenciales y secretos;
- autorización por operación;
- sanitización de datos;
- auditoría y correlación;
- límites de tiempo y volumen;
- adaptación de Hermes/Kanban/MikroMCP/Google.

Ninguna variable `VITE_*` puede contener secretos.

## 2. Transporte y sesión

- HTTPS obligatorio fuera de desarrollo local.
- Sesión mediante cookie `HttpOnly`, `Secure` y `SameSite=Strict`.
- El frontend usa `credentials: include`.
- Todas las solicitudes envían `X-Nuga-Mode: staging|production`.
- El servidor debe rechazar una cabecera cuyo modo no coincida con su entorno.
- Las mutaciones deben validar `Origin` y un mecanismo CSRF emitido por el backend.
- Las respuestas JSON usan `Content-Type: application/json`.
- Los errores nunca deben incluir secretos, comandos sensibles ni trazas internas.

## 3. Sobre de errores

```json
{
  "error": {
    "code": "CAPABILITY_DENIED",
    "message": "Operación no permitida en este entorno.",
    "correlationId": "req_..."
  }
}
```

Códigos mínimos: `UNAUTHORIZED`, `FORBIDDEN`, `MODE_MISMATCH`,
`CAPABILITY_DENIED`, `VALIDATION_ERROR`, `NOT_FOUND`,
`SERVICE_UNAVAILABLE` y `INTERNAL_ERROR`.

## 4. Estado y capacidades

### GET /api/v1/status

```json
{
  "mode": "staging",
  "source": "server",
  "hermes": "available",
  "writesEnabled": false,
  "integrations": {
    "nugacore": false,
    "mikromcp": false,
    "google": false
  }
}
```

### GET /api/v1/capabilities

```json
{
  "canReadRealData": true,
  "canRequestDryRun": true,
  "canSubmitApproval": true,
  "canExecuteAuthorizedOperation": false
}
```

El frontend valida ambos contratos en tiempo de ejecución. Una respuesta incompleta o
incompatible deja el sistema en modo no disponible y bloquea operaciones.

## 5. Recursos iniciales de Hermes y Kanban

| Método | Ruta | Uso inicial |
|---|---|---|
| GET | `/api/v1/auth/me` | Sesión de Ramiro |
| GET | `/api/v1/agents` | Cinco perfiles Hermes |
| GET | `/api/v1/tasks` | Tarjetas del tablero activo |
| GET | `/api/v1/tasks/:id` | Detalle de tarjeta |
| GET | `/api/v1/tasks/:id/runs` | Corridas y estado |
| POST | `/api/v1/tasks` | Crear tarea controlada |
| PATCH | `/api/v1/tasks/:id` | Transición permitida |
| POST | `/api/v1/tasks/:id/comments` | Instrucción humana |
| GET | `/api/v1/deliverables` | Entregables |
| GET | `/api/v1/audit/events` | Auditoría sanitizada |
| GET | `/api/v1/notifications` | Alertas |
| GET | `/api/v1/dashboard/metrics` | KPIs reales |
| GET | `/api/v1/dashboard/overview` | Resumen ejecutivo |

Las rutas adicionales ya declaradas por los providers no habilitan una integración por sí
mismas. El backend debe anunciarlas en capacidades y aplicar autorización.

## 6. Decisiones

### POST /api/v1/decisions/:id/action

```json
{
  "action": "approve",
  "comment": "Validado por Ramiro",
  "confirmationVerified": true
}
```

La frase tipográfica escrita por Ramiro se valida en memoria y **nunca** se envía ni se
persiste. `confirmationVerified` es evidencia de interfaz, no autenticación. El backend
debe autenticar la sesión, volver a validar estado, riesgo, capacidad y autorización antes
de aceptar la decisión. Aprobar una propuesta no autoriza ejecutar cambios externos.

## 7. Política inicial por entorno

| Capacidad | DEMO | STAGING inicial | PRODUCTION futura |
|---|---:|---:|---:|
| Red desde frontend | No | Solo `/api` | Solo `/api` |
| Leer Hermes/Kanban | Simulado | Sí | Sí |
| Crear tareas/comentarios | Simulado | Sí | Sí |
| Dry-run | Simulado | Solicitud controlada | Solicitud controlada |
| MikroMCP | Simulado | Desconectado | Gated |
| Ejecutar cambios WISP | No | No | Requiere gate independiente |
| Google | Simulado | Desconectado | OAuth y scopes mínimos |

## 8. Criterios para conectar staging

1. Backend desplegado en el host de laboratorio.
2. `GET /api/v1/status` y `GET /api/v1/capabilities` válidos.
3. Autenticación de Ramiro sin secretos en el bundle.
4. Pruebas negativas de modo, permisos, CSRF y respuestas malformadas.
5. Logs sanitizados y correlacionados.
6. Hermes limitado inicialmente a lectura, creación de tareas y comentarios.
7. MikroMCP, RouterOS y Google permanecen desconectados.
