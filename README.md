# NUGA Team Console

Frontend visual y seguro para coordinar el equipo de agentes Hermes de NUGA: **Director, NugaCore, Operaciones, Marketing y Administración**.

La consola concentra planeación, tareas, decisiones, entregables, campañas y registros administrativos. Su diseño separa claramente **proponer**, **aprobar** y **ejecutar**: una aprobación dentro de la interfaz no autoriza por sí sola cambios en sistemas externos.

## Estado actual

- Frontend React disponible en modos `demo`, `staging` y `production`.
- API Express con autenticación local, sesión mediante cookie HttpOnly y protección CSRF.
- Persistencia de consola en Supabase mediante esquemas lógicamente separados para staging y producción.
- Lectura controlada de Hermes/Kanban desde el backend.
- Asistencia de redacción y análisis de flujos mediante MiniMax OAuth, sin enviar tokens al navegador.
- Planes de trabajo para proyectos, marketing y administración con preguntas, responsable recomendado, riesgos y aprobación humana.
- DEMO aislado, con cero llamadas de red.
- MikroMCP, RouterOS y Google permanecen desconectados hasta contar con una autorización y un gate específicos.
- Los planes aprobados todavía no crean ni ejecutan tareas automáticamente.

## Principios de seguridad

- Ningún secreto puede almacenarse en GitHub, variables `VITE_*`, `localStorage`, logs o respuestas del navegador.
- El frontend solo se comunica con NUGA Console API; nunca accede directamente a Supabase, Hermes, RouterOS o proveedores de IA.
- Las sesiones usan cookies `HttpOnly`, `Secure` y `SameSite=Strict` fuera del desarrollo local.
- Las mutaciones requieren sesión, origen permitido y token CSRF.
- La configuración falla de forma cerrada cuando el modo del frontend y del backend no coincide.
- Supabase aplica RLS y privilegios mínimos; `anon` y `authenticated` no acceden a los esquemas internos de la consola.
- Publicaciones, despliegues, compras, migraciones y operaciones sobre infraestructura requieren autorización explícita.
- Staging y producción se mantienen separados.

## Arquitectura

```text
Navegador
   |
   | HTTPS + sesión HttpOnly + CSRF
   v
NUGA Console API
   |
   +-- Supabase (datos propiedad de la consola)
   +-- Hermes/Kanban (fuente de verdad de tareas y ejecuciones)
   +-- MiniMax OAuth (redacción y análisis supervisado)
   |
   +-- Integraciones externas desconectadas o protegidas por gates
```

### Propiedad de los datos

Hermes conserva la autoridad sobre tableros, tareas, comentarios y ejecuciones. NUGA Team Console administra decisiones, auditoría, entregables, extensiones visuales, proyectos, campañas, administración y planes de flujo. El backend puede componer ambas fuentes sin duplicar su autoridad.

## Modos

| Modo | Datos | Red | Uso |
|---|---|---|---|
| `demo` | Semillas locales marcadas como DEMO | Ninguna | Diseño, demostraciones y pruebas aisladas |
| `staging` | Servicios no productivos | Solo API de staging | Integración y validación |
| `production` | Datos reales autorizados | Solo API productiva | Operación controlada |

El modo no puede elevarse desde parámetros de URL, `localStorage` ni herramientas del navegador.

## Tecnologías

- React 19 y TypeScript
- Vite 6
- Tailwind CSS 4
- Express
- Vitest y Testing Library
- Bun
- Supabase Data API desde el backend
- Hermes y MiniMax OAuth mediante adaptadores controlados

## Desarrollo local

### Requisitos

- Bun
- Node.js compatible con las dependencias del proyecto
- Git

### Instalación

```bash
git clone https://github.com/nugacorp/NUGA-Team-Console.git
cd NUGA-Team-Console
bun install --frozen-lockfile
```

### Ejecutar DEMO

```bash
VITE_APP_MODE=demo bun run dev
```

DEMO debe funcionar sin llamadas de red. No agregues credenciales para utilizarlo.

### Variables de frontend permitidas

```env
VITE_APP_MODE=demo
VITE_NUGA_API_URL=/api
```

No coloques tokens, contraseñas, claves privadas ni credenciales de proveedores en variables `VITE_*`.

## Validación

Antes de proponer cambios:

```bash
bun run typecheck
bun run test
bun run lint -- --max-warnings=133
VITE_APP_MODE=production VITE_NUGA_API_URL=/api bun run build
bun run check:production-artifact
bun run check:bundle-size
```

GitHub Actions ejecuta estas validaciones en cada pull request dirigido a `main`. No se debe fusionar un cambio si CI no está en verde.

## Scripts principales

| Comando | Propósito |
|---|---|
| `bun run dev` | Iniciar el frontend local |
| `bun run server:dev` | Iniciar la API en modo desarrollo |
| `bun run typecheck` | Validar TypeScript |
| `bun run test` | Ejecutar pruebas |
| `bun run lint` | Ejecutar ESLint |
| `bun run build` | Crear el bundle |
| `bun run check:production-artifact` | Rechazar datos DEMO en el artefacto productivo |
| `bun run check:bundle-size` | Aplicar el presupuesto de tamaño |
| `bun run auth:hash-password` | Generar un hash para autenticación local |

## Flujo de contribución

1. Inspeccionar el estado real antes de modificar.
2. Crear una rama desde `main`.
3. Mantener el cambio limitado a una finalidad verificable.
4. Ejecutar las validaciones locales.
5. Abrir un pull request.
6. Esperar CI en verde.
7. Fusionar y desplegar únicamente con la autorización correspondiente.
8. Conservar evidencia y un procedimiento de rollback para acciones de riesgo.

## Documentación

- [Arquitectura y aislamiento DEMO](DEMO_ARCHITECTURE.md)
- [Contrato de NUGA Console API](docs/API_CONTRACT.md)
- [Matriz de propiedad de datos](docs/DATA_OWNERSHIP_MATRIX.md)
- [Esquemas Supabase](docs/SUPABASE_SCHEMA.md)
- [Ejemplo de configuración](.env.example)

## Alcance operativo

NUGA Team Console es una capa de coordinación y control. Mostrar un plan, recomendar un agente o registrar una aprobación no equivale a ejecutar una acción externa. Las operaciones reales deben atravesar su propio control de capacidad, autorización, validación, auditoría y rollback.
